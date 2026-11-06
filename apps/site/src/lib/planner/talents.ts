import type { PlannerCondition, PlannerNode, StaticPlanner } from '@afallon/contracts/public';
import type { FinalRank, PlannerBuild, TalentPurchase } from './build';

/** Evidence status never denotes persistence: a committed allocation can still be blocked or unverified. */
export type TalentStatus = 'verified' | 'blocked' | 'unverified';
export type TalentMode = 'preview' | 'committed';
export type TalentReason = { code: string; message: string; status: Exclude<TalentStatus, 'verified'>; target?: string };
export type TalentCheck = { status: TalentStatus; reasons: readonly TalentReason[] };
export type RequirementRow = TalentCheck & { group: number; index: number; optional: boolean; target: string | null; raw: Record<string, unknown> | null };
export type PurchaseEvaluation = TalentCheck & TalentPurchase & {
  mode: TalentMode; ordinal: number | null; rank: number | null; cost: number | null; pointType: string | null;
  requirements: readonly RequirementRow[]; useEffectCondition: PlannerCondition | null;
};
export type TalentAllocation = TalentCheck & TalentPurchase & {
  mode: TalentMode; defaultRank: number | null; rank: number | null; selectedIncrements: number;
  ranks: readonly PurchaseEvaluation[];
};
export type TalentBalance = {
  type: string | null; name: string; base: number | null; total: number | null;
  provenance: 'base-level' | 'entered' | 'unknown'; sourceLabel: 'From Your Level' | 'Entered by You' | 'Not Verified';
  /** Base-level remaining is a hypothetical base-plan budget, never the character's full game-earned balance. */
  basis: 'base-plan' | 'entered-total' | 'unknown';
  knownSpent: number; spent: number | null; remaining: number | null; shortfall: number | null;
  remainingLabel: string; gaps: readonly string[];
};
export type TalentEvaluation = TalentCheck & {
  mode: TalentMode; order: PlannerBuild['talents']['kind']; allocations: readonly TalentAllocation[];
  purchases: readonly PurchaseEvaluation[]; heroic: readonly TalentAllocation[]; balances: readonly TalentBalance[];
  unresolved: readonly TalentPurchase[];
};
export type DependencyEdge = { from: TalentPurchase; to: TalentPurchase; target: string; optional: boolean; group: number };
export type DependencyChain = { nodes: readonly TalentPurchase[]; edges: readonly DependencyEdge[]; unresolvedTargets: readonly string[] };
export type TalentTree = StaticPlanner['trees'][number];
export type TalentScope = { trees: readonly TalentTree[]; nodes: ReadonlyMap<string, { tree: TalentTree; node: PlannerNode }>; targets: ReadonlyMap<string, readonly { tree: TalentTree; node: PlannerNode }[]>; check: TalentCheck };
export type TalentKnowledge = ReadonlyMap<string, { rank: number | null; status: TalentStatus }>;
export type TalentEvaluator = {
  payload: StaticPlanner;
  scope(build: PlannerBuild): TalentScope;
  initialKnowledge(scope: TalentScope): Map<string, { rank: number | null; status: TalentStatus }>;
  rankCheck(build: PlannerBuild, scope: TalentScope, knowledge: TalentKnowledge, row: TalentPurchase, rank: number | null, mode: TalentMode, ordinal: number | null): PurchaseEvaluation;
  evaluate(build: PlannerBuild, options?: { mode?: TalentMode }): TalentEvaluation;
  /** A proposed next rank is always a preview, even when inspecting a committed build. */
  inspectNextRank(build: PlannerBuild, row: TalentPurchase): PurchaseEvaluation;
  dependencyChain(build: PlannerBuild, selected: TalentPurchase): DependencyChain;
};
export const talentNodeKey = (row: TalentPurchase): string => `${row.tree}/${row.node}`;
const whole = (value: unknown): value is number => typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
const reason = (code: string, message: string, status: TalentReason['status'] = 'unverified', target?: string): TalentReason => ({ code, message, status, ...(target ? { target } : {}) });
export function combineTalentChecks(checks: readonly TalentCheck[]): TalentCheck {
  const reasons = checks.flatMap(check => check.reasons);
  return { status: checks.some(check => check.status === 'blocked') ? 'blocked' : checks.some(check => check.status === 'unverified') ? 'unverified' : 'verified', reasons };
}
const checked = (...reasons: TalentReason[]): TalentCheck => combineTalentChecks(reasons.map(row => ({ status: row.status, reasons: [row] })));
const enumName = (value: unknown): string | null => value !== null && typeof value === 'object' && 'name' in value && typeof value.name === 'string' ? value.name : null;
function predicateTarget(raw: Record<string, unknown> | null): string | null {
  if (!raw) return null;
  const kind = raw.requirementType === 'Ability' ? 'abilities' : raw.requirementType === 'Bonus' ? 'bonuses' : null;
  const id = raw.requirementType === 'Ability' ? raw.abilityID : raw.bonusID;
  return kind && whole(id) ? `${kind}:${id}` : null;
}
const comparators: Record<string, (rank: number, amount: number) => boolean> = {
  Equal: (a, b) => a === b, EqualOrBelow: (a, b) => a <= b, EqualOrAbove: (a, b) => a >= b,
  Below: (a, b) => a < b, Above: (a, b) => a > b,
};

/** Evaluate the evidenced native Ability/Bonus knowledge path only. External learning is not zero.
 * Unknown knowledge negates membership; the rank comparison applies only to Known membership.
 * Optional thresholds use lower/upper bounds on true counts, so irrelevant unknown alternatives do not block a proved group.
 * Rank use/effect conditions deliberately never enter this function.
 */
export function evaluatePurchaseCondition(condition: PlannerCondition, knowledge: TalentKnowledge, scope: TalentScope, supportedBuild = true): TalentCheck & { requirements: readonly RequirementRow[] } {
  const rows: RequirementRow[] = [];
  if (!supportedBuild) return { ...checked(reason('purchase-rules-not-verified', 'Purchase rules are not verified for this game build.')), requirements: rows };
  if (condition.groups === null || condition.id === null || !['inline-requirements', 'requirements-template'].includes(condition.semantics ?? '')) {
    return { ...checked(...(condition.gaps.length ? condition.gaps : ['condition-semantics-not-verified']).map(gap => reason(gap, 'Purchase requirements are not recorded or verified.'))), requirements: rows };
  }
  const groups: TalentCheck[] = [];
  condition.groups.forEach((group, groupIndex) => {
    if (!group) { groups.push(checked(reason('condition-group-missing', 'A purchase requirement group is missing.'))); return; }
    const mandatory: TalentCheck[] = [], optional: TalentCheck[] = [];
    group.requirements.forEach((raw, index) => {
      const target = predicateTarget(raw);
      const name = target ? scope.targets.get(target)?.[0]?.node.target.name ?? 'External ability or bonus' : 'Purchase requirement';
      let check: TalentCheck;
      if (!raw || !target || !['Mandatory', 'Optional'].includes(String(raw.conditionRule))) {
        check = checked(reason('purchase-predicate-not-verified', 'This purchase predicate is not verified.'));
      } else {
        const known = knowledge.get(target);
        const membership = enumName(raw.knowledge);
        if (!['Known', 'Unknown'].includes(membership ?? '') || typeof raw.boolBalue1 !== 'boolean') {
          check = checked(reason('knowledge-operands-not-verified', `${name}: knowledge operands are not verified.`, 'unverified', target));
        } else if (!known || known.rank === null || known.status === 'unverified') {
          check = checked(reason('knowledge-not-verified', `${name}: knowledge is not verified.`, 'unverified', target));
        } else if (known.status === 'blocked') {
          check = checked(reason('dependency-blocked', `${name}: a prerequisite allocation is blocked.`, 'blocked', target));
        } else if (membership === 'Unknown') {
          check = known.rank === 0 ? checked() : checked(reason('must-be-unknown', `${name} must not be learned.`, 'blocked', target));
        } else if (known.rank === 0) {
          check = checked(reason('must-be-known', `${name} must be learned.`, 'blocked', target));
        } else if (raw.boolBalue1) {
          const comparison = enumName(raw.value) ?? '';
          const compare = Object.hasOwn(comparators, comparison) ? comparators[comparison] : undefined;
          if (!compare || typeof raw.amount1 !== 'number' || !Number.isSafeInteger(raw.amount1)) check = checked(reason('rank-comparison-not-verified', `${name}: rank comparison is not verified.`, 'unverified', target));
          else check = compare(known.rank, raw.amount1) ? checked() : checked(reason('rank-requirement', `${name} does not meet the required rank comparison (${enumName(raw.value)}, ${raw.amount1}).`, 'blocked', target));
        } else check = checked();
      }
      const row: RequirementRow = { ...check, group: groupIndex, index, optional: raw?.conditionRule === 'Optional', target, raw };
      rows.push(row);
      (row.optional ? optional : mandatory).push(check);
    });
    const checks = [...mandatory];
    if (optional.length) {
      const threshold = group.checkCount === false ? 1 : group.checkCount === true && whole(group.requiredCount) ? group.requiredCount : null;
      const passed = optional.filter(row => row.status === 'verified').length;
      const unknown = optional.filter(row => row.status === 'unverified').length;
      if (threshold === null) checks.push(checked(reason('optional-threshold-not-verified', 'The optional requirement threshold is not verified.')));
      else if (passed < threshold) {
        const status = passed + unknown < threshold ? 'blocked' : 'unverified';
        checks.push({ status, reasons: [reason('optional-threshold', `Optional requirements: ${passed} verified of ${threshold} needed.`, status), ...optional.flatMap(row => row.reasons)] });
      }
    }
    groups.push(combineTalentChecks(checks));
  });
  // Computed operand gaps are already handled in their exact group. Unknown new evidence gaps remain visible.
  const handled = ['purchase-predicate-not-verified', 'predicate-missing', 'optional-threshold-mode-missing', 'optional-threshold-missing', 'condition-group-missing'];
  groups.push(checked(...condition.gaps.filter(gap => !handled.includes(gap)).map(gap => reason(gap, 'Purchase evidence is incomplete.'))));
  return { ...combineTalentChecks(groups), requirements: rows };
}

/** Only the published, build-matched base Talent Point schedule is derived; no activity totals or modifiers are inferred. */
export function baseTalentPoints(payload: StaticPlanner, type: string, level: number): number | null {
  const grant = payload.pointTypes.find(point => point.key === type)?.baseLevelGrant;
  if (payload.buildId !== '25653798' || type !== 'treePoints:0' || grant?.rule !== 'build-25653798-base-talent-points'
    || grant.start !== 1 || grant.perLevel !== 3 || grant.positiveCap !== 180 || !whole(level) || level < 1) return null;
  return Math.min(180, 1 + 3 * (level - 1));
}

/** Build an index once per loaded planner resource; neither creation nor evaluation reads storage or fetches data. */
export function createTalentEvaluator(payload: StaticPlanner): TalentEvaluator {
  const treeIndex = new Map(payload.trees.flatMap(tree => tree.key ? [[tree.key, tree] as const] : []));
  const pointIndex = new Map(payload.pointTypes.flatMap(point => point.key ? [[point.key, point] as const] : []));
  function scope(build: PlannerBuild): TalentScope {
    const identity = payload.classes.find(row => row.key === build.class);
    const race = payload.races.find(row => row.key === build.race);
    const reasons: TalentReason[] = [];
    if (!identity) reasons.push(reason('class-unresolved', 'The selected class is not published.'));
    if (!race) reasons.push(reason('race-unresolved', 'The selected race is not published.'));
    else if (!race.offeredClasses.some(row => row.key === build.class)) reasons.push(reason('class-not-offered', 'The selected race does not offer this class.', 'blocked'));
    if (!identity?.levels) reasons.push(reason('level-bounds-missing', 'Published level bounds are not available.'));
    else if (!Number.isSafeInteger(build.level) || build.level < identity.levels.min || build.level > identity.levels.max) reasons.push(reason('level-out-of-bounds', 'The selected level is outside the published range.', 'blocked'));
    const trees = identity?.trees.flatMap(ref => ref.key && treeIndex.has(ref.key) ? [treeIndex.get(ref.key)!] : []) ?? [];
    if (identity?.trees.some(ref => !ref.key || !treeIndex.has(ref.key))) reasons.push(reason('tree-unresolved', 'A class talent tree is not available.'));
    const nodes = new Map<string, { tree: TalentTree; node: PlannerNode }>();
    const targets = new Map<string, { tree: TalentTree; node: PlannerNode }[]>();
    for (const tree of trees) for (const node of tree.nodes) {
      nodes.set(talentNodeKey({ tree: tree.key!, node: node.index }), { tree, node });
      if (node.target.key) {
        const locations = targets.get(node.target.key) ?? [];
        locations.push({ tree, node }); targets.set(node.target.key, locations);
      }
    }
    return { trees, nodes, targets, check: checked(...reasons) };
  }
  function initialKnowledge(current: TalentScope): Map<string, { rank: number | null; status: TalentStatus }> {
    const known = new Map<string, { rank: number | null; status: TalentStatus }>();
    for (const [target, locations] of current.targets) {
      const defaults = locations.map(row => row.node.defaultRank);
      const verified = payload.buildId === '25653798' && defaults.every(whole);
      known.set(target, { rank: verified ? Math.max(...defaults as number[]) : null, status: verified ? 'verified' : 'unverified' });
    }
    return known;
  }
  function rankCheck(build: PlannerBuild, current: TalentScope, known: TalentKnowledge, row: TalentPurchase, rank: number | null, mode: TalentMode, ordinal: number | null): PurchaseEvaluation {
    const resolved = current.nodes.get(talentNodeKey(row));
    if (!resolved) return { ...row, mode, ordinal, rank, cost: null, pointType: null, requirements: [], useEffectCondition: null, ...checked(reason('node-unresolved', 'This selected talent is not available for the published class.')) };
    const { node, tree } = resolved;
    const facts: TalentReason[] = [];
    if (payload.buildId !== '25653798' || !['ability', 'bonus'].includes(node.kind)) facts.push(reason('node-kind-not-verified', 'Purchase behavior is not verified for this talent.'));
    if (node.target.key === null) facts.push(reason('node-target-unresolved', 'The talent target is not available.'));
    if (rank === null || node.defaultRank === null) facts.push(reason('default-knowledge-missing', 'The starting rank is not verified.'));
    if (node.rankLimit === null) facts.push(reason('rank-limit-missing', 'The talent rank limit is not verified.'));
    else if (rank !== null && rank > node.rankLimit) facts.push(reason('rank-limit', 'The selected rank exceeds the authored limit.', 'blocked'));
    const authored = node.ranks.find(entry => entry.rank === rank);
    const cost = authored && whole(authored.authoredCost) ? authored.authoredCost : null;
    if (cost === null) facts.push(reason('rank-cost-missing', 'The authored next-rank cost is not verified.'));
    if (!tree.pointType || !pointIndex.has(tree.pointType)) facts.push(reason('point-type-unresolved', 'The point type for this talent is not verified.'));
    const conditions = evaluatePurchaseCondition(node.purchaseCondition, known, current, payload.buildId === '25653798');
    return { ...row, mode, ordinal, rank, cost, pointType: tree.pointType, useEffectCondition: authored?.useEffectCondition ?? null,
      requirements: conditions.requirements, ...combineTalentChecks([current.check, checked(...facts), conditions]) };
  }
  function evaluate(build: PlannerBuild, options: { mode?: TalentMode } = {}): TalentEvaluation {
    const mode = options.mode ?? 'preview', current = scope(build), known = initialKnowledge(current);
    const purchases: PurchaseEvaluation[] = [];
    const selected = new Map<string, { row: TalentPurchase; increments: number; ranks: PurchaseEvaluation[] }>();
    const spent = new Map<string, { known: number; unknown: boolean }>();
    const total = (type: string): number | null => build.points.find(point => point.type === type)?.total ?? baseTalentPoints(payload, type, build.level);
    function account(entry: PurchaseEvaluation): PurchaseEvaluation {
      if (entry.pointType) {
        const balance = spent.get(entry.pointType) ?? { known: 0, unknown: false };
        if (entry.cost === null) balance.unknown = true; else balance.known += entry.cost;
        spent.set(entry.pointType, balance);
        const available = total(entry.pointType);
        const name = pointIndex.get(entry.pointType)?.name ?? 'Unresolved point type';
        const budget = available === null ? checked(reason('remaining-not-verified', `${name}: remaining points are not verified.`))
          : balance.known > available ? checked(reason('point-shortfall', `${name}: ${balance.known - available} more needed.`, 'blocked'))
          : balance.unknown ? checked(reason('spent-not-verified', `${name}: selected costs are not verified.`)) : checked();
        return { ...entry, ...combineTalentChecks([entry, budget]) };
      }
      return entry;
    }
    function remember(entry: PurchaseEvaluation, increment: number): void {
      const key = talentNodeKey(entry), previous = selected.get(key);
      if (previous) { previous.increments += increment; previous.ranks.push(entry); }
      else selected.set(key, { row: { tree: entry.tree, node: entry.node }, increments: increment, ranks: [entry] });
    }
    if (build.talents.kind === 'ordered') {
      for (const [index, row] of build.talents.purchases.entries()) {
        const node = current.nodes.get(talentNodeKey(row))?.node;
        const previous = selected.get(talentNodeKey(row));
        const rank = node?.defaultRank === null || !node ? null : node.defaultRank + (previous?.increments ?? 0) + 1;
        let entry = rankCheck(build, current, known, row, rank, mode, index + 1);
        if (previous && previous.ranks.some(rank => rank.status !== 'verified')) entry = { ...entry, ...combineTalentChecks([entry, checked(reason('prior-rank-not-verified', 'An earlier rank of this talent is blocked or not verified.', previous.ranks.some(rank => rank.status === 'blocked') ? 'blocked' : 'unverified'))]) };
        if (current.nodes.get(talentNodeKey(row))?.tree.pointType !== 'treePoints:0') entry = { ...entry, ...combineTalentChecks([entry, checked(reason('ordered-point-type-not-verified', 'Only Talent Point purchases have a verified ordered stream.'))]) };
        entry = account(entry); purchases.push(entry); remember(entry, 1);
        if (node?.target.key) {
          const previousKnown = known.get(node.target.key);
          if (entry.status === 'verified' && rank !== null) known.set(node.target.key, { rank, status: 'verified' });
          else if (!previousKnown?.rank) known.set(node.target.key, { rank: entry.status === 'blocked' ? 0 : null, status: entry.status });
        }
      }
    }
    // Final snapshots assert current ranks, not purchase history. Seed final knowledge and downgrade
    // invalid prerequisites to their verified earlier/default rank until dependent checks stabilize.
    const finalRows = [...(build.talents.kind === 'unknown-order' ? build.talents.ranks : []), ...build.heroic];
    const beforeFinal = new Map(known);
    for (const row of finalRows) {
      const target = current.nodes.get(talentNodeKey(row))?.node.target.key;
      if (target) known.set(target, { rank: row.rank, status: 'verified' });
    }
    for (let pass = 0; pass <= finalRows.length; pass++) {
      let changed = false;
      for (const row of finalRows) {
        const target = current.nodes.get(talentNodeKey(row))?.node.target.key;
        if (!target) continue;
        const check = rankCheck(build, current, known, row, row.rank, mode, null);
        if (check.status === 'verified') continue;
        const fallback = beforeFinal.get(target);
        const next = fallback?.rank ? fallback : { rank: check.status === 'blocked' ? 0 : null, status: check.status };
        const previous = known.get(target);
        if (previous?.rank !== next.rank || previous?.status !== next.status) { known.set(target, next); changed = true; }
      }
      if (!changed) break;
    }
    if (build.talents.kind === 'unknown-order') evaluateFinal(build.talents.ranks, false);
    // Heroic never supplies knowledge to the earlier ordinary purchase timeline.
    evaluateFinal(build.heroic, true);
    function evaluateFinal(rows: readonly FinalRank[], heroic: boolean): void {
      for (const row of rows) {
        const resolved = current.nodes.get(talentNodeKey(row)), defaultRank = resolved?.node.defaultRank;
        const start = defaultRank ?? 0;
        if (row.rank < start) {
          const entry = { ...rankCheck(build, current, known, row, row.rank, mode, null), ...checked(reason('below-free-default', 'A free starting rank cannot be removed.', 'blocked')) };
          remember(entry, 0); continue;
        }
        for (let rank = start + 1; rank <= row.rank; rank++) {
          let entry = rankCheck(build, current, known, row, defaultRank === null ? null : rank, mode, null);
          if (resolved?.tree.pointType !== (heroic ? 'treePoints:2' : 'treePoints:0')) entry = { ...entry, ...combineTalentChecks([entry, checked(reason('allocation-point-type-not-verified', 'This allocation does not use the expected point type.'))]) };
          entry = account(entry); remember(entry, 1);
        }
      }
    }
    const balances: TalentBalance[] = [...new Set([...current.trees.flatMap(tree => tree.pointType ? [tree.pointType] : []), ...build.points.map(point => point.type)])].map(type => {
      const point = pointIndex.get(type), entered = build.points.find(row => row.type === type), base = baseTalentPoints(payload, type, build.level);
      const earned = point ? entered?.total ?? base : null, spend = spent.get(type) ?? { known: 0, unknown: false };
      const spentAmount = spend.unknown ? null : spend.known;
      const remaining = earned === null || spentAmount === null ? null : earned - spentAmount;
      return { type, name: point?.name ?? 'Unresolved point type', base, total: earned, provenance: entered && point ? 'entered' : base !== null ? 'base-level' : 'unknown',
        sourceLabel: entered && point ? 'Entered by You' : base !== null ? 'From Your Level' : 'Not Verified', basis: entered && point ? 'entered-total' : base !== null ? 'base-plan' : 'unknown',
        knownSpent: spend.known, spent: spentAmount, remaining, shortfall: earned === null || (spentAmount === null && spend.known <= earned) ? null : Math.max(0, spend.known - earned),
        remainingLabel: remaining === null ? 'Remaining Not Verified' : `${remaining} remaining`, gaps: point?.gaps ?? ['point-type-unresolved'] };
    });
    if ([...selected.values()].some(row => row.ranks.some(entry => entry.pointType === null))) balances.push({
      type: null, name: 'Unresolved point type', base: null, total: null, provenance: 'unknown', sourceLabel: 'Not Verified', basis: 'unknown',
      knownSpent: 0, spent: null, remaining: null, shortfall: null, remainingLabel: 'Remaining Not Verified', gaps: ['point-type-unresolved'],
    });
    const allocations: TalentAllocation[] = [];
    for (const [key, { tree, node }] of current.nodes) {
      const picked = selected.get(key), ranks = picked?.ranks ?? [], increments = picked?.increments ?? 0;
      const final = finalRows.find(row => talentNodeKey(row) === key);
      const defaultCheck = payload.buildId === '25653798' ? checked() : checked(reason('default-rules-not-verified', 'Free starting ranks are not verified for this game build.'));
      if (increments || ranks.length || (node.defaultRank ?? 0) > 0) allocations.push({ tree: tree.key!, node: node.index, mode, defaultRank: node.defaultRank,
        rank: final?.rank ?? (node.defaultRank === null ? null : node.defaultRank + increments), selectedIncrements: increments, ranks, ...combineTalentChecks([defaultCheck, ...ranks]) });
    }
    for (const [key, picked] of selected) if (!current.nodes.has(key)) allocations.push({ ...picked.row, mode, defaultRank: null, rank: finalRows.find(row => talentNodeKey(row) === key)?.rank ?? null, selectedIncrements: picked.increments, ranks: picked.ranks, ...combineTalentChecks(picked.ranks) });
    const heroicTrees = new Set(build.heroic.map(row => row.tree));
    const overall = combineTalentChecks([current.check, ...allocations]);
    return { ...overall, mode, order: build.talents.kind, allocations, purchases, heroic: allocations.filter(row => heroicTrees.has(row.tree)), balances,
      unresolved: [...selected.values()].filter(row => !current.nodes.has(talentNodeKey(row.row))).map(row => row.row) };
  }
  function inspectNextRank(build: PlannerBuild, row: TalentPurchase): PurchaseEvaluation {
    const current = scope(build), resolved = current.nodes.get(talentNodeKey(row));
    if (resolved?.tree.pointType === 'treePoints:2') {
      const final = build.heroic.find(entry => talentNodeKey(entry) === talentNodeKey(row));
      const rank = (final?.rank ?? resolved.node.defaultRank ?? 0) + 1;
      const edited = { ...build, heroic: [...build.heroic.filter(entry => talentNodeKey(entry) !== talentNodeKey(row)), { ...row, rank }] };
      return evaluate(edited, { mode: 'preview' }).allocations.find(entry => talentNodeKey(entry) === talentNodeKey(row))!.ranks.at(-1)!;
    }
    if (build.talents.kind === 'unknown-order') {
      const final = build.talents.ranks.find(entry => talentNodeKey(entry) === talentNodeKey(row));
      const rank = (final?.rank ?? resolved?.node.defaultRank ?? 0) + 1;
      const edited: PlannerBuild = { ...build, talents: { kind: 'unknown-order', ranks: [...build.talents.ranks.filter(entry => talentNodeKey(entry) !== talentNodeKey(row)), { ...row, rank }] } };
      return evaluate(edited, { mode: 'preview' }).allocations.find(entry => talentNodeKey(entry) === talentNodeKey(row))!.ranks.at(-1)!;
    }
    return evaluate({ ...build, talents: { kind: 'ordered', purchases: [...build.talents.purchases, row] } }, { mode: 'preview' }).purchases.at(-1)!;
  }
  function dependencyChain(build: PlannerBuild, selected: TalentPurchase): DependencyChain {
    const current = scope(build), edges: DependencyEdge[] = [], unresolved = new Map<string, Set<string>>();
    for (const [key, { tree, node }] of current.nodes) for (const [group, conditions] of (node.purchaseCondition.groups ?? []).entries()) for (const raw of conditions?.requirements ?? []) {
      const target = predicateTarget(raw); if (!target) continue;
      const locations = current.targets.get(target);
      if (!locations) { const targets = unresolved.get(key) ?? new Set(); targets.add(target); unresolved.set(key, targets); }
      else for (const location of locations) edges.push({ from: { tree: location.tree.key!, node: location.node.index }, to: { tree: tree.key!, node: node.index }, target, optional: raw?.conditionRule === 'Optional', group });
    }
    // Traverse ancestors and descendants independently: a sibling sharing an ancestor is not part of this node's chain.
    const keys = new Set([talentNodeKey(selected)]);
    for (const direction of ['up', 'down']) {
      const visited = new Set([talentNodeKey(selected)]), queue = [talentNodeKey(selected)];
      for (let index = 0; index < queue.length; index++) for (const edge of edges) {
        const source = talentNodeKey(direction === 'up' ? edge.to : edge.from), destination = talentNodeKey(direction === 'up' ? edge.from : edge.to);
        if (source === queue[index] && !visited.has(destination)) { visited.add(destination); keys.add(destination); queue.push(destination); }
      }
    }
    return { nodes: [...keys].map(key => { const location = current.nodes.get(key); return location ? { tree: location.tree.key!, node: location.node.index } : selected; }),
      edges: edges.filter(edge => keys.has(talentNodeKey(edge.from)) && keys.has(talentNodeKey(edge.to))), unresolvedTargets: [...new Set([...keys].flatMap(key => [...(unresolved.get(key) ?? [])]))] };
  }
  return { payload, scope, initialKnowledge, rankCheck, evaluate, inspectNextRank, dependencyChain };
}
