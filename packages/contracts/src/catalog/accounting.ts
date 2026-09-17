import { Type, type Static } from "typebox";
import { ContentIdentitySchema, type ContentIdentity } from "../lifecycle";
import type { WorldInventory } from "../raw/world-inventory";
import { schemaRegistry } from "../schema-registry";

const text = Type.String({ minLength: 1 });
const hash = Type.String({ pattern: "^[a-f0-9]{64}$" });
const strict = { additionalProperties: false } as const;

export const REQUIRED_GAMEPLAY_COVERAGE_FAMILIES = ["canonical", "inventory", "producers", "placements", "roles", "relationships", "spatial", "coverage", "game-map"] as const;
export const CoverageFamilySchema = Type.Union([
  Type.Literal("canonical"), Type.Literal("inventory"), Type.Literal("producers"),
  Type.Literal("placements"), Type.Literal("roles"), Type.Literal("relationships"),
  Type.Literal("spatial"), Type.Literal("coverage"), Type.Literal("game-map"),
  Type.Literal("capture"),
]);
export type CoverageFamily = Static<typeof CoverageFamilySchema>;
export const CoverageDispositionStateSchema = Type.Union([
  Type.Literal("verified"), Type.Literal("not-applicable"), Type.Literal("reviewed-excluded"),
  Type.Literal("unsupported"), Type.Literal("unreachable"), Type.Literal("failed"), Type.Literal("not-attempted"),
]);
export type CoverageDispositionState = Static<typeof CoverageDispositionStateSchema>;

export const CoverageEvidencePointerSchema = Type.Object({
  artifact: ContentIdentitySchema,
  recordPath: Type.String({ pattern: "^(?:/(?:[^~]|~[01])*)?$" }),
  runId: text,
  targetIdentity: text,
}, strict);
export type CoverageEvidencePointer = Static<typeof CoverageEvidencePointerSchema>;

export const CoveragePolicySchema = schemaRegistry.register("compendium.coverage-policy.v1", Type.Object({
  schemaVersion: Type.Literal("compendium.coverage-policy.v1"),
  buildId: text,
  requiredFamilies: Type.Array(CoverageFamilySchema, { minItems: 1, uniqueItems: true }),
  requireCaptures: Type.Boolean(),
  acceptedDispositions: Type.Array(Type.Union([
    Type.Literal("verified"), Type.Literal("not-applicable"), Type.Literal("reviewed-excluded"),
  ]), { minItems: 1, uniqueItems: true }),
}, strict)).schema;
export type CoveragePolicy = Static<typeof CoveragePolicySchema>;

export const CoverageReviewDecisionSchema = Type.Object({
  subjectKey: text,
  family: CoverageFamilySchema,
  discriminator: text,
  state: CoverageDispositionStateSchema,
  reason: text,
  evidence: Type.Array(CoverageEvidencePointerSchema),
  outsideRequiredUniverse: Type.Boolean(),
}, strict);
export type CoverageReviewDecision = Static<typeof CoverageReviewDecisionSchema>;

export const CoverageClosureSchema = schemaRegistry.register("compendium.coverage-closure.v1", Type.Object({
  state: Type.Union([Type.Literal("open"), Type.Literal("closed")]),
  inventories: Type.Array(ContentIdentitySchema, { uniqueItems: true }),
  subjectKeys: Type.Array(text, { uniqueItems: true }),
  evidence: Type.Array(CoverageEvidencePointerSchema),
  reason: text,
}, strict)).schema;
export type CoverageClosure = Static<typeof CoverageClosureSchema>;

export const CoverageReviewSchema = schemaRegistry.register("compendium.coverage-review.v1", Type.Object({
  schemaVersion: Type.Literal("compendium.coverage-review.v1"),
  buildId: text,
  reviewer: text,
  policy: ContentIdentitySchema,
  inventories: Type.Array(ContentIdentitySchema, { uniqueItems: true }),
  closure: CoverageClosureSchema,
  decisions: Type.Array(CoverageReviewDecisionSchema),
}, strict)).schema;
export type CoverageReview = Static<typeof CoverageReviewSchema>;

export const CoverageObligationSchema = schemaRegistry.register("compendium.coverage-obligation.v1", Type.Object({
  obligationId: hash,
  buildId: text,
  subjectKey: text,
  family: CoverageFamilySchema,
  discriminator: text,
  required: Type.Boolean(),
  gameplay: Type.Boolean(),
  reachable: Type.Boolean(),
  inventoryReferences: Type.Array(ContentIdentitySchema, { minItems: 1, uniqueItems: true }),
  origins: Type.Array(CoverageEvidencePointerSchema, { minItems: 1 }),
}, strict)).schema;
export type CoverageObligation = Static<typeof CoverageObligationSchema>;

export interface VerifiedCoverageEvidence {
  family: CoverageFamily;
  subjectKeys: readonly string[];
  reference: ContentIdentity;
  manifest: ContentIdentity;
  runId: string;
  targetIdentity: string;
  document: unknown;
}

export interface VerifiedCoverageInventory {
  reference: ContentIdentity;
  manifest: ContentIdentity;
  runId: string;
  targetIdentity: string;
  inventory: WorldInventory;
}

export interface CoverageAccountingInput {
  buildId: string;
  inventories: readonly VerifiedCoverageInventory[];
  review: { reference: ContentIdentity; document: CoverageReview };
  policy: { reference: ContentIdentity; document: CoveragePolicy };
  evidence: readonly VerifiedCoverageEvidence[];
  discoveredSubjects?: readonly Pick<CoverageObligation, "subjectKey" | "family" | "gameplay" | "reachable" | "inventoryReferences" | "origins">[];
}

export const CoverageDispositionSchema = schemaRegistry.register("compendium.coverage-disposition.v1", Type.Object({
  dispositionId: hash,
  obligationId: hash,
  state: CoverageDispositionStateSchema,
  reason: text,
  evidence: Type.Array(CoverageEvidencePointerSchema),
  review: ContentIdentitySchema,
  accepted: Type.Boolean(),
  effective: Type.Boolean(),
  outsideRequiredUniverse: Type.Boolean(),
}, strict)).schema;
export type CoverageDisposition = Static<typeof CoverageDispositionSchema>;

export interface CoverageAccounting {
  buildId: string;
  review: CoverageAccountingInput["review"];
  policy: CoverageAccountingInput["policy"];
  inventories: VerifiedCoverageInventory[];
  evidence: VerifiedCoverageEvidence[];
  obligations: CoverageObligation[];
  dispositions: CoverageDisposition[];
  closureIdentity: string;
  closureValid: boolean;
  closureFailures: string[];
}
