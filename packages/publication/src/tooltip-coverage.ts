import type { CatalogFacts, CatalogRelations, TooltipLine } from "@afallon/contracts/catalog";
import {
  STATIC_DOCUMENT_SCHEMA_IDS,
  type PublicAbility,
  type PublicDocument,
  type PublicGearSet,
  type PublicItem,
  type PublicNpc,
} from "@afallon/contracts/public";

function hasNativeText(lines: readonly TooltipLine[]): boolean {
  return lines.some((line) => line.spans.some((span) => span.text.length > 0));
}

function sameLines(left: readonly TooltipLine[], right: readonly TooltipLine[]): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

export function assertCompleteTooltipCoverage(complete: boolean, issues: readonly string[]): void {
  if (complete && issues.length > 0) throw new Error(`Complete publication failed tooltip coverage:\n${issues.join("\n")}`);
}

export function auditPublicTooltipCoverage(
  facts: CatalogFacts,
  relations: CatalogRelations,
  documents: ReadonlyMap<string, PublicDocument>,
  schemaIdByKey?: ReadonlyMap<string, string>,
): string[] {
  const issues: string[] = [];
  const rankIndexesByAbility = new Map(facts.abilities.map((ability) => [ability.entityKey, new Set(ability.ranks.map((rank) => rank.rankIndex))]));

  for (const ability of facts.abilities) {
    const document = documents.get(ability.entityKey);
    if (document?.ref.kind !== "abilities") {
      issues.push(`Ability ${ability.entityKey} has no public document.`);
      continue;
    }
    const published = document as PublicAbility;
    const publishedByRank = new Map(published.facts.ranks.map((rank) => [rank.rankIndex, rank]));
    for (const rank of ability.ranks) {
      const publicRank = publishedByRank.get(rank.rankIndex);
      if (!publicRank) issues.push(`Ability ${ability.entityKey} is missing public rank ${rank.rankIndex}.`);
      else if (!hasNativeText(publicRank.lines)) issues.push(`Ability ${ability.entityKey} rank ${rank.rankIndex} has an empty public native-text block.`);
      else if (!sameLines(rank.lines, publicRank.lines)) issues.push(`Ability ${ability.entityKey} rank ${rank.rankIndex} changed its native-text block.`);
    }
    for (const rank of published.facts.ranks) if (!ability.ranks.some((candidate) => candidate.rankIndex === rank.rankIndex)) {
      issues.push(`Ability ${ability.entityKey} has unexpected public rank ${rank.rankIndex}.`);
    }
  }

  for (const item of facts.items) {
    const document = documents.get(item.entityKey);
    if (document?.ref.kind !== "items") continue;
    const published = document as PublicItem;
    if (!sameLines(item.useLines, published.facts.useLines)) issues.push(`Item ${item.entityKey} changed its native use-text block.`);
    for (const reference of published.facts.actionAbilities) {
      const key = reference.ability.key;
      if (key !== null && !rankIndexesByAbility.get(key)?.has(reference.rankIndex)) issues.push(`Item ${item.entityKey} references missing ability rank ${key}#${reference.rankIndex}.`);
    }
  }

  for (const npc of facts.npcs) {
    const document = documents.get(npc.entityKey);
    if (document?.ref.kind !== "npcs") continue;
    for (const phase of (document as PublicNpc).abilityPhases) for (const reference of phase.abilities) {
      const key = reference.ability.key;
      if (key !== null && !rankIndexesByAbility.get(key)?.has(reference.rankIndex)) issues.push(`NPC ${npc.entityKey} references missing ability rank ${key}#${reference.rankIndex}.`);
    }
  }

  for (const condition of relations.conditions) if (condition.requirements.length > 0 && condition.scope === null) {
    issues.push(`Condition ${condition.conditionId} has unclassified or mixed requirement predicates.`);
  }

  for (const set of facts.gearSets) {
    const document = documents.get(set.entityKey);
    if (document?.ref.kind !== "gearSets") continue;
    for (const [index, member] of (document as PublicGearSet).members.entries()) if (member.key === null) {
      issues.push(`Gear set ${set.entityKey} has unresolved public member ${index}: ${member.label}.`);
    }
  }

  if (schemaIdByKey) for (const [key, document] of documents) {
    const expected = STATIC_DOCUMENT_SCHEMA_IDS[document.ref.kind as keyof typeof STATIC_DOCUMENT_SCHEMA_IDS];
    const actual = schemaIdByKey.get(key);
    if (expected !== actual) issues.push(`Document ${key} uses schema ${actual ?? "missing"}; expected ${expected ?? "no registered schema"}.`);
  }

  return issues.sort();
}
