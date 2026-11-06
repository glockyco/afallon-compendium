import { expect, test } from 'bun:test';
import type { StaticPlanner } from '@afallon/contracts/public';
import fixture from '../talents.fixture.json';
import { createTalentEvaluator } from '../talents';
import { identityRef, newBuild, nodeAnchor, requirementLabel, workspaceWeb } from './workspace';

const payload = fixture.payload as StaticPlanner;
test('new setup is a complete build, keeping source data and no implicit point or feature choices', () => {
  const build = newBuild(payload, 'races:1', 'classes:7', 30);
  expect(build).toEqual({ catalog: payload.catalogId, race: 'races:1', class: 'classes:7', level: 30, points: [], talents: { kind: 'ordered', purchases: [] }, heroic: [], gear: [], party: { role: null, members: [] } });
});
test('workspace adapts published nodes to the existing web without fetching class pages or inventing routes', () => {
  const build = newBuild(payload, 'races:1', 'classes:7', 30);
  const evaluator = createTalentEvaluator(payload), scope = evaluator.scope(build);
  const drawing = workspaceWeb(scope.trees, evaluator, build);
  expect(drawing.web.nodes.length).toBe(scope.nodes.size);
  expect(drawing.trees.flatMap(tree => tree.rows).map(row => row.anchor).sort()).toEqual(drawing.web.nodes.map(row => row.talent).sort());
  expect(new Set(drawing.web.nodes.map(row => row.talent)).size).toBe(scope.nodes.size);
  const keys = new Set([...drawing.web.nodes.map(row => row.talent), ...drawing.web.wedges.map(row => row.tree)]);
  expect(drawing.web.edges.every(edge => keys.has(edge.from) && keys.has(edge.to))).toBe(true);
  expect(identityRef({ key: 'bonuses:1', name: 'Passive' })).toEqual({ key: null, label: 'Passive' });
  const ref = { key: 'classes:7', kind: 'classes' as const, name: 'Hunter', slug: 'hunter' };
  expect(identityRef({ key: ref.key, name: ref.name, ref })).toBe(ref);
  expect(nodeAnchor({ tree: 'talentTrees:13', node: 2 })).toBe('plan-talentTrees-13-2');
});
test('requirement rows explain native comparison operands without showing internal identifiers', () => {
  const node = payload.trees.flatMap(tree => tree.nodes)[0]!;
  expect(requirementLabel({ requirementType: 'Ability', knowledge: { name: 'Known' }, boolBalue1: true, value: { name: 'EqualOrAbove' }, amount1: 3 }, node)).toBe(`${node.target.name} must be learned with a rank at least 3`);
  expect(requirementLabel({ requirementType: 'Ability', knowledge: { name: 'Unknown' }, boolBalue1: false }, node)).toBe(`${node.target.name} must not be learned`);
  expect(requirementLabel(null, undefined)).toBe('Requirement not recorded');
  expect(requirementLabel({ requirementType: 'Future' }, undefined)).toBe('Purchase rule not verified');
});
