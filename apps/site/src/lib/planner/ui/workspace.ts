import type { PlannerNode, Ref, StaticPlanner, TalentWeb } from '@afallon/contracts/public';
import type { TalentWebTree } from '../../detail/sections/TalentWeb.svelte';
import { talentWebLayout } from '../../../../../../packages/publication/src/talent-web';
import type { PlannerBuild, TalentPurchase } from '../build';
import type { TalentEvaluator, TalentTree as PlannerTree } from '../talents';

export const treeAnchor = (key: string) => `plan-${key.replace(':', '-')}`;
export const nodeAnchor = (row: TalentPurchase) => `${treeAnchor(row.tree)}-${row.node}`;
export const statusText = (status: string) => status === 'verified' ? 'Verified' : status === 'blocked' ? 'Blocked' : 'Not Verified';
export function identityRef(identity: { key: string | null; name: string; icon?: Ref['icon']; ref?: Ref }): Ref {
  return identity.ref ?? { key: null, label: identity.name, ...(identity.icon ? { icon: identity.icon } : {}) };
}
export function newBuild(payload: StaticPlanner, race: string, characterClass: string, level: number): PlannerBuild {
  return { catalog: payload.catalogId, race, class: characterClass, level, points: [], talents: { kind: 'ordered', purchases: [] }, heroic: [], gear: [], party: { role: null, members: [] } };
}
/** Reuse the game's published layout algorithm, adapting route-scoped facts rather than fetching class pages. */
export function workspaceWeb(trees: readonly PlannerTree[], evaluator: TalentEvaluator, build: PlannerBuild): { trees: TalentWebTree[]; web: TalentWeb } {
  const scope = evaluator.scope(build);
  const requires = (tree: PlannerTree, node: PlannerNode): number[] => {
    const indices = new Set<number>();
    for (const group of node.purchaseCondition.groups ?? []) for (const raw of group?.requirements ?? []) {
      const knowledge = raw?.knowledge;
      if (!raw || !knowledge || typeof knowledge !== 'object' || !('name' in knowledge) || knowledge.name !== 'Known') continue;
      const target = raw.requirementType === 'Ability' ? `abilities:${raw.abilityID}` : raw.requirementType === 'Bonus' ? `bonuses:${raw.bonusID}` : null;
      for (const source of scope.targets.get(target ?? '') ?? []) if (source.tree.key === tree.key && source.node.index !== node.index) indices.add(source.node.index);
    }
    return [...indices];
  };
  const layout = talentWebLayout(trees.filter(tree => tree.key && tree.tiers !== null).map(tree => ({
    treeKey: tree.key!, tiers: tree.tiers!, nodes: tree.nodes.map(node => ({ nodeIndex: node.index, nodeType: node.kind, tier: node.tier, row: node.row,
      requires: requires(tree, node) })),
  })));
  const publicTrees: TalentWebTree[] = trees.map(tree => ({ anchor: treeAnchor(tree.key!), name: tree.name, rows: tree.nodes.map(node => ({
    anchor: nodeAnchor({ tree: tree.key!, node: node.index }), tier: node.tier, position: node.row, name: node.target.name,
    ...(node.target.ref?.kind === 'abilities' ? { ability: node.target.ref } : {}),
    ranks: node.rankLimit ?? node.ranks.length, ...(node.target.icon ? { icon: node.target.icon } : {}), requirements: [],
  })) }));
  return { trees: publicTrees, web: {
    wedges: layout.wedges.map(row => ({ tree: treeAnchor(row.treeKey), angle: row.angle, width: row.width })),
    nodes: layout.nodes.map(row => ({ talent: nodeAnchor({ tree: row.treeKey, node: row.nodeIndex }), x: row.x, y: row.y })),
    edges: layout.edges.map(row => ({ from: row.source === -1 ? treeAnchor(row.treeKey) : nodeAnchor({ tree: row.treeKey, node: row.source }), to: nodeAnchor({ tree: row.treeKey, node: row.target }), points: row.points })),
  } };
}
export function requirementLabel(raw: Record<string, unknown> | null, node: PlannerNode | undefined): string {
  if (!raw) return 'Requirement not recorded';
  if (raw.requirementType !== 'Ability' && raw.requirementType !== 'Bonus') return 'Purchase rule not verified';
  const enumName = (value: unknown) => value && typeof value === 'object' && 'name' in value ? String(value.name) : '';
  const knowledge = enumName(raw.knowledge);
  if (knowledge !== 'Known' && knowledge !== 'Unknown') return 'Knowledge requirement not verified';
  const comparisons: Record<string, string> = { Equal: 'equal to', EqualOrAbove: 'at least', Above: 'greater than', EqualOrBelow: 'at most', Below: 'less than' };
  return `${node?.target.name ?? 'External ability or bonus'} ${knowledge === 'Unknown' ? 'must not be learned' : 'must be learned'}${raw.boolBalue1 ? ` with a rank ${comparisons[enumName(raw.value)] ?? 'with an unverified comparison to'} ${raw.amount1}` : ''}`;
}
