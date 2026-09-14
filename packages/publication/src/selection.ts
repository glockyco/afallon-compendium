import { randomUUID } from "node:crypto";
import { link, mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import * as path from "node:path";
import { Assert } from "typebox/value";
import { ArtifactStore } from "@afallon/artifacts";
import type { CatalogGateResult } from "@afallon/catalog";
import { canonicalJson, schemaRegistry, type ContentIdentity } from "@afallon/contracts";
import { StaticRootManifestSchema, assertStaticResourceIdentity, type StaticResourceReference, type StaticRootManifest } from "@afallon/contracts/public";

export interface PublicationCandidateResource {
  reference: StaticResourceReference;
  identity: ContentIdentity;
}

export interface PublicationCandidateAsset {
  path: string;
  identity: ContentIdentity;
}

export interface SelectedPublication {
  root: StaticResourceReference;
  directory: string;
}

function referencedPaths(value: unknown, result = new Set<string>()): Set<string> {
  if (typeof value === "string" && /^(?:resources|assets)\/[a-f0-9]{64}\.(?:json|webp)$/.test(value)) result.add(value);
  else if (Array.isArray(value)) for (const item of value) referencedPaths(item, result);
  else if (value !== null && typeof value === "object") for (const item of Object.values(value)) referencedPaths(item, result);
  return result;
}

async function materialize(store: ArtifactStore, destination: string, identity: ContentIdentity): Promise<void> {
  await store.verify(identity);
  await mkdir(path.dirname(destination), { recursive: true });
  await link(store.objectPath(identity.sha256), destination);
}

export async function selectPublication(
  store: ArtifactStore,
  publicationRoot: string,
  rootResource: PublicationCandidateResource,
  resources: readonly PublicationCandidateResource[],
  assets: readonly PublicationCandidateAsset[],
  gate: CatalogGateResult,
): Promise<SelectedPublication> {
  if (!gate.accepted) throw new Error("Publication candidate failed its catalog gate.");
  await store.verify(rootResource.identity);
  const rootBytes = await readFile(store.objectPath(rootResource.identity.sha256));
  if (rootBytes.byteLength !== rootResource.identity.bytes) throw new Error("Publication root size does not match its identity.");
  const rootValue: unknown = JSON.parse(rootBytes.toString("utf8"));
  Assert(StaticRootManifestSchema, rootValue);
  const root = rootValue as StaticRootManifest;
  if (root.complete !== gate.complete) throw new Error("Publication root completeness does not match its catalog gate.");
  if (rootResource.reference.sha256 !== rootResource.identity.sha256 || rootResource.reference.bytes !== rootResource.identity.bytes) throw new Error("Publication root reference does not match its object identity.");

  const byPath = new Map<string, PublicationCandidateResource>();
  const values = new Map<string, unknown>();
  for (const resource of resources) {
    if (resource.reference.sha256 !== resource.identity.sha256 || resource.reference.bytes !== resource.identity.bytes || !resource.reference.path.includes(resource.identity.sha256)) throw new Error(`Publication resource identity mismatch: ${resource.reference.path}.`);
    if (byPath.has(resource.reference.path)) throw new Error(`Duplicate publication resource path: ${resource.reference.path}.`);
    await store.verify(resource.identity);
    const value: unknown = JSON.parse((await readFile(store.objectPath(resource.identity.sha256))).toString("utf8"));
    Assert(schemaRegistry.require(resource.reference.schemaId).schema, value);
    assertStaticResourceIdentity(root, value as { buildId: string; catalogId: string });
    byPath.set(resource.reference.path, resource);
    values.set(resource.reference.path, value);
  }
  const assetsByPath = new Map(assets.map((asset) => [asset.path, asset]));
  for (const asset of assets) {
    if (!asset.path.includes(asset.identity.sha256)) throw new Error(`Publication asset identity mismatch: ${asset.path}.`);
    await store.verify(asset.identity);
  }
  const required = referencedPaths(root);
  for (const value of values.values()) for (const resourcePath of referencedPaths(value)) required.add(resourcePath);
  for (const requiredPath of required) if (!byPath.has(requiredPath) && !assetsByPath.has(requiredPath)) throw new Error(`Publication resource is missing: ${requiredPath}.`);

  const absoluteRoot = path.resolve(publicationRoot);
  const candidate = path.join(absoluteRoot, `.candidate-${randomUUID()}`);
  const selectedDirectory = path.join(absoluteRoot, "publications", rootResource.identity.sha256);
  await mkdir(absoluteRoot, { recursive: true });
  await mkdir(candidate, { recursive: false });
  try {
    await materialize(store, path.join(candidate, "publication.json"), rootResource.identity);
    for (const resource of resources) await materialize(store, path.join(candidate, resource.reference.path), resource.identity);
    for (const asset of assets) await materialize(store, path.join(candidate, asset.path), asset.identity);
    await mkdir(path.dirname(selectedDirectory), { recursive: true });
    try { await rename(candidate, selectedDirectory); } catch (error) {
      if (!(error instanceof Error) || !("code" in error) || error.code !== "EEXIST") throw error;
    }
    const selection: SelectedPublication = { root: rootResource.reference, directory: path.relative(absoluteRoot, selectedDirectory) };
    const temporarySelection = path.join(absoluteRoot, `.selected-${randomUUID()}.json`);
    await writeFile(temporarySelection, `${canonicalJson(selection)}\n`, { flag: "wx" });
    await rename(temporarySelection, path.join(absoluteRoot, "selected.json"));
    return selection;
  } finally {
    await rm(candidate, { recursive: true, force: true });
  }
}
