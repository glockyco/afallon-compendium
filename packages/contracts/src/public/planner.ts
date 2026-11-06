import { Type, type Static, type TSchema } from "typebox";
import { ArtRefSchema } from "./documents";
import { count, number, text, StaticResourceIdentityFields } from "./primitives";

const nullable = <T extends TSchema>(schema: T) => Type.Union([schema, Type.Null()]);
const gaps = Type.Array(text, { uniqueItems: true });
const identity = Type.Object({ key: nullable(text), name: text, icon: Type.Optional(ArtRefSchema) }, { additionalProperties: false });
// Raw authored operands intentionally retain new fields and predicate forms. Presence is not verification.
const rawObject = Type.Record(Type.String(), Type.Unknown());
export const PlannerConditionSchema = Type.Object({
  id: nullable(text), semantics: nullable(text), sourceFieldPath: nullable(text),
  groups: nullable(Type.Array(nullable(Type.Object({
    checkCount: Type.Optional(Type.Boolean()), requiredCount: Type.Optional(Type.Integer()),
    requirements: Type.Array(nullable(rawObject)),
  }, { additionalProperties: true })))), gaps,
}, { additionalProperties: false });
export const PlannerRankSchema = Type.Object({
  rank: count, authoredCost: nullable(number),
  text: Type.Array(Type.String()), rawData: rawObject, useEffectCondition: PlannerConditionSchema,
}, { additionalProperties: false });
export const PlannerNodeSchema = Type.Object({
  index: count, kind: text, target: identity, tier: Type.Integer(), row: Type.Integer(),
  rankLimit: nullable(count), defaultRank: nullable(count), ranks: Type.Array(PlannerRankSchema),
  purchaseCondition: PlannerConditionSchema, gaps,
}, { additionalProperties: false });
export const PlannerTreeSchema = Type.Object({
  ...identity.properties, pointType: nullable(text), tiers: nullable(count), slotsPerTier: nullable(count),
  nodes: Type.Array(PlannerNodeSchema), gaps,
}, { additionalProperties: false });
export const StaticPlannerSchema = Type.Object({
  schemaVersion: Type.Literal("compendium.static-planner.v1"), ...StaticResourceIdentityFields,
  races: Type.Array(Type.Object({ ...identity.properties, offeredClasses: Type.Array(identity), gaps }, { additionalProperties: false })),
  classes: Type.Array(Type.Object({ ...identity.properties,
    levels: nullable(Type.Object({ min: Type.Integer({ minimum: 1 }), max: Type.Integer({ minimum: 1 }) }, { additionalProperties: false })),
    trees: Type.Array(identity), gaps,
  }, { additionalProperties: false })),
  trees: Type.Array(PlannerTreeSchema),
  pointTypes: Type.Array(Type.Object({ ...identity.properties,
    startAmount: nullable(number), authoredMaxPoints: nullable(number),
    // Zero authored maximum is uncapped, not a zero balance. Only the evidenced base level schedule is derived.
    baseLevelGrant: nullable(Type.Object({ start: number, perLevel: number, positiveCap: nullable(number), rule: text }, { additionalProperties: false })),
    rawGainRules: Type.Array(rawObject), gaps,
  }, { additionalProperties: false })),
  gaps,
}, { additionalProperties: false });
export type StaticPlanner = Static<typeof StaticPlannerSchema>;
export type PlannerCondition = Static<typeof PlannerConditionSchema>;
export type PlannerNode = Static<typeof PlannerNodeSchema>;
