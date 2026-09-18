export type SortDirection = 'asc' | 'desc';
export type SortState = { id: string; dir: SortDirection };
export type SortValue = string | number | null | undefined;

/** A first click sorts a number column high to low and a text column A to Z; a repeat flips it. */
export function toggleSort(state: SortState, id: string, numeric = false): SortState {
  if (state.id === id) return { id, dir: state.dir === 'asc' ? 'desc' : 'asc' };
  return { id, dir: numeric ? 'desc' : 'asc' };
}

/** Rows without a value for the active column sort last in both directions. */
export function sortRows<T>(rows: readonly T[], value: (row: T, id: string) => SortValue, state: SortState): T[] {
  const decorated = rows.map((row, index) => ({ row, index, key: value(row, state.id) }));
  const sign = state.dir === 'asc' ? 1 : -1;
  decorated.sort((left, right) => {
    const missingLeft = left.key === null || left.key === undefined || left.key === '';
    const missingRight = right.key === null || right.key === undefined || right.key === '';
    if (missingLeft !== missingRight) return missingLeft ? 1 : -1;
    let comparison = 0;
    if (!missingLeft && !missingRight) {
      comparison = typeof left.key === 'number' && typeof right.key === 'number'
        ? left.key - right.key
        : String(left.key).localeCompare(String(right.key), 'en', { numeric: true });
    }
    return comparison === 0 ? left.index - right.index : comparison * sign;
  });
  return decorated.map((entry) => entry.row);
}
