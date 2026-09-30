import type { PlacedRule, PlacementRef } from '@afallon/contracts/public';
import type { SortValue } from '../table';

/** A value that decides whether a column shows: text, a number, or `undefined` when the row has no value. */
export type ColumnValue = string | number | undefined;

/**
 * What a table does with a column whose rows all hold one value: `keep` it, `omit` it because the value is a default
 * or the page shows it elsewhere, or state the value once in the section's `heading` line. A column without a policy
 * keeps its values, so a table of one row still shows the values that a reader compares, such as a price.
 */
export type SharedPolicy = 'keep' | 'omit' | 'heading';

export interface RelationColumn<Row> {
  id: string;
  label: string;
  /** A short explanation of the game rule behind the values. */
  hint?: string;
  rules?: PlacedRule[];
  numeric?: boolean;
  /** The sort key. A column without one does not sort. */
  sort?: (row: Row) => SortValue;
  /** The value that decides emptiness and equality. It is not the rendered cell. */
  value: (row: Row) => ColumnValue;
  whenShared?: (value: string | number) => SharedPolicy;
}

export interface SharedValue<Row> { column: RelationColumn<Row>; value: string | number }

export interface ColumnPlan<Row> {
  columns: RelationColumn<Row>[];
  /** The values that every row shares and that the heading line states instead of a column. */
  shared: SharedValue<Row>[];
}

const empty = (value: ColumnValue) => value === undefined || value === '';

/** The columns that a table shows for its rows. */
export function planColumns<Row>(columns: readonly RelationColumn<Row>[], rows: readonly NoInfer<Row>[]): ColumnPlan<Row> {
  const plan: ColumnPlan<Row> = { columns: [], shared: [] };
  for (const column of columns) {
    const values = rows.map(column.value);
    if (values.every(empty)) continue;
    const first = values[0];
    if (first !== undefined && !empty(first) && column.whenShared && values.every((value) => value === first)) {
      const policy = column.whenShared(first);
      if (policy === 'omit') continue;
      if (policy === 'heading') { plan.shared.push({ column, value: first }); continue; }
    }
    plan.columns.push(column);
  }
  return plan;
}

/** A column policy that omits the column when its rows share `value`, the default that a reader assumes. */
export const omitWhenShared = (value: string | number) => (shared: string | number): SharedPolicy => shared === value ? 'omit' : 'keep';

/** A column policy that omits the column whatever value its rows share, because the page states it elsewhere. */
export const omitAlways = (): SharedPolicy => 'omit';

/** A column policy that states the shared value in the heading line. */
export const stateInHeading = (): SharedPolicy => 'heading';

/**
 * Groups rows whose `key` matches, in first-seen order, and merges each group into one row. The key holds every value
 * that the merged row takes from its first row, so rows merge only when those values agree. `merge` combines the rest,
 * such as the roles of a quest row or the spots of a connection.
 */
export function mergeRows<Row, Merged>(rows: readonly Row[], key: (row: Row) => string, merge: (group: readonly Row[]) => Merged): Merged[] {
  const groups = new Map<string, Row[]>();
  for (const row of rows) {
    const id = key(row), group = groups.get(id);
    if (group) group.push(row);
    else groups.set(id, [row]);
  }
  return [...groups.values()].map(merge);
}

/** The distinct placements of several rows, in first-seen order, so a merged row counts each map spot once. */
export function uniquePlacements(groups: readonly (readonly PlacementRef[])[]): PlacementRef[] {
  const seen = new Map<string, PlacementRef>();
  for (const placements of groups) for (const placement of placements) if (!seen.has(placement.placementId)) seen.set(placement.placementId, placement);
  return [...seen.values()];
}

/** The first rows of a relation stay visible before its full list opens. */
export const VISIBLE_ROWS = 8;

export function shownRowCount(total: number, expanded: boolean): number {
  return expanded || total <= VISIBLE_ROWS ? total : VISIBLE_ROWS;
}
