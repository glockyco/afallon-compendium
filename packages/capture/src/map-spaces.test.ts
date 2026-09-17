import { expect, test } from "bun:test";
import { compileMapSpaces } from "@afallon/contracts/spatial";
import type { SceneCatalog } from "@afallon/contracts"
import type { MapSpaceProfile } from "@afallon/contracts"

function fixture(): { profile: MapSpaceProfile; catalog: SceneCatalog } {
  return {
    catalog: {
      schemaVersion: "compendium.scene-catalog.v1", buildId: "build",
      scenes: [{ sourceKey: 1, nativeId: 1, entryName: "Interior", displayName: "Interior", sourceFieldPath: "scenes[1]", state: "matched", buildMatches: [{ buildIndex: 0, path: "Assets/Interior.unity" }] }],
      buildScenes: [{ buildIndex: 0, path: "Assets/Interior.unity", pathError: null, nativeIds: [1] }],
      summary: { databaseScenes: 1, matchedScenes: 1, unmatchedScenes: 0, ambiguousScenes: 0, unavailableScenes: 0, buildScenes: 1, unclaimedBuildScenes: 0, sharedBuildScenes: 0 },
    },
    profile: {
      schemaVersion: "compendium.map-space-profile.v2", buildId: "build",
      mapSpaces: [{ id: "interior", label: "Interior" }],
      bindings: [{
        id: "interior", mapSpaceId: "interior", sceneNativeId: 1, scenePath: "Assets/Interior.unity",
        frame: { origin: { x: 0, z: 0 }, xAxis: { x: 1, z: 0 }, yAxis: { x: 0, z: 1 } },
        domain: { kind: "boxes", boxes: [{ min: { x: 0, y: 0, z: 0 }, max: { x: 10, y: 10, z: 10 } }] },
        evidence: [{ path: "review.json", sha256: "a".repeat(64), pointer: "" }],
      }],
    },
  };
}

test("horizontal membership ignores height and preserves half-open boundaries", () => {
  const { profile, catalog } = fixture();
  const index = compileMapSpaces(profile, catalog);
  const lower = index.resolve(1, "Assets/Interior.unity", { x: 1, y: 1, z: 1 });
  const upper = index.resolve(1, "Assets/Interior.unity", { x: 1, y: 100, z: 1 });
  expect(lower.state).toBe("resolved");
  expect(upper.state).toBe("resolved");
  expect(lower.candidates[0]!.mapPosition).toEqual(upper.candidates[0]!.mapPosition);
  expect(index.resolve(1, "Assets/Interior.unity", { x: 10, y: 5, z: 1 }).state).toBe("unresolved");
  expect(index.resolve(1, "Assets/Interior.unity", { x: 1, y: 5, z: 10 }).state).toBe("unresolved");
});

test("stacked placements retain distinct heights while sharing a map position", () => {
  const { profile, catalog } = fixture();
  const index = compileMapSpaces(profile, catalog);
  const lower = { placementId: "lower", position: { x: 1, y: 2, z: 1 } };
  const upper = { placementId: "upper", position: { x: 1, y: 8, z: 1 } };
  const lowerResolution = index.resolve(1, "Assets/Interior.unity", lower.position);
  const upperResolution = index.resolve(1, "Assets/Interior.unity", upper.position);
  expect(lower.placementId).not.toBe(upper.placementId);
  expect(lower.position.y).not.toBe(upper.position.y);
  expect(lowerResolution.candidates[0]!.mapPosition).toEqual(upperResolution.candidates[0]!.mapPosition);
  expect(lowerResolution.candidates[0]!.bindingIds).toEqual(upperResolution.candidates[0]!.bindingIds);
});

test("multiple build paths cannot hide behind a matched catalog state", () => {
  const { profile, catalog } = fixture();
  expect(compileMapSpaces(profile, catalog).resolve(1, "Assets/Interior.unity", { x: 1, y: 1, z: 1 }).state).toBe("resolved");
  catalog.scenes[0]!.buildMatches.push({ buildIndex: 1, path: "Assets/Other/Interior.unity" });
  expect(() => compileMapSpaces(profile, catalog)).toThrow();
});
