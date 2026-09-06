import { expect, test } from "bun:test";
import { compileMapSpaces } from "./map-spaces";
import type { SceneCatalog } from "./map-contracts";
import type { MapSpaceProfile } from "./spatial-contracts";

function fixture(): { profile: MapSpaceProfile; catalog: SceneCatalog } {
  return {
    catalog: {
      schemaVersion: "compendium.scene-catalog.v1", buildId: "build",
      scenes: [{ sourceKey: 1, nativeId: 1, entryName: "Interior", displayName: "Interior", sourceFieldPath: "scenes[1]", state: "matched", buildMatches: [{ buildIndex: 0, path: "Assets/Interior.unity" }] }],
      buildScenes: [{ buildIndex: 0, path: "Assets/Interior.unity", pathError: null, nativeIds: [1] }],
      summary: { databaseScenes: 1, matchedScenes: 1, unmatchedScenes: 0, ambiguousScenes: 0, unavailableScenes: 0, buildScenes: 1, unclaimedBuildScenes: 0, sharedBuildScenes: 0 },
    },
    profile: {
      schemaVersion: "compendium.map-space-profile.v1", buildId: "build",
      mapSpaces: [{ id: "interior", label: "Interior", floors: [{ id: "lower", label: "Lower" }, { id: "upper", label: "Upper" }] }],
      bindings: [{
        id: "interior", mapSpaceId: "interior", sceneNativeId: 1, scenePath: "Assets/Interior.unity",
        frame: { origin: { x: 0, z: 0 }, xAxis: { x: 1, z: 0 }, yAxis: { x: 0, z: 1 } },
        domain: { kind: "boxes", boxes: [{ min: { x: 0, y: 0, z: 0 }, max: { x: 10, y: 10, z: 10 } }] },
        floorDomains: [
          { floorId: "lower", boxes: [{ min: { x: 0, y: 0, z: 0 }, max: { x: 10, y: 5, z: 10 } }] },
          { floorId: "upper", boxes: [{ min: { x: 0, y: 5, z: 0 }, max: { x: 10, y: 10, z: 10 } }] },
        ],
        evidence: [{ path: "review.json", sha256: "a".repeat(64), pointer: "" }],
      }],
    },
  };
}

test("overlapping footprints preserve floor height and half-open boundaries", () => {
  const { profile, catalog } = fixture();
  const index = compileMapSpaces(profile, catalog);
  const lower = index.resolve(1, "Assets/Interior.unity", { x: 1, y: 4, z: 1 });
  const upper = index.resolve(1, "Assets/Interior.unity", { x: 1, y: 5, z: 1 });
  expect(lower.candidates[0]!.floorIds).toEqual(["lower"]);
  expect(upper.candidates[0]!.floorIds).toEqual(["upper"]);
  expect(lower.candidates[0]!.mapPosition).toEqual(upper.candidates[0]!.mapPosition);
  expect(index.resolve(1, "Assets/Interior.unity", { x: 10, y: 5, z: 1 }).state).toBe("unresolved");
  profile.bindings[0]!.floorDomains[0]!.boxes[0]!.max.y = 6;
  const ambiguous = compileMapSpaces(profile, catalog).resolve(1, "Assets/Interior.unity", { x: 1, y: 5, z: 1 });
  expect(ambiguous.state).toBe("ambiguous");
  expect(new Set(ambiguous.candidates[0]!.floorIds)).toEqual(new Set(["lower", "upper"]));
});

test("multiple build paths cannot hide behind a matched catalog state", () => {
  const { profile, catalog } = fixture();
  expect(compileMapSpaces(profile, catalog).resolve(1, "Assets/Interior.unity", { x: 1, y: 1, z: 1 }).state).toBe("resolved");
  catalog.scenes[0]!.buildMatches.push({ buildIndex: 1, path: "Assets/Other/Interior.unity" });
  expect(() => compileMapSpaces(profile, catalog)).toThrow();
});
