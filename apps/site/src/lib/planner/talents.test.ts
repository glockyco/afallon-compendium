import { expect, test } from 'bun:test';
import { Assert } from 'typebox/value';
import { StaticPlannerSchema, type PlannerCondition, type PlannerNode, type StaticPlanner } from '@afallon/contracts/public';
import type { PlannerBuild, TalentPurchase } from './build';
import { baseTalentPoints, createTalentEvaluator, evaluatePurchaseCondition, talentNodeKey } from './talents';
import { addTalentRank, adjacentTalentRuns, earliestWithBaseTalentPoints, reconstructTalentPurchases, removeTalentRank, resetTalentBuild, resetTalentTree } from './talents-order';
import published from './talents.fixture.json';

const catalog = 'd5b0b4b3e2161010e0de6fff10a2be305063990eb7c139080a9eb844edee0e15';
const ref = (key: string, name = key) => ({ key, name });
const condition = (requirements: Record<string, unknown>[] = [], options: { checkCount?: boolean; requiredCount?: number } = {}): PlannerCondition => ({
  id: 'fixture-recorded-condition', semantics: 'inline-requirements', sourceFieldPath: 'fixture.node.requirements', gaps: [],
  groups: [{ checkCount: false, requiredCount: 0, ...options, requirements }],
});
const missing: PlannerCondition = { id: null, semantics: null, sourceFieldPath: null, groups: null, gaps: ['condition-not-recorded'] };
const predicate = (id: number, options: Record<string, unknown> = {}) => ({
  requirementType: 'Bonus', conditionRule: 'Mandatory', bonusID: id, knowledge: { name: 'Known', value: 0 }, boolBalue1: false, ...options,
});
const node = (index: number, costs: number[] = [1], options: Partial<PlannerNode> = {}): PlannerNode => ({
  index, kind: 'bonus', target: ref(`bonuses:${index}`, `Bonus ${index}`), tier: 99, row: 0,
  rankLimit: costs.length, defaultRank: 0, gaps: [], purchaseCondition: condition(),
  ranks: costs.map((authoredCost, rank) => ({ rank: rank + 1, authoredCost, text: [`Rank ${rank + 1}`], rawData: {}, useEffectCondition: missing })), ...options,
});
function fixture(): StaticPlanner {
  return { schemaVersion: 'compendium.static-planner.v1', buildId: '25653798', catalogId: catalog, gaps: [],
    races: [{ ...ref('races:0', 'Human'), offeredClasses: [ref('classes:0', 'Class')], gaps: [] }],
    classes: [{ ...ref('classes:0', 'Class'), levels: { min: 1, max: 60 }, trees: [ref('talentTrees:0'), ref('talentTrees:1'), ref('talentTrees:2')], gaps: [] }],
    trees: [
      { ...ref('talentTrees:0'), pointType: 'treePoints:0', tiers: 3, slotsPerTier: 3, gaps: [], nodes: [
        node(0, [1, 2, 0, 5], { defaultRank: 1, purchaseCondition: missing }),
        node(1, [1, 2, 0, 5], { purchaseCondition: condition([predicate(0)]) }),
        node(2, [0], { purchaseCondition: condition([predicate(1, { boolBalue1: true, amount1: 2, value: { name: 'EqualOrAbove', value: 2 } })]) }),
        node(3, [1], { purchaseCondition: condition([predicate(999)]) }),
        node(4, [0], { purchaseCondition: missing }),
      ] },
      { ...ref('talentTrees:1'), pointType: 'treePoints:0', tiers: 1, slotsPerTier: 2, gaps: [], nodes: [
        node(5, [1], { purchaseCondition: condition([predicate(2)]) }),
        node(6, [1], { purchaseCondition: condition([predicate(1, { conditionRule: 'Optional' }), predicate(2, { conditionRule: 'Optional' })], { checkCount: true, requiredCount: 2 }) }),
      ] },
      { ...ref('talentTrees:2'), pointType: 'treePoints:2', tiers: 1, slotsPerTier: 1, gaps: [], nodes: [node(7, [20, 20, 20, 20, 20, 25])] },
    ],
    pointTypes: [
      { ...ref('treePoints:0', 'Talent Points'), startAmount: 1, authoredMaxPoints: 180, baseLevelGrant: { start: 1, perLevel: 3, positiveCap: 180, rule: 'build-25653798-base-talent-points' }, rawGainRules: [], gaps: ['full-earned-total-not-verified'] },
      { ...ref('treePoints:2', 'Heroic Essence'), startAmount: 0, authoredMaxPoints: 0, baseLevelGrant: null, rawGainRules: [], gaps: ['full-earned-total-not-verified', 'base-level-grant-not-verified'] },
    ],
  };
}
const purchase = (node: number, tree = 'talentTrees:0'): TalentPurchase => ({ tree, node });
const build = (purchases: readonly TalentPurchase[] = [], options: Partial<PlannerBuild> = {}): PlannerBuild => ({
  catalog, race: 'races:0', class: 'classes:0', level: 30, points: [], talents: { kind: 'ordered', purchases }, heroic: [], gear: [], party: { role: null, members: [] }, ...options,
});
const codes = (value: { reasons: readonly { code: string }[] }) => value.reasons.map(row => row.code);
const chainOrder = [purchase(1), purchase(1), purchase(2), purchase(5, 'talentTrees:1')];

test('authored rank costs, free defaults and separate use/effect requirements do not become purchase gates', () => {
  const data = fixture();
  data.trees[0]!.nodes[1]!.ranks[0]!.useEffectCondition = condition([{ requirementType: 'Item', conditionRule: 'Mandatory', itemID: 999 }]);
  const evaluator = createTalentEvaluator(data), plan = build([purchase(1), purchase(1), purchase(1), purchase(1)]);
  const result = evaluator.evaluate(plan, { mode: 'committed' });
  expect(result.status).toBe('verified');
  expect(result.purchases.map(row => row.cost)).toEqual([1, 2, 0, 5]);
  expect(result.purchases[0]!.useEffectCondition!.groups![0]!.requirements[0]!.requirementType).toBe('Item');
  expect(result.balances.find(row => row.type === 'treePoints:0')!.spent).toBe(8);
  expect(result.allocations.find(row => row.node === 0)!.rank).toBe(1);
  expect(result.allocations.find(row => row.node === 0)!.ranks).toEqual([]);
  // The free default is known, but missing purchase evidence still prevents its rank-two purchase.
  const next = evaluator.inspectNextRank(build(), purchase(0));
  expect(next.rank).toBe(2); expect(next.cost).toBe(2); expect(next.status).toBe('unverified');
  expect(codes(next)).toContain('condition-not-recorded');
  expect(evaluator.evaluate(plan, { mode: 'preview' }).status).toBe(result.status);
  expect(result.purchases[0]!.mode).toBe('committed');
});

test('mandatory predicates, all groups and native optional-count semantics retain every reason', () => {
  const evaluator = createTalentEvaluator(fixture()), scope = evaluator.scope(build()), known = evaluator.initialKnowledge(scope);
  known.set('bonuses:1', { rank: 2, status: 'verified' });
  const mandatory = predicate(2), match = predicate(1, { conditionRule: 'Optional' }), unknown = predicate(999, { conditionRule: 'Optional' });
  const failure = evaluatePurchaseCondition(condition([mandatory, match], { checkCount: true, requiredCount: 1 }), known, scope);
  expect(failure.status).toBe('blocked'); expect(codes(failure)).toContain('must-be-known');
  expect(evaluatePurchaseCondition(condition([match, unknown]), known, scope).status).toBe('verified');
  expect(evaluatePurchaseCondition(condition([match, unknown], { checkCount: true, requiredCount: 2 }), known, scope).status).toBe('unverified');
  expect(evaluatePurchaseCondition(condition([match], { checkCount: true, requiredCount: 2 }), known, scope).status).toBe('blocked');
  const noThreshold = condition([match]); delete noThreshold.groups![0]!.checkCount;
  expect(evaluatePurchaseCondition(noThreshold, known, scope).status).toBe('unverified');
  const twoGroups = condition([match]); twoGroups.groups!.push({ requirements: [predicate(2)], checkCount: false });
  expect(evaluatePurchaseCondition(twoGroups, known, scope).status).toBe('blocked');
  const both = evaluatePurchaseCondition(condition([predicate(2), predicate(999)]), known, scope);
  expect(both.status).toBe('blocked'); expect(codes(both)).toEqual(['must-be-known', 'knowledge-not-verified']);
});

test('all five native rank comparisons and negated knowledge use the authored operands', () => {
  const evaluator = createTalentEvaluator(fixture()), scope = evaluator.scope(build()), known = evaluator.initialKnowledge(scope);
  known.set('bonuses:1', { rank: 2, status: 'verified' });
  for (const [name, amount, status] of [['Equal', 2, 'verified'], ['EqualOrBelow', 3, 'verified'], ['EqualOrAbove', 3, 'blocked'], ['Below', 3, 'verified'], ['Above', 2, 'blocked']] as const) {
    expect(evaluatePurchaseCondition(condition([predicate(1, { boolBalue1: true, amount1: amount, value: { name } })]), known, scope).status).toBe(status);
  }
  expect(evaluatePurchaseCondition(condition([predicate(2, { knowledge: { name: 'Unknown' } })]), known, scope).status).toBe('verified');
  expect(evaluatePurchaseCondition(condition([predicate(1, { knowledge: { name: 'Unknown' } })]), known, scope).status).toBe('blocked');
  expect(evaluatePurchaseCondition(condition([predicate(999, { knowledge: { name: 'Unknown' } })]), known, scope).status).toBe('unverified');
});

test('unknown predicates, ranks, inputs, point types and future builds remain unverified rather than free', () => {
  const data = fixture(), evaluator = createTalentEvaluator(data);
  expect(evaluator.inspectNextRank(build(), purchase(3)).status).toBe('unverified');
  expect(addTalentRank(evaluator, build(), purchase(4)).changed).toBe(false);
  const n = data.trees[0]!.nodes[1]!;
  n.purchaseCondition = condition([{ requirementType: 'Future', conditionRule: 'Mandatory' }]);
  expect(createTalentEvaluator(data).inspectNextRank(build(), purchase(1)).status).toBe('unverified');
  n.purchaseCondition = condition(); n.ranks[0]!.authoredCost = null;
  const unknownCost = createTalentEvaluator(data).evaluate(build([purchase(1)]));
  expect(unknownCost.balances.find(row => row.type === 'treePoints:0')!.remaining).toBeNull();
  expect(codes(unknownCost)).toContain('rank-cost-missing');
  n.ranks[0]!.authoredCost = 1; n.defaultRank = null;
  expect(createTalentEvaluator(data).inspectNextRank(build(), purchase(1)).rank).toBeNull();
  n.defaultRank = 0; data.trees[0]!.pointType = null;
  const unknownType = createTalentEvaluator(data).evaluate(build([purchase(1)]));
  expect(unknownType.balances.find(row => row.type === null)!.remainingLabel).toBe('Remaining Not Verified');
  expect(unknownType.balances.find(row => row.type === 'treePoints:2')!.knownSpent).toBe(0);
  data.buildId = 'future';
  expect(baseTalentPoints(data, 'treePoints:0', 30)).toBeNull();
  expect(createTalentEvaluator(data).inspectNextRank(build(), purchase(1)).status).toBe('unverified');
});

test('typed provenance, Heroic intermediate costs, unknown remaining and lower-level shortfalls preserve choices', () => {
  const evaluator = createTalentEvaluator(fixture());
  const plan = build(chainOrder, { heroic: [{ tree: 'talentTrees:2', node: 7, rank: 6 }] });
  const result = evaluator.evaluate(plan);
  const talent = result.balances.find(row => row.type === 'treePoints:0')!, heroic = result.balances.find(row => row.type === 'treePoints:2')!;
  expect(talent).toMatchObject({ base: 88, total: 88, spent: 4, remaining: 84, sourceLabel: 'From Your Level', basis: 'base-plan' });
  expect(heroic).toMatchObject({ total: null, spent: 125, remaining: null, shortfall: null, remainingLabel: 'Remaining Not Verified' });
  const entered = evaluator.evaluate({ ...plan, points: [{ type: 'treePoints:2', total: 100 }] });
  expect(entered.balances.find(row => row.type === 'treePoints:2')).toMatchObject({ sourceLabel: 'Entered by You', shortfall: 25, remaining: -25 });
  expect(entered.balances.find(row => row.type === 'treePoints:0')!.remaining).toBe(84);
  const lower = evaluator.evaluate({ ...plan, level: 1, points: [{ type: 'treePoints:2', total: 1000 }] });
  expect(lower.balances.find(row => row.type === 'treePoints:0')!.shortfall).toBe(3);
  expect(lower.purchases).toHaveLength(4); expect(lower.allocations.find(row => row.node === 2)!.rank).toBe(1);
  expect(lower.heroic[0]!.rank).toBe(6);
  expect(plan.talents).toEqual({ kind: 'ordered', purchases: chainOrder });
  expect(baseTalentPoints(fixture(), 'treePoints:0', 1)).toBe(1);
  expect(baseTalentPoints(fixture(), 'treePoints:0', 60)).toBe(178);
  expect(baseTalentPoints(fixture(), 'treePoints:0', 100)).toBe(180);
});

test('the entire dependency chain includes cross-tree ancestors, descendants and optional edges without cycles', () => {
  const evaluator = createTalentEvaluator(fixture());
  const chain = evaluator.dependencyChain(build(chainOrder), purchase(1));
  expect(chain.nodes.map(talentNodeKey).sort()).toEqual(['talentTrees:0/0', 'talentTrees:0/1', 'talentTrees:0/2', 'talentTrees:1/5', 'talentTrees:1/6']);
  expect(chain.edges.some(row => row.optional)).toBe(true);
  expect(evaluator.dependencyChain(build(), purchase(3)).unresolvedTargets).toEqual(['bonuses:999']);
  const data = fixture(); data.trees[0]!.nodes[0]!.purchaseCondition = condition([predicate(2)]);
  expect(createTalentEvaluator(data).dependencyChain(build(), purchase(2)).nodes.length).toBe(5);
});

test('adjacent runs reconstruct exact cross-tree order and do not collapse later repeats', () => {
  const ordered = [purchase(1), purchase(1), purchase(5, 'talentTrees:1'), purchase(1), purchase(2)];
  const runs = adjacentTalentRuns(ordered);
  expect(runs.map(row => row.count)).toEqual([2, 1, 1, 1]);
  expect(reconstructTalentPurchases(runs)).toEqual(ordered);
  expect(() => reconstructTalentPurchases([{ ...purchase(1), count: 0 }])).toThrow();
  expect(() => reconstructTalentPurchases([{ ...purchase(1), count: 409 }])).toThrow();
});

test('Earliest With Base Talent Points respects exact order, base-only budgets and zero-cost gates', () => {
  const evaluator = createTalentEvaluator(fixture());
  const plan = build(chainOrder, { level: 1, points: [{ type: 'treePoints:0', total: 1000 }], heroic: [{ tree: 'talentTrees:2', node: 7, rank: 6 }] });
  const projection = earliestWithBaseTalentPoints(evaluator, plan);
  expect(projection.purchases.map(row => row.earliestLevel)).toEqual([1, 2, 2, 2]);
  expect(projection.prefix).toEqual([purchase(1)]);
  expect(projection.heroic).toEqual([{ tree: 'talentTrees:2', node: 7, rank: 6, acquisitionLevel: null }]);
  expect(projection.defaults).toEqual([{ tree: 'talentTrees:0', node: 0, rank: 1 }]);
  const blocked = earliestWithBaseTalentPoints(evaluator, build([purchase(2), purchase(1)]));
  expect(blocked.purchases.map(row => row.earliestLevel)).toEqual([null, null]);
  expect(blocked.purchases[0]!.cost).toBe(0); expect(blocked.purchases[0]!.status).toBe('blocked');
  expect(blocked.purchases[1]!.stoppedByOrdinal).toBe(1);
  const unknown = earliestWithBaseTalentPoints(evaluator, build([purchase(4), purchase(1)]));
  expect(unknown.status).toBe('unverified'); expect(unknown.prefix).toEqual([]);
  expect(unknown.purchases[1]!.stoppedByOrdinal).toBe(1);
});

test('published level bounds, not the authored point cap, bound replay; later cheap picks do not pass expensive ones', () => {
  const data = fixture(); data.trees[0]!.nodes[1]!.ranks[0]!.authoredCost = 179;
  const projection = earliestWithBaseTalentPoints(createTalentEvaluator(data), build([purchase(1), purchase(2)]), 999);
  expect(projection.level).toBe(60); expect(projection.purchases[0]!.earliestLevel).toBeNull();
  expect(codes(projection.purchases[0]!)).toContain('base-grant-shortfall');
  expect(projection.purchases[1]!.stoppedByOrdinal).toBe(1);
  data.pointTypes[0]!.baseLevelGrant = null;
  expect(earliestWithBaseTalentPoints(createTalentEvaluator(data), build([purchase(1)])).status).toBe('unverified');
});

test('snapshots keep unknown order, final ranks and Heroic choices, with no invented timeline', () => {
  const evaluator = createTalentEvaluator(fixture());
  const plan = build([], { talents: { kind: 'unknown-order', ranks: [{ ...purchase(1), rank: 2 }, { ...purchase(2), rank: 1 }] }, heroic: [{ tree: 'talentTrees:2', node: 7, rank: 6 }], points: [{ type: 'treePoints:2', total: 125 }] });
  const evaluation = evaluator.evaluate(plan);
  expect(evaluation.order).toBe('unknown-order'); expect(evaluation.status).toBe('verified');
  expect(evaluation.purchases).toEqual([]); expect(evaluation.allocations.find(row => row.node === 2)!.rank).toBe(1);
  const projection = earliestWithBaseTalentPoints(evaluator, plan);
  expect(projection.status).toBe('unverified'); expect(projection.purchases).toEqual([]);
  expect(projection.unknownOrderRanks).toEqual(plan.talents.kind === 'unknown-order' ? plan.talents.ranks : []);
  const edited = addTalentRank(evaluator, plan, purchase(1));
  expect(edited.build.talents.kind).toBe('unknown-order'); expect(edited.changed).toBe(true);
  expect(removeTalentRank(evaluator, edited.build, purchase(1)).build).toEqual(plan);
});

test('append, minus, scoped tree reset and confirmed whole-build reset return new reversible plans', () => {
  const evaluator = createTalentEvaluator(fixture()), original = build(chainOrder, { points: [{ type: 'treePoints:2', total: 125 }], heroic: [{ tree: 'talentTrees:2', node: 7, rank: 6 }] });
  const added = addTalentRank(evaluator, original, purchase(1));
  expect(added.changed).toBe(true); expect(added.build).not.toBe(original);
  expect(added.build.talents.kind === 'ordered' && added.build.talents.purchases.at(-1)).toEqual(purchase(1));
  expect(removeTalentRank(evaluator, added.build, purchase(1)).build).toEqual(original);
  const removed = removeTalentRank(evaluator, original, purchase(1));
  expect(removed.build.talents.kind === 'ordered' && removed.build.talents.purchases).toEqual([purchase(1), purchase(2), purchase(5, 'talentTrees:1')]);
  expect(removed.evaluation.allocations.find(row => row.node === 2)!.status).toBe('blocked');
  expect(removed.evaluation.allocations.find(row => row.node === 5)!.status).toBe('blocked');
  expect(removeTalentRank(evaluator, build(), purchase(0)).changed).toBe(false);
  const reset = resetTalentTree(evaluator, original, 'talentTrees:0');
  expect(reset.build.talents).toEqual({ kind: 'ordered', purchases: [purchase(5, 'talentTrees:1')] });
  expect(reset.build.heroic).toEqual(original.heroic); expect(reset.build.points).toEqual(original.points);
  expect(reset.evaluation.purchases[0]!.status).toBe('blocked');
  const cleared = resetTalentBuild(evaluator, original);
  expect(cleared.build).toMatchObject({ class: original.class, race: original.race, level: original.level, catalog: original.catalog, points: [], talents: { kind: 'ordered', purchases: [] }, heroic: [], gear: [], party: { role: null, members: [] } });
  expect(original.talents).toEqual({ kind: 'ordered', purchases: chainOrder });
});

test('one native-gate-checked real-payload order replays for every published playable class', () => {
  const data = published.payload as StaticPlanner;
  Assert(StaticPlannerSchema, data);
  expect(published.provenance).toMatchObject({ originalClasses: 6, originalTrees: 28, originalNodes: 730, catalogId: catalog });
  expect(data.classes.map(row => row.key)).toEqual(published.orders.map(row => row.class));
  const evaluator = createTalentEvaluator(data);
  for (const order of published.orders) {
    const race = data.races.find(row => row.offeredClasses.some(offer => offer.key === order.class))!;
    const plan = build(order.purchases, { class: order.class, race: race.key!, level: 60 });
    const result = evaluator.evaluate(plan);
    expect(order.purchases).toHaveLength(20);
    expect(result.purchases.every(row => row.status === 'verified')).toBe(true);
    expect(result.purchases.every(row => row.requirements.length > 0)).toBe(true);
    const projection = earliestWithBaseTalentPoints(evaluator, plan);
    expect(projection.purchases.every(row => row.earliestLevel !== null)).toBe(true);
    expect(projection.prefix).toEqual(order.purchases);
    const missingDefaults = data.trees.filter(tree => data.classes.find(cls => cls.key === order.class)!.trees.some(ref => ref.key === tree.key))
      .flatMap(tree => tree.nodes.filter(node => node.defaultRank === 1 && node.purchaseCondition.id === null).map(node => ({ tree: tree.key!, node: node.index })));
    expect(missingDefaults.length).toBeGreaterThan(0);
    for (const row of missingDefaults) expect(codes(evaluator.inspectNextRank(plan, row))).toContain('condition-not-recorded');
  }
});

test('zero-cost ordered events can exceed the base point count and still retain gates and order', () => {
  const data = fixture();
  data.trees[0]!.nodes = [node(0, [1], { defaultRank: 1 }), ...Array.from({ length: 40 }, (_value, index) => node(index + 100, [0, 0, 0, 0, 0], { purchaseCondition: condition([predicate(0)]) }))];
  const ordered = data.trees[0]!.nodes.slice(1).flatMap(row => Array.from({ length: 5 }, () => purchase(row.index)));
  const plan = build(ordered, { level: 1 }), evaluator = createTalentEvaluator(data);
  expect(ordered).toHaveLength(200);
  expect(reconstructTalentPurchases(adjacentTalentRuns(ordered))).toEqual(ordered);
  const projection = earliestWithBaseTalentPoints(evaluator, plan);
  expect(projection.prefix).toEqual(ordered);
  expect(projection.purchases.every(row => row.earliestLevel === 1 && row.cost === 0)).toBe(true);
});

test('a recorded empty condition is distinct from a missing condition, and free first ranks skip their authored cost', () => {
  const data = fixture(); data.trees[0]!.nodes[0]!.purchaseCondition = { ...condition(), groups: [] };
  const evaluator = createTalentEvaluator(data);
  const next = evaluator.inspectNextRank(build(), purchase(0));
  expect(next.status).toBe('verified'); expect(next.rank).toBe(2); expect(next.cost).toBe(2);
  expect(addTalentRank(evaluator, build(), purchase(0)).evaluation.balances.find(row => row.type === 'treePoints:0')!.spent).toBe(2);
  expect(createTalentEvaluator(fixture()).inspectNextRank(build(), purchase(0)).status).toBe('unverified');
});

test('unknown comparator names cannot borrow object prototypes, and signed native comparisons remain signed', () => {
  const evaluator = createTalentEvaluator(fixture()), scope = evaluator.scope(build()), known = evaluator.initialKnowledge(scope);
  known.set('bonuses:1', { rank: 2, status: 'verified' });
  expect(evaluatePurchaseCondition(condition([predicate(1, { boolBalue1: true, amount1: 1, value: { name: 'constructor' } })]), known, scope).status).toBe('unverified');
  expect(evaluatePurchaseCondition(condition([predicate(1, { boolBalue1: true, amount1: -1, value: { name: 'Above' } })]), known, scope).status).toBe('verified');
});

test('snapshots preserve unresolved final ranks and propagate incomplete dependencies without inventing knowledge', () => {
  const data = fixture(); data.trees[0]!.nodes[1]!.purchaseCondition = missing;
  const evaluator = createTalentEvaluator(data), plan = build([], { talents: { kind: 'unknown-order', ranks: [{ ...purchase(1), rank: 2 }, { ...purchase(2), rank: 1 }, { ...purchase(99), rank: 3 }] } });
  const result = evaluator.evaluate(plan);
  expect(result.allocations.find(row => row.node === 1)!.status).toBe('unverified');
  expect(result.allocations.find(row => row.node === 2)!.status).toBe('unverified');
  expect(result.allocations.find(row => row.node === 99)!.rank).toBe(3);
  expect(result.unresolved).toEqual([purchase(99)]);
  expect(result.balances.find(row => row.type === null)!.remaining).toBeNull();
});

test('all thirty-eight real missing-condition nodes remain unverified, independently of preview or committed state', () => {
  const data = published.payload as StaticPlanner, evaluator = createTalentEvaluator(data);
  const missingNodes = data.trees.flatMap(tree => tree.nodes.filter(node => node.purchaseCondition.id === null).map(node => ({ tree: tree.key!, node: node.index })));
  expect(published.provenance.originalMissingConditions).toBe(38);
  expect(missingNodes).toHaveLength(38);
  for (const row of missingNodes) {
    const cls = data.classes.find(cls => cls.trees.some(ref => ref.key === row.tree))!;
    const race = data.races.find(race => race.offeredClasses.some(ref => ref.key === cls.key))!;
    const plan = build([], { class: cls.key!, race: race.key!, level: 60, points: [{ type: 'treePoints:2', total: 100000 }] });
    const next = evaluator.inspectNextRank(plan, row);
    expect(codes(next)).toContain('condition-not-recorded');
    expect(next.status).not.toBe('verified');
    expect(next.mode).toBe('preview');
    expect(addTalentRank(evaluator, plan, row, 'committed').changed).toBe(false);
  }
});
