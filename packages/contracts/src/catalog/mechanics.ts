import { Type, type Static } from "typebox";
import { ContentIdentitySchema } from "../lifecycle";
import { schemaRegistry } from "../schema-registry";
import type { ProvenanceReference } from "./query";

const text = Type.String({ minLength: 1 });
const sha256 = Type.String({ pattern: "^[0-9a-f]{64}$" });
const ruleId = Type.String({ pattern: "^[a-z][a-z0-9]*(-[a-z0-9]+)*$" });

export const MECHANICS_TOPICS = ["character-progression", "heroic-tier", "crafting-and-gathering"] as const;
export const MechanicsTopicSchema = Type.Union([Type.Literal("character-progression"), Type.Literal("heroic-tier"), Type.Literal("crafting-and-gathering")]);
export type MechanicsTopic = Static<typeof MechanicsTopicSchema>;

// A reviewed record of the calculation rules that native evidence of one build proves. Each evidence object is a
// registered store object: a bounded decompilation, a read-only probe output, a caller scan, or a constant read. A rule
// is `verified` when its evidence proves the whole phrase and `unknown` when the phrase names an unresolved branch.
// `phrase` names each operand as `{name}`; the number itself stays in `operands`. `links` name catalog entities that
// the rule reads, such as the Experience Bonus stat.
export const MechanicsRulesSchema = Type.Object({
  schemaVersion: Type.Literal("compendium.mechanics-rules.v1"),
  buildId: text,
  binary: Type.Object({ file: text, sha256 }, { additionalProperties: false }),
  evidence: Type.Array(Type.Object({ id: ruleId, description: text, object: ContentIdentitySchema }, { additionalProperties: false }), { minItems: 1 }),
  rules: Type.Array(Type.Object({
    id: ruleId,
    topic: MechanicsTopicSchema,
    section: ruleId,
    status: Type.Union([Type.Literal("verified"), Type.Literal("unknown")]),
    phrase: text,
    operands: Type.Record(Type.String({ pattern: "^[a-z][A-Za-z0-9]*$" }), Type.Number()),
    links: Type.Array(text, { uniqueItems: true }),
    sources: Type.Array(Type.Object({ evidence: ruleId, method: text }, { additionalProperties: false }), { minItems: 1 }),
  }, { additionalProperties: false }), { minItems: 1 }),
}, { additionalProperties: false });
export type MechanicsRules = Static<typeof MechanicsRulesSchema>;

// A rule as the catalog stores and returns it. `links` resolve to catalog references; `sources` keep the evidence
// object of each cited method.
export interface CatalogMechanicsRule {
  ruleId: string;
  topic: MechanicsTopic;
  section: string;
  ordinal: number;
  status: "verified" | "unknown";
  phrase: string;
  operands: Record<string, number>;
  links: Array<{ entityKey: string | null; label: string }>;
  sources: Array<{ method: string; description: string; object: { sha256: string; bytes: number } }>;
}
export type NormalizedMechanicsRule = CatalogMechanicsRule & { provenance: ProvenanceReference[] };

schemaRegistry.register("compendium.mechanics-rules.v1", MechanicsRulesSchema);
