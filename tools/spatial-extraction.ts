import { dirname, resolve } from "node:path";
import { Assert } from "typebox/value";
import { MapSpaceProfileSchema, SpatialSnapshotSchema, type MapSpaceProfile, type SpatialSnapshot } from "./spatial-contracts";
import type { MapGeometry, SceneCatalog } from "./map-contracts";
import { PlacementRolesSchema, type PlacementRoles } from "./role-contracts";
import { compileMapSpaces } from "./map-spaces";
import { compileAuthoredRegions } from "./map-regions";

export function resolveEvidencePointer(value: unknown, pointer: string): unknown {
  if (pointer !== "" && !pointer.startsWith("/")) throw new Error(`Evidence has an invalid JSON pointer: ${pointer}`);
  for (const encoded of pointer === "" ? [] : pointer.slice(1).split("/")) {
    if (/~(?:[^01]|$)/.test(encoded)) throw new Error(`Evidence has an invalid JSON pointer: ${pointer}`);
    const key = encoded.replaceAll("~1", "/").replaceAll("~0", "~");
    if (value === null || typeof value !== "object" || !Object.hasOwn(value, key)) throw new Error(`Evidence pointer is absent: ${pointer}`);
    value = (value as Record<string, unknown>)[key];
  }
  return value;
}

export async function loadSpatialProfile(path: string | undefined) {
  if (path === undefined) return null;
  const bytes = await Bun.file(path).bytes();
  const profile: unknown = JSON.parse(new TextDecoder().decode(bytes));
  Assert(MapSpaceProfileSchema, profile);
  const observed = new Map<string, { sha256: string; value: unknown }>();
  for (const binding of profile.bindings) {
    for (const evidence of binding.evidence) {
      const target = resolve(dirname(path), evidence.path);
      let source = observed.get(target);
      if (source === undefined) {
        const content = await Bun.file(target).bytes();
        source = { sha256: new Bun.CryptoHasher("sha256").update(content).digest("hex"), value: JSON.parse(new TextDecoder().decode(content)) };
        observed.set(target, source);
      }
      if (source.sha256 !== evidence.sha256) throw new Error(`Spatial review evidence changed: ${evidence.path}`);
      resolveEvidencePointer(source.value, evidence.pointer);
    }
  }
  return { profile, bytes, sha256: new Bun.CryptoHasher("sha256").update(bytes).digest("hex") };
}

export function collectSpatialSnapshot(
  profile: MapSpaceProfile | null,
  catalog: SceneCatalog,
  geometry: MapGeometry,
  placements: PlacementRoles,
  sources: SpatialSnapshot["sources"],
): SpatialSnapshot {
  Assert(PlacementRolesSchema, placements);
  if (placements.buildId !== catalog.buildId || placements.sceneNativeId !== geometry.scene.nativeId) throw new Error("Spatial inputs do not share a build and source scene.");
  if ((profile === null) !== (sources.profile === null)) throw new Error("Spatial profile data and provenance disagree.");
  const index = profile === null ? null : compileMapSpaces(profile, catalog);
  const regionIndex = compileAuthoredRegions(geometry);
  const summary = { placements: 0, resolved: 0, unresolved: 0, ambiguous: 0, regionIssues: 0 };
  const seen = new Set<string>();
  const rows: SpatialSnapshot["placements"] = [];
  for (const placement of placements.placements) {
    if (seen.has(placement.placementId)) throw new Error("Spatial input repeats a placement identity.");
    seen.add(placement.placementId);
    const resolution = index?.resolve(placements.sceneNativeId, geometry.scene.path, placement.position)
      ?? { state: "unresolved" as const, candidates: [], issues: ["No reviewed map-space profile is configured."] };
    const regions = regionIndex.resolve(placement.position);
    rows.push({ placementId: placement.placementId, worldPosition: placement.position, resolution, regions });
    summary.placements++;
    summary[resolution.state]++;
    summary.regionIssues += regions.unresolved.length;
  }
  const result: SpatialSnapshot = {
    schemaVersion: "compendium.spatial-snapshot.v2", buildId: catalog.buildId,
    sceneNativeId: geometry.scene.nativeId, scenePath: geometry.scene.path, sources,
    completeImageryCoverage: false, placements: rows, summary,
  };
  Assert(SpatialSnapshotSchema, result);
  return result;
}
