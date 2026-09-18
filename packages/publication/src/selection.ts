import { createHash, randomUUID } from "node:crypto";
import { chmod, lstat, mkdir, open, readFile, rename, rm } from "node:fs/promises";
import * as path from "node:path";
import { Assert } from "typebox/value";
import { ArtifactStore } from "@afallon/artifacts";
import type { CatalogGateResult } from "@afallon/catalog";
import { canonicalJson, type ContentIdentity } from "@afallon/contracts";
import { StaticRootManifestSchema, assertStaticResourceReference, assertStaticPublicationBudgets, assertStaticPublicationSemantics, staticResourceEdges, staticResourceSchema, type StaticResource, type StaticResourceReference, type VerifiedPublicationGraph } from "@afallon/contracts/public";

export interface PublicationCandidateResource { reference: StaticResourceReference; identity: ContentIdentity }
export interface PublicationCandidateAsset { path: string; identity: ContentIdentity }
export interface SelectedPublication { root: StaticResourceReference; directory: string }

function verifyReference(reference: StaticResourceReference, identity: ContentIdentity): void {
  assertStaticResourceReference(reference);
  if (reference.sha256 !== identity.sha256 || reference.bytes !== identity.bytes) throw new Error(`Publication reference identity mismatch: ${reference.path}.`);
}

export async function verifyPublicationGraph(
  store: ArtifactStore,
  rootResource: PublicationCandidateResource,
  resources: readonly PublicationCandidateResource[],
  assets: readonly PublicationCandidateAsset[],
  gate: Pick<CatalogGateResult, "accepted" | "complete">,
): Promise<VerifiedPublicationGraph> {
  if (!gate.accepted) throw new Error("Publication candidate failed its catalog gate.");
  verifyReference(rootResource.reference, rootResource.identity);
  if (rootResource.reference.schemaId !== "compendium.static-root.v3") throw new Error("Publication root reference has the wrong schema.");
  await store.verify(rootResource.identity);
  const root: unknown = JSON.parse(await readFile(store.objectPath(rootResource.identity.sha256), "utf8"));
  Assert(StaticRootManifestSchema, root);
  if (root.complete !== gate.complete) throw new Error("Publication root completeness does not match its catalog gate.");
  assertStaticPublicationBudgets(root, rootResource.identity.bytes);
  const byPath = new Map<string, PublicationCandidateResource>();
  for (const resource of resources) {
    verifyReference(resource.reference, resource.identity);
    if (byPath.has(resource.reference.path)) throw new Error(`Duplicate publication resource path: ${resource.reference.path}.`);
    byPath.set(resource.reference.path, resource);
  }
  const assetsByPath = new Map<string, PublicationCandidateAsset>();
  for (const asset of assets) {
    verifyReference({ path: asset.path, ...asset.identity, schemaId: "image/webp" }, asset.identity);
    if (assetsByPath.has(asset.path)) throw new Error(`Duplicate publication image path: ${asset.path}.`);
    assetsByPath.set(asset.path, asset);
  }
  const visited = new Map<string, StaticResourceReference>();
  const values = new Map<string, StaticResource>();
  const pending = staticResourceEdges(root).map((reference) => ({ reference, parent: "publication.json" }));
  for (let index = 0; index < pending.length; index += 1) {
    const { reference, parent } = pending[index]!;
    verifyReference(reference, reference);
    const prior = visited.get(reference.path);
    if (prior) {
      if (prior.sha256 !== reference.sha256 || prior.bytes !== reference.bytes || prior.schemaId !== reference.schemaId) throw new Error(`Conflicting publication edge from ${parent}: ${reference.path}.`);
      continue;
    }
    visited.set(reference.path, reference);
    if (reference.schemaId === "image/webp") {
      const asset = assetsByPath.get(reference.path);
      if (!asset) throw new Error(`Publication image is missing from ${parent}: ${reference.path}.`);
      verifyReference(reference, asset.identity);
      await store.verify(asset.identity);
      const file = await open(store.objectPath(asset.identity.sha256), "r");
      try {
        const header = Buffer.alloc(12);
        const result = await file.read(header, 0, header.length, 0);
        if (result.bytesRead !== 12 || header.toString("ascii", 0, 4) !== "RIFF" || header.toString("ascii", 8, 12) !== "WEBP") throw new Error(`Publication image is not WebP: ${reference.path}.`);
      } finally { await file.close(); }
      continue;
    }
    const resource = byPath.get(reference.path);
    if (!resource) throw new Error(`Publication resource is missing from ${parent}: ${reference.path}.`);
    verifyReference(reference, resource.identity);
    if (reference.schemaId !== resource.reference.schemaId) throw new Error(`Publication resource has the wrong schema from ${parent}: ${reference.path}.`);
    await store.verify(resource.identity);
    const value: unknown = JSON.parse(await readFile(store.objectPath(resource.identity.sha256), "utf8"));
    Assert(staticResourceSchema(reference.schemaId), value);
    const typed = value as StaticResource;
    values.set(reference.path, typed);
    for (const edge of staticResourceEdges(typed)) pending.push({ reference: edge, parent: reference.path });
  }
  for (const resource of resources) if (!visited.has(resource.reference.path)) throw new Error(`Unreachable publication resource: ${resource.reference.path}.`);
  for (const asset of assets) if (!visited.has(asset.path)) throw new Error(`Unreachable publication image: ${asset.path}.`);
  assertStaticPublicationSemantics(root, values);
  return { publication: root, resources: values, references: visited };
}

async function verifyFile(filePath: string, identity: ContentIdentity): Promise<void> {
  const stat = await lstat(filePath);
  if (!stat.isFile() || stat.size !== identity.bytes) throw new Error(`Publication file size or kind mismatch: ${filePath}.`);
  const file = await open(filePath, "r");
  try {
    const buffer = Buffer.allocUnsafe(1024 * 1024), hash = createHash("sha256");
    let bytes = 0;
    while (true) {
      const result = await file.read(buffer, 0, buffer.length, null);
      if (result.bytesRead === 0) break;
      bytes += result.bytesRead;
      hash.update(buffer.subarray(0, result.bytesRead));
    }
    if (bytes !== identity.bytes || hash.digest("hex") !== identity.sha256) throw new Error(`Publication file integrity mismatch: ${filePath}.`);
  } finally { await file.close(); }
}

async function materialize(store: ArtifactStore, destination: string, identity: ContentIdentity): Promise<void> {
  await mkdir(path.dirname(destination), { recursive: true });
  const source = await open(store.objectPath(identity.sha256), "r");
  try {
    const target = await open(destination, "wx", 0o600);
    try {
      const buffer = Buffer.allocUnsafe(1024 * 1024), hash = createHash("sha256");
      let bytes = 0;
      while (true) {
        const result = await source.read(buffer, 0, buffer.length, null);
        if (result.bytesRead === 0) break;
        hash.update(buffer.subarray(0, result.bytesRead));
        bytes += result.bytesRead;
        let offset = 0;
        while (offset < result.bytesRead) {
          const written = await target.write(buffer, offset, result.bytesRead - offset);
          if (written.bytesWritten === 0) throw new Error(`Publication copy made no progress: ${destination}.`);
          offset += written.bytesWritten;
        }
      }
      if (bytes !== identity.bytes || hash.digest("hex") !== identity.sha256) throw new Error(`Publication copy integrity mismatch: ${destination}.`);
      await target.sync();
    } finally { await target.close(); }
  } finally { await source.close(); }
  await chmod(destination, 0o444);
}

async function verifyMaterializedFiles(directory: string, files: readonly PublicationCandidateAsset[]): Promise<void> {
  const directories = new Set([directory, ...files.filter((file) => file.path.includes("/")).map((file) => path.join(directory, path.dirname(file.path)))]);
  for (const candidate of directories) {
    const stat = await lstat(candidate);
    if (!stat.isDirectory() || stat.isSymbolicLink()) throw new Error(`Publication directory is not a regular directory: ${candidate}.`);
  }
  for (const file of files) await verifyFile(path.join(directory, file.path), file.identity);
}

export async function materializePublication(store: ArtifactStore, publicationRoot: string, rootResource: PublicationCandidateResource, resources: readonly PublicationCandidateResource[], assets: readonly PublicationCandidateAsset[], gate: Pick<CatalogGateResult, "accepted" | "complete">): Promise<SelectedPublication> {
  await verifyPublicationGraph(store, rootResource, resources, assets, gate);
  const absoluteRoot = path.resolve(publicationRoot);
  const selectedDirectory = path.join(absoluteRoot, "publications", rootResource.identity.sha256);
  const files = [{ path: "publication.json", identity: rootResource.identity }, ...resources.map((resource) => ({ path: resource.reference.path, identity: resource.identity })), ...assets];
  await mkdir(path.dirname(selectedDirectory), { recursive: true });
  let exists = false;
  try { const stat = await lstat(selectedDirectory); if (!stat.isDirectory() || stat.isSymbolicLink()) throw new Error("Publication directory is not a regular directory."); exists = true; }
  catch (error) { if (!(error instanceof Error) || !("code" in error) || error.code !== "ENOENT") throw error; }
  if (exists) {
    await verifyMaterializedFiles(selectedDirectory, files);
  } else {
    const candidate = path.join(absoluteRoot, `.candidate-${randomUUID()}`);
    await mkdir(candidate);
    try {
      for (const file of files) await materialize(store, path.join(candidate, file.path), file.identity);
      try { await rename(candidate, selectedDirectory); }
      catch (error) {
        if (!(error instanceof Error) || !("code" in error) || (error.code !== "EEXIST" && error.code !== "ENOTEMPTY")) throw error;
        await verifyMaterializedFiles(selectedDirectory, files);
      }
    } finally { await rm(candidate, { recursive: true, force: true }); }
  }
  return { root: rootResource.reference, directory: path.relative(absoluteRoot, selectedDirectory) };
}

export async function selectPublication(store: ArtifactStore, publicationRoot: string, rootResource: PublicationCandidateResource, resources: readonly PublicationCandidateResource[], assets: readonly PublicationCandidateAsset[], gate: Pick<CatalogGateResult, "accepted" | "complete">): Promise<SelectedPublication> {
  const selection = await materializePublication(store, publicationRoot, rootResource, resources, assets, gate);
  const temporary = path.join(path.resolve(publicationRoot), `.selected-${randomUUID()}.json`);
  try {
    const file = await open(temporary, "wx", 0o644);
    try { await file.writeFile(`${canonicalJson(selection)}\n`); await file.sync(); } finally { await file.close(); }
    await rename(temporary, path.join(path.resolve(publicationRoot), "selected.json"));
  } finally { await rm(temporary, { force: true }); }
  return selection;
}
