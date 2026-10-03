import type { CatalogEntityRow, CatalogProgressionFact } from "@afallon/contracts/catalog";
import { type EntityRef, isEntityRef, type PublicStat, type Ref } from "@afallon/contracts/public";
import { displayName } from "../text";
import { talentAnchor } from "./classes";
import { baseDocument, type DocumentProjectionInput } from "./projection";

// These captured records have neither an identified player-facing use nor meaningful explanatory text.
// Item power stays: it is present on hundreds of items even though its definition has no description.
const INTERNAL_STATS: Readonly<Record<string, true>> = {
  "stats:42": true, "stats:44": true, "stats:90": true, "stats:115": true,
  "stats:116": true, "stats:117": true, "stats:118": true, "stats:122": true,
};
export function isPlayerStat(entity: CatalogEntityRow): boolean {
  return entity.kind === "stats" && !Object.hasOwn(INTERNAL_STATS, entity.entityKey);
}

const BONUS_NAMES: Record<string, string> = {
  BASE_RESISTANCE_TYPE: "Armor Reduction", DAMAGE: "Damage", RESISTANCE: "Resistance",
  PENETRATION: "Penetration", CRIT_CHANCE: "Critical Hit Chance",
  HEALING: "Healing", GLOBAL_HEALING: "Healing", EFFECT_TRIGGER: "On-Hit Effect",
};
const FAMILY_ORDER: Readonly<Record<PublicStat["grants"][number]["family"], number>> = {
  fixedItems: 0, randomItems: 1, gems: 2, sets: 3, talents: 4, effects: 5, enchantments: 6,
};

// Electricity Resistance's authored description names Fire damage, contradicting its own name.
// No verified damage rule resolves which damage it reduces.
// Item Power comes from the stats:53 fixed item stat and is also published as the item's itemPower fact.
const STAT_NOTES: Readonly<Record<string, { text: string; replaceDescription?: true }>> = {
  "stats:98": { text: "Its in-game description refers to Fire damage, so it does not establish which damage this resistance reduces.", replaceDescription: true },
  "stats:53": { text: "Item Power is an equipment rating shown in item tooltips." },
};
// The item list's itemPower column is projected from the same stats:53 item stat.
const ITEM_LIST_COLUMNS: Readonly<Record<string, string>> = { "stats:53": "itemPower" };

function distinctRefs(refs: Ref[]): Ref[] {
  const unique = new Map<string, Ref>();
  for (const ref of refs) unique.set(ref.key ?? `missing:${ref.label}`, ref);
  return [...unique.values()].sort((a, b) => (isEntityRef(a) ? a.name : a.label).localeCompare(isEntityRef(b) ? b.name : b.label));
}

/** Source edges are built from authored stat rows, not the shorter item-list summaries. */
export function projectStat(entity: CatalogEntityRow, ref: EntityRef, input: DocumentProjectionInput): PublicStat {
  const fact = input.facts.progression.facts.find((row) => row.kind === "stats" && row.entityKey === entity.entityKey);
  if (!fact || fact.kind !== "stats") throw new Error(`Stat ${entity.entityKey} has no definition.`);
  const key = entity.entityKey;
  const resolves = (stat: { entityKey: string | null }) => stat.entityKey === key;
  const present = (sourceKey: string) => input.references.refs.has(sourceKey);
  const sources = input.facts.items.filter((item) => input.references.refs.get(item.entityKey)?.slug);
  const progress = input.facts.progression;
  const progressing = (kind: CatalogProgressionFact["kind"]) => progress.facts.filter((row) => row.kind === kind && present(row.entityKey));
  const refOf = (source: { entityKey: string; name?: string | null }) => input.resolve({ entityKey: source.entityKey, label: source.name ?? source.entityKey });
  const talents: PublicStat["sources"]["talents"] = [];
  const talentGrants: PublicStat["grants"] = [];
  const seenTalents = new Set<string>();
  const bonuses = new Map(progress.facts.flatMap((bonus) => bonus.kind === "bonuses" && bonus.details.ranks.some((rank) => rank.statEffects.some((row) => resolves(row.stat))) ? [[bonus.entityKey, bonus] as const] : []));
  for (const node of progress.talentNodes) {
    const bonus = node.target?.entityKey ? bonuses.get(node.target.entityKey) : undefined;
    if (!bonus) continue;
    for (const link of progress.links) {
      if (link.linkKind !== "talentTree" || link.target.entityKey !== node.tree || !present(link.owner)) continue;
      const character = input.references.refs.get(link.owner)!;
      if (character.kind !== "classes" || character.slug === undefined) continue;
      const id = `${character.key}:${node.tree}:${node.nodeIndex}`;
      if (seenTalents.has(id)) continue;
      seenTalents.add(id);
      const icon = input.artByEntity.get(bonus.entityKey)?.icon;
      talents.push({ class: character, talent: { ...character, name: displayName(bonus.name ?? node.target?.label ?? "Talent"), variant: talentAnchor(node.tree, node.nodeIndex), ...(icon ? { icon } : {}) } });
      // Every rank of a talent raises the same bonus, so the talent is one grant for each of its flat and percent forms:
      // the bonus range across its ranks, and in `tier` how many ranks give the bonus.
      for (const percent of [false, true]) {
        const ranks = bonus.details.ranks.map((rank) => rank.statEffects.filter((entry) => resolves(entry.stat) && entry.isPercent === percent))
          .filter((entries) => entries.length > 0);
        if (!ranks.length) continue;
        const amounts = ranks.map((entries) => entries.reduce((sum, entry) => sum + entry.amount, 0));
        const min = Math.min(...amounts), max = Math.max(...amounts);
        talentGrants.push({ source: talents[talents.length - 1]!.talent, family: "talents", class: character, percent,
          ...(min === max ? { amount: min } : { min, max }), tier: ranks.length });
      }
    }
  }
  talents.sort((a, b) => (isEntityRef(a.class) ? a.class.name : a.class.label).localeCompare(isEntityRef(b.class) ? b.class.name : b.class.label)
    || (isEntityRef(a.talent) ? a.talent.name : a.talent.label).localeCompare(isEntityRef(b.talent) ? b.talent.name : b.talent.label));
  const classes: PublicStat["sources"]["classes"] = [];
  for (const source of progressing("classes").filter((row) => input.references.refs.get(row.entityKey)?.slug)) {
    if (source.kind !== "classes") continue;
    const initial = source.details.stats.filter((row) => resolves(row.stat)).reduce((sum, row) => sum + row.amount, 0)
      + source.details.customStats.filter((row) => resolves(row.stat)).reduce((sum, row) => sum + row.addedValue, 0);
    const growth = source.details.stats.filter((row) => resolves(row.stat)).reduce((sum, row) => sum + row.bonusPerLevel, 0)
      + source.details.customStats.filter((row) => resolves(row.stat)).reduce((sum, row) => sum + row.valuePerLevel, 0);
    if (initial !== 0 || growth !== 0) classes.push({ class: refOf(source), starting: initial, growth });
  }
  classes.sort((a, b) => (isEntityRef(a.class) ? a.class.name : a.class.label).localeCompare(isEntityRef(b.class) ? b.class.name : b.class.label));
  const grants: PublicStat["grants"] = [];
  for (const item of sources) {
    const source = refOf(item);
    for (const row of item.stats.filter((row) => resolves(row.stat))) grants.push({ source, family: "fixedItems", amount: row.amount, percent: row.isPercent });
    for (const row of item.randomStats.filter((row) => resolves(row.stat))) grants.push({ source, family: "randomItems", min: row.min, max: row.max, percent: row.isPercent });
    for (const row of item.gem?.stats.filter((row) => resolves(row.stat)) ?? []) grants.push({ source, family: "gems", amount: row.amount, percent: row.isPercent });
  }
  for (const set of input.facts.gearSets.filter((row) => present(row.entityKey))) {
    for (const tier of set.tiers) for (const row of tier.stats.filter((stat) => resolves(stat.stat))) {
      grants.push({ source: refOf(set), family: "sets", amount: row.amount, percent: row.isPercent, tier: tier.equipped });
    }
  }
  grants.push(...talentGrants);
  for (const source of progressing("effects")) if (source.kind === "effects" && input.references.refs.get(source.entityKey)?.slug) {
    for (const rank of source.details.ranks) for (const row of rank.statEffects.filter((stat) => resolves(stat.stat))) {
      grants.push({ source: refOf(source), family: "effects", amount: row.amount, percent: row.isPercent, tier: rank.rank + 1 });
    }
  }
  for (const source of progressing("enchantments")) if (source.kind === "enchantments" && present(source.entityKey)) {
    for (const tier of source.details.tiers) for (const row of tier.stats.filter((stat) => resolves(stat.stat))) {
      grants.push({ source: refOf(source), family: "enchantments", amount: row.amount, percent: row.isPercent, tier: tier.tier });
    }
  }
  grants.sort((a, b) => FAMILY_ORDER[a.family] - FAMILY_ORDER[b.family]
    || (isEntityRef(a.source) ? a.source.name : a.source.label).localeCompare(isEntityRef(b.source) ? b.source.name : b.source.label)
    || (a.tier ?? 0) - (b.tier ?? 0));
  const details = fact.details;
  const recovery = details.regeneration.filter((row) => row.amount !== 0 && row.interval > 0)
    .map((row) => ({ when: row.when, amount: row.amount, interval: row.interval }));
  // The raw vitality flag also marks zero-base Item Power and Armor Penetration. In this catalog,
  // only Health, Mana, Energy, and Endurance have both a starting pool and active recovery.
  const vitality = details.isVitalityStat && details.baseValue > 0 && recovery.length > 0;
  return {
    ...baseDocument(entity, ref, input),
    ...(STAT_NOTES[key] ? { note: STAT_NOTES[key].text, ...(STAT_NOTES[key].replaceDescription ? { description: null } : {}) } : {}),
    ...(ITEM_LIST_COLUMNS[key] ? { itemListColumn: ITEM_LIST_COLUMNS[key], itemListCount: sources.filter((item) => item.stats.some((row) => resolves(row.stat) && row.amount >= 0)).length } : {}),
    ...(details.uiCategory && details.uiCategory !== "None" ? { category: details.uiCategory } : {}),
    ...(details.statCategory && details.statCategory !== "None" ? { statCategory: details.statCategory } : {}),
    unit: details.isPercentStat ? "percent" : "flat", base: details.baseValue,
    ...(details.minValue === null ? {} : { min: details.minValue }),
    ...(details.maxValue === null ? {} : { max: details.maxValue }),
    vitality,
    ...(vitality ? { startPercentage: details.startPercentage } : {}),
    recovery,
    grants,
    bonuses: details.statBonuses.flatMap((bonus) => {
      const type = BONUS_NAMES[bonus.statType.name];
      if (!type) return [];
      // A mismatched generic type can refer to another damage family. Only explicit custom types are safe to name.
      const damageType = bonus.customDamageType?.trim();
      return [{ type, amount: bonus.modifyValue,
        ...(damageType ? { damageType: displayName(damageType) } : {}),
        ...(bonus.resistanceStat?.entityKey && present(bonus.resistanceStat.entityKey) ? { resistanceStat: input.resolve(bonus.resistanceStat) } : {}),
        ...(bonus.penetrationStat?.entityKey && present(bonus.penetrationStat.entityKey) ? { penetrationStat: input.resolve(bonus.penetrationStat) } : {}),
        ...(bonus.stat?.entityKey && present(bonus.stat.entityKey) ? { stat: input.resolve(bonus.stat) } : {}),
      }];
    }),
    onHit: details.onHitEffects.map((row) => ({ effect: input.resolve(row.effect), rank: row.rank, chance: row.chance })),
    procCooldown: details.procCooldown,
    sources: {
      fixedItems: distinctRefs(sources.filter((item) => item.stats.some((row) => resolves(row.stat))).map(refOf)),
      randomItems: distinctRefs(sources.filter((item) => item.randomStats.some((row) => resolves(row.stat))).map(refOf)),
      gems: distinctRefs(sources.filter((item) => item.gem?.stats.some((row) => resolves(row.stat))).map(refOf)),
      sets: distinctRefs(input.facts.gearSets.filter((set) => input.references.refs.get(set.entityKey)?.slug && set.tiers.some((tier) => tier.stats.some((row) => resolves(row.stat)))).map(refOf)),
      talents,
      effects: distinctRefs(progressing("effects").flatMap((source) => source.kind === "effects" && input.references.refs.get(source.entityKey)?.slug && source.details.ranks.some((rank) => rank.statEffects.some((row) => resolves(row.stat))) ? [refOf(source)] : [])),
      classes,
      enchantments: distinctRefs(progressing("enchantments").flatMap((source) => source.kind === "enchantments" && source.details.tiers.some((tier) => tier.stats.some((row) => resolves(row.stat))) ? [refOf(source)] : [])),
    },
  };
}
