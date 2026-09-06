import { Type, type Static } from "typebox";

const text = Type.String({ minLength: 1 });
const count = Type.Integer({ minimum: 0 });
const nullableId = Type.Union([count, Type.Null()]);
export const RoleEvidenceSchema = Type.Object({
  artifact: Type.Union([Type.Literal("canonical"), Type.Literal("relationships"), Type.Literal("npc-producers"), Type.Literal("world-sources"), Type.Literal("faction-roles")]),
  pointer: Type.String({ pattern: "^/" }),
});
export type RoleEvidence = Static<typeof RoleEvidenceSchema>;
export const RoleFactSchema = Type.Object({ role: text, npcId: nullableId, scope: Type.Union([Type.Literal("authored"), Type.Literal("player-state")]), evidence: Type.Array(RoleEvidenceSchema, { minItems: 1 }) });
export type RoleFact = Static<typeof RoleFactSchema>;
export const RoleIssueSchema = Type.Object({ reason: text, detail: text, evidence: Type.Array(RoleEvidenceSchema, { minItems: 1 }) });
export type RoleIssue = Static<typeof RoleIssueSchema>;
export const PlacementRolesSchema = Type.Object({
  schemaVersion: Type.Literal("compendium.placement-roles.v1"),
  buildId: text,
  sceneNativeId: count,
  snapshotFrame: count,
  placements: Type.Array(Type.Object({
    placementId: text,
    position: Type.Object({ x: Type.Number(), y: Type.Number(), z: Type.Number() }),
    sourceIds: Type.Array(text, { minItems: 1, uniqueItems: true }),
    roles: Type.Array(Type.Object({ ...RoleFactSchema.properties, sourceIds: Type.Array(text, { minItems: 1, uniqueItems: true }) })),
  })),
  sources: Type.Array(Type.Object({ sourceId: text, placementId: text, families: Type.Array(text, { minItems: 1, uniqueItems: true }), evidence: Type.Array(RoleEvidenceSchema, { minItems: 1 }) })),
  unplacedSources: Type.Array(Type.Object({ families: Type.Array(text, { minItems: 1, uniqueItems: true }), roles: Type.Array(RoleFactSchema), evidence: Type.Array(RoleEvidenceSchema, { minItems: 1 }) })),
  unresolved: Type.Array(RoleIssueSchema),
  summary: Type.Object({ inputRows: count, identityResolvedRows: count, uniqueSources: count, placements: count, multiSourcePlacements: count, multiRolePlacements: count, unplacedSources: count, unresolved: count }),
});
export type PlacementRoles = Static<typeof PlacementRolesSchema>;
