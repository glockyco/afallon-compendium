import { randomUUID } from "node:crypto";
import { rm } from "node:fs/promises";
import { join } from "node:path";
import { Assert } from "typebox/value";
import { ArtifactStore, beginArtifactRun, createArtifactLease, fingerprintStep, selectLatestSuccess, type ArtifactRun } from "@afallon/artifacts";
import { canonicalJson, schemaRegistry, MapSpaceProfileSchema, type ArtifactRunManifest, type ContentIdentity } from "@afallon/contracts";
import { CatalogPlanSchema, CatalogImagerySchema, CoverageReviewSchema, CoveragePolicySchema, type CatalogPlan } from "@afallon/contracts/catalog";
import { assembleCatalog } from "./assembly";
import { admitCatalogPlan, coverageExclusionSubjects, evidenceReference } from "./evidence";
import { normalizeCatalog } from "./normalize";
import { computeCoverageAccounting } from "./coverage-accounting";
import type { NormalizedOutputCounts } from "./database";

export interface CatalogResult {
  catalogId: string;
  object: ContentIdentity;
  manifestPath: string;
  manifest: ArtifactRunManifest;
  counts: NormalizedOutputCounts;
}

export async function assembleCatalogFromPlan(store: ArtifactStore, input: CatalogPlan, options: { diagnosticRevision: string; select?: boolean }): Promise<CatalogResult> {
  Assert(CatalogPlanSchema, input);
  const plan: CatalogPlan = { ...input, scans: [...input.scans].sort((a, b) => a.sha256.localeCompare(b.sha256)), imagery: [...input.imagery].sort((a, b) => a.sha256.localeCompare(b.sha256)) };
  const declaredInputs = { profile: plan.spatialProfile, coverageReview: plan.coverageReview, ...Object.fromEntries(plan.scans.map((identity) => [`scan:${identity.sha256}`, identity])), ...Object.fromEntries(plan.imagery.map((identity) => [`imagery:${identity.sha256}`, identity])) };
  const lease = await createArtifactLease(store, { runId: `catalog-admission-${randomUUID()}`, buildId: plan.buildId, operation: "catalog", objects: Object.values(declaredInputs), manifests: plan.scans });
  let run: ArtifactRun;
  let planObject: ContentIdentity;
  const settings = { planSchemaVersion: plan.schemaVersion, canonicalTarget: plan.canonicalTarget };
  let implementation: string;
  try {
    const storedPlan = await store.putBytes(new TextEncoder().encode(canonicalJson(plan)), lease);
    planObject = { sha256: storedPlan.sha256, bytes: storedPlan.bytes };
    const inputs = { ...declaredInputs, plan: planObject };
    const schemas = [CatalogPlanSchema, CatalogImagerySchema, MapSpaceProfileSchema, CoverageReviewSchema, CoveragePolicySchema].map((schema) => { const identity = schemaRegistry.identify(schema); return { id: identity.id, sha256: identity.sha256 }; });
    const fingerprint = await fingerprintStep({ entrypoint: import.meta.path, buildId: plan.buildId, settings, schemas, inputs });
    implementation = fingerprint.implementation;
    run = await beginArtifactRun(store, { buildId: plan.buildId, operation: "catalog", diagnosticRevision: options.diagnosticRevision, settings, schemas, inputs, inputManifests: plan.scans.map((identity) => `scan:${identity.sha256}`), implementationFingerprint: fingerprint.implementation, cacheKey: fingerprint.cacheKey, probeHashes: fingerprint.probeHashes });
  } finally {
    await lease.release();
  }
  const candidate = join(store.root, "runs", run.runId, "candidate.sqlite");
  let result: CatalogResult;
  try {
    const admitted = await admitCatalogPlan(store, plan);
    const sources = [...admitted.sources.map((source) => ({ key: source.key, kind: source.kind, identity: { sha256: source.reference.sha256, bytes: source.bytes } })), { key: `plan:${planObject.sha256}`, kind: "catalog-plan", identity: planObject }];
    const references = sources.map((source) => ({ kind: source.kind === "scan-manifest" || source.kind === "run-manifest" ? "run-manifest" as const : "object" as const, content: source.identity }));
    const preparation = await run.putBytes(new TextEncoder().encode(canonicalJson({ buildId: plan.buildId, plan: planObject, sources })));
    await run.addArtifact("admitted-inputs.json", preparation, { mediaType: "application/json", references });
    const normalized = normalizeCatalog(admitted, evidenceReference(planObject));
    const accounting = computeCoverageAccounting({ buildId: plan.buildId, inventories: admitted.inventories, review: admitted.review, policy: admitted.policy, evidence: admitted.evidence, discoveredSubjects: coverageExclusionSubjects(admitted, normalized) });
    await run.setPhase("execution");
    const sealed = await assembleCatalog(store, candidate, { normalized, sources, accounting, identity: { schemaVersion: "compendium.catalog.v2", settings, assemblerFingerprint: implementation } }, run);
    const object = { sha256: sealed.sha256, bytes: sealed.bytes };
    await run.addArtifact("catalog.sqlite", object, { mediaType: "application/vnd.sqlite3", schemaId: "compendium.catalog.v2", references });
    const manifest = await run.succeed();
    result = { catalogId: sealed.catalogId, object, manifestPath: run.manifestPath, manifest, counts: sealed.counts };
    if (options.select === true) await selectLatestSuccess(store, run.manifestPath);
    return result;
  } catch (error) {
    if (run.status === "running") await run.fail(error);
    throw error;
  } finally {
    try { await rm(candidate, { force: true }); }
    finally { await run.release(); }
  }
}
