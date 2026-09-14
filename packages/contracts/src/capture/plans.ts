import { Type, type Static } from "typebox";

const reviewedCellOwner = Type.Object({
  minX: Type.Number(),
  minZ: Type.Number(),
  sceneNativeId: Type.Integer({ minimum: 0 }),
  reason: Type.String({ minLength: 1 }),
}, { additionalProperties: false });

export const ReviewedCellOwnersSchema = Type.Object({
  schemaVersion: Type.Literal("compendium.reviewed-cell-owners.v1"),
  mapSpaceId: Type.Literal("world-surface"),
  cells: Type.Array(reviewedCellOwner),
}, { additionalProperties: false });
export type ReviewedCellOwners = Static<typeof ReviewedCellOwnersSchema>;
