import type { CatalogEntityRow, CatalogGearSetFacts } from "@afallon/contracts/catalog";
import { categoryLabel, type EntityRef, type GearSet, type GearSetTier, type PublicGearSet } from "@afallon/contracts/public";
import { itemKind, itemTypeLabel } from "../item-type";
import { baseDocument, type DocumentProjectionInput } from "./projection";

/** Each tier as the number of equipped members it needs and the stats it grants, in the order of the game's item tooltip. */
function gearSetTiers(fact: CatalogGearSetFacts, input: DocumentProjectionInput): GearSetTier[] {
  return fact.tiers.map((tier) => ({ equipped: Math.max(1, tier.equipped),
    stats: tier.stats.map((row) => ({ stat: input.resolve(row.stat), amount: row.amount, isPercent: row.isPercent })) }));
}

/** The gear set of an item, in full: its members, then its tiers, which is the order the game's own item tooltip shows. */
export function projectItemGearSet(setKey: string, input: DocumentProjectionInput): GearSet | undefined {
  const fact = input.facts.gearSets.find((candidate) => candidate.entityKey === setKey);
  if (!fact || !input.entities.some((candidate) => candidate.entityKey === setKey)) return undefined;
  return { set: input.resolve({ entityKey: setKey, label: setKey }), members: fact.members.map(input.resolve), tiers: gearSetTiers(fact, input) };
}

/** A gear set's page: each piece with what it is, then the set's tiers. */
export function projectGearSet(entity: CatalogEntityRow, ref: EntityRef, input: DocumentProjectionInput): PublicGearSet {
  const fact = input.facts.gearSets.find((candidate) => candidate.entityKey === entity.entityKey);
  if (!fact || fact.members.length === 0) throw new Error(`Gear set ${entity.entityKey} has no members.`);
  const items = new Map(input.facts.items.map((item) => [item.entityKey, item]));
  const kinds = fact.members.map((member) => itemKind(member.entityKey ? items.get(member.entityKey) : undefined));
  const pieces = fact.members.map((member, index) => {
    const type = itemTypeLabel(kinds[index]!);
    return { item: input.resolve(member), ...(type ? { type } : {}) };
  });
  const groups = new Set(kinds.map((kind) => kind.weaponType ? "Weapons" : kind.armorType ? categoryLabel(kind.armorType) : null));
  const type = groups.size === 1 ? [...groups][0] : null;
  return { ...baseDocument(entity, ref, input), ...(type ? { type } : {}), pieces, tiers: gearSetTiers(fact, input) };
}
