import type { CatalogCondition, CatalogEndpoint, CatalogFacts, CatalogGatheringNode, CatalogRelations } from "@afallon/contracts/catalog";
import type { NodeYieldRow, PlacedNodeGroup, PlacementRef, PublicGatheringNode, Ref, SpawnerExample, SpawnerGroup } from "@afallon/contracts/public";
import type { ReferenceResolver } from "./documents";
import { displayName } from "./text";
import { placedRules } from "./placed-rules";

type Resolve = ReferenceResolver;
type Requirements = (conditionIds: readonly string[]) => PublicGatheringNode["facts"]["requirements"];

/**
 * The reader name of each gathering node. Two nodes that share a name are variants: each takes the name of its loot table
 * without the shared node name as a qualifier, such as "Fishing Hole (Cave Coalway)", or else its position.
 */
export function gatheringNodeNames(nodes: readonly CatalogGatheringNode[]): ReadonlyMap<string, string> {
  const byName = new Map<string, CatalogGatheringNode[]>();
  for (const node of nodes) byName.set(displayName(node.name), [...byName.get(displayName(node.name)) ?? [], node]);
  const result = new Map<string, string>();
  for (const [name, group] of byName) {
    if (group.length === 1) { result.set(group[0]!.entityKey, name); continue; }
    const qualifiers = group.map((node) => {
      const table = displayName(node.lootTable?.label ?? "");
      return table.toLowerCase().startsWith(`${name.toLowerCase()} `) ? table.slice(name.length + 1) : table;
    });
    const distinct = qualifiers.every((qualifier) => qualifier !== "") && new Set(qualifiers).size === qualifiers.length;
    group.forEach((node, index) => result.set(node.entityKey, `${name} (${distinct ? qualifiers[index] : `Variant ${index + 1}`})`));
  }
  return result;
}


type SpawnerSource = CatalogGatheringNode["sources"][number] & { spawner: NonNullable<CatalogGatheringNode["sources"][number]["spawner"]> };

/**
 * Spawners grouped by their skill, timing, and complete option list. Each group counts its spawners and lists the published
 * placement of each.
 */
export function spawnerGroups(nodes: readonly CatalogGatheringNode[], resolve: Resolve, placements: ReadonlyMap<string, PlacementRef>): ReadonlyMap<string, SpawnerGroup & { nodeKeys: ReadonlySet<string> }> {
  const bySpawner = new Map<string, Array<SpawnerSource & { nodeKey: string }>>();
  for (const node of nodes) for (const source of node.sources) {
    if (source.sourceKind !== "spawner-option" || source.spawner === null) continue;
    bySpawner.set(source.sourceId, [...bySpawner.get(source.sourceId) ?? [], { ...source, spawner: source.spawner, nodeKey: node.entityKey }]);
  }
  const groups = new Map<string, SpawnerGroup & { nodeKeys: Set<string> }>();
  for (const options of bySpawner.values()) {
    options.sort((left, right) => (left.optionIndex ?? 0) - (right.optionIndex ?? 0));
    const first = options[0]!.spawner;
    const facts = {
      ...(first.skill?.entityKey ? { skill: resolve(first.skill) } : {}), skillCap: Math.max(0, first.skillCap), respawnSeconds: first.respawnTime, jitterSeconds: first.respawnJitter,
      despawnSeconds: first.despawnDelay, playerRange: first.playerRange,
      options: options.map((option) => ({ node: resolve({ entityKey: option.nodeKey, label: option.nodeKey }), lowSkillWeight: option.spawner.weightAtLowSkill, highSkillWeight: option.spawner.weightAtHighSkill, teaserWeight: option.spawner.teaserWeight })),
    };
    const key = JSON.stringify(facts);
    const group = groups.get(key) ?? { ...facts, spawners: 0, placements: [], unplaced: 0, nodeKeys: new Set<string>() };
    group.spawners += 1;
    const placement = options[0]!.placementId === null ? undefined : placements.get(options[0]!.placementId);
    if (placement) group.placements.push({ placementId: placement.placementId, mapSpaceId: placement.mapSpaceId, label: placement.label });
    else group.unplaced += 1;
    for (const option of options) group.nodeKeys.add(option.nodeKey);
    groups.set(key, group);
  }
  return groups;
}

function placedGroups(node: CatalogGatheringNode, placements: ReadonlyMap<string, PlacementRef>): PlacedNodeGroup[] {
  const groups = new Map<number, PlacedNodeGroup>();
  for (const source of node.sources) {
    if (source.sourceKind !== "placed-object" || source.cooldown === null) continue;
    const group = groups.get(source.cooldown) ?? { cooldownSeconds: source.cooldown, objects: 0, placements: [], unplaced: 0 };
    group.objects += 1;
    const placement = source.placementId === null ? undefined : placements.get(source.placementId);
    if (placement) group.placements.push({ placementId: placement.placementId, mapSpaceId: placement.mapSpaceId, label: placement.label });
    else group.unplaced += 1;
    groups.set(source.cooldown, group);
  }
  return [...groups.values()].sort((left, right) => left.cooldownSeconds - right.cooldownSeconds);
}

/** The placed-object source of each gathering node, by source id, for item rows that come from a scene object. */
export function placedNodeBySource(nodes: readonly CatalogGatheringNode[]): ReadonlyMap<string, string> {
  return new Map(nodes.flatMap((node) => node.sources.filter((source) => source.sourceKind === "placed-object").map((source) => [source.sourceId, node.entityKey] as const)));
}


/**
 * The gathering node documents. A node's yields are the items of its loot table from its spawner options and its placed
 * objects, with their authored count range and chance.
 */
export function projectGatheringNodeDocuments(facts: CatalogFacts, relations: CatalogRelations, input: {
  resolve: Resolve; requirements: Requirements; conditions: ReadonlyMap<string, CatalogCondition>; placements: ReadonlyMap<string, PlacementRef>;
}): ReadonlyMap<string, PublicGatheringNode> {
  const groups = [...spawnerGroups(facts.gatheringNodes, input.resolve, input.placements).values()];
  const placedBySource = placedNodeBySource(facts.gatheringNodes);
  const yields = new Map<string, Map<string, NodeYieldRow>>();
  const addYield = (nodeKey: string, row: { item: CatalogEndpoint; min: number | null; max: number | null; rawRate: number | null }) => {
    const value: NodeYieldRow = { counterpart: input.resolve(row.item), ...(countOf(row.min) === undefined ? {} : { min: countOf(row.min) }), ...(countOf(row.max) === undefined ? {} : { max: countOf(row.max) }), ...(chanceOf(row.rawRate) === undefined ? {} : { chance: chanceOf(row.rawRate) }) };
    const rows = yields.get(nodeKey) ?? new Map<string, NodeYieldRow>();
    rows.set(JSON.stringify(value), value);
    yields.set(nodeKey, rows);
  };
  for (const row of relations.gathers) if (row.gatheringNode?.entityKey) addYield(row.gatheringNode.entityKey, row);
  for (const row of relations.interactions) { const nodeKey = placedBySource.get(row.sourceId); if (nodeKey) addYield(nodeKey, row); }
  const result = new Map<string, PublicGatheringNode>();
  for (const node of facts.gatheringNodes) {
    const ref = input.resolve({ entityKey: node.entityKey, label: node.name });
    if (ref.key === null || !("slug" in ref) || !ref.slug) throw new Error(`Gathering node ${node.entityKey} has no page reference.`);
    const kinds = new Set(node.sources.map((source) => source.sourceKind));
    const gate = requiredLevel(node, input.conditions) ?? 1;
    const skill = node.skill?.entityKey ? facts.progression.facts.find((fact) => fact.kind === "skills" && fact.entityKey === node.skill!.entityKey) : undefined;
    const highest = skill?.kind === "skills" && skill.details.maxLevel > 0 ? skill.details.maxLevel : undefined;
    const yieldLevels = highest === undefined || highest === gate ? [gate] : [gate, highest];
    result.set(node.entityKey, {
      ref, description: null, art: {},
      facts: {
        ...(node.skill?.entityKey ? { skill: input.resolve(node.skill) } : {}),
        ...(requiredLevel(node, input.conditions) === undefined ? {} : { requiredLevel: requiredLevel(node, input.conditions) }),
        ...(countOf(node.skillExperience) === undefined ? {} : { skillExperience: countOf(node.skillExperience) }),
        ...(countOf(node.characterExperience) === undefined ? {} : { characterExperience: countOf(node.characterExperience) }),
        requirements: node.conditionId === null ? [] : input.requirements([node.conditionId]), variant: node.variant,
      },
      yields: [...(yields.get(node.entityKey)?.values() ?? [])].sort((left, right) => refName(left.counterpart).localeCompare(refName(right.counterpart))),
      spawners: groups.filter((group) => group.nodeKeys.has(node.entityKey)).map(({ nodeKeys: _nodeKeys, ...group }) => group).sort((left, right) => right.spawners - left.spawners),
      placed: placedGroups(node, input.placements),
      placedRules: placedRules(facts, "gatheringNodes", { entityKey: node.entityKey, sourceKinds: kinds, yieldLevels }, input.resolve),
    });
  }
  return result;
}

/** The most common spawner group of each gathering skill, as the mechanics page's example of weighted selection. */
export function spawnerExamples(nodes: readonly CatalogGatheringNode[], resolve: Resolve, placements: ReadonlyMap<string, PlacementRef>): SpawnerExample[] {
  const bySkill = new Map<string, SpawnerExample>();
  for (const { nodeKeys: _nodeKeys, placements: _placements, unplaced: _unplaced, ...group } of spawnerGroups(nodes, resolve, placements).values()) {
    const skill = group.skill && group.skill.key !== null ? group.skill.key : "";
    const current = bySkill.get(skill);
    if (!current || group.spawners > current.spawners) bySkill.set(skill, group);
  }
  return [...bySkill.values()].sort((left, right) => refName(left.skill).localeCompare(refName(right.skill)));
}

/** The level of the node's requirement on its own skill, when its condition has one. */
export function requiredLevel(node: CatalogGatheringNode, conditions: ReadonlyMap<string, CatalogCondition>): number | undefined {
  if (node.conditionId === null || !node.skill?.entityKey) return undefined;
  const condition = conditions.get(node.conditionId);
  if (!condition) throw new Error(`Missing catalog condition ${node.conditionId}.`);
  const levels = condition.requirements.flatMap((group) => group.requirements).filter((requirement) => requirement.type.name === "Skill" && requirement.references.skill?.entityKey === node.skill!.entityKey).map((requirement) => requirement.amounts.primary);
  return levels.length === 1 ? countOf(levels[0]!) : undefined;
}

function refName(ref: Ref | undefined): string {
  return ref === undefined ? "" : ref.key === null ? ref.label : ref.name;
}

function countOf(value: number | null): number | undefined {
  return value !== null && Number.isInteger(value) && value >= 0 ? value : undefined;
}

function chanceOf(value: number | null): number | undefined {
  return value !== null && Number.isFinite(value) && value >= 0 && value <= 100 ? value : undefined;
}

