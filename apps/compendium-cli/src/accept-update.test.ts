import { createHash } from "node:crypto";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "bun:test";
import { ArtifactStore, beginArtifactRun } from "@afallon/artifacts";
import {
  UPDATE_CHECK_AREAS,
  UPDATE_RISK_AREAS,
  canonicalJson,
  type AcceptedBuildDescriptor,
  type ContentIdentity,
  type UpdateReport,
} from "@afallon/contracts";
import type { StaticRootManifest } from "@afallon/contracts/public";
import { acceptUpdate, type DeploymentMetadata } from "./accept-update";

const BUILD_ID = "25419293";
const CATALOG_ID = "c".repeat(64);
const bytes = (value: string): Uint8Array => new TextEncoder().encode(value);
const identity = (value: Uint8Array): ContentIdentity => ({ sha256: createHash("sha256").update(value).digest("hex"), bytes: value.byteLength });

type Fixture = {
  root: string;
  storeRoot: string;
  reportPath: string;
  publicationRoot: string;
  baselineRoot: string;
  siteDirectory: string;
  stageRoot: string;
  selectionPath: string;
  descriptorPath: string;
  candidatePublicationId: string;
  priorPublicationId: string;
  priorDescriptorBytes: Uint8Array;
  priorDescriptorIdentity: ContentIdentity;
  priorSelectionBytes: Uint8Array;
  priorSelectionIdentity: ContentIdentity;
};

function priorDescriptor(evidence: ContentIdentity, publication: ContentIdentity): AcceptedBuildDescriptor {
  return {
    schemaVersion: "compendium.accepted-build.v1",
    acceptedAt: "2026-01-01T00:00:00.000Z",
    releaseVersion: "0.16.1",
    buildId: "25153357",
    report: evidence,
    catalog: { catalogId: "d".repeat(64), manifest: evidence, object: evidence },
    publication: {
      manifest: evidence,
      root: { path: `resources/${publication.sha256}.json`, ...publication, schemaId: "compendium.static-root.v3" },
    },
    stage: {
      schemaVersion: "afallon.deployment.v2",
      publicationId: publication.sha256,
      buildId: "25153357",
      catalogId: "d".repeat(64),
      mode: "preview",
      coverageComplete: true,
      selectionSha256: "f".repeat(64),
      publicationSha256: "e".repeat(64),
    },
    rollback: null,
  };
}

async function fixture(): Promise<Fixture> {
  const root = await mkdtemp(join(tmpdir(), "afallon-accept-update-"));
  const storeRoot = join(root, "artifacts"), publicationRoot = join(root, "publication"), baselineRoot = join(root, "baseline"), siteDirectory = join(root, "site");
  const store = new ArtifactStore(storeRoot);
  const evidenceObject = await store.putBytes(bytes("reviewed evidence"));
  const evidence = { sha256: evidenceObject.sha256, bytes: evidenceObject.bytes };
  const catalogManifestObject = await store.putBytes(bytes("catalog manifest"));
  const catalogObject = await store.putBytes(bytes("catalog object"));
  const catalogManifest = { sha256: catalogManifestObject.sha256, bytes: catalogManifestObject.bytes };
  const sealedCatalog = { sha256: catalogObject.sha256, bytes: catalogObject.bytes };
  const reference = { path: "resources/coverage.json", sha256: "a".repeat(64), bytes: 10, schemaId: "compendium.static-coverage.v1" as const };
  const publication: StaticRootManifest = {
    schemaVersion: "compendium.static-root.v3",
    buildId: BUILD_ID,
    catalogId: CATALOG_ID,
    mode: "preview",
    complete: true,
    world: { mapSpaceId: "world", label: "Afallon", bounds: { min: { x: 0, y: 0 }, max: { x: 1, y: 1 } }, offsets: [{ mapSpaceId: "world", worldX: 0, worldY: 0, source: "native", status: "placed" }], unplacedMapSpaceIds: [] },
    maps: [],
    kinds: [{ kind: "items", label: "Item", plural: "Items", route: "items", icon: "item", pages: true, searchable: true, columns: [], facets: [] }],
    lists: { items: [{ ...reference, schemaId: "compendium.static-kind-list.v1" }] },
    search: [{ ...reference, schemaId: "compendium.static-search.v3" }],
    coverage: reference,
  };
  const publicationObject = await store.putBytes(bytes(`${canonicalJson(publication)}\n`));
  const publicationRun = await beginArtifactRun(store, {
    buildId: BUILD_ID,
    operation: "publish",
    settings: { plan: { catalog: { catalogId: CATALOG_ID, manifest: catalogManifest, object: sealedCatalog } } },
    schemas: [],
    implementationFingerprint: "1".repeat(64),
    cacheKey: "2".repeat(64),
    probeHashes: {},
    diagnosticRevision: "test",
    inputs: {},
  });
  await publicationRun.addArtifact("publication.json", publicationObject, { mediaType: "application/json", schemaId: "compendium.static-root.v3" });
  await publicationRun.succeed();
  const publicationManifest = publicationRun.manifestIdentity;
  await publicationRun.release();
  if (!publicationManifest) throw new Error("Publication fixture did not produce a manifest.");

  const pointer = { buildId: BUILD_ID, content: evidence };
  const report: UpdateReport = {
    schemaVersion: "compendium.update-report.v1",
    releaseVersion: "0.16.2",
    recordedAt: "2026-09-20T00:00:00.000Z",
    previous: { buildId: "25153357", inputHashes: { installation: "3".repeat(64) } },
    current: { buildId: BUILD_ID, inputHashes: { installation: "4".repeat(64) } },
    artifacts: {
      updateReceipt: pointer,
      schemaSnapshot: pointer,
      buildComparison: pointer,
      scans: [pointer],
      reviewedInputs: [pointer],
      catalog: { buildId: BUILD_ID, content: catalogManifest },
      publication: { buildId: BUILD_ID, content: publicationManifest },
    },
    checks: UPDATE_CHECK_AREAS.map(area => ({ area, passed: true as const, detail: `${area} passed.`, evidence: [pointer] })),
    risks: UPDATE_RISK_AREAS.map(area => ({ area, disposition: "supported-changed" as const, detail: `${area} reviewed.`, evidence: [pointer] })),
  };
  const reportPath = join(root, "update-report.json");
  await writeFile(reportPath, `${canonicalJson(report)}\n`);

  const candidatePublicationId = publicationObject.sha256;
  await mkdir(join(publicationRoot, "publications", candidatePublicationId), { recursive: true });
  await mkdir(baselineRoot, { recursive: true });
  const selectionPath = join(publicationRoot, "selected.json"), descriptorPath = join(storeRoot, "accepted-build.json"), stageRoot = join(siteDirectory, ".stage", "production");
  const priorPublication = { ...publication, buildId: "25153357", catalogId: "d".repeat(64) } satisfies StaticRootManifest;
  const priorPublicationBytes = bytes(`${canonicalJson(priorPublication)}\n`), priorPublicationIdentity = identity(priorPublicationBytes), priorPublicationId = priorPublicationIdentity.sha256;
  const priorRoot = { path: `resources/${priorPublicationId}.json`, ...priorPublicationIdentity, schemaId: "compendium.static-root.v3" as const };
  const priorSelectionBytes = bytes(`${canonicalJson({ root: priorRoot, directory: `publications/${priorPublicationId}` })}\n`), priorSelectionIdentity = identity(priorSelectionBytes);
  await mkdir(join(publicationRoot, "publications", priorPublicationId), { recursive: true });
  await writeFile(join(publicationRoot, "publications", priorPublicationId, "publication.json"), priorPublicationBytes);
  await mkdir(stageRoot, { recursive: true });
  await writeFile(join(stageRoot, "version.txt"), "prior stage");
  await writeFile(selectionPath, priorSelectionBytes);
  const priorDescriptorBytes = bytes(`${canonicalJson(priorDescriptor(evidence, priorPublicationIdentity))}\n`), priorDescriptorIdentity = identity(priorDescriptorBytes);
  await writeFile(descriptorPath, priorDescriptorBytes);
  return { root, storeRoot, reportPath, publicationRoot, baselineRoot, siteDirectory, stageRoot, selectionPath, descriptorPath, candidatePublicationId, priorPublicationId, priorDescriptorBytes, priorDescriptorIdentity, priorSelectionBytes, priorSelectionIdentity };
}

async function successfulStage(value: Fixture): Promise<DeploymentMetadata> {
  const selectionBytes = new Uint8Array(await readFile(value.selectionPath));
  await mkdir(value.stageRoot, { recursive: true });
  await writeFile(join(value.stageRoot, "version.txt"), "candidate stage");
  return {
    schemaVersion: "afallon.deployment.v2",
    publicationId: value.candidatePublicationId,
    buildId: BUILD_ID,
    catalogId: CATALOG_ID,
    mode: "preview",
    coverageComplete: true,
    selectionSha256: identity(selectionBytes).sha256,
    publicationSha256: value.candidatePublicationId,
  };
}

test("accepts one candidate with compare-and-swap and retained rollback identity", async () => {
  const value = await fixture();
  try {
    let stageCalls = 0;
    const accepted = await acceptUpdate({
      ...value,
      expectedDescriptorSha256: value.priorDescriptorIdentity.sha256,
      stage: async () => { stageCalls++; return successfulStage(value); },
    });
    expect(stageCalls).toBe(1);
    expect(accepted).toMatchObject({
      buildId: BUILD_ID,
      catalog: { catalogId: CATALOG_ID },
      publication: { root: { sha256: value.candidatePublicationId } },
      rollback: { selection: value.priorSelectionIdentity, acceptedDescriptor: value.priorDescriptorIdentity, buildId: "25153357", publicationId: value.priorPublicationId },
    });
    expect(await readFile(join(value.stageRoot, "version.txt"), "utf8")).toBe("candidate stage");
    expect(JSON.parse(await readFile(value.descriptorPath, "utf8"))).toEqual(accepted);
    const store = new ArtifactStore(value.storeRoot);
    expect(await readFile(store.objectPath(value.priorSelectionIdentity.sha256), "utf8")).toBe(new TextDecoder().decode(value.priorSelectionBytes));
    expect(await readFile(store.objectPath(value.priorDescriptorIdentity.sha256), "utf8")).toBe(new TextDecoder().decode(value.priorDescriptorBytes));

    await expect(acceptUpdate({ ...value, expectedDescriptorSha256: "0".repeat(64), stage: async () => { stageCalls++; return successfulStage(value); } })).rejects.toThrow(/compare-and-swap/);
    expect(stageCalls).toBe(1);
  } finally { await rm(value.root, { recursive: true, force: true }); }
});

test("retains a selected publication without a prior accepted descriptor", async () => {
  const value = await fixture();
  try {
    await rm(value.descriptorPath);
    const accepted = await acceptUpdate({ ...value, stage: async () => successfulStage(value) });
    expect(accepted.rollback).toEqual({ selection: value.priorSelectionIdentity, buildId: "25153357", publicationId: value.priorPublicationId });
    expect(await readFile(new ArtifactStore(value.storeRoot).objectPath(value.priorSelectionIdentity.sha256), "utf8")).toBe(new TextDecoder().decode(value.priorSelectionBytes));
  } finally { await rm(value.root, { recursive: true, force: true }); }
});

test("restores the selected publication, descriptor, and stage when staging fails", async () => {
  const value = await fixture();
  try {
    await expect(acceptUpdate({
      ...value,
      expectedDescriptorSha256: value.priorDescriptorIdentity.sha256,
      stage: async () => {
        await mkdir(value.stageRoot, { recursive: true });
        await writeFile(join(value.stageRoot, "version.txt"), "partial candidate stage");
        throw new Error("injected staging failure");
      },
    })).rejects.toThrow("injected staging failure");
    expect(await readFile(value.selectionPath, "utf8")).toBe(new TextDecoder().decode(value.priorSelectionBytes));
    expect(await readFile(value.descriptorPath, "utf8")).toBe(new TextDecoder().decode(value.priorDescriptorBytes));
    expect(await readFile(join(value.stageRoot, "version.txt"), "utf8")).toBe("prior stage");
  } finally { await rm(value.root, { recursive: true, force: true }); }
});

test("rejects incomplete report evidence before staging", async () => {
  const value = await fixture();
  try {
    const report = JSON.parse(await readFile(value.reportPath, "utf8")) as UpdateReport;
    report.checks = report.checks.slice(1);
    await writeFile(value.reportPath, `${canonicalJson(report)}\n`);
    let stageCalls = 0;
    await expect(acceptUpdate({ ...value, stage: async () => { stageCalls++; return successfulStage(value); } })).rejects.toThrow();
    expect(stageCalls).toBe(0);
    expect(await readFile(value.selectionPath, "utf8")).toBe(new TextDecoder().decode(value.priorSelectionBytes));
    expect(await readFile(value.descriptorPath, "utf8")).toBe(new TextDecoder().decode(value.priorDescriptorBytes));
    expect(await readFile(join(value.stageRoot, "version.txt"), "utf8")).toBe("prior stage");
  } finally { await rm(value.root, { recursive: true, force: true }); }
});
