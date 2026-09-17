import { Assert } from "typebox/value";
import { ArtifactStore, resolveArtifactRun } from "@afallon/artifacts";
import {
  CapturePlanSchema, CaptureSetSchema, CaptureRasterSchema, CaptureReadinessSchema, MapSpaceProfileSchema, TilePlanSchema,
  type CaptureRaster, type CaptureSet, type ContentIdentity, type MapSpaceProfile, type TilePlan, type TileSourceProvenance,
} from "@afallon/contracts";
import { readCaptureArtifactJson, validateCaptureCheckpoint } from "./capture-cache";
import { validateReusedCaptureTile, validateCapturePlan } from "./capture";
import { resolveEvidencePointer } from "./spatial-extraction";

export interface SourceTile {
  id: string;
  imageIdentity: string;
  imageBytes: Uint8Array;
  empty: boolean;
  rasterValue: CaptureRaster;
  sourceOrdinal: number;
  sceneNativeId: number;
  scenePath: string;
  standingPoint: CaptureSet["standingPoint"];
  width: number;
  height: number;
}
export interface LoadedTileInputs {
  plan: TilePlan;
  profile: MapSpaceProfile;
  sources: { captureSet: CaptureSet; tiles: SourceTile[] }[];
  provenance: TileSourceProvenance[];
}

export async function loadTileInputs(store: ArtifactStore, plan: TilePlan): Promise<LoadedTileInputs> {
  Assert(TilePlanSchema, plan);
  const profile = await readCaptureArtifactJson(store, plan.profile);
  Assert(MapSpaceProfileSchema, profile);
  if (profile.buildId !== plan.buildId || !profile.mapSpaces.some(map => map.id === plan.mapSpaceId)) throw new Error("Pyramid profile does not match the selected build and map.");
  for (const binding of profile.bindings) for (const evidence of binding.evidence) {
    const object = Bun.file(store.objectPath(evidence.sha256));
    const content = { sha256: evidence.sha256, bytes: object.size };
    resolveEvidencePointer(await readCaptureArtifactJson(store, content), evidence.pointer);
  }
  const sources: LoadedTileInputs["sources"] = [];
  const provenance: TileSourceProvenance[] = [];
  const seen = new Set<string>();
  for (const reference of plan.sources) {
    if (seen.has(reference.sha256)) throw new Error("Pyramid plan repeats a capture manifest.");
    seen.add(reference.sha256);
    const manifest = await resolveArtifactRun(store, reference, { buildId: plan.buildId, operation: "capture" });
    if (manifest.input.inputs.profile?.sha256 !== plan.profile.sha256 || manifest.input.inputs.profile.bytes !== plan.profile.bytes) throw new Error("Capture and pyramid profiles differ.");
    const capturePlanReference = manifest.input.inputs.plan;
    if (capturePlanReference === undefined) throw new Error("Capture manifest has no registered plan.");
    const capturePlan = await readCaptureArtifactJson(store, capturePlanReference);
    Assert(CapturePlanSchema, capturePlan);
    validateCapturePlan(capturePlan);
    const setReference = manifest.outputs.find(output => output.name === "capture-set.json");
    if (setReference === undefined) throw new Error("Capture manifest has no capture set.");
    const set = await readCaptureArtifactJson(store, setReference.content);
    Assert(CaptureSetSchema, set);
    if (set.buildId !== plan.buildId || set.mapSpaceId !== plan.mapSpaceId || capturePlan.sceneNativeId !== set.sceneNativeId || capturePlan.scenePath !== set.scenePath || capturePlan.mapSpaceId !== set.mapSpaceId || capturePlan.width !== set.width || capturePlan.height !== set.height) throw new Error("Capture set disagrees with the pyramid scope.");
    const expected = new Set(set.expectedTiles);
    if (expected.size !== set.expectedTiles.length || set.tiles.length !== expected.size || new Set(set.tiles.map(tile => tile.id)).size !== expected.size || capturePlan.tiles.length !== expected.size || capturePlan.tiles.some(tile => !expected.has(tile.id))) throw new Error("Capture set has duplicate or missing tiles.");
    const tiles: SourceTile[] = [];
    const sourceProvenance: TileSourceProvenance = { manifest: reference, runId: manifest.runId, captureSet: setReference.content, sceneNativeId: set.sceneNativeId, scenePath: set.scenePath, mapSpaceId: set.mapSpaceId, completeImagery: false, width: set.width, height: set.height, tiles: [] };
    for (const tile of set.tiles) {
      if (!expected.has(tile.id)) throw new Error("Capture set contains an unexpected tile.");
      const checkpoint = { schemaVersion: "compendium.capture-tile-checkpoint.v2" as const, tileId: tile.id, compatibilityKey: tile.compatibilityKey, artifacts: tile.artifacts, origin: tile.origin };
      const intent = capturePlan.tiles.find(candidate => candidate.id === tile.id)!;
      await validateCaptureCheckpoint(store, manifest, checkpoint, intent, capturePlan);
      await validateReusedCaptureTile(store, intent, { sourceRun: manifest, sourceManifest: reference, checkpoint }, capturePlan);
      const raster = await readCaptureArtifactJson(store, tile.artifacts.raster.content);
      Assert(CaptureRasterSchema, raster);
      const readiness = await readCaptureArtifactJson(store, tile.artifacts.readiness.content);
      Assert(CaptureReadinessSchema, readiness);
      const bindings = profile.bindings.filter(binding => binding.sceneNativeId === set.sceneNativeId && binding.scenePath === set.scenePath && binding.mapSpaceId === set.mapSpaceId);
      if (bindings.length !== 1) throw new Error("Capture requires one unambiguous reviewed spatial binding.");
      validateDomain(bindings[0]!, raster);
      tiles.push({ id: tile.id, imageIdentity: tile.artifacts.image.content.sha256, imageBytes: await Bun.file(store.objectPath(tile.artifacts.image.content.sha256)).bytes(), empty: readiness.empty, rasterValue: raster, sourceOrdinal: sources.length, sceneNativeId: set.sceneNativeId, scenePath: set.scenePath, standingPoint: set.standingPoint, width: set.width, height: set.height });
      sourceProvenance.tiles.push({ id: tile.id, compatibilityKey: tile.compatibilityKey, status: tile.status, empty: readiness.empty, origin: tile.origin, verticalBounds: raster.verticalBounds, image: tile.artifacts.image.content, raster: tile.artifacts.raster.content, readiness: tile.artifacts.readiness.content, restoration: tile.artifacts.restoration.content, nativeContext: tile.artifacts.nativeContext.map(entry => entry.content), cleanup: tile.artifacts.cleanup! });
    }
    sources.push({ captureSet: set, tiles });
    provenance.push(sourceProvenance);
  }
  return { plan, profile, sources, provenance };
}

function validateDomain(binding: MapSpaceProfile["bindings"][number], raster: CaptureRaster): void {
  if (binding.domain.kind === "scene") return;
  const edge = raster.worldFromPixelEdge;
  const corners = [[0, 0], [raster.width, 0], [0, raster.height], [raster.width, raster.height]].map(([x, y]) => ({ x: edge.origin.x + edge.xAxis.x * x! + edge.yAxis.x * y!, z: edge.origin.z + edge.xAxis.z * x! + edge.yAxis.z * y! }));
  const minX = Math.min(...corners.map(point => point.x)), maxX = Math.max(...corners.map(point => point.x));
  const minZ = Math.min(...corners.map(point => point.z)), maxZ = Math.max(...corners.map(point => point.z));
  if (!binding.domain.boxes.some(box => maxX > box.min.x && minX < box.max.x && maxZ > box.min.z && minZ < box.max.z)) throw new Error(`Capture raster ${raster.tileId} lies outside its reviewed domain.`);
}
