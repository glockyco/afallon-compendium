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
  const details = fact.details;
  return {
    ...baseDocument(entity, ref, input),
    ...(details.uiCategory && details.uiCategory !== "None" ? { category: details.uiCategory } : {}),
    ...(details.statCategory && details.statCategory !== "None" ? { statCategory: details.statCategory } : {}),
    unit: details.isPercentStat ? "percent" : "flat", base: details.baseValue,
    ...(details.minValue === null ? {} : { min: details.minValue }),
    ...(details.maxValue === null ? {} : { max: details.maxValue }),
    vitality: details.isVitalityStat,
    ...(details.isVitalityStat ? { startPercentage: details.startPercentage } : {}),
    recovery: details.regeneration.filter((row) => row.amount !== 0 && row.interval > 0).map((row) => ({ when: row.when, amount: row.amount, interval: row.interval })),
    bonuses: details.statBonuses.flatMap((bonus) => {
      const type = BONUS_NAMES[bonus.statType.name];
      if (!type) return [];
      const damageType = bonus.customDamageType || (bonus.damageType.name !== "None" ? bonus.damageType.name : null);
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
