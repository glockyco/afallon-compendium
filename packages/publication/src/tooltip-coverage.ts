import type { CatalogFacts, CatalogRelations, TooltipLine } from "@afallon/contracts/catalog";
import {
  STATIC_DOCUMENT_SCHEMA_IDS,
  type AbilityVersion,
  type AbilityPhase,
  type PublicGearSet,
  type PublicAbility,
  type PublicClass,
  type PublicDocument,
  type PublicItem,
  type PublicNpc,
  type Ref,
} from "@afallon/contracts/public";
import { talentAnchor } from "./documents/classes";

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
  const versionByRecord = new Map<string, AbilityVersion>();
  for (const document of documents.values()) if (document.ref.kind === "abilities") {
    for (const version of (document as PublicAbility).versions) for (const key of version.keys) versionByRecord.set(key, version);
  }
  // A reference to an ability page names its version when the page has several.
  const referencedRanks = (ref: Ref): ReadonlySet<number> | undefined => {
    if (ref.key === null) return undefined;
    const document = documents.get(ref.key);
    if (document?.ref.kind !== "abilities") return undefined;
    const versions = (document as PublicAbility).versions;
    const version = ref.variant === undefined ? (versions.length === 1 ? versions[0] : undefined) : versions.find((candidate) => candidate.anchor === ref.variant);
    return version ? new Set(version.ranks.map((rank) => rank.rankIndex)) : undefined;
  };
  const checkPhases = (owner: string, phases: readonly AbilityPhase[]) => {
    for (const phase of phases) for (const reference of phase.abilities) {
      if (reference.ability.key !== null && !referencedRanks(reference.ability)?.has(reference.rankIndex)) issues.push(`NPC ${owner} references missing ability rank ${reference.ability.key}#${reference.rankIndex}.`);
    }
  };

  for (const ability of facts.abilities) {
    const version = versionByRecord.get(ability.entityKey);
    if (!version) {
      issues.push(`Ability ${ability.entityKey} has no public document.`);
      continue;
    }
    const publishedByRank = new Map(version.ranks.map((rank) => [rank.rankIndex, rank]));
    for (const rank of ability.ranks) {
      const publicRank = publishedByRank.get(rank.rankIndex);
      if (!publicRank) issues.push(`Ability ${ability.entityKey} is missing public rank ${rank.rankIndex}.`);
      else if (!hasNativeText(publicRank.lines)) issues.push(`Ability ${ability.entityKey} rank ${rank.rankIndex} has an empty public native-text block.`);
      else if (!sameLines(rank.lines, publicRank.lines)) issues.push(`Ability ${ability.entityKey} rank ${rank.rankIndex} changed its native-text block.`);
    }
    for (const rank of version.ranks) if (!ability.ranks.some((candidate) => candidate.rankIndex === rank.rankIndex)) {
      issues.push(`Ability ${ability.entityKey} has unexpected public rank ${rank.rankIndex}.`);
    }
  }

  for (const item of facts.items) {
    const document = documents.get(item.entityKey);
    if (document?.ref.kind !== "items") continue;
    const published = document as PublicItem;
    if (!sameLines(item.useLines, published.facts.useLines)) issues.push(`Item ${item.entityKey} changed its native use-text block.`);
    for (const reference of published.facts.actionAbilities) {
      if (reference.ability.key === null) continue;
      const ranks = referencedRanks(reference.ability);
      if (!ranks || (reference.rankIndex !== undefined && !ranks.has(reference.rankIndex))) {
        issues.push(`Item ${item.entityKey} references missing ability${reference.rankIndex === undefined ? "" : " rank"} ${reference.ability.key}${reference.rankIndex === undefined ? "" : `#${reference.rankIndex}`}.`);
      }
    }
  }

  for (const document of documents.values()) if (document.ref.kind === "npcs") {
    const npc = document as PublicNpc;
    checkPhases(npc.ref.key, npc.abilityPhases);
    for (const variant of npc.variants) checkPhases(variant.key, variant.facts.abilityPhases ?? []);
  }

  // A talent rank shows every stat change that the game's talent tooltip shows: its own changes and its pet changes whose
  // stat exists. A rank that shows no effect is reported too, because a change that the catalog does not read leaves the
  // rank empty.
  const bonusByAnchor = new Map(facts.progression.talentNodes.flatMap((node) => node.target?.entityKey?.startsWith("bonuses:") ? [[talentAnchor(node.tree, node.nodeIndex), node.target.entityKey] as const] : []));
  const bonusRanks = new Map(facts.progression.facts.flatMap((fact) => fact.kind === "bonuses" ? [[fact.entityKey, fact.details.ranks] as const] : []));
  for (const document of documents.values()) if (document.ref.kind === "classes") {
    for (const tree of (document as PublicClass).trees) for (const row of tree.rows) {
      const bonusKey = bonusByAnchor.get(row.anchor), ranks = bonusKey === undefined ? [] : bonusRanks.get(bonusKey) ?? [];
      for (const [published, source] of [[row.first, ranks[0]], [row.last, ranks.length > 1 ? ranks.at(-1) : undefined]] as const) {
        if (!published || !source) continue;
        const shown = published.stats.length + published.petStats.reduce((sum, group) => sum + group.stats.length, 0);
        const expected = source.statEffects.length + source.petStatEffects.filter((change) => change.stat.entityKey !== null).length;
        if (shown < expected) issues.push(`Talent ${bonusKey} rank ${published.rank} on ${document.ref.key} shows ${shown} of its ${expected} stat changes.`);
        else if (shown === 0 && published.text.length === 0) issues.push(`Talent ${bonusKey} rank ${published.rank} on ${document.ref.key} shows no effect.`);
      }
    }
  }

  const itemConditionIds = new Set(facts.items.flatMap((item) => item.conditionIds));
  for (const condition of relations.conditions) if (itemConditionIds.has(condition.conditionId) && condition.requirements.length > 0 && condition.scope === null) {
    issues.push(`Condition ${condition.conditionId} has unclassified or mixed requirement predicates.`);
  }

  // A gear set shows in full on its own page and on the page of each member.
  for (const document of documents.values()) {
    if (document.ref.kind === "gearSets") for (const [index, piece] of (document as PublicGearSet).pieces.entries()) {
      if (piece.item.key === null) issues.push(`Gear set ${document.ref.key} has unresolved public piece ${index}: ${piece.item.label}.`);
    }
    const set = document.ref.kind === "items" ? (document as PublicItem).facts.gearSet : undefined;
    if (set && set.set.key === null) issues.push(`Item ${document.ref.key} names the unresolved gear set ${set.set.label}.`);
  }

  if (schemaIdByKey) for (const [key, document] of documents) {
    const expected = STATIC_DOCUMENT_SCHEMA_IDS[document.ref.kind as keyof typeof STATIC_DOCUMENT_SCHEMA_IDS];
    const actual = schemaIdByKey.get(key);
    if (expected !== actual) issues.push(`Document ${key} uses schema ${actual ?? "missing"}; expected ${expected ?? "no registered schema"}.`);
  }

  return issues.sort();
}
