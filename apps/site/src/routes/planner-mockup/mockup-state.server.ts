// Throwaway mockup data: a plausible Druid build computed from the real class document and planner payload.
import type { PublicClass, StaticPlanner, TalentRow } from '@afallon/contracts/public';
import { serverMapLoader } from '$lib/server/publication';

export type MockOrderRow = { anchor: string; name: string; icon?: { url: string }; rank: number; ranks: number; tree: string; level: number; cost: number };
export type MockRun = { anchor: string; name: string; icon?: { url: string }; from: number; to: number; ranks: number; tree: string; fromLevel: number; toLevel: number };
const requirementPattern = /^(.*) (?:learned|rank (\d+) or higher)$/;

export async function loadMockup() {
  const loader = serverMapLoader();
  const page = await loader.loadDocument('classes', 'druid');
  if (page.kind !== 'classes') throw new Error('Druid missing');
  const doc: PublicClass = page.document;
  const planner: StaticPlanner = await loader.loadPlanner();
  const level = 24;
  const total = 1 + 3 * (level - 1);

  const payloadNode = (anchor: string) => {
    const [, tree, index] = anchor.match(/^talent-(\d+)-(\d+)$/)!;
    return planner.trees.find((entry) => entry.key === `talentTrees:${tree}`)?.nodes.find((node) => node.index === Number(index));
  };
  const learned = new Map<string, number>();
  const byName = new Map<string, TalentRow>();
  for (const tree of doc.trees) for (const row of tree.rows) {
    byName.set(row.name, row);
    const node = payloadNode(row.anchor);
    if (node?.defaultRank) learned.set(row.anchor, node.defaultRank);
  }
  const rankOf = (name: string) => { const row = byName.get(name); return row ? learned.get(row.anchor) ?? 0 : 0; };
  const met = (row: TalentRow) => row.requirements.every((group) => {
    const checks = group.requirements.map((requirement) => {
      const match = requirement.label.match(requirementPattern);
      return match ? rankOf(match[1]!) >= Number(match[2] ?? 1) : true;
    });
    return group.mode === 'all' ? checks.every(Boolean) : checks.some(Boolean);
  });

  const order: MockOrderRow[] = [];
  let spent = 0;
  const treeSpent = new Map<string, number>();
  function allocate(treeName: string, budget: number, caps: Record<string, number>) {
    const tree = doc.trees.find((entry) => entry.name === treeName)!;
    const rows = [...tree.rows].sort((a, b) => a.tier - b.tier || a.position - b.position);
    let used = 0, progress = true;
    while (progress && used < budget) {
      progress = false;
      for (const row of rows) {
        const cap = Math.min(caps[row.name] ?? row.ranks, row.ranks);
        const node = payloadNode(row.anchor);
        while ((learned.get(row.anchor) ?? 0) < cap && met(row) && used < budget) {
          const rank = (learned.get(row.anchor) ?? 0) + 1;
          const cost = node?.ranks[rank - 1]?.authoredCost ?? 1;
          learned.set(row.anchor, rank);
          used += cost; spent += cost; progress = true;
          const level = spent <= 1 ? 1 : Math.ceil((spent - 1) / 3) + 1;
          const icon = (row.ability && 'icon' in row.ability ? row.ability.icon : undefined) ?? row.icon;
          order.push({ anchor: row.anchor, name: row.name, icon, rank, ranks: row.ranks, tree: tree.name, level, cost });
        }
      }
    }
    treeSpent.set(treeName, used);
  }
  allocate('Stellar Balance', 31, { 'Stellar Focus': 2 });
  allocate('Verdant Restoration', 12, {});

  const selected = byName.get('Stellar Focus')!;
  const selectedNode = payloadNode(selected.anchor)!;
  const statAmount = (rank: number) => (selectedNode.ranks[rank - 1]?.rawData as { statEffects?: { amount: number }[] } | undefined)?.statEffects?.[0]?.amount;
  const runs: MockRun[] = [];
  for (const row of order) {
    const last = runs.at(-1);
    if (last && last.anchor === row.anchor) { last.to = row.rank; last.toLevel = row.level; }
    else runs.push({ anchor: row.anchor, name: row.name, icon: row.icon, from: row.rank, to: row.rank, ranks: row.ranks, tree: row.tree, fromLevel: row.level, toLevel: row.level });
  }
  const classOptions = (await loader.loadList('classes')).rows.map((entry) => ({ name: entry.ref.name, icon: 'icon' in entry.ref ? (entry.ref as { icon?: { url: string } }).icon : undefined }));
  return {
    doc,
    level,
    total,
    runs,
    classOptions,
    spent,
    treeSpent: Object.fromEntries(treeSpent),
    learned: Object.fromEntries(learned),
    order,
    selected: {
      anchor: selected.anchor,
      name: selected.name,
      icon: selected.icon,
      ranks: selected.ranks,
      rank: learned.get(selected.anchor) ?? 0,
      current: statAmount(learned.get(selected.anchor) ?? 0),
      next: statAmount((learned.get(selected.anchor) ?? 0) + 1),
      requirement: selected.requirements[0]?.requirements[0]?.label,
    },
  };
}
