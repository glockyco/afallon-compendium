import { HEROIC_TIER_KEY, type CatalogCondition, type CatalogEndpoint, type CatalogEntityRow, type CatalogFacts, type CatalogProgressionFact, type ProgressionBonusRank, type ProgressionPetStat, type ProgressionStat } from "@afallon/contracts/catalog";
import { type EntityRef, isEntityRef, type LearnerRow, type PublicClass, type Ref, type TalentPets, type TalentPoints, type TalentRank, type TalentTree, type TalentWeb } from "@afallon/contracts/public";
import { placedRules, topicRef } from "../placed-rules";
import { talentWebInputs, talentWebLayout } from "../talent-web";
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
/** The anchor of a talent tree on its class page. */
export function treeAnchor(treeKey: string): string {
  return `tree-${treeKey.slice(treeKey.indexOf(":") + 1)}`;
}

export function talentAnchor(treeKey: string, nodeIndex: number): string {
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
    // A passive talent shows its own icon, as its row does.
    const icon = input.artByEntity.get(endpoint.entityKey!)?.icon;
    return { key: classRef.key, kind: classRef.kind, name: displayName(endpoint.label ?? ""), slug: classRef.slug, variant: anchor, ...(icon ? { icon } : {}) };
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

// The pets that a pet stat change names, as the game's talent tooltip does. The game names every summon when the NPC of
// the change is missing. The catalog keeps no species names, so a species change is not published, and the tooltip
// coverage audit reports its rank.
function talentPets(change: ProgressionPetStat, input: DocumentProjectionInput): TalentPets | undefined {
  switch (change.targetType.name) {
    case "HunterBeast": return { kind: "beast" };
    case "SpecificNPC": return change.npc?.entityKey ? { kind: "npc", npc: input.resolve(change.npc) } : { kind: "summons" };
    case "AllPets": return { kind: "summons" };
    default: return undefined;
  }
}

function talentRank(rank: ProgressionBonusRank, input: DocumentProjectionInput): TalentRank {
  const text = rank.statEffects.length === 0 && rank.emptyTooltip ? withoutMarkup(rank.emptyTooltip).trim() : "";
  const stat = (change: ProgressionStat) => ({ stat: input.resolve(change.stat), amount: change.amount, isPercent: change.isPercent });
  // The changes to the same pets share one group, in the order of their first change. The game skips a pet change whose
  // stat is missing.
  const petStats = new Map<string, TalentRank["petStats"][number]>();
  for (const change of rank.petStatEffects) {
    const pets = change.stat.entityKey === null ? undefined : talentPets(change, input);
    if (pets === undefined) continue;
    const key = pets.kind === "npc" ? `npc:${change.npc?.entityKey}` : pets.kind, group = petStats.get(key);
    if (group) group.stats.push(stat(change));
    else petStats.set(key, { pets, stats: [stat(change)] });
  }
  return {
    rank: Math.max(0, rank.rank) + 1, stats: rank.statEffects.map(stat), petStats: [...petStats.values()],
    text: text ? [{ spans: [{ text, tone: null, italic: false }] }] : [],
  };
}

// The points that learning every rank of a talent node takes. Ranking up spends the next rank's `unlockCost` from the
// tree's points (`AbilityManager.RankUpAbility`, `BonusManager.RankUpBonus`). An ability that the class knows from the
// start already holds its first rank.
function nodeCost(fact: CatalogProgressionFact | undefined): number {
  if (fact?.kind !== "abilities" && fact?.kind !== "bonuses") return 0;
  const ranks = fact.kind === "abilities" && fact.details.learnedByDefault ? fact.details.ranks.slice(1) : fact.details.ranks;
  return ranks.reduce((sum, rank) => sum + Math.max(0, rank.unlockCost), 0);
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
  // The Heroic Tier guide explains how kills give Heroic Essence, the points of the Heroic trees.
  const heroic = facts.get(HEROIC_TIER_KEY);
  const essencePoint = heroic?.kind === "heroicTier" && progression.mechanicsRules.some((rule) => rule.topic === "heroic-tier") ? heroic.details.essenceTreePoint?.entityKey ?? undefined : undefined;
  const projectedTrees: TalentTree[] = trees.map((link) => {
    const treeKey = link.target.entityKey!, tree = facts.get(treeKey), points = tree?.kind === "talentTrees" ? tree.details.treePoint : null;
    const nodes = progression.talentNodes.filter((node) => node.tree === treeKey && node.target?.entityKey).sort((a, b) => a.tier - b.tier || a.row - b.row || a.nodeIndex - b.nodeIndex);
    return {
      anchor: treeAnchor(treeKey), name: displayName(link.target.label), ...(points?.label ? { points: displayName(points.label) } : {}),
      ...(points?.entityKey && points.entityKey === essencePoint ? { pointsGuide: { target: "tree-points", guide: topicRef("heroic-tier"), section: "essence" } } : {}),
      cost: nodes.reduce((sum, node) => sum + nodeCost(facts.get(node.target!.entityKey!)), 0),
      rows: nodes.map((node) => {
        const target = node.target!, bonus = node.nodeType === "bonus" ? facts.get(target.entityKey!) : undefined;
        const ranks = bonus?.kind === "bonuses" ? bonus.details.ranks : [];
        return {
          anchor: talentAnchor(treeKey, node.nodeIndex), tier: Math.max(0, node.tier), position: Math.max(0, node.row), name: displayName(target.label),
          ...(node.nodeType === "ability" ? { ability: input.resolve(target) } : {}),
          ...(node.nodeType === "bonus" && input.artByEntity.get(target.entityKey!)?.icon ? { icon: input.artByEntity.get(target.entityKey!)!.icon } : {}),
          ranks: Math.max(1, ranks.length),
          ...(ranks[0] ? { first: talentRank(ranks[0], input) } : {}), ...(ranks.length > 1 ? { last: talentRank(ranks.at(-1)!, input) } : {}),
          requirements: node.conditionId === null ? [] : requirementsFor([node.conditionId], conditions, resolve),
        };
      }),
    };
  });
  // The web lays the trees out as the game's talent screen does (talent-web.ts). It shows only talents with a row.
  const rowAnchors = new Set(projectedTrees.flatMap((tree) => tree.rows.map((row) => row.anchor)));
  const layout = talentWebLayout(talentWebInputs(entity.entityKey, input.facts, conditions));
  const web: TalentWeb | undefined = layout.wedges.length === 0 ? undefined : {
    wedges: layout.wedges.map((wedge) => ({ tree: treeAnchor(wedge.treeKey), angle: wedge.angle, width: wedge.width })),
    nodes: layout.nodes.flatMap((node) => { const talent = talentAnchor(node.treeKey, node.nodeIndex); return rowAnchors.has(talent) ? [{ talent, x: node.x, y: node.y }] : []; }),
    edges: layout.edges.flatMap((edge) => {
      const from = talentAnchor(edge.treeKey, edge.source), to = talentAnchor(edge.treeKey, edge.target);
      return rowAnchors.has(from) && rowAnchors.has(to) ? [{ from, to, points: edge.points.map(([x, y]) => [x, y] as [number, number]) }] : [];
    }),
  };
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
    ...(web ? { web } : {}),
    startingGear: (details?.startItems ?? []).map((row) => ({ item: input.resolve(row.item), count: Math.max(0, row.count), equipped: row.equipped })),
    placedRules: placedRules(input.facts, "classes", { entityKey: entity.entityKey }, input.resolve),
  };
}
