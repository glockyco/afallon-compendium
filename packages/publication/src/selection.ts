import { createHash, randomUUID } from "node:crypto";
import { chmod, lstat, mkdir, open, readFile, rename, rm } from "node:fs/promises";
import * as path from "node:path";
import { Assert } from "typebox/value";
import { ArtifactStore } from "@afallon/artifacts";
import type { CatalogGateResult } from "@afallon/catalog";
import { canonicalJson, type ContentIdentity } from "@afallon/contracts";
import { StaticResourceReferenceSchema, StaticRootManifestSchema, assertStaticResourceIdentity, staticResourceEdges, staticResourceSchema, type StaticResource, type StaticResourceReference, type StaticRootManifest } from "@afallon/contracts/public";
import { PUBLICATION_ROOT_BUDGET, PUBLICATION_PART_BUDGET, PUBLICATION_ESSENTIAL_BUDGET } from "./resources";

export interface PublicationCandidateResource { reference: StaticResourceReference; identity: ContentIdentity }
export interface PublicationCandidateAsset { path: string; identity: ContentIdentity }
export interface SelectedPublication { root: StaticResourceReference; directory: string }

function verifyReference(reference: StaticResourceReference, identity: ContentIdentity): void {
  Assert(StaticResourceReferenceSchema, reference);
  const expectedPath = reference.schemaId === "image/webp" ? `assets/${reference.sha256}.webp` : `resources/${reference.sha256}.json`;
  if (reference.path !== expectedPath || reference.sha256 !== identity.sha256 || reference.bytes !== identity.bytes) throw new Error(`Publication reference identity or path mismatch: ${reference.path}.`);
}

export async function verifyPublicationGraph(
  store: ArtifactStore,
  rootResource: PublicationCandidateResource,
  resources: readonly PublicationCandidateResource[],
  assets: readonly PublicationCandidateAsset[],
  gate: Pick<CatalogGateResult, "accepted" | "complete">,
): Promise<StaticRootManifest> {
  if (!gate.accepted) throw new Error("Publication candidate failed its catalog gate.");
  verifyReference(rootResource.reference, rootResource.identity);
  if (rootResource.reference.schemaId !== "compendium.static-root.v2") throw new Error("Publication root reference has the wrong schema.");
  await store.verify(rootResource.identity);
  const root: unknown = JSON.parse(await readFile(store.objectPath(rootResource.identity.sha256), "utf8"));
  Assert(StaticRootManifestSchema, root);
  if (root.complete !== gate.complete) throw new Error("Publication root completeness does not match its catalog gate.");
  if (rootResource.identity.bytes > PUBLICATION_ROOT_BUDGET) throw new Error("Publication root exceeds its byte budget.");
  const essentialBytes = rootResource.identity.bytes + root.coverage.bytes + root.maps.reduce((sum, map) => sum + map.imagery.bytes + map.parts.reduce((partSum, part) => partSum + part.bytes, 0), 0);
  if (essentialBytes > PUBLICATION_ESSENTIAL_BUDGET) throw new Error("Essential publication exceeds its byte budget.");
  for (const reference of [...root.entitySearch, ...root.itemSearch, ...root.maps.flatMap((map) => [...map.parts, ...map.optionalGeometry])]) {
    if (reference.bytes > PUBLICATION_PART_BUDGET) throw new Error(`Publication part exceeds its byte budget: ${reference.path}.`);
  }
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
    assertStaticResourceIdentity(root, typed);
    values.set(reference.path, typed);
    for (const edge of staticResourceEdges(typed)) pending.push({ reference: edge, parent: reference.path });
  }
  for (const resource of resources) if (!visited.has(resource.reference.path)) throw new Error(`Unreachable publication resource: ${resource.reference.path}.`);
  for (const asset of assets) if (!visited.has(asset.path)) throw new Error(`Unreachable publication image: ${asset.path}.`);
  const coverage = values.get(root.coverage.path);
  if (coverage?.schemaVersion !== "compendium.static-coverage.v1" || coverage.complete !== root.complete) throw new Error("Publication coverage does not match its root.");
  const mapIds = new Set<string>();
  const placementIds = new Set<string>();
  for (const map of root.maps) {
    if (mapIds.has(map.mapSpaceId)) throw new Error(`Duplicate publication map: ${map.mapSpaceId}.`);
    mapIds.add(map.mapSpaceId);
    const mapPlacementStates = new Map<string, boolean | null>();
    const geometryIds = new Set<string>();
    const travelGeometryIds = new Set<string>();
    for (const [part, reference] of map.parts.entries()) {
      const value = values.get(reference.path);
      if (value?.schemaVersion !== "compendium.static-map.v2" || value.mapSpaceId !== map.mapSpaceId || value.part !== part) throw new Error(`Atlas part identity mismatch: ${reference.path}.`);
      for (const placement of value.placements) {
        if (placementIds.has(placement[0])) throw new Error(`Duplicate public placement: ${placement[0]}.`);
        placementIds.add(placement[0]);
        mapPlacementStates.set(placement[0], placement[8]);
      }
      if (value.regions.some((region) => region.mapSpaceId !== map.mapSpaceId)) throw new Error(`Atlas region map mismatch: ${reference.path}.`);
    }
    for (const [part, reference] of map.optionalGeometry.entries()) {
      const value = values.get(reference.path);
      if (value?.schemaVersion !== "compendium.static-geometry.v1" || value.mapSpaceId !== map.mapSpaceId || value.part !== part) throw new Error(`Geometry part identity mismatch: ${reference.path}.`);
      for (const placement of value.placements) {
        if (!mapPlacementStates.has(placement.placementId)) throw new Error(`Geometry placement is missing from its map: ${placement.placementId}.`);
        if (geometryIds.has(placement.placementId)) throw new Error(`Duplicate geometry placement: ${placement.placementId}.`);
        geometryIds.add(placement.placementId);
        if (placement.travel) {
          if (placement.travel.enabled !== mapPlacementStates.get(placement.placementId)) throw new Error(`Travel marker state differs from its geometry: ${placement.placementId}.`);
          travelGeometryIds.add(placement.placementId);
        }
      }
    }
    for (const [placementId, state] of mapPlacementStates) if (state !== null && !travelGeometryIds.has(placementId)) throw new Error(`Travel placement has no declared geometry: ${placementId}.`);
    const imagery = values.get(map.imagery.path);
    if (imagery?.schemaVersion !== "compendium.static-imagery.v2" || imagery.mapSpaceId !== map.mapSpaceId || imagery.layers.some((layer) => layer.mapSpaceId !== map.mapSpaceId)) throw new Error(`Imagery map mismatch: ${map.imagery.path}.`);
    if (!imagery.layers.some((layer) => layer.id === imagery.defaultLayerId && layer.kind === "game-map")) throw new Error(`Imagery default is not a game map: ${map.imagery.path}.`);
  }
  for (const [part, reference] of root.entitySearch.entries()) {
    const value = values.get(reference.path);
    if (value?.schemaVersion !== "compendium.static-entity-search.v2" || value.part !== part) throw new Error(`Entity search part identity mismatch: ${reference.path}.`);
    for (const entity of value.entities) {
      const detail = values.get(entity.detail.path);
      if (detail?.schemaVersion !== "compendium.static-entity-detail.v1" || detail.entity.entityKey !== entity.entityKey) throw new Error(`Entity detail identity mismatch: ${entity.entityKey}.`);
    }
  }
  for (const [part, reference] of root.itemSearch.entries()) {
    const value = values.get(reference.path);
    if (value?.schemaVersion !== "compendium.static-item-search.v2" || value.part !== part) throw new Error(`Item search part identity mismatch: ${reference.path}.`);
    for (const item of value.items) {
      const detail = values.get(item.detail.path), source = values.get(item.source.path);
      if (detail?.schemaVersion !== "compendium.static-entity-detail.v1" || detail.entity.entityKey !== item.itemKey || source?.schemaVersion !== "compendium.static-item-source.v1" || source.itemSource.itemKey !== item.itemKey) throw new Error(`Item resource identity mismatch: ${item.itemKey}.`);
    }
  }
  return root;
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
