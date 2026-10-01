import type { CatalogCondition, CatalogEndpoint, CatalogEntityRow, CatalogFacts } from "@afallon/contracts/catalog";
import { type EntityRef, isEntityRef, type LearnerRow, type PublicClass, type Ref, type TalentPoints, type TalentRank, type TalentTree } from "@afallon/contracts/public";
import { placedRules } from "../placed-rules";
import { displayName, withoutMarkup } from "../text";
import { baseDocument, type DocumentProjectionInput, optionalFactRef, pushIndex, type ReferenceResolver, requirementsFor } from "./projection";

/**
 * The classes with a page that start with each item, in class native id order. A class that no race offers has no page,
 * so no player can start with its gear.
 */
export function startingGearByItem(entities: readonly CatalogEntityRow[], facts: CatalogFacts, refs: ReadonlyMap<string, EntityRef>): ReadonlyMap<string, readonly EntityRef[]> {
  const nativeIds = new Map(entities.map((entity) => [entity.entityKey, entity.nativeId]));
  const classes = facts.progression.facts.flatMap((fact) => fact.kind === "classes" ? [fact] : [])
    .sort((left, right) => (nativeIds.get(left.entityKey) ?? 0) - (nativeIds.get(right.entityKey) ?? 0));
  const result = new Map<string, EntityRef[]>();
  for (const fact of classes) {
    const classRef = refs.get(fact.entityKey);
    if (classRef?.kind !== "classes" || classRef.slug === undefined) continue;
    for (const itemKey of new Set(fact.details.startItems.map((row) => row.item.entityKey))) pushIndex(result, itemKey, classRef);
  }
  return result;
}

// A talent tree row has the anchor `talent-<tree id>-<node index>`, so a requirement or an ability page can link it.
function talentAnchor(treeKey: string, nodeIndex: number): string {
  return `talent-${treeKey.slice(treeKey.indexOf(":") + 1)}-${nodeIndex}`;
}

// The trees of a class in authored order, with the anchor of each passive talent. A talent that appears in several trees
// of the game appears once in a class, so a reference on the class page resolves to the row of that class.
function classTalents(classKey: string, input: DocumentProjectionInput) {
  const progression = input.facts.progression;
  const trees = progression.links.filter((link) => link.owner === classKey && link.linkKind === "talentTree" && link.target.entityKey !== null).sort((a, b) => a.linkIndex - b.linkIndex);
  const anchors = new Map<string, string>();
  for (const tree of trees) for (const node of progression.talentNodes) if (node.tree === tree.target.entityKey && node.target?.entityKey && !anchors.has(node.target.entityKey)) anchors.set(node.target.entityKey, talentAnchor(node.tree, node.nodeIndex));
  return { trees, anchors };
}

// Resolves a talent to its row on the page of its class. Other references resolve as everywhere else.
function talentResolver(classRef: Ref, anchors: ReadonlyMap<string, string>, input: DocumentProjectionInput): ReferenceResolver {
  return (endpoint) => {
    const anchor = endpoint.entityKey === null || !endpoint.entityKey.startsWith("bonuses:") ? undefined : anchors.get(endpoint.entityKey);
    if (anchor === undefined || !isEntityRef(classRef) || classRef.slug === undefined) return input.resolve(endpoint);
    return { key: classRef.key, kind: classRef.kind, name: displayName(endpoint.label ?? ""), slug: classRef.slug, variant: anchor };
  };
}

// The published classes that learn one of the abilities, as the auto attack or through a talent tree node.
export function learnersOf(abilityKeys: ReadonlySet<string>, input: DocumentProjectionInput, conditions: ReadonlyMap<string, CatalogCondition>): LearnerRow[] {
  const progression = input.facts.progression, rows: LearnerRow[] = [], seen = new Set<string>();
  for (const learner of progression.learners) {
    if (!abilityKeys.has(learner.ability) || learner.owner.entityKey === null) continue;
    const classRef = input.resolve(learner.owner);
    if (!isEntityRef(classRef) || classRef.kind !== "classes" || classRef.slug === undefined) continue;
    if (learner.via === "autoAttack") {
      const key = `${classRef.key}|auto`;
      if (!seen.has(key)) { seen.add(key); rows.push({ class: classRef, via: "autoAttack", requirements: [] }); }
      continue;
    }
    if (learner.via !== "talentTree" || learner.source?.entityKey == null) continue;
    const node = progression.talentNodes.find((candidate) => candidate.tree === learner.source?.entityKey && candidate.target?.entityKey === learner.ability && candidate.tier === learner.tier && candidate.row === learner.row);
    if (!node) continue;
    const key = `${classRef.key}|${node.tree}|${node.nodeIndex}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const { anchors } = classTalents(classRef.key, input);
    const requirements = node.conditionId === null ? [] : requirementsFor([node.conditionId], conditions, talentResolver(classRef, anchors, input));
    rows.push({ class: classRef, via: "talentTree", tree: displayName(learner.source.label), tier: Math.max(0, node.tier), talent: { ...classRef, variant: talentAnchor(node.tree, node.nodeIndex) }, requirements });
  }
  return rows;
}

function talentRank(rank: { rank: number; statEffects: readonly { stat: CatalogEndpoint; amount: number; isPercent: boolean }[]; emptyTooltip: string | null }, input: DocumentProjectionInput): TalentRank {
  const text = rank.statEffects.length === 0 && rank.emptyTooltip ? withoutMarkup(rank.emptyTooltip).trim() : "";
  return { rank: Math.max(0, rank.rank) + 1, stats: rank.statEffects.map((row) => ({ stat: input.resolve(row.stat), amount: row.amount, isPercent: row.isPercent })), text: text ? [{ spans: [{ text, tone: null, italic: false }] }] : [] };
}

// The level cap of a level template: the game stops experience at the template's `levels` value.
function templateCap(template: CatalogEndpoint | null | undefined, input: DocumentProjectionInput): number | undefined {
  const fact = template?.entityKey ? input.facts.progression.facts.find((candidate) => candidate.entityKey === template.entityKey) : undefined;
  return fact?.kind === "levels" && fact.details.levels > 0 ? fact.details.levels : undefined;
}

export function projectClass(entity: CatalogEntityRow, ref: EntityRef, input: DocumentProjectionInput, conditions: ReadonlyMap<string, CatalogCondition>): PublicClass {
  const progression = input.facts.progression, facts = new Map(progression.facts.map((fact) => [fact.entityKey, fact]));
  const fact = facts.get(entity.entityKey), details = fact?.kind === "classes" ? fact.details : undefined;
  const { trees, anchors } = classTalents(entity.entityKey, input), resolve = talentResolver(ref, anchors, input);
  const projectedTrees: TalentTree[] = trees.map((link) => {
    const treeKey = link.target.entityKey!, tree = facts.get(treeKey), points = tree?.kind === "talentTrees" ? tree.details.treePoint : null;
    const nodes = progression.talentNodes.filter((node) => node.tree === treeKey && node.target?.entityKey).sort((a, b) => a.tier - b.tier || a.row - b.row || a.nodeIndex - b.nodeIndex);
    return {
      anchor: `tree-${treeKey.slice(treeKey.indexOf(":") + 1)}`, name: displayName(link.target.label), ...(points?.label ? { points: displayName(points.label) } : {}),
      rows: nodes.map((node) => {
        const target = node.target!, bonus = node.nodeType === "bonus" ? facts.get(target.entityKey!) : undefined;
        const ranks = bonus?.kind === "bonuses" ? bonus.details.ranks : [];
        return {
          anchor: talentAnchor(treeKey, node.nodeIndex), tier: Math.max(0, node.tier), position: Math.max(0, node.row), name: displayName(target.label),
          ...(node.nodeType === "ability" ? { ability: input.resolve(target) } : {}), ranks: Math.max(1, ranks.length),
          ...(ranks[0] ? { first: talentRank(ranks[0], input) } : {}), ...(ranks.length > 1 ? { last: talentRank(ranks.at(-1)!, input) } : {}),
          requirements: node.conditionId === null ? [] : requirementsFor([node.conditionId], conditions, resolve),
        };
      }),
    };
  });
  // Talent points that no rule grants and that have no start amount carry no information.
  const pointKeys = [...new Set(trees.flatMap((link) => { const tree = facts.get(link.target.entityKey!); return tree?.kind === "talentTrees" && tree.details.treePoint?.entityKey ? [tree.details.treePoint.entityKey] : []; }))];
  const talentPoints = pointKeys.flatMap((key): TalentPoints[] => {
    const point = facts.get(key);
    if (point?.kind !== "treePoints") return [];
    const gains = point.details.gainRules.filter((rule) => rule.class === null || rule.class.entityKey === entity.entityKey).flatMap((rule): TalentPoints["gains"] => {
      const trigger = rule.trigger.name;
      return trigger === "characterLevelUp" || trigger === "skillLevelUp" || trigger === "npcKilled" || trigger === "itemGained" || trigger === "weaponTemplateLevelUp" ? [{ trigger, amount: Math.max(0, rule.amount) }] : [];
    });
    return gains.length === 0 && point.details.startAmount <= 0 ? [] : [{ name: displayName(point.name ?? ""), start: Math.max(0, point.details.startAmount), max: Math.max(0, point.details.maxPoints), gains }];
  });
  const races = progression.facts.flatMap((race) => race.kind === "races" && race.details.offeredClasses.some((row) => row.entityKey === entity.entityKey) ? [displayName(race.name ?? "")] : []).filter(Boolean);
  const highestLevel = templateCap(details?.levelTemplate, input);
  const autoAttack = optionalFactRef(input.resolve, details?.autoAttackAbility);
  return {
    ...baseDocument(entity, ref, input),
    facts: { races, weapons: [...(input.classWeapons?.get(entity.entityKey) ?? [])], ...(autoAttack ? { autoAttack } : {}), talentPoints, ...(highestLevel === undefined ? {} : { highestLevel }) },
    trees: projectedTrees,
    startingGear: (details?.startItems ?? []).map((row) => ({ item: input.resolve(row.item), count: Math.max(0, row.count), equipped: row.equipped })),
    placedRules: placedRules(input.facts, "classes", { entityKey: entity.entityKey }, input.resolve),
  };
}
