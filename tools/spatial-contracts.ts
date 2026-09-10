import { Type, type Static } from "typebox";

const text = Type.String({ minLength: 1 });
const id = Type.String({ pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$" });
const point = Type.Object({ x: Type.Number(), y: Type.Number(), z: Type.Number() });
const horizontal = Type.Object({ x: Type.Number(), z: Type.Number() });
const box = Type.Object({ min: point, max: point });
const boxes = Type.Array(box, { minItems: 1 });
const evidence = Type.Object({ path: text, sha256: Type.String({ pattern: "^[a-f0-9]{64}$" }), pointer: Type.String({ pattern: "^(?:/.*)?$" }) });

export const MapSpaceProfileSchema = Type.Object({
  schemaVersion: Type.Literal("compendium.map-space-profile.v2"),
  buildId: text,
  mapSpaces: Type.Array(Type.Object({ id, label: text })),
  bindings: Type.Array(Type.Object({
    id,
    mapSpaceId: id,
    sceneNativeId: Type.Integer({ minimum: 0 }),
    scenePath: text,
    frame: Type.Object({ origin: horizontal, xAxis: horizontal, yAxis: horizontal }),
    domain: Type.Union([Type.Object({ kind: Type.Literal("scene") }), Type.Object({ kind: Type.Literal("boxes"), boxes })]),
    evidence: Type.Array(evidence, { minItems: 1 }),
  })),
});
export type MapSpaceProfile = Static<typeof MapSpaceProfileSchema>;
export type SpatialPosition = Static<typeof point>;
export type SpatialBox = Static<typeof box>;
export const SpatialSnapshotSchema = Type.Object({
  schemaVersion: Type.Literal("compendium.spatial-snapshot.v2"),
  buildId: text,
  sceneNativeId: Type.Integer({ minimum: 0 }),
  scenePath: text,
  sources: Type.Object({ geometry: evidence, placements: evidence, profile: Type.Union([evidence, Type.Null()]) }),
  completeImageryCoverage: Type.Literal(false),
  placements: Type.Array(Type.Object({
    placementId: text,
    worldPosition: point,
    resolution: Type.Object({
      state: Type.Union([Type.Literal("resolved"), Type.Literal("unresolved"), Type.Literal("ambiguous")]),
      candidates: Type.Array(Type.Object({
        mapSpaceId: text, mapPosition: Type.Object({ x: Type.Number(), y: Type.Number() }), bindingIds: Type.Array(text),
      })),
      issues: Type.Array(text),
    }),
    regions: Type.Object({
      memberships: Type.Array(Type.Object({ regionIndex: Type.Integer({ minimum: 0 }), nativeId: Type.Union([Type.Integer(), Type.Null()]), componentInstanceId: Type.Integer() })),
      unresolved: Type.Array(Type.Object({ regionIndex: Type.Integer({ minimum: 0 }), reason: text })),
    }),
  })),
  summary: Type.Object({ placements: Type.Integer({ minimum: 0 }), resolved: Type.Integer({ minimum: 0 }), unresolved: Type.Integer({ minimum: 0 }), ambiguous: Type.Integer({ minimum: 0 }), regionIssues: Type.Integer({ minimum: 0 }) }),
});
export type SpatialSnapshot = Static<typeof SpatialSnapshotSchema>;
export type SpatialResolution = SpatialSnapshot["placements"][number]["resolution"];
export type SpatialCandidate = SpatialResolution["candidates"][number];
export type AuthoredRegionResolution = SpatialSnapshot["placements"][number]["regions"];
