import type { CatalogEntityRow, CatalogFacts, ProgressionFaction } from "@afallon/contracts/catalog";
import type { EntityRef, FactionStance, FactionStanding, PublicFaction } from "@afallon/contracts/public";
import { topicRef } from "../placed-rules";
import { displayName } from "../text";
import { baseDocument, type DocumentProjectionInput } from "./projection";

// The game's alignment of a stance toward the player.
const ALIGNMENTS: Readonly<Record<string, FactionStance["alignment"]>> = { Ally: "ally", Neutral: "neutral", Enemy: "enemy" };
// The verified rule that names the faction of every race, whose relations a new character starts with.
const NEW_CHARACTER_RULE = "factions-new-character-standing";

function factionFacts(facts: CatalogFacts, key: string): ProgressionFaction | undefined {
  const fact = facts.progression.facts.find((candidate) => candidate.entityKey === key);
  return fact?.kind === "factions" ? fact.details : undefined;
}

function stancesOf(key: string, faction: ProgressionFaction): FactionStance[] {
  return faction.stances.map((stance) => {
    const alignment = ALIGNMENTS[stance.alignmentToPlayer.name];
    if (!alignment) throw new Error(`Faction ${key} has a stance with the unknown alignment ${stance.alignmentToPlayer.name}.`);
    return { name: displayName(stance.stance ?? "") || "Unnamed Stance", points: Math.max(0, stance.pointsRequired), alignment };
  });
}

/**
 * A new character's stance and points toward each faction, by faction key. Character creation copies the relations of
 * the race's faction, finding each relation's default stance by name among the target faction's stances. The verified
 * rule names that faction. Without the rule, no starting standing is known.
 */
export function newCharacterStandings(facts: CatalogFacts): ReadonlyMap<string, FactionStanding> {
  const rule = facts.progression.mechanicsRules.find((candidate) => candidate.ruleId === NEW_CHARACTER_RULE && candidate.status === "verified");
  const playerFaction = rule?.links[0]?.entityKey;
  if (!rule) return new Map();
  if (!playerFaction) throw new Error(`Rule ${NEW_CHARACTER_RULE} names no faction.`);
  const own = factionFacts(facts, playerFaction);
  if (!own) throw new Error(`Rule ${NEW_CHARACTER_RULE} names ${playerFaction}, which has no faction facts.`);
  const result = new Map<string, FactionStanding>();
  for (const relation of own.relations) {
    const target = relation.faction.entityKey ? factionFacts(facts, relation.faction.entityKey) : undefined;
    if (!target || !relation.faction.entityKey) continue;
    const index = target.stances.findIndex((stance) => stance.stance === relation.defaultStance);
    if (index < 0) throw new Error(`${playerFaction} starts at the stance ${relation.defaultStance ?? "none"}, which ${relation.faction.entityKey} lacks.`);
    const stance = stancesOf(relation.faction.entityKey, target)[index]!;
    result.set(relation.faction.entityKey, { stance: stance.name, points: Math.max(0, relation.startingPoints), alignment: stance.alignment });
  }
  return result;
}

/**
 * A faction's page: its stances in order with the points each holds and its alignment, its default stance and starting
 * points toward each faction, and a new character's standing with it. `members` counts the NPC pages that name the
 * faction, as the NPC list's Faction filter counts them.
 */
export function projectFaction(entity: CatalogEntityRow, ref: EntityRef, input: DocumentProjectionInput, members: number, standings: ReadonlyMap<string, FactionStanding>): PublicFaction {
  const fact = factionFacts(input.facts, entity.entityKey);
  if (!fact) throw new Error(`Faction ${entity.entityKey} has no faction facts.`);
  const relations = fact.relations.map((relation) => ({
    faction: input.resolve(relation.faction), ...(relation.defaultStance ? { stance: displayName(relation.defaultStance) } : {}), startingPoints: Math.max(0, relation.startingPoints),
  }));
  const newCharacter = standings.get(entity.entityKey);
  return {
    ...baseDocument(entity, ref, input), stances: stancesOf(entity.entityKey, fact), relations, members, shownInReputation: fact.showInReputation,
    ...(newCharacter ? { newCharacter, guide: topicRef("factions") } : {}),
  };
}
