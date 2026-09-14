import { Assert } from "typebox/value";
import { NativeMapRegistrationSchema,
SceneCatalogSchema,
type MapGeometry,
type NavigationGeometry,
type NativeMapRegistration,
type NativeMapTransform,
type SceneCatalog, } from "@afallon/contracts"
import type { WorldInventory } from "@afallon/contracts"

type MapZone = MapGeometry["mapZones"][number];
type CalibrationSample = NonNullable<MapZone["calibration"]>["samples"][number];
type BuildScene = WorldInventory["buildScenes"][number];
type DatabaseScene = WorldInventory["databaseScenes"][number];
type BuildMatch = { buildIndex: number; path: string };

type BasisPoint = { x: 0 | 1; y: 0 | 1; label: string };

const BASIS_POINTS: readonly BasisPoint[] = [
  { x: 0, y: 0, label: "(0, 0)" },
  { x: 1, y: 0, label: "(1, 0)" },
  { x: 0, y: 1, label: "(0, 1)" },
];
const WORLD_RESIDUAL_LIMIT = 0.002;
const NORMALIZED_RESIDUAL_LIMIT = 1e-5;
const HORIZONTAL_TOLERANCE = 1e-6;

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function pathBasename(path: string): string {
  const separator = Math.max(path.lastIndexOf("/"), path.lastIndexOf("\\"));
  const basename = separator < 0 ? path : path.slice(separator + 1);
  return basename.endsWith(".unity") ? basename.slice(0, -".unity".length) : basename;
}

function unresolvedRegistration(zone: MapZone, issues: readonly string[]): NativeMapRegistration {
  const registration: NativeMapRegistration = {
    scope: "native-coordinate-registration",
    sourceComponentInstanceId: zone.source.componentInstanceId,
    zoneId: zone.zoneId,
    state: "unresolved",
    transform: null,
    issues: [...issues],
  };
  Assert(NativeMapRegistrationSchema, registration);
  return registration;
}

function sampleHasFiniteData(sample: CalibrationSample): boolean {
  const candidate = sample as CalibrationSample | null | undefined;
  return isFiniteNumber(candidate?.map?.x)
    && isFiniteNumber(candidate?.map?.y)
    && isFiniteNumber(candidate?.world?.x)
    && isFiniteNumber(candidate?.world?.y)
    && isFiniteNumber(candidate?.world?.z)
    && isFiniteNumber(candidate?.roundTrip?.x)
    && isFiniteNumber(candidate?.roundTrip?.y);
}

function worldDistance(
  first: { x: number; y: number; z: number },
  second: { x: number; y: number; z: number },
): number {
  return Math.hypot(first.x - second.x, first.y - second.y, first.z - second.z);
}

function normalizedDistance(
  first: { x: number; y: number },
  second: { x: number; y: number },
): number {
  return Math.hypot(first.x - second.x, first.y - second.y);
}

export function collectSceneCatalog(buildId: string, inventory: WorldInventory): SceneCatalog {
  const buildMatchesByEntryName = new Map<string, BuildMatch[]>();
  const buildScenes = inventory.buildScenes.map((scene: BuildScene) => {
    const nativeIds: number[] = [];
    if (scene.path !== null) {
      const entryName = pathBasename(scene.path);
      const matches = buildMatchesByEntryName.get(entryName);
      if (matches === undefined) buildMatchesByEntryName.set(entryName, [{ buildIndex: scene.buildIndex, path: scene.path }]);
      else matches.push({ buildIndex: scene.buildIndex, path: scene.path });
    }
    return {
      buildIndex: scene.buildIndex,
      path: scene.path,
      pathError: scene.pathError,
      nativeIds,
    };
  });

  const scenes: SceneCatalog["scenes"] = [];
  const databaseRecordsByEntryName = new Map<string, number[]>();
  for (const row of inventory.databaseScenes as readonly DatabaseScene[]) {
    if (row.nativeId === null) {
      scenes.push({
        sourceKey: row.sourceKey,
        nativeId: null,
        entryName: null,
        displayName: null,
        sourceFieldPath: row.sourceFieldPath,
        state: "unavailable",
        buildMatches: [],
      });
      continue;
    }

    const entryName = row.fields.entryName;
    const displayName = row.fields.entryDisplayName;
    const matches = entryName === null ? [] : (buildMatchesByEntryName.get(entryName) ?? []);
    if (entryName !== null) {
      const nativeIds = databaseRecordsByEntryName.get(entryName);
      if (nativeIds === undefined) databaseRecordsByEntryName.set(entryName, [row.nativeId]);
      else nativeIds.push(row.nativeId);
    }
    scenes.push({
      sourceKey: row.sourceKey,
      nativeId: row.nativeId,
      entryName,
      displayName,
      sourceFieldPath: row.sourceFieldPath,
      state: matches.length === 0 ? "unmatched" : matches.length === 1 ? "matched" : "ambiguous",
      buildMatches: matches.map(match => ({ buildIndex: match.buildIndex, path: match.path })),
    });
  }

  for (const buildScene of buildScenes) {
    if (buildScene.path === null) continue;
    const entryName = pathBasename(buildScene.path);
    const nativeIds = databaseRecordsByEntryName.get(entryName);
    if (nativeIds === undefined) continue;
    for (const nativeId of nativeIds) {
      if (!buildScene.nativeIds.includes(nativeId)) buildScene.nativeIds.push(nativeId);
    }
  }

  let matchedScenes = 0;
  let unmatchedScenes = 0;
  let ambiguousScenes = 0;
  let unavailableScenes = 0;
  for (const scene of scenes) {
    if (scene.state === "matched") matchedScenes++;
    else if (scene.state === "unmatched") unmatchedScenes++;
    else if (scene.state === "ambiguous") ambiguousScenes++;
    else unavailableScenes++;
  }
  let unclaimedBuildScenes = 0;
  let sharedBuildScenes = 0;
  for (const scene of buildScenes) {
    if (scene.nativeIds.length === 0) unclaimedBuildScenes++;
    else if (scene.nativeIds.length > 1) sharedBuildScenes++;
  }
  const catalog: SceneCatalog = {
    schemaVersion: "compendium.scene-catalog.v1",
    buildId,
    scenes,
    buildScenes,
    summary: {
      databaseScenes: scenes.length,
      matchedScenes,
      unmatchedScenes,
      ambiguousScenes,
      unavailableScenes,
      buildScenes: buildScenes.length,
      unclaimedBuildScenes,
      sharedBuildScenes,
    },
  };
  Assert(SceneCatalogSchema, catalog);
  return catalog;
}

export function worldToNativeMap(transform: NativeMapTransform, point: { x: number; z: number }): { x: number; y: number } {
  const worldX = point.x - transform.origin.x;
  const worldZ = point.z - transform.origin.z;
  return {
    x: transform.inverse.xx * worldX + transform.inverse.xz * worldZ,
    y: transform.inverse.yx * worldX + transform.inverse.yz * worldZ,
  };
}

export function nativeMapToWorld(transform: NativeMapTransform, point: { x: number; y: number }): { x: number; y: number; z: number } {
  return {
    x: transform.origin.x + transform.mapXAxis.x * point.x + transform.mapYAxis.x * point.y,
    y: transform.origin.y,
    z: transform.origin.z + transform.mapXAxis.z * point.x + transform.mapYAxis.z * point.y,
  };
}

export function fitNativeMapRegistration(zone: MapZone): NativeMapRegistration {
  const calibration = zone.calibration;
  if (calibration === null || typeof calibration !== "object" || !Array.isArray(calibration.samples)) {
    return unresolvedRegistration(zone, ["Calibration samples are unavailable."]);
  }

  const samples = calibration.samples;
  if (samples.some(sample => !sampleHasFiniteData(sample))) {
    return unresolvedRegistration(zone, ["Calibration samples contain missing or nonfinite data."]);
  }

  const basisSamples: Record<string, CalibrationSample | undefined> = {};
  const issues: string[] = [];
  for (const basis of BASIS_POINTS) {
    const matches = samples.filter(sample => sample.map.x === basis.x && sample.map.y === basis.y);
    if (matches.length === 0) issues.push(`Missing basis sample at map ${basis.label}.`);
    else if (matches.length > 1) issues.push(`Duplicate basis sample at map ${basis.label}.`);
    else basisSamples[basis.label] = matches[0]!;
  }
  if (issues.length > 0) return unresolvedRegistration(zone, issues);

  const originSample = basisSamples["(0, 0)"]!;
  const xSample = basisSamples["(1, 0)"]!;
  const ySample = basisSamples["(0, 1)"]!;
  const origin = originSample.world;
  const mapXAxis = {
    x: xSample.world.x - origin.x,
    z: xSample.world.z - origin.z,
  };
  const mapYAxis = {
    x: ySample.world.x - origin.x,
    z: ySample.world.z - origin.z,
  };
  const mapAxisXWorldY = xSample.world.y - origin.y;
  const mapAxisYWorldY = ySample.world.y - origin.y;
  if (![origin.x, origin.y, origin.z, mapXAxis.x, mapXAxis.z, mapYAxis.x, mapYAxis.z, mapAxisXWorldY, mapAxisYWorldY].every(isFiniteNumber)) {
    return unresolvedRegistration(zone, ["Calibration basis produces nonfinite transform data."]);
  }
  if (Math.abs(mapAxisXWorldY) > HORIZONTAL_TOLERANCE || Math.abs(mapAxisYWorldY) > HORIZONTAL_TOLERANCE) {
    return unresolvedRegistration(zone, ["Calibration samples define a non-horizontal world plane."]);
  }

  const determinantTermA = mapXAxis.x * mapYAxis.z;
  const determinantTermB = mapYAxis.x * mapXAxis.z;
  const determinant = determinantTermA - determinantTermB;
  const determinantScale = Math.max(1, Math.abs(determinantTermA), Math.abs(determinantTermB));
  if (!Number.isFinite(determinant) || Math.abs(determinant) <= Number.EPSILON * determinantScale) {
    return unresolvedRegistration(zone, ["Calibration transform is singular."]);
  }

  const transform: NativeMapTransform = {
    origin,
    mapXAxis,
    mapYAxis,
    inverse: {
      xx: mapYAxis.z / determinant,
      xz: -mapYAxis.x / determinant,
      yx: -mapXAxis.z / determinant,
      yz: mapXAxis.x / determinant,
    },
    maxWorldResidual: 0,
    maxNormalizedResidual: 0,
  };

  for (const sample of samples) {
    const expectedWorld = nativeMapToWorld(transform, sample.map);
    const expectedMap = worldToNativeMap(transform, sample.world);
    const worldResidual = worldDistance(expectedWorld, sample.world);
    const normalizedResidual = Math.max(
      normalizedDistance(sample.map, sample.roundTrip),
      normalizedDistance(expectedMap, sample.roundTrip),
      normalizedDistance(expectedMap, sample.map),
    );
    transform.maxWorldResidual = Math.max(transform.maxWorldResidual, worldResidual);
    transform.maxNormalizedResidual = Math.max(transform.maxNormalizedResidual, normalizedResidual);
  }

  if (!Number.isFinite(transform.maxWorldResidual) || transform.maxWorldResidual > WORLD_RESIDUAL_LIMIT) {
    return unresolvedRegistration(zone, [`World calibration residual exceeds ${WORLD_RESIDUAL_LIMIT}.`]);
  }
  if (!Number.isFinite(transform.maxNormalizedResidual) || transform.maxNormalizedResidual > NORMALIZED_RESIDUAL_LIMIT) {
    return unresolvedRegistration(zone, [`Native normalized round-trip residual exceeds ${NORMALIZED_RESIDUAL_LIMIT}.`]);
  }

  const registration: NativeMapRegistration = {
    scope: "native-coordinate-registration",
    sourceComponentInstanceId: zone.source.componentInstanceId,
    zoneId: zone.zoneId,
    state: "verified",
    transform,
    issues: [],
  };
  Assert(NativeMapRegistrationSchema, registration);
  return registration;
}

export function validateSceneGeometry(geometry: MapGeometry, navigation: NavigationGeometry): void {
  if (geometry.scene.handle !== navigation.scene.handle || geometry.scene.nativeId !== navigation.scene.nativeId || geometry.scene.path !== navigation.scene.path || geometry.scene.buildIndex !== navigation.scene.buildIndex) throw new Error("Geometry and navigation observations crossed a scene instance boundary.");
  const queryTypes = new Set<string>();
  for (const query of geometry.queries) {
    if (queryTypes.has(query.nativeType) || query.includeInactiveCount !== query.sceneCount + query.foreignSceneCount) throw new Error("Native geometry query counts do not reconcile.");
    queryTypes.add(query.nativeType);
  }
  const meshIds = new Set(geometry.meshes.map(mesh => mesh.instanceId));
  if (meshIds.size !== geometry.meshes.length || geometry.renderers.some(renderer => renderer.meshInstanceId !== null && !meshIds.has(renderer.meshInstanceId))) throw new Error("Renderer mesh references do not reconcile.");
  if (navigation.vertices.length !== navigation.vertexCount * 3 || navigation.indices.length !== navigation.triangleCount * 3 || navigation.areas.length !== navigation.triangleCount) throw new Error("Native navigation array counts do not reconcile.");
  for (const index of navigation.indices) if (index >= navigation.vertexCount) throw new Error("A navigation triangle references an unavailable vertex.");
}
