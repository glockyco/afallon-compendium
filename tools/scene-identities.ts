import { Assert } from "typebox/value";
import { Type, type Static } from "typebox";
import { hashFile } from "./build";
import { isWithin, type CompendiumConfig } from "./config";
import { indexSerializedAsset } from "./serialized-assets";
import { resolvePlacementIdentities } from "./placement-identities";
import {
  PlacementSnapshotSchema,
  type PlacementIdentityResult,
  type PlacementSnapshot,
  type SerializedAssetIndex,
} from "./placement-contracts";
import type { Runtime } from "./runtime";
import { mkdir, realpath, stat } from "node:fs/promises";
import { isAbsolute, relative, resolve, sep, win32 } from "node:path";

const ADDRESSABLE_GRAPH_SCHEMA_VERSION = "compendium.addressable-locations.v1";
const BUNDLED_ASSET_PROVIDER = "UnityEngine.ResourceManagement.ResourceProviders.BundledAssetProvider";
const ASSET_BUNDLE_PROVIDER = "UnityEngine.ResourceManagement.ResourceProviders.AssetBundleProvider";
const GAME_OBJECT_RESOURCE = "UnityEngine.GameObject";
const ASSET_BUNDLE_RESOURCE = "UnityEngine.ResourceManagement.ResourceProviders.IAssetBundleResource";
const SHA256 = /^[a-f0-9]{64}$/;
const GUID = /^[a-f0-9]{32}$/;

const AddressableGraphSchema = Type.Object({
  schemaVersion: Type.Literal(ADDRESSABLE_GRAPH_SCHEMA_VERSION),
  frame: Type.Integer({ minimum: 0 }),
  dataPath: Type.String({ minLength: 1 }),
  scene: Type.Object({ path: Type.String({ minLength: 1 }), handle: Type.Integer(), buildIndex: Type.Integer() }),
  assets: Type.Array(Type.Object({ guid: Type.String({ minLength: 1 }), locationIds: Type.Array(Type.Integer({ minimum: 0 })) })),
  locations: Type.Array(Type.Object({
    id: Type.Integer({ minimum: 0 }),
    primaryKey: Type.String({ minLength: 1 }),
    internalId: Type.String({ minLength: 1 }),
    transformedInternalId: Type.String({ minLength: 1 }),
    providerId: Type.String({ minLength: 1 }),
    resourceType: Type.String({ minLength: 1 }),
    dependencyIds: Type.Array(Type.Integer({ minimum: 0 })),
  })),
});
type AddressableGraph = Static<typeof AddressableGraphSchema>;
type AddressableAsset = AddressableGraph["assets"][number];
type AddressableLocation = AddressableGraph["locations"][number];

type SourceIssue = {
  streamComponentInstanceId: number | null;
  assetGuid: string | null;
  reason: string;
  detail: string;
  candidates: string[];
};

type SourceIssuesArtifact = {
  schemaVersion: "compendium.scene-source-issues.v2";
  scope: "queried-source-components";
  buildId: string;
  sceneNativeId: number;
  scenePath: string;
  snapshotFrame: number;
  issues: SourceIssue[];
  skippedStreams: { componentInstanceId: number; assetGuid: string | null; loadedRootInstanceId: number | null; reason: "no-queried-source-components" }[];
  summary: {
    loadedStreams: number;
    sourceStreams: number;
    resolvedStreams: number;
    unresolvedStreams: number;
    indexedPrefabs: number;
  };
};

type SourceExpectation = {
  path: string;
  assetName: string;
};

type PreparedSource = {
  expectation: SourceExpectation;
  sourcePath: string;
};

function checkSignal(runtime: Runtime): void {
  runtime.signal.throwIfAborted();
}

function normalizedRelativePath(value: string, label: string): string {
  const normalized = value.replaceAll("\\", "/");
  if (!normalized || normalized.startsWith("/") || /^[A-Za-z]:/.test(normalized)) throw new Error(`${label} must be a relative path.`);
  const parts = normalized.split("/");
  if (parts.some(part => part === "" || part === "." || part === "..")) throw new Error(`${label} contains path traversal.`);
  return parts.join("/");
}

function logicalPath(root: string, path: string, label: string): string {
  const suffix = relative(root, path);
  if (isAbsolute(suffix) || suffix === ".." || suffix.startsWith(`..${sep}`)) throw new Error(`${label} is outside the game root.`);
  return normalizedRelativePath(suffix.split(sep).join("/"), label);
}

function artifactPath(directory: string, name: string): string {
  const target = resolve(directory, name);
  if (!isWithin(directory, target)) throw new Error(`Artifact path escapes preparation directory: ${name}`);
  return target;
}

async function writeJson(path: string, value: unknown): Promise<void> {
  await Bun.write(path, `${JSON.stringify(value, null, 2)}\n`);
}

function graphLocation(locations: ReadonlyMap<number, AddressableLocation>, id: number, label: string): AddressableLocation {
  const location = locations.get(id);
  if (location === undefined) throw new Error(`${label} references missing location ${id}.`);
  return location;
}

function validateGraph(graph: AddressableGraph, snapshot: PlacementSnapshot): { assets: Map<string, AddressableAsset>; locations: Map<number, AddressableLocation> } {
  if (!win32.isAbsolute(graph.dataPath)) throw new Error("Addressable graph dataPath must be an absolute Windows path.");
  if (win32.basename(graph.dataPath).toLowerCase() !== "afallon_data") throw new Error(`Addressable graph dataPath does not identify Afallon_Data: ${graph.dataPath}.`);
  if (graph.scene.path !== snapshot.context.scene.path || graph.scene.handle !== snapshot.context.scene.handle || graph.scene.buildIndex !== snapshot.context.scene.buildIndex) {
    throw new Error("Addressable graph scene provenance does not match the placement snapshot.");
  }

  const assets = new Map<string, AddressableAsset>();
  for (const asset of graph.assets) {
    if (!GUID.test(asset.guid)) throw new Error(`Addressable graph contains invalid asset GUID ${JSON.stringify(asset.guid)}.`);
    if (assets.has(asset.guid)) throw new Error(`Addressable graph contains duplicate asset GUID ${asset.guid}.`);
    assets.set(asset.guid, asset);
  }
  const locations = new Map<number, AddressableLocation>();
  for (const location of graph.locations) {
    if (locations.has(location.id)) throw new Error(`Addressable graph contains duplicate location ID ${location.id}.`);
    locations.set(location.id, location);
  }
  for (const asset of graph.assets) {
    const seen = new Set<number>();
    for (const id of asset.locationIds) {
      if (seen.has(id)) throw new Error(`Addressable asset ${asset.guid} repeats location ${id}.`);
      seen.add(id);
      graphLocation(locations, id, `Addressable asset ${asset.guid}`);
    }
  }
  const state = new Map<number, 0 | 1 | 2>();
  const visit = (location: AddressableLocation): void => {
    const current = state.get(location.id) ?? 0;
    if (current === 1) throw new Error(`Addressable dependency graph contains a cycle at location ${location.id}.`);
    if (current === 2) return;
    state.set(location.id, 1);
    const seen = new Set<number>();
    for (const dependencyId of location.dependencyIds) {
      if (seen.has(dependencyId)) throw new Error(`Addressable location ${location.id} repeats dependency ${dependencyId}.`);
      seen.add(dependencyId);
      if (dependencyId === location.id) throw new Error(`Addressable location ${location.id} depends on itself.`);
      visit(graphLocation(locations, dependencyId, `Addressable location ${location.id}`));
    }
    state.set(location.id, 2);
  };
  for (const location of graph.locations) visit(location);
  return { assets, locations };
}

function localBundlePath(graph: AddressableGraph, bundle: AddressableLocation, config: CompendiumConfig): string | SourceIssue {
  const suffix = win32.relative(graph.dataPath, bundle.transformedInternalId);
  if (!suffix || win32.isAbsolute(suffix) || suffix === ".." || suffix.startsWith("..\\") || suffix.startsWith("../")) {
    return {
      streamComponentInstanceId: null,
      assetGuid: null,
      reason: "non-local-source",
      detail: `Bundle transformedInternalId ${bundle.transformedInternalId} is not below graph dataPath ${graph.dataPath}.`,
      candidates: [bundle.transformedInternalId],
    };
  }
  const suffixParts = suffix.split(/[\\/]+/).filter(Boolean);
  if (suffixParts.some(part => part === "." || part === "..")) {
    return {
      streamComponentInstanceId: null,
      assetGuid: null,
      reason: "non-local-source",
      detail: `Bundle transformedInternalId ${bundle.transformedInternalId} contains path traversal relative to graph dataPath.`,
      candidates: [bundle.transformedInternalId],
    };
  }
  const sourcePath = resolve(config.gamePath, "Afallon_Data", ...suffixParts);
  if (!isWithin(config.gamePath, sourcePath)) {
    return {
      streamComponentInstanceId: null,
      assetGuid: null,
      reason: "non-local-source",
      detail: `Resolved bundle path ${sourcePath} escapes the installed game root.`,
      candidates: [sourcePath],
    };
  }
  return sourcePath;
}

function sourceIssue(streamComponentInstanceId: number | null, assetGuid: string | null, reason: string, detail: string, candidates: Iterable<string> = []): SourceIssue {
  return { streamComponentInstanceId, assetGuid, reason, detail, candidates: [...new Set(candidates)].sort() };
}

function validateIndexShape(index: SerializedAssetIndex, label: string, expected: { sourcePath: string; scenePath?: string; buildIndex?: number; assetName?: string }): void {
  if (!SHA256.test(index.source.sha256)) throw new TypeError(`${label} has an invalid source SHA-256.`);
  if (index.source.bytes < 0 || !Number.isSafeInteger(index.source.bytes)) throw new TypeError(`${label} has an invalid source byte count.`);
  if (expected.scenePath !== undefined && (index.source.scenePath !== expected.scenePath || index.source.buildIndex !== expected.buildIndex)) {
    throw new Error(`${label} scene provenance does not match ${expected.scenePath}#${expected.buildIndex}.`);
  }
  if (expected.scenePath === undefined && (index.source.scenePath !== null || index.source.buildIndex !== null)) {
    throw new Error(`${label} unexpectedly has scene provenance.`);
  }
  if (expected.assetName !== undefined && index.source.assetName !== expected.assetName) {
    throw new Error(`${label} assetName does not match ${expected.assetName}.`);
  }
  if (normalizedRelativePath(index.source.path, `${label} source.path`) !== normalizedRelativePath(expected.sourcePath, `${label} expected source path`)) {
    throw new Error(`${label} source path does not match ${expected.sourcePath}.`);
  }
  const paths = new Set<string>();
  for (const dependency of index.dependencies) {
    if (!SHA256.test(dependency.sha256)) throw new TypeError(`${label} has an invalid dependency SHA-256.`);
    const dependencyPath = normalizedRelativePath(dependency.path, `${label} dependency path`);
    if (paths.has(dependencyPath)) throw new Error(`${label} repeats dependency ${dependencyPath}.`);
    paths.add(dependencyPath);
  }
}

async function verifyIndexFiles(config: CompendiumConfig, index: SerializedAssetIndex, label: string, runtime: Runtime): Promise<void> {
  const files = [index.source, ...index.dependencies];
  const checked = new Map<string, string>();
  for (const file of files) {
    checkSignal(runtime);
    const logical = normalizedRelativePath(file.path, `${label} file path`);
    const hostPath = resolve(config.gamePath, ...logical.split("/"));
    if (!isWithin(config.gamePath, hostPath)) throw new Error(`${label} file ${logical} escapes the game root.`);
    const canonicalRoot = await realpath(config.gamePath);
    const canonicalPath = await realpath(hostPath);
    if (!isWithin(canonicalRoot, canonicalPath)) throw new Error(`${label} file ${logical} escapes the game root through a symlink.`);
    const details = await stat(canonicalPath);
    if (!details.isFile()) throw new Error(`${label} file ${logical} is not a regular file.`);
    if (details.size !== file.bytes) throw new Error(`${label} file ${logical} byte count does not match its recorded hash.`);
    const previous = checked.get(canonicalPath);
    if (previous !== undefined) {
      if (previous !== file.sha256) throw new Error(`${label} records conflicting hashes for ${logical}.`);
      continue;
    }
    const actual = await hashFile(canonicalPath);
    if (actual !== file.sha256) throw new Error(`${label} file ${logical} hash does not match its recorded hash.`);
    checked.set(canonicalPath, actual);
    checkSignal(runtime);
  }
}

function sourceForGuid(
  graph: AddressableGraph,
  assets: ReadonlyMap<string, AddressableAsset>,
  locations: ReadonlyMap<number, AddressableLocation>,
  guid: string,
  config: CompendiumConfig,
): PreparedSource | SourceIssue {
  const asset = assets.get(guid);
  if (asset === undefined) return sourceIssue(null, guid, "missing-location", `Addressable graph has no asset record for loaded stream GUID ${guid}.`);
  if (asset.locationIds.length !== 1) return sourceIssue(null, guid, "ambiguous-location", `Loaded stream GUID ${guid} has ${asset.locationIds.length} addressable locations; no location was selected.`, asset.locationIds.map(String));
  const locationId = asset.locationIds[0]!;
  const location = locations.get(locationId);
  if (location === undefined) return sourceIssue(null, guid, "missing-location", `Loaded stream GUID ${guid} references missing location ${locationId}.`, [String(locationId)]);
  if (location.providerId !== BUNDLED_ASSET_PROVIDER || location.resourceType !== GAME_OBJECT_RESOURCE) {
    return sourceIssue(null, guid, "unsupported-provider", `Asset location ${locationId} uses provider ${location.providerId} and resource type ${location.resourceType}, not a bundled GameObject.`, [String(locationId)]);
  }
  if (location.dependencyIds.length === 0) return sourceIssue(null, guid, "missing-source-bundle", `Asset location ${locationId} has no dependency identifying its source bundle.`, [String(locationId)]);
  const bundleId = location.dependencyIds[0]!;
  const bundle = locations.get(bundleId);
  if (bundle === undefined) return sourceIssue(null, guid, "missing-source-bundle", `Asset location ${locationId} references missing source bundle location ${bundleId}.`, [String(bundleId)]);
  if (bundle.dependencyIds.length !== 0) return sourceIssue(null, guid, "invalid-source-bundle", `Source bundle location ${bundleId} has dependencies; the first dependency is not an unambiguous source bundle.`, [String(bundleId)]);
  if (bundle.providerId !== ASSET_BUNDLE_PROVIDER || bundle.resourceType !== ASSET_BUNDLE_RESOURCE) {
    return sourceIssue(null, guid, "unsupported-bundle-provider", `Source bundle location ${bundleId} uses provider ${bundle.providerId} and resource type ${bundle.resourceType}.`, [String(bundleId)]);
  }
  const sourcePath = localBundlePath(graph, bundle, config);
  if (typeof sourcePath !== "string") return { ...sourcePath, assetGuid: guid };
  return { expectation: { path: logicalPath(config.gamePath, sourcePath, `Bundle for ${guid}`), assetName: location.internalId }, sourcePath };
}

export interface PlacementIdentityPreparation {
  result: PlacementIdentityResult;
  artifactPaths: string[];
}

/** Prepare verified serialized identities for the source components in one loaded snapshot. */
export async function prepareSceneIdentities(
  config: CompendiumConfig,
  runtime: Runtime,
  buildId: string,
  snapshot: PlacementSnapshot,
  directory: string,
): Promise<PlacementIdentityPreparation> {
  if (!config || typeof config !== "object") throw new TypeError("Configuration is required.");
  if (!runtime || typeof runtime !== "object") throw new TypeError("Runtime is required.");
  if (typeof buildId !== "string" || buildId.length === 0) throw new TypeError("buildId must be a non-empty string.");
  Assert(PlacementSnapshotSchema, snapshot);
  if (!isAbsolute(directory)) throw new TypeError("Preparation directory must be absolute.");
  await mkdir(directory, { recursive: true });
  const outputDirectory = await realpath(directory);
  checkSignal(runtime);

  const locationPath = artifactPath(outputDirectory, "addressable-locations.json");
  const graphResult = await runtime.probe(resolve(import.meta.dir, "probes/addressable-locations.csx"), locationPath, { parameters: { researchCharacter: config.character } });
  checkSignal(runtime);
  Assert(AddressableGraphSchema, graphResult.value);
  if (await hashFile(locationPath) !== graphResult.reference.sha256) throw new Error("Native addressable graph hash does not match its artifact.");
  const graph = graphResult.value as AddressableGraph;
  const graphMaps = validateGraph(graph, snapshot);
  checkSignal(runtime);

  const sceneBuildIndex = snapshot.context.scene.buildIndex;
  if (!Number.isSafeInteger(sceneBuildIndex) || sceneBuildIndex < 0) throw new Error(`Scene build index ${sceneBuildIndex} cannot identify an installed level file.`);
  const sceneSourcePath = resolve(config.gamePath, "Afallon_Data", `level${sceneBuildIndex}`);
  const sceneIndex = await indexSerializedAsset({ gameRoot: config.gamePath, sourcePath: sceneSourcePath });
  checkSignal(runtime);
  const sceneExpectedPath = logicalPath(config.gamePath, sceneSourcePath, "Scene source");
  validateIndexShape(sceneIndex, "Scene serialized asset index", { sourcePath: sceneExpectedPath, scenePath: snapshot.context.scene.path, buildIndex: sceneBuildIndex });
  await verifyIndexFiles(config, sceneIndex, "Scene serialized asset index", runtime);
  checkSignal(runtime);
  const scenePath = artifactPath(outputDirectory, "scene-index.json");
  await writeJson(scenePath, sceneIndex);
  checkSignal(runtime);

  const loadedStreams = snapshot.streams.filter(stream => stream.loadedRootInstanceId !== null);
  const parents = new Map(snapshot.nodes.map(node => [node.instanceId, node.parentInstanceId]));
  const owners = new Map<number, number | null>(loadedStreams.map(stream => [stream.loadedRootInstanceId!, stream.loadedRootInstanceId!]));
  const sourceRoots = new Set<number>();
  for (const component of snapshot.components) {
    const trail: number[] = [];
    let current: number | null = component.gameObjectInstanceId;
    while (current !== null && !owners.has(current)) {
      if (!parents.has(current) || trail.length >= parents.size) throw new Error("Source snapshot hierarchy is missing or cyclic.");
      trail.push(current);
      current = parents.get(current)!;
    }
    const owner = current === null ? null : owners.get(current)!;
    for (const node of trail) owners.set(node, owner);
    if (owner !== null) sourceRoots.add(owner);
  }
  const sourceStreams = loadedStreams.filter(stream => sourceRoots.has(stream.loadedRootInstanceId!));
  const issues: SourceIssue[] = [];
  const sourceByGuid = new Map<string, PreparedSource>();
  const failedByGuid = new Map<string, SourceIssue>();
  for (const stream of sourceStreams) {
    checkSignal(runtime);
    if (stream.assetGuid === null) {
      issues.push(sourceIssue(stream.componentInstanceId, null, "missing-guid", `Loaded stream ${stream.componentInstanceId} has no addressable asset GUID.`));
      continue;
    }
    if (sourceByGuid.has(stream.assetGuid)) continue;
    if (failedByGuid.has(stream.assetGuid)) {
      issues.push(sourceIssue(stream.componentInstanceId, stream.assetGuid, failedByGuid.get(stream.assetGuid)!.reason, failedByGuid.get(stream.assetGuid)!.detail, failedByGuid.get(stream.assetGuid)!.candidates));
      continue;
    }
    const prepared = sourceForGuid(graph, graphMaps.assets, graphMaps.locations, stream.assetGuid, config);
    if ("expectation" in prepared) {
      sourceByGuid.set(stream.assetGuid, prepared);
      continue;
    }
    failedByGuid.set(stream.assetGuid, prepared);
    issues.push(sourceIssue(stream.componentInstanceId, stream.assetGuid, prepared.reason, prepared.detail, prepared.candidates));
  }

  const prefabs = new Map<string, SerializedAssetIndex>();
  const prefabPaths: string[] = [];
  const indexedGuids = new Set<string>();
  for (const [guid, prepared] of [...sourceByGuid.entries()].sort(([left], [right]) => left.localeCompare(right))) {
    checkSignal(runtime);
    let canonicalPath: string;
    try {
      const canonicalRoot = await realpath(config.gamePath);
      canonicalPath = await realpath(prepared.sourcePath);
      const details = await stat(canonicalPath);
      if (!isWithin(canonicalRoot, canonicalPath) || !details.isFile()) throw new Error("the resolved path is not an installed regular file within the game root");
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      const issue = sourceIssue(null, guid, "missing-local-source", `Resolved source bundle ${prepared.sourcePath} is unavailable locally: ${detail}.`, [prepared.sourcePath]);
      failedByGuid.set(guid, issue);
      sourceByGuid.delete(guid);
      for (const stream of sourceStreams) if (stream.assetGuid === guid) issues.push(sourceIssue(stream.componentInstanceId, guid, issue.reason, issue.detail, issue.candidates));
      continue;
    }
    const index = await indexSerializedAsset({ gameRoot: config.gamePath, sourcePath: canonicalPath!, assetName: prepared.expectation.assetName });
    checkSignal(runtime);
    validateIndexShape(index, `Prefab serialized asset index ${guid}`, { sourcePath: prepared.expectation.path, assetName: prepared.expectation.assetName });
    await verifyIndexFiles(config, index, `Prefab serialized asset index ${guid}`, runtime);
    checkSignal(runtime);
    prefabs.set(guid, index);
    indexedGuids.add(guid);
    const prefabPath = artifactPath(outputDirectory, `prefabs/${guid}-index.json`);
    await mkdir(resolve(outputDirectory, "prefabs"), { recursive: true });
    await writeJson(prefabPath, index);
    prefabPaths.push(prefabPath);
  }

  checkSignal(runtime);
  const result = resolvePlacementIdentities(buildId, snapshot, sceneIndex, prefabs);
  checkSignal(runtime);
  const issuesPath = artifactPath(outputDirectory, "source-issues.json");
  const resolvedStreamCount = sourceStreams.filter(stream => stream.assetGuid !== null && indexedGuids.has(stream.assetGuid)).length;
  const issueArtifact: SourceIssuesArtifact = {
    schemaVersion: "compendium.scene-source-issues.v2", scope: "queried-source-components", buildId,
    sceneNativeId: snapshot.context.gameSceneNativeId, scenePath: snapshot.context.scene.path, snapshotFrame: snapshot.frame,
    issues: issues.sort((left, right) => (left.streamComponentInstanceId ?? 0) - (right.streamComponentInstanceId ?? 0) || left.reason.localeCompare(right.reason)),
    skippedStreams: loadedStreams.filter(stream => !sourceRoots.has(stream.loadedRootInstanceId!)).map(stream => ({ componentInstanceId: stream.componentInstanceId, assetGuid: stream.assetGuid, loadedRootInstanceId: stream.loadedRootInstanceId, reason: "no-queried-source-components" })),
    summary: { loadedStreams: loadedStreams.length, sourceStreams: sourceStreams.length, resolvedStreams: resolvedStreamCount, unresolvedStreams: sourceStreams.length - resolvedStreamCount, indexedPrefabs: indexedGuids.size },
  };
  await writeJson(issuesPath, issueArtifact);
  checkSignal(runtime);
  const resultPath = artifactPath(outputDirectory, "placement-identities.json");
  await writeJson(resultPath, result);
  checkSignal(runtime);
  return { result, artifactPaths: [scenePath, ...prefabPaths, locationPath, issuesPath, resultPath] };
}
