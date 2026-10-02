import type { CatalogCondition, CatalogFacts } from "@afallon/contracts/catalog";

export interface TalentWebTreeInput {
  treeKey: string;
  tiers: number;
  nodes: Array<{ nodeIndex: number; nodeType: string; tier: number; row: number; requires: number[] }>;
}
export interface TalentWebLayout {
  wedges: Array<{ treeKey: string; angle: number; width: number }>;
  nodes: Array<{ treeKey: string; nodeIndex: number; x: number; y: number }>;
  edges: Array<{ treeKey: string; source: number; target: number; points: Array<[number, number]> }>;
}

// TalentWebPanel settings captured in local/research/runtime-20261002/talent-web-layout.data.json.
const RING_START = 300;
const RING_STEP = 185;
const NODE_ARC = 145;
const WEDGE_GAP_DEGREES = 20;
const NODE_SIZE = 100;

/** TalentWebPanel.BuildWeb (RVA a781d0) retains trees with positive tiers, valid slots and nonempty nodes. */
export function talentWebInputs(classKey: string, facts: CatalogFacts, conditions: ReadonlyMap<string, CatalogCondition>): TalentWebTreeInput[] {
  const progression = facts.progression;
  const trees = new Map(progression.facts.flatMap((fact) => fact.kind === "talentTrees" ? [[fact.entityKey, fact.details] as const] : []));
  return progression.links.filter((link) => link.owner === classKey && link.linkKind === "talentTree" && link.target.entityKey !== null)
    .sort((a, b) => a.linkIndex - b.linkIndex).flatMap((link): TalentWebTreeInput[] => {
      const treeKey = link.target.entityKey!, tree = trees.get(treeKey);
      const nodes = progression.talentNodes.filter((node) => node.tree === treeKey).sort((a, b) => a.nodeIndex - b.nodeIndex);
      if (!tree || tree.tiers <= 0 || tree.slotsPerTier < 0 || nodes.length === 0) return [];
      const byEntry = new Map(nodes.filter((node) => node.target?.entityKey).map((node) => [`${node.nodeType}:${node.target!.entityKey}`, node.nodeIndex]));
      return [{ treeKey, tiers: tree.tiers, nodes: nodes.map((node) => {
        const condition = node.conditionId === null ? undefined : conditions.get(node.conditionId);
        if (node.conditionId !== null && !condition) throw new Error(`Missing catalog condition ${node.conditionId}.`);
        const requires = new Set<number>();
        for (const group of condition?.requirements ?? []) for (const requirement of group.requirements) {
          if (requirement.knowledge?.value !== 0) continue;
          const type = ({ Ability: "ability", Bonus: "bonus", Recipe: "recipe", Resource: "resourceNode" } as Record<string, string>)[requirement.type.name ?? ""];
          const key = type && ({ ability: requirement.references.ability, bonus: requirement.references.bonus, recipe: requirement.references.recipe, resourceNode: requirement.references.resource } as const)[type as "ability"]?.entityKey;
          const source = key === null || key === undefined ? undefined : byEntry.get(`${type}:${key}`);
          if (source !== undefined && source !== node.nodeIndex) requires.add(source);
        }
        return { nodeIndex: node.nodeIndex, nodeType: node.nodeType, tier: node.tier, row: node.row, requires: [...requires] };
      }) }];
    });
}

// System.Random(int seed), used by TalentWebLayout.Build (RVA a75210) for Fisher–Yates restarts.
// The game's Mono-compatible seeded implementation uses the subtractive 56-slot generator.
function seededRandom(seed: number): (max: number) => number {
  const large = 2147483647;
  const seeds = new Array<number>(56).fill(0);
  let mj = 161803398 - (seed === -2147483648 ? large : Math.abs(seed)), mk = 1;
  seeds[55] = mj;
  for (let i = 1; i < 55; i++) {
    const index = 21 * i % 55;
    seeds[index] = mk;
    mk = mj - mk;
    if (mk < 0) mk += large;
    mj = seeds[index]!;
  }
  for (let pass = 0; pass < 4; pass++) for (let i = 1; i < 56; i++) {
    seeds[i] = seeds[i]! - seeds[1 + (i + 30) % 55]!;
    if (seeds[i]! < 0) seeds[i] = seeds[i]! + large;
  }
  let inext = 0, inextp = 21;
  return (max: number): number => {
    if (++inext >= 56) inext = 1;
    if (++inextp >= 56) inextp = 1;
    let value = seeds[inext]! - seeds[inextp]!;
    if (value === large) value--;
    if (value < 0) value += large;
    seeds[inext] = value;
    return Math.floor(value / large * max);
  };
}

export function talentWebLayout(trees: TalentWebTreeInput[]): TalentWebLayout {
  const result: TalentWebLayout = { wedges: [], nodes: [], edges: [] };
  const width = 360 / trees.length - WEDGE_GAP_DEGREES;
  for (let t = 0; t < trees.length; t++) {
    const tree = trees[t]!;
    const angle = 90 - t * (360 / trees.length);
    result.wedges.push({ treeKey: tree.treeKey, angle, width });
    const byIndex = new Map(tree.nodes.map((node) => [node.nodeIndex, node]));
    const depth = new Map<number, number>();
    const visiting = new Set<number>();
    const layer = (index: number): number => {
      if (depth.has(index)) return depth.get(index)!;
      if (visiting.has(index)) throw new Error(`Cyclic talent requirements in ${tree.treeKey}.`);
      visiting.add(index);
      const sources = byIndex.get(index)?.requires.filter((source) => byIndex.has(source)) ?? [];
      const value = sources.length ? Math.max(...sources.map(layer)) + 1 : 0;
      depth.set(index, value);
      visiting.delete(index);
      return value;
    };
    for (const node of tree.nodes) layer(node.nodeIndex);
    // Build inserts a separate virtual node at every intermediate level of a long link.
    // They take part in crossing minimization and spacing, but not in the public node list.
    const layers: number[][] = [];
    for (const node of tree.nodes) (layers[depth.get(node.nodeIndex)!] ??= []).push(node.nodeIndex);
    for (const group of layers) group?.sort((a, b) => byIndex.get(a)!.row - byIndex.get(b)!.row || a - b);
    let nextVirtual = Math.max(-1, ...tree.nodes.map((node) => node.nodeIndex)) + 1;
    const paths: Array<{ source: number; target: number; ids: number[] }> = [];
    const links: Array<[number, number]> = [];
    for (const target of tree.nodes) for (const source of target.requires) {
      if (!byIndex.has(source)) continue;
      const ids = [source];
      for (let level = depth.get(source)! + 1; level < depth.get(target.nodeIndex)!; level++) {
        const virtual = nextVirtual++;
        (layers[level] ??= []).push(virtual);
        depth.set(virtual, level);
        ids.push(virtual);
      }
      ids.push(target.nodeIndex);
      paths.push({ source, target: target.nodeIndex, ids });
      for (let i = 1; i < ids.length; i++) links.push([ids[i - 1]!, ids[i]!]);
    }
    const crossingPositions = new Int32Array(nextVirtual), sweepPositions = new Int32Array(nextVirtual);
    const sweepKeys = new Float64Array(nextVirtual);
    const crossings = (order: number[][]): number => {
      for (const group of order) for (let index = 0; index < group.length; index++) crossingPositions[group[index]!] = index;
      let count = 0;
      for (let i = 0; i < links.length; i++) for (let j = i + 1; j < links.length; j++) {
        const [a, b] = links[i]!, [c, d] = links[j]!;
        if (depth.get(a) === depth.get(c) && (crossingPositions[a]! - crossingPositions[c]!) * (crossingPositions[b]! - crossingPositions[d]!) < 0) count++;
      }
      return count;
    };
    let best = layers.map((group) => [...group]);
    let bestCrossings = crossings(best);
    const treeId = Number(tree.treeKey.slice(tree.treeKey.lastIndexOf(":") + 1));
    const random = seededRandom(treeId);
    for (let restart = 0; restart < 30 && bestCrossings > 0; restart++) {
      const order = best.map((group) => [...group]);
      if (restart > 0) for (const group of order) for (let remaining = group.length; remaining > 1; remaining--) {
        const index = random(remaining);
        [group[remaining - 1], group[index]] = [group[index]!, group[remaining - 1]!];
      }
      for (let pass = 0; pass < 20; pass++) {
        for (let direction = 0; direction < 2; direction++) {
          for (const group of order) for (let position = 0; position < group.length; position++) sweepPositions[group[position]!] = position;
          for (let index = 0; index < order.length; index++) {
            const level = direction === 0 ? index : order.length - index - 1;
            const group = order[level]!;
            for (let position = 0; position < group.length; position++) {
              const id = group[position]!;
              let total = 0, count = 0;
              for (const [a, b] of links) {
                if (direction === 0 && b === id) { total += sweepPositions[a]!; count++; }
                else if (direction === 1 && a === id) { total += sweepPositions[b]!; count++; }
              }
              sweepKeys[id] = count ? total / count : position;
            }
            group.sort((a, b) => sweepKeys[a]! - sweepKeys[b]!);
            for (let position = 0; position < group.length; position++) sweepPositions[group[position]!] = position;
          }
        }
        let score = crossings(order), improved = true;
        while (improved) {
          improved = false;
          for (const group of order) for (let index = 0; index + 1 < group.length; index++) {
            [group[index], group[index + 1]] = [group[index + 1]!, group[index]!];
            const candidate = crossings(order);
            if (candidate < score) { score = candidate; improved = true; }
            else [group[index], group[index + 1]] = [group[index + 1]!, group[index]!];
          }
        }
        if (score < bestCrossings) { bestCrossings = score; best = order.map((group) => [...group]); }
        if (bestCrossings === 0) break;
      }
    }
    const positions = new Map<number, [number, number]>();
    let radius = 0;
    const spacing = Math.max(NODE_ARC, NODE_SIZE * 1.5);
    const radians = angle * Math.PI / 180;
    for (const group of best) {
      if (!group?.length) continue;
      const half = (group.length - 1) * spacing / 2;
      radius = Math.max(radius ? radius + RING_STEP : RING_START, (half + NODE_SIZE * .75) / Math.tan(width * Math.PI / 360));
      for (let i = 0; i < group.length; i++) {
        const lateral = half - i * spacing;
        const x = Math.cos(radians) * radius + Math.sin(radians) * lateral;
        const y = Math.sin(radians) * radius - Math.cos(radians) * lateral;
        positions.set(group[i]!, [x, y]);
        if (byIndex.has(group[i]!)) result.nodes.push({ treeKey: tree.treeKey, nodeIndex: group[i]!, x, y });
      }
    }
    for (const { source, target, ids } of paths) result.edges.push({ treeKey: tree.treeKey, source, target, points: ids.map((id) => positions.get(id)!) });
    for (const node of tree.nodes) if (!node.requires.length) {
      result.edges.push({ treeKey: tree.treeKey, source: -1, target: node.nodeIndex, points: [[0, 0], positions.get(node.nodeIndex)!] });
    }
  }
  return result;
}
