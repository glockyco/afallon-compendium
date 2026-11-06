import { BUILD_LIMITS, type FinalRank, type PlannerBuild, type TalentPurchase } from './build';
import { baseTalentPoints, combineTalentChecks, talentNodeKey, type PurchaseEvaluation, type TalentCheck, type TalentEvaluation, type TalentEvaluator, type TalentMode } from './talents';

export type TalentRun = TalentPurchase & { count: number };
/** Transport compression only: nonadjacent repeats remain separate and zero-cost events are retained. */
export function adjacentTalentRuns(purchases: readonly TalentPurchase[]): TalentRun[] {
  const runs: TalentRun[] = [];
  for (const row of purchases) {
    const previous = runs.at(-1);
    if (previous && talentNodeKey(previous) === talentNodeKey(row)) previous.count++;
    else runs.push({ ...row, count: 1 });
  }
  return runs;
}
export function reconstructTalentPurchases(runs: readonly TalentRun[]): TalentPurchase[] {
  if (runs.length > BUILD_LIMITS.purchases) throw new Error('Too many talent purchase runs.');
  const purchases: TalentPurchase[] = [];
  for (const row of runs) {
    if (!Number.isSafeInteger(row.count) || row.count < 1 || purchases.length + row.count > BUILD_LIMITS.purchases) throw new Error('Invalid talent purchase count.');
    for (let count = 0; count < row.count; count++) purchases.push({ tree: row.tree, node: row.node });
  }
  return purchases;
}

export type EarliestTalentPurchase = PurchaseEvaluation & {
  earliestLevel: number | null; visibleAtLevel: boolean; stoppedByOrdinal: number | null;
};
export type EarliestTalentPlan = TalentCheck & {
  label: 'Earliest With Base Talent Points'; assumptions: readonly string[]; order: PlannerBuild['talents']['kind'];
  level: number | null; bounds: { min: number; max: number } | null;
  purchases: readonly EarliestTalentPurchase[]; prefix: readonly TalentPurchase[];
  defaults: readonly FinalRank[]; unknownOrderRanks: readonly FinalRank[];
  /** Final Heroic choices remain visible beside the projection, never part of a level snapshot. */
  heroic: readonly (FinalRank & { acquisitionLevel: null })[];
};
const assumptions = [
  'This is an earliest-affordable plan, not actual purchase history.',
  'Only verified base Talent Points, free starting ranks, authored costs and purchase requirements are replayed.',
  'An earlier blocked or unverified purchase stops the ordered stream; later choices are not reordered.',
  'Entered totals have no earlier grant schedule. Heroic Essence ranks have no acquisition level.',
] as const;
const issue = (code: string, message: string, status: 'blocked' | 'unverified'): TalentCheck => ({ status, reasons: [{ code, message, status }] });

/** Replay one retained Talent Point stream without reordering or back-projecting current entered totals.
 * The first affordable published level is assigned even to a zero-cost event only after its gates pass.
 * A cost beyond the maximum published base grant blocks, rather than inventing another level.
 * Use prefix for the web's level view and purchases for its ordered ledger; both preserve the same order.
 */
export function earliestWithBaseTalentPoints(evaluator: TalentEvaluator, build: PlannerBuild, viewLevel = build.level, mode: TalentMode = 'preview'): EarliestTalentPlan {
  const scope = evaluator.scope(build), identity = evaluator.payload.classes.find(row => row.key === build.class), bounds = identity?.levels ?? null;
  const level = bounds ? Math.max(bounds.min, Math.min(bounds.max, Number.isFinite(viewLevel) ? Math.trunc(viewLevel) : bounds.min)) : null;
  const known = evaluator.initialKnowledge(scope), defaults: FinalRank[] = [];
  for (const { tree, node } of scope.nodes.values()) if ((node.defaultRank ?? 0) > 0 && evaluator.payload.buildId === '25653798') defaults.push({ tree: tree.key!, node: node.index, rank: node.defaultRank! });
  const base = { label: 'Earliest With Base Talent Points' as const, assumptions, order: build.talents.kind, level, bounds, defaults,
    heroic: build.heroic.map(row => ({ ...row, acquisitionLevel: null })), unknownOrderRanks: build.talents.kind === 'unknown-order' ? build.talents.ranks : [] };
  if (build.talents.kind === 'unknown-order') return { ...base, ...issue('purchase-order-unknown', 'Final ranks are retained, but their purchase order and earlier level snapshots are not verified.', 'unverified'), purchases: [], prefix: [] };
  const purchases: EarliestTalentPurchase[] = [], counts = new Map<string, number>();
  let spend = 0, previousLevel = bounds?.min ?? 1, stopped: EarliestTalentPurchase | null = null;
  for (const [index, row] of build.talents.purchases.entries()) {
    const resolved = scope.nodes.get(talentNodeKey(row)), defaultRank = resolved?.node.defaultRank;
    const count = (counts.get(talentNodeKey(row)) ?? 0) + 1; counts.set(talentNodeKey(row), count);
    const rank = defaultRank === null || defaultRank === undefined ? null : defaultRank + count;
    let entry = evaluator.rankCheck(build, scope, known, row, rank, mode, index + 1);
    if (entry.pointType !== 'treePoints:0') entry = { ...entry, ...combineTalentChecks([entry, issue('ordered-point-type-not-verified', 'Only Talent Point purchases have a verified level-grant stream.', 'unverified')]) };
    let earliestLevel: number | null = null;
    if (stopped) entry = { ...entry, ...combineTalentChecks([entry, issue('ordered-stream-stopped', `The ordered stream stopped at purchase ${stopped.ordinal}.`, stopped.status === 'blocked' ? 'blocked' : 'unverified')]) };
    else if (entry.status === 'verified' && entry.cost !== null && bounds) {
      const required = spend + entry.cost;
      for (let candidate = previousLevel; candidate <= bounds.max; candidate++) {
        const available = baseTalentPoints(evaluator.payload, 'treePoints:0', candidate);
        if (available === null) { entry = { ...entry, ...issue('base-grant-not-verified', 'The base Talent Point grant is not verified.', 'unverified') }; break; }
        if (available >= required) { earliestLevel = candidate; break; }
      }
      if (earliestLevel === null && entry.status === 'verified') entry = { ...entry, ...issue('base-grant-shortfall', 'This purchase cannot fit the base Talent Point grant within the published levels.', 'blocked') };
    }
    const projected: EarliestTalentPurchase = { ...entry, earliestLevel, visibleAtLevel: earliestLevel !== null && level !== null && earliestLevel <= level, stoppedByOrdinal: stopped?.ordinal ?? null };
    purchases.push(projected);
    if (!stopped && earliestLevel === null) stopped = projected;
    if (earliestLevel !== null) {
      spend += entry.cost!; previousLevel = earliestLevel;
      if (resolved?.node.target.key) known.set(resolved.node.target.key, { rank, status: 'verified' });
    }
  }
  return { ...base, ...combineTalentChecks([scope.check, ...purchases]), purchases, prefix: purchases.filter(row => row.visibleAtLevel).map(row => ({ tree: row.tree, node: row.node })) };
}

export type TalentEditResult = { changed: boolean; build: PlannerBuild; evaluation: TalentEvaluation; check: TalentCheck };
function result(evaluator: TalentEvaluator, previous: PlannerBuild, build: PlannerBuild, mode: TalentMode, check?: TalentCheck): TalentEditResult {
  const evaluation = evaluator.evaluate(build, { mode });
  return { changed: previous !== build, build, evaluation, check: check ?? evaluation };
}
function changeFinalRank(rows: readonly FinalRank[], row: TalentPurchase, rank: number): FinalRank[] {
  const exists = rows.some(entry => talentNodeKey(entry) === talentNodeKey(row));
  const changed = rows.flatMap(entry => talentNodeKey(entry) === talentNodeKey(row) ? rank > 0 ? [{ ...row, rank }] : [] : [entry]);
  return !exists && rank > 0 ? [...changed, { ...row, rank }] : changed;
}

/** Add only a verified next rank. Rejected previews do not alter the build; inspectNextRank names their reasons.
 * Ordered increments append. Editing an unknown-order snapshot preserves its discriminator instead of inventing history.
 * Every successful edit returns a new build; retain the prior build for Undo. These are plan edits, never game refunds.
 */
export function addTalentRank(evaluator: TalentEvaluator, build: PlannerBuild, row: TalentPurchase, mode: TalentMode = 'preview'): TalentEditResult {
  const next = evaluator.inspectNextRank(build, row);
  if (next.status !== 'verified' || next.rank === null) return result(evaluator, build, build, mode, next);
  const tree = evaluator.scope(build).nodes.get(talentNodeKey(row))?.tree;
  if (tree?.pointType === 'treePoints:2') return result(evaluator, build, { ...build, heroic: changeFinalRank(build.heroic, row, next.rank) }, mode);
  if (build.talents.kind === 'unknown-order') return result(evaluator, build, { ...build, talents: { kind: 'unknown-order', ranks: changeFinalRank(build.talents.ranks, row, next.rank) } }, mode);
  if (build.talents.purchases.length >= BUILD_LIMITS.purchases) return result(evaluator, build, build, mode, issue('purchase-limit', 'The build transport purchase limit has been reached.', 'blocked'));
  return result(evaluator, build, { ...build, talents: { kind: 'ordered', purchases: [...build.talents.purchases, { ...row }] } }, mode);
}

/** Remove the last chosen increment of a node and replay later choices in place, including now-blocked dependencies. */
export function removeTalentRank(evaluator: TalentEvaluator, build: PlannerBuild, row: TalentPurchase, mode: TalentMode = 'preview'): TalentEditResult {
  const heroic = build.heroic.find(entry => talentNodeKey(entry) === talentNodeKey(row));
  const minimum = evaluator.scope(build).nodes.get(talentNodeKey(row))?.node.defaultRank ?? 0;
  if (heroic) {
    if (heroic.rank <= minimum) return result(evaluator, build, build, mode);
    return result(evaluator, build, { ...build, heroic: changeFinalRank(build.heroic, row, heroic.rank - 1) }, mode);
  }
  if (build.talents.kind === 'unknown-order') {
    const final = build.talents.ranks.find(entry => talentNodeKey(entry) === talentNodeKey(row));
    if (!final || final.rank <= minimum) return result(evaluator, build, build, mode);
    return result(evaluator, build, { ...build, talents: { kind: 'unknown-order', ranks: changeFinalRank(build.talents.ranks, row, final.rank - 1) } }, mode);
  }
  const index = build.talents.purchases.findLastIndex(entry => talentNodeKey(entry) === talentNodeKey(row));
  if (index < 0) return result(evaluator, build, build, mode);
  return result(evaluator, build, { ...build, talents: { kind: 'ordered', purchases: build.talents.purchases.filter((_entry, ordinal) => ordinal !== index) } }, mode);
}
export function resetTalentTree(evaluator: TalentEvaluator, build: PlannerBuild, tree: string, mode: TalentMode = 'preview'): TalentEditResult {
  const talents = build.talents.kind === 'ordered' ? { kind: 'ordered' as const, purchases: build.talents.purchases.filter(row => row.tree !== tree) }
    : { kind: 'unknown-order' as const, ranks: build.talents.ranks.filter(row => row.tree !== tree) };
  return result(evaluator, build, { ...build, talents, heroic: build.heroic.filter(row => row.tree !== tree) }, mode);
}
/** Reset allocations and entered totals, keeping published identity, current level and source provenance. UI confirms this action. */
export function resetTalentBuild(evaluator: TalentEvaluator, build: PlannerBuild, mode: TalentMode = 'preview'): TalentEditResult {
  return result(evaluator, build, { ...build, points: [], talents: { kind: 'ordered', purchases: [] }, heroic: [], gear: [], party: { role: null, members: [] } }, mode);
}
