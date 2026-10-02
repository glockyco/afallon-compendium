import { Type, type Static } from "typebox";
import { ContentIdentitySchema } from "../lifecycle";
import { schemaRegistry } from "../schema-registry";
import type { ProvenanceReference } from "./query";

const text = Type.String({ minLength: 1 });
const sha256 = Type.String({ pattern: "^[0-9a-f]{64}$" });
const ruleId = Type.String({ pattern: "^[a-z][a-z0-9]*(-[a-z0-9]+)*$" });

export const MECHANICS_TOPICS = ["character-progression", "heroic-tier", "crafting-and-gathering", "corruption", "loot"] as const;
export const MechanicsTopicSchema = Type.Union([Type.Literal("character-progression"), Type.Literal("heroic-tier"), Type.Literal("crafting-and-gathering"), Type.Literal("corruption"), Type.Literal("loot")]);
export type MechanicsTopic = Static<typeof MechanicsTopicSchema>;

// Where a reader meets a rule. A `section` target lists the rule in that section of the page; a `fact` target makes the
// rule the explanation of that label. `linked` places the rule only on the pages of the entities in its links. The
// gathering node scopes `spawned` and `placed` limit a rule to nodes with that kind of source.
export const RULE_PLACEMENT_TARGETS = {
  items: { crafting: "section", teaches: "section", corruption: "section", "when-used": "section", "cloth-loot": "section", "collected-from": "section", "quest-pickups": "section", "dungeon-finder": "section" },
  gatheringNodes: { "how-it-works": "section" },
  skills: { "how-to-gain-experience": "section" },
  npcs: { experience: "fact" },
  quests: { experience: "fact" },
  classes: { "talent-points": "fact" },
} as const;
export type RulePlacementPage = keyof typeof RULE_PLACEMENT_TARGETS;
export const RULE_PLACEMENT_SCOPES = {
  items: ["all", "linked"], gatheringNodes: ["all", "linked", "spawned", "placed"], skills: ["all", "linked"], npcs: ["all"], quests: ["all"], classes: ["all"],
} as const satisfies Record<RulePlacementPage, readonly string[]>;
export const RulePlacementSchema = Type.Object({
  page: Type.Union([Type.Literal("items"), Type.Literal("gatheringNodes"), Type.Literal("skills"), Type.Literal("npcs"), Type.Literal("quests"), Type.Literal("classes")]),
  target: Type.Union([Type.Literal("crafting"), Type.Literal("teaches"), Type.Literal("corruption"), Type.Literal("when-used"), Type.Literal("cloth-loot"), Type.Literal("collected-from"), Type.Literal("quest-pickups"), Type.Literal("dungeon-finder"), Type.Literal("how-it-works"), Type.Literal("how-to-gain-experience"), Type.Literal("experience"), Type.Literal("talent-points")]),
  scope: Type.Union([Type.Literal("all"), Type.Literal("linked"), Type.Literal("spawned"), Type.Literal("placed")]),
}, { additionalProperties: false });
export type RulePlacement = Static<typeof RulePlacementSchema>;

/** The kind of target that a placement names, or null when the page kind has no such target. */
export function placementTargetKind(page: RulePlacementPage, target: string): "section" | "fact" | null {
  return (RULE_PLACEMENT_TARGETS[page] as Record<string, "section" | "fact">)[target] ?? null;
}
export function placementScopeAllowed(page: RulePlacementPage, scope: string): boolean {
  return (RULE_PLACEMENT_SCOPES[page] as readonly string[]).includes(scope);
}

// A reviewed record of the calculation rules that native evidence of one build proves. Each evidence object is a
// registered store object: a bounded decompilation, a read-only probe output, a caller scan, or a constant read. A rule
// is `verified` when its evidence proves the whole phrase and `unknown` when the phrase names an unresolved branch.
// `phrase` names each operand as `{name}`; the number itself stays in `operands`. `links` name catalog entities that
// the rule reads, such as the Experience Bonus stat. `{#n}` places link `n` inside the phrase; a phrase without such
// tokens leads into the closing list of its links. A rule with a `topic` appears in the guide of that topic; its
// `placements` name the pages where it also appears. A rule needs a topic, a placement, or both.
export const MechanicsRulesSchema = Type.Object({
  schemaVersion: Type.Literal("compendium.mechanics-rules.v2"),
  buildId: text,
  binary: Type.Object({ file: text, sha256 }, { additionalProperties: false }),
  evidence: Type.Array(Type.Object({ id: ruleId, description: text, object: ContentIdentitySchema }, { additionalProperties: false }), { minItems: 1 }),
  rules: Type.Array(Type.Object({
    id: ruleId,
    topic: Type.Optional(MechanicsTopicSchema),
    section: ruleId,
    status: Type.Union([Type.Literal("verified"), Type.Literal("unknown")]),
    phrase: text,
    operands: Type.Record(Type.String({ pattern: "^[a-z][A-Za-z0-9]*$" }), Type.Number()),
    links: Type.Array(text, { uniqueItems: true }),
    sources: Type.Array(Type.Object({ evidence: ruleId, method: text }, { additionalProperties: false }), { minItems: 1 }),
    placements: Type.Array(RulePlacementSchema),
  }, { additionalProperties: false }), { minItems: 1 }),
}, { additionalProperties: false });
export type MechanicsRules = Static<typeof MechanicsRulesSchema>;

// A rule as the catalog stores and returns it. `links` resolve to catalog references; `sources` keep the evidence
// object of each cited method. `ordinal` orders the rules of one topic, or the rules without a topic.
export interface CatalogMechanicsRule {
  ruleId: string;
  topic: MechanicsTopic | null;
  section: string;
  ordinal: number;
  status: "verified" | "unknown";
  phrase: string;
  operands: Record<string, number>;
  links: Array<{ entityKey: string | null; label: string }>;
  sources: Array<{ method: string; description: string; object: { sha256: string; bytes: number } }>;
  placements: RulePlacement[];
}
export type NormalizedMechanicsRule = CatalogMechanicsRule & { provenance: ProvenanceReference[] };

schemaRegistry.register("compendium.mechanics-rules.v2", MechanicsRulesSchema);
