import type { CatalogCondition } from "@afallon/contracts/catalog";
import type { PublicAbility } from "@afallon/contracts/public";
import { phaseAbilities } from "../adventurers";
import type { PublishedPage } from "../references";
import { learnersOf } from "./classes";
import { type DocumentProjectionInput, mergeRefs, pageBase, requirementsFor } from "./projection";

// An ability page shows one version for each set of records that share their rank texts, with creatures that use
// them, items that cast them, and items that teach them.
export function projectAbilityPage(page: PublishedPage, input: DocumentProjectionInput, conditions: ReadonlyMap<string, CatalogCondition>): PublicAbility {
  const progression = new Map(input.facts.progression.facts.map((fact) => [fact.entityKey, fact]));
  const factsByKey = new Map(input.facts.abilities.map((fact) => [fact.entityKey, fact]));
  const covered = new Set(page.versions.flatMap((version) => version.members.map((member) => member.entityKey)));
  for (const member of page.members) if (!covered.has(member.entity.entityKey)) throw new Error(`Missing ability facts for ${member.entity.entityKey}.`);
  const base = pageBase(page, input);
  const versions = page.versions.map((version) => {
    const keys = version.members.map((member) => member.entityKey), keySet = new Set(keys);
    const fact = factsByKey.get(keys[0]!)!;
    const usedBy = mergeRefs(input.facts.npcs.filter((npc) => phaseAbilities(npc).some((phase) => phase.abilities.some((ability) => ability.ability.entityKey !== null && keySet.has(ability.ability.entityKey))))
      .map((npc) => input.resolve({ entityKey: npc.entityKey, label: npc.entityKey })), input);
    const usedByItems = mergeRefs(input.facts.items.filter((item) => item.actionAbilities.some((ability) => ability.ability.entityKey !== null && keySet.has(ability.ability.entityKey))
      || item.gameActions.some((action) => action.type === "Ability" && action.target?.entityKey !== null && action.target?.entityKey !== undefined && keySet.has(action.target.entityKey)))
      .map((item) => input.resolve({ entityKey: item.entityKey, label: item.entityKey })), input);
    const taughtBy = mergeRefs(input.facts.items.filter((item) => item.actionAbilities.some((ability) => ability.ability.entityKey !== null && keySet.has(ability.ability.entityKey)))
      .map((item) => input.resolve({ entityKey: item.entityKey, label: item.entityKey })), input);
    const icon = input.artByEntity.get(keys[0]!)?.icon;
    const mechanics = progression.get(keys[0]!);
    const useCondition = mechanics?.kind === "abilities" ? mechanics.details.ranks[0]?.conditionId ?? null : null;
    const useRequirements = useCondition === null ? [] : requirementsFor([useCondition], conditions, input.resolve);
    return { keys, anchor: version.anchor, ...(icon && icon.sha256 !== base.art.icon?.sha256 ? { icon } : {}), ranks: fact.ranks.map((rank) => ({ rankIndex: Math.max(0, rank.rankIndex), lines: rank.lines })), useRequirements, learnedBy: learnersOf(keySet, input, conditions), usedBy, usedByItems, taughtBy };
  });
  return { ...base, versions };
}
