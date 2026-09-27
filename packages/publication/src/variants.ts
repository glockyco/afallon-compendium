import type { CatalogEndpoint, CatalogFacts, CatalogNpcFacts } from "@afallon/contracts/catalog";
import { NPC_VARIANT_FIELD_VALUES, type NpcVariantField } from "@afallon/contracts/public";
import { plainText } from "./text";

type AbilityFacts = CatalogFacts["abilities"][number];

/**
 * The ability records of one page that share their rank texts form one version. Versions keep the member order, so the
 * first version holds the lowest native id.
 */
export function abilityVersions(members: readonly AbilityFacts[]): AbilityFacts[][] {
  const versions = new Map<string, AbilityFacts[]>();
  for (const member of members) {
    const key = JSON.stringify(member.ranks.map((rank) => [rank.rankIndex, rank.lines]));
    const version = versions.get(key);
    if (version) version.push(member);
    else versions.set(key, [member]);
  }
  return [...versions.values()];
}

const endpointKey = (endpoint: CatalogEndpoint | null) => endpoint === null ? null : endpoint.entityKey ?? plainText(endpoint.label ?? "");

// The catalog value of each variant field. Abilities compare by version, because two records with the same rank texts
// are the same ability for a player.
function fieldValues(fact: CatalogNpcFacts, abilityVersion: (key: string | null) => string | null): Record<NpcVariantField, unknown> {
  return {
    npcType: plainText(fact.npcType ?? "") || null, creatureType: plainText(fact.creatureType ?? "") || null, family: plainText(fact.family ?? "") || null,
    faction: endpointKey(fact.faction), species: endpointKey(fact.species),
    respawn: [fact.minRespawn, fact.maxRespawn], experience: [fact.minExperience, fact.maxExperience],
    stats: fact.stats.map((row) => [endpointKey(row.stat), row.amount, row.isPercent]),
    immunities: [fact.immuneToStun, fact.immuneToSlow], aggroRange: fact.aggroRange, lootSpecialization: fact.lootSpecialization,
    abilityPhases: fact.abilityPhases.map((phase) => [phase.phaseIndex, phase.name, phase.requirement, phase.abilities.map((ability) => [abilityVersion(ability.ability.entityKey), ability.rankIndex])]),
    factionRewards: fact.factionRewards.map((reward) => [endpointKey(reward.faction), reward.amount]),
    linkedNpc: endpointKey(fact.linkedNpc),
  };
}

/** The record facts that differ between the variants of one creature page. */
export function npcVariantFields(facts: readonly CatalogNpcFacts[], abilityVersion: (key: string | null) => string | null): NpcVariantField[] {
  if (facts.length < 2) return [];
  const values = facts.map((fact) => fieldValues(fact, abilityVersion));
  return NPC_VARIANT_FIELD_VALUES.filter((field) => new Set(values.map((value) => JSON.stringify(value[field]))).size > 1);
}
