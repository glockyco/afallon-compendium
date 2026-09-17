import { Assert, AssertError } from "typebox/value";
import type { MapSpaceProfile, SpatialBox, SpatialCandidate, SpatialPosition, SpatialResolution } from "./reviewed"
import { MapSpaceProfileSchema } from "./reviewed"
import type { SceneCatalog } from "./map"
import { SceneCatalogSchema } from "./map"

type MapSpace = MapSpaceProfile["mapSpaces"][number];
type Binding = MapSpaceProfile["bindings"][number];
type Frame = Binding["frame"];
type CompiledBinding = {
  source: Binding;
  inverse: { xx: number; xz: number; yx: number; yz: number };
};
type MutableCandidate = {
  mapSpaceId: string;
  mapPosition: { x: number; y: number };
  bindingIds: string[];
};

function assertContract(schema: typeof MapSpaceProfileSchema | typeof SceneCatalogSchema, value: unknown, label: string): void {
  try {
    Assert(schema, value);
  } catch (error) {
    if (error instanceof AssertError) {
      throw new TypeError(`${label} does not satisfy its contract: ${error.message}`, { cause: error.cause.errors });
    }
    throw error;
  }
}

function finite(value: number, label: string): void {
  if (!Number.isFinite(value)) throw new TypeError(`${label} must be finite.`);
}

export function invertMapSpaceFrame(frame: Frame, bindingId: string): { xx: number; xz: number; yx: number; yz: number } {
  finite(frame.origin.x, `Binding "${bindingId}" frame origin.x`);
  finite(frame.origin.z, `Binding "${bindingId}" frame origin.z`);
  finite(frame.xAxis.x, `Binding "${bindingId}" frame xAxis.x`);
  finite(frame.xAxis.z, `Binding "${bindingId}" frame xAxis.z`);
  finite(frame.yAxis.x, `Binding "${bindingId}" frame yAxis.x`);
  finite(frame.yAxis.z, `Binding "${bindingId}" frame yAxis.z`);

  const determinantTermA = frame.xAxis.x * frame.yAxis.z;
  const determinantTermB = frame.yAxis.x * frame.xAxis.z;
  const determinant = determinantTermA - determinantTermB;
  const determinantScale = Math.max(1, Math.abs(determinantTermA), Math.abs(determinantTermB));
  if (!Number.isFinite(determinant) || Math.abs(determinant) <= Number.EPSILON * determinantScale) {
    throw new TypeError(`Binding "${bindingId}" frame is singular and has no finite inverse.`);
  }
  const inverse = {
    xx: frame.yAxis.z / determinant,
    xz: -frame.yAxis.x / determinant,
    yx: -frame.xAxis.z / determinant,
    yz: frame.xAxis.x / determinant,
  };
  if (!Object.values(inverse).every(Number.isFinite)) {
    throw new TypeError(`Binding "${bindingId}" frame inverse is not finite.`);
  }
  return inverse;
}

function sameFrame(left: Frame, right: Frame): boolean {
  return left.origin.x === right.origin.x
    && left.origin.z === right.origin.z
    && left.xAxis.x === right.xAxis.x
    && left.xAxis.z === right.xAxis.z
    && left.yAxis.x === right.yAxis.x
    && left.yAxis.z === right.yAxis.z;
}

function validateBox(box: SpatialBox, label: string): void {
  for (const axis of ["x", "y", "z"] as const) {
    finite(box.min[axis], `${label} min.${axis}`);
    finite(box.max[axis], `${label} max.${axis}`);
    if (!(box.min[axis] < box.max[axis])) {
      throw new TypeError(`${label} must have min.${axis} < max.${axis} for a finite half-open box.`);
    }
  }
}

function contains(box: SpatialBox, position: SpatialPosition): boolean {
  return position.x >= box.min.x && position.x < box.max.x
    && position.z >= box.min.z && position.z < box.max.z;
}

function unique<T>(values: T[]): T[] {
  return [...new Set(values)];
}

function catalogBinding(catalog: SceneCatalog, binding: Binding): void {
  const sameNativeId = catalog.scenes.filter(scene => scene.nativeId === binding.sceneNativeId);
  if (sameNativeId.length > 1) {
    throw new Error(`Binding "${binding.id}" has an ambiguous catalog scene identity ${binding.sceneNativeId}.`);
  }
  const exact = sameNativeId.filter(scene => scene.buildMatches.some(match => match.path === binding.scenePath));
  if (exact.length === 0) {
    if (sameNativeId.length === 0) {
      throw new Error(`Binding "${binding.id}" references scene ${binding.sceneNativeId} absent from the scene catalog.`);
    }
    const states = unique(sameNativeId.map(scene => scene.state));
    if (states.includes("ambiguous")) {
      throw new Error(`Binding "${binding.id}" references an ambiguous catalog scene ${binding.sceneNativeId}.`);
    }
    if (states.includes("unmatched") || states.includes("unavailable")) {
      throw new Error(`Binding "${binding.id}" references an unmatched or unavailable catalog scene ${binding.sceneNativeId}.`);
    }
    throw new Error(`Binding "${binding.id}" scene path "${binding.scenePath}" does not match the exact catalog path for scene ${binding.sceneNativeId}.`);
  }
  if (exact.length > 1) {
    throw new Error(`Binding "${binding.id}" has an ambiguous catalog binding for scene ${binding.sceneNativeId} at path "${binding.scenePath}".`);
  }
  const scene = exact[0]!;
  if (scene.state === "ambiguous" || scene.buildMatches.length !== 1) {
    throw new Error(`Binding "${binding.id}" references an ambiguous catalog scene ${binding.sceneNativeId}.`);
  }
  if (scene.state !== "matched") {
    throw new Error(`Binding "${binding.id}" references an unmatched or unavailable catalog scene ${binding.sceneNativeId}.`);
  }
  const exactPaths = scene.buildMatches.filter(match => match.path === binding.scenePath);
  if (exactPaths.length !== 1) {
    throw new Error(`Binding "${binding.id}" has an ambiguous exact catalog path for scene ${binding.sceneNativeId}.`);
  }
}

function resolveProjection(binding: CompiledBinding, position: SpatialPosition): { x: number; y: number } {
  const dx = position.x - binding.source.frame.origin.x;
  const dz = position.z - binding.source.frame.origin.z;
  if (!Number.isFinite(dx) || !Number.isFinite(dz)) {
    throw new TypeError(`Spatial position cannot be transformed because its frame-relative coordinates are nonfinite.`);
  }
  const mapPosition = {
    x: binding.inverse.xx * dx + binding.inverse.xz * dz,
    y: binding.inverse.yx * dx + binding.inverse.yz * dz,
  };
  if (!Number.isFinite(mapPosition.x) || !Number.isFinite(mapPosition.y)) {
    throw new TypeError(`Spatial position cannot be transformed to finite map coordinates.`);
  }
  return mapPosition;
}

export function indexMapSpaceDefinitions(definitions: readonly MapSpace[]): ReadonlyMap<string, MapSpace> {
  const mapSpaces = new Map<string, MapSpace>();
  for (const mapSpace of definitions) {
    if (mapSpaces.has(mapSpace.id)) throw new Error(`Duplicate map-space ID "${mapSpace.id}".`);
    mapSpaces.set(mapSpace.id, mapSpace);
  }
  return mapSpaces;
}

export interface CompiledMapSpaces {
  resolve(sceneNativeId: number, scenePath: string, position: SpatialPosition): SpatialResolution;
}

export function compileMapSpaces(profile: MapSpaceProfile, catalog: SceneCatalog): CompiledMapSpaces {
  assertContract(MapSpaceProfileSchema, profile, "Map-space profile");
  assertContract(SceneCatalogSchema, catalog, "Scene catalog");
  if (profile.buildId !== catalog.buildId) {
    throw new Error(`Map-space profile build "${profile.buildId}" does not match scene catalog build "${catalog.buildId}".`);
  }

  const mapSpaces = indexMapSpaceDefinitions(profile.mapSpaces);

  const bindingsByScene = new Map<string, CompiledBinding[]>();
  const bindingIds = new Set<string>();
  const frameBySceneMap = new Map<string, Frame>();
  for (const binding of profile.bindings) {
    if (bindingIds.has(binding.id)) throw new Error(`Duplicate map-space binding ID "${binding.id}".`);
    bindingIds.add(binding.id);
    if (!mapSpaces.has(binding.mapSpaceId)) {
      throw new Error(`Binding "${binding.id}" references unknown map space "${binding.mapSpaceId}".`);
    }
    catalogBinding(catalog, binding);

    if (binding.domain.kind === "boxes") {
      binding.domain.boxes.forEach((box, index) => validateBox(box, `Binding "${binding.id}" domain box ${index}`));
    }

    const inverse = invertMapSpaceFrame(binding.frame, binding.id);
    const sceneMapKey = `${binding.sceneNativeId}\u0000${binding.scenePath}\u0000${binding.mapSpaceId}`;
    const priorFrame = frameBySceneMap.get(sceneMapKey);
    if (priorFrame !== undefined && !sameFrame(priorFrame, binding.frame)) {
      throw new Error(`Bindings for scene ${binding.sceneNativeId} path "${binding.scenePath}" and map space "${binding.mapSpaceId}" use inconsistent frames.`);
    }
    if (priorFrame === undefined) frameBySceneMap.set(sceneMapKey, binding.frame);

    const sceneKey = `${binding.sceneNativeId}\u0000${binding.scenePath}`;
    const compiled = { source: binding, inverse };
    const sceneBindings = bindingsByScene.get(sceneKey);
    if (sceneBindings === undefined) bindingsByScene.set(sceneKey, [compiled]);
    else sceneBindings.push(compiled);
  }

  return {
    resolve(sceneNativeId: number, scenePath: string, position: SpatialPosition): SpatialResolution {
      finite(sceneNativeId, "sceneNativeId");
      if (!Number.isInteger(sceneNativeId) || sceneNativeId < 0) throw new TypeError("sceneNativeId must be a nonnegative integer.");
      if (typeof scenePath !== "string" || scenePath.length === 0) throw new TypeError("scenePath must be a non-empty string.");
      if (position === null || typeof position !== "object") throw new TypeError("Spatial position must be an object with finite x, y, and z coordinates.");
      finite(position.x, "Spatial position x");
      finite(position.y, "Spatial position y");
      finite(position.z, "Spatial position z");

      const sceneKey = `${sceneNativeId}\u0000${scenePath}`;
      const bindings = bindingsByScene.get(sceneKey);
      if (bindings === undefined) {
        return {
          state: "unresolved",
          candidates: [],
          issues: [`Scene ${sceneNativeId} at path "${scenePath}" is absent from the compiled map-space bindings.`],
        };
      }

      const candidates: MutableCandidate[] = [];
      for (const binding of bindings) {
        const mapSpace = mapSpaces.get(binding.source.mapSpaceId)!;
        const inDomain = binding.source.domain.kind === "scene"
          || binding.source.domain.boxes.some(box => contains(box, position));
        if (!inDomain) continue;
        const mapPosition = resolveProjection(binding, position);
        let candidate = candidates.find(existing => existing.mapSpaceId === mapSpace.id
          && existing.mapPosition.x === mapPosition.x
          && existing.mapPosition.y === mapPosition.y);
        if (candidate === undefined) {
          candidate = { mapSpaceId: mapSpace.id, mapPosition, bindingIds: [] };
          candidates.push(candidate);
        }
        if (!candidate.bindingIds.includes(binding.source.id)) candidate.bindingIds.push(binding.source.id);
      }

      const issues: string[] = [];
      if (candidates.length === 0) {
        for (const mapSpaceId of new Set(bindings.map(binding => binding.source.mapSpaceId))) {
          issues.push(`Position is outside the declared domain for map space "${mapSpaceId}".`);
        }
      }
      const outputCandidates: SpatialCandidate[] = candidates;

      if (outputCandidates.length > 1) {
        const candidateMapIds = unique(outputCandidates.map(candidate => candidate.mapSpaceId));
        if (candidateMapIds.length === 1) {
          issues.push(`Position resolves to multiple projections in map space "${candidateMapIds[0]}".`);
        } else {
          issues.push(`Position resolves to multiple map-space candidates: ${candidateMapIds.join(", ")}.`);
        }
      }
      let state: SpatialResolution["state"];
      if (outputCandidates.length === 0) state = "unresolved";
      else if (outputCandidates.length > 1) state = "ambiguous";
      else state = "resolved";
      return { state, candidates: outputCandidates, issues };
    },
  };
}
