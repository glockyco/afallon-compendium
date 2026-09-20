import { createHash, randomUUID } from "node:crypto";
import { lstat, mkdir, open, readFile, rename, rm } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { Assert } from "typebox/value";
import { ArtifactStore, createArtifactLease, resolveArtifactRun } from "@afallon/artifacts";
import { AcceptedBuildDescriptorSchema, canonicalJson, validateUpdateReport, type AcceptedBuildDescriptor, type ContentIdentity } from "@afallon/contracts";
import { StaticRootManifestSchema } from "@afallon/contracts/public";
export interface DeploymentMetadata {
  schemaVersion: "afallon.deployment.v2";
  publicationId: string;
  buildId: string;
  catalogId: string;
  mode: "preview" | "release";
  coverageComplete: boolean;
  selectionSha256: string;
  publicationSha256: string;
}

export interface AcceptUpdateOptions {
  storeRoot: string;
  reportPath: string;
  publicationRoot: string;
  baselineRoot: string;
  siteDirectory?: string;
  expectedDescriptorSha256?: string | null;
  stage: (publicationRoot: string, siteDirectory: string, baselineRoot: string) => Promise<DeploymentMetadata>;
}

async function optionalBytes(path: string): Promise<Buffer | null> {
  try { return await readFile(path); }
  catch (error) { if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") return null; throw error; }
}

function identity(bytes: Uint8Array): ContentIdentity { return { sha256: createHash("sha256").update(bytes).digest("hex"), bytes: bytes.byteLength }; }

async function replace(path: string, bytes: Uint8Array): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  const temporary = `${path}.${randomUUID()}.tmp`;
  try {
    const file = await open(temporary, "wx", 0o644);
    try { await file.writeFile(bytes); await file.sync(); } finally { await file.close(); }
    await rename(temporary, path);
  } finally { await rm(temporary, { force: true }); }
}

async function verifyReportEvidence(store: ArtifactStore, report: ReturnType<typeof validateUpdateReport>): Promise<void> {
  const pointers = [report.artifacts.updateReceipt, report.artifacts.schemaSnapshot, report.artifacts.buildComparison, ...report.artifacts.scans, ...report.artifacts.reviewedInputs, report.artifacts.catalog, report.artifacts.publication, ...report.checks.flatMap(check => check.evidence), ...report.risks.flatMap(risk => risk.evidence)];
  const unique = new Map(pointers.map(pointer => [`${pointer.content.sha256}:${pointer.content.bytes}`, pointer.content]));
  for (const value of unique.values()) await store.verify(value);
}

export async function acceptUpdate(options: AcceptUpdateOptions): Promise<AcceptedBuildDescriptor> {
  const store = new ArtifactStore(resolve(options.storeRoot));
  const reportBytes = new Uint8Array(await readFile(resolve(options.reportPath)));
  const report = validateUpdateReport(JSON.parse(new TextDecoder().decode(reportBytes)));
  await verifyReportEvidence(store, report);
  const publicationRun = await resolveArtifactRun(store, report.artifacts.publication.content, { buildId: report.current.buildId, operation: "publish" });
  const publicationOutput = publicationRun.outputs.find(output => output.name === "publication.json" && output.schemaId === "compendium.static-root.v3");
  if (!publicationOutput) throw new Error("Accepted update report does not reference a successful static publication run.");
  const rootValue: unknown = JSON.parse(await readFile(store.objectPath(publicationOutput.content.sha256), "utf8"));
  Assert(StaticRootManifestSchema, rootValue);
  if (rootValue.buildId !== report.current.buildId) throw new Error("Accepted publication build does not match the update report.");
  if (!rootValue.complete) throw new Error("Accepted publication does not report complete coverage.");
  const plan = publicationRun.input.settings.plan as { catalog?: { catalogId?: string; manifest?: ContentIdentity; object?: ContentIdentity } };
  if (!plan.catalog?.catalogId || !plan.catalog.manifest || !plan.catalog.object || rootValue.catalogId !== plan.catalog.catalogId) throw new Error("Accepted publication has no matching sealed catalog identity.");
  if (report.artifacts.catalog.content.sha256 !== plan.catalog.manifest.sha256 || report.artifacts.catalog.content.bytes !== plan.catalog.manifest.bytes) throw new Error("Update report catalog does not match the published catalog.");

  const publicationRoot = resolve(options.publicationRoot), siteDirectory = resolve(options.siteDirectory ?? join(import.meta.dir, "../../site"));
  const descriptorPath = join(store.root, "accepted-build.json"), selectionPath = join(publicationRoot, "selected.json"), stageRoot = join(siteDirectory, ".stage", "production");
  const previousDescriptorBytes = await optionalBytes(descriptorPath), previousSelection = await optionalBytes(selectionPath);
  const previousDescriptorIdentity = previousDescriptorBytes ? identity(previousDescriptorBytes) : null;
  if (options.expectedDescriptorSha256 !== undefined && options.expectedDescriptorSha256 !== previousDescriptorIdentity?.sha256) throw new Error("Accepted-build compare-and-swap failed.");
  const priorValue: unknown = previousDescriptorBytes ? JSON.parse(previousDescriptorBytes.toString("utf8")) : null;
  if (priorValue !== null) Assert(AcceptedBuildDescriptorSchema, priorValue);
  const prior = priorValue as AcceptedBuildDescriptor | null;
  const candidateDirectory = join(publicationRoot, "publications", publicationOutput.content.sha256);
  const stat = await lstat(candidateDirectory);
  if (!stat.isDirectory() || stat.isSymbolicLink()) throw new Error("Candidate publication directory is unavailable.");
  const selection = { root: { path: `resources/${publicationOutput.content.sha256}.json`, sha256: publicationOutput.content.sha256, bytes: publicationOutput.content.bytes, schemaId: "compendium.static-root.v3" as const }, directory: `publications/${publicationOutput.content.sha256}` };
  const selectionBytes = new TextEncoder().encode(`${canonicalJson(selection)}\n`), selectionIdentity = identity(selectionBytes);
  const stageBackup = `${stageRoot}.rollback-${randomUUID()}`;
  let backedUp = false, selectionChanged = false, descriptorChanged = false;
  try {
    try { await rename(stageRoot, stageBackup); backedUp = true; }
    catch (error) { if (!(error && typeof error === "object" && "code" in error && error.code === "ENOENT")) throw error; }
    await replace(selectionPath, selectionBytes);
    selectionChanged = true;
    const metadata = await options.stage(publicationRoot, siteDirectory, resolve(options.baselineRoot));
    if (metadata.buildId !== report.current.buildId || metadata.catalogId !== plan.catalog.catalogId || metadata.publicationId !== publicationOutput.content.sha256 || metadata.selectionSha256 !== selectionIdentity.sha256 || metadata.publicationSha256 !== publicationOutput.content.sha256 || metadata.coverageComplete !== true || metadata.mode !== rootValue.mode) {
      throw new Error("Staged production metadata does not match the accepted candidate.");
    }
    const lease = await createArtifactLease(store, { runId: randomUUID(), buildId: report.current.buildId, operation: "accept-update", objects: [], manifests: [report.artifacts.publication.content, report.artifacts.catalog.content] });
    let reportIdentity: ContentIdentity, rollbackDescriptorIdentity = previousDescriptorIdentity;
    try {
      const storedReport = await store.putBytes(reportBytes, lease);
      reportIdentity = { sha256: storedReport.sha256, bytes: storedReport.bytes };
      if (previousDescriptorBytes) {
        const storedDescriptor = await store.putBytes(previousDescriptorBytes, lease);
        rollbackDescriptorIdentity = { sha256: storedDescriptor.sha256, bytes: storedDescriptor.bytes };
      }
    } finally { await lease.release(); }
    const descriptor: AcceptedBuildDescriptor = {
      schemaVersion: "compendium.accepted-build.v1", acceptedAt: new Date().toISOString(), releaseVersion: report.releaseVersion, buildId: report.current.buildId,
      report: reportIdentity,
      catalog: { catalogId: plan.catalog.catalogId, manifest: plan.catalog.manifest, object: plan.catalog.object },
      publication: { manifest: report.artifacts.publication.content, root: selection.root }, stage: metadata,
      rollback: rollbackDescriptorIdentity && prior ? { descriptor: rollbackDescriptorIdentity, buildId: prior.buildId, publicationId: prior.publication.root.sha256 } : null,
    };
    Assert(AcceptedBuildDescriptorSchema, descriptor);
    await replace(descriptorPath, new TextEncoder().encode(`${canonicalJson(descriptor)}\n`));
    descriptorChanged = true;
    if (backedUp) await rm(stageBackup, { recursive: true, force: true }).catch(() => undefined);
    return descriptor;
  } catch (error) {
    if (descriptorChanged) {
      if (previousDescriptorBytes) await replace(descriptorPath, previousDescriptorBytes);
      else await rm(descriptorPath, { force: true });
    }
    await rm(stageRoot, { recursive: true, force: true });
    if (backedUp) await rename(stageBackup, stageRoot);
    if (selectionChanged) {
      if (previousSelection) await replace(selectionPath, previousSelection);
      else await rm(selectionPath, { force: true });
    }
    throw error;
  }
}
