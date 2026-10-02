/**
 * Column widths of a list table. A browser's automatic table layout gives spare width to the columns with the longest
 * content, so one long name pushes every other column away and leaves gaps between short values. The list instead
 * sizes each column to its widest value and spreads the spare width evenly between the columns, so the space between
 * neighbouring values is the same and the table still fills its card.
 *
 * - `name` is the entry's own link and `text` names other things (a place, a chain, a quest giver). Both stay on one
 *   line, end in an ellipsis past their cap, and shrink toward their floor when the columns do not fit.
 * - `label` is a short category or level range, and `number` a count or amount. Neither is ever cut.
 */
export type ColumnShape = 'name' | 'text' | 'label' | 'badges' | 'number';

// Caps sit near the longest ordinary value, so a rare long variant name is cut instead of widening its column. Floors
// keep a few words of a value readable.
const REM = 16;
const LIMITS: Record<'name' | 'text' | 'label', { cap: number; floor: number }> = {
  name: { cap: 22 * REM, floor: 9 * REM },
  text: { cap: 16 * REM, floor: 6 * REM },
  label: { cap: Infinity, floor: 5 * REM },
};
// Names and texts give up width first. A label gives up width only when they are at their floors. Badges and numbers
// keep their width, because a badge cannot end in an ellipsis and a number cut short would read as another number.
const STAGES: ReadonlyArray<ReadonlySet<ColumnShape>> = [new Set(['name', 'text']), new Set(['label'])];

// The columns of other things' names, and the columns that show badges. Every other non-numeric column is a label.
const TEXT_COLUMNS: ReadonlySet<string> = new Set(['place', 'chain', 'area', 'giver', 'source']);
const BADGE_COLUMNS: ReadonlySet<string> = new Set(['role']);

/** The shape of a published list column. The first column of every list is the entry's name. */
export function columnShape(id: string, numeric: boolean): ColumnShape {
  if (id === 'name') return 'name';
  if (numeric) return 'number';
  if (BADGE_COLUMNS.has(id)) return 'badges';
  return TEXT_COLUMNS.has(id) ? 'text' : 'label';
}

const limits = (shape: ColumnShape) => shape === 'name' || shape === 'text' || shape === 'label' ? LIMITS[shape] : undefined;

/**
 * The width of each column, in pixels, from its natural width (its widest value or heading, with padding) and the
 * width available to the table. When the columns fit, the spare width first shows cut texts in full. The rest is spread
 * in equal parts between neighbouring columns, and after the last column when its values are left-aligned, so the space
 * between values is the same everywhere. A part goes to the column where it shows: after a left-aligned value, or before
 * a number, which is right-aligned. A number followed by a left-aligned column has no such room between them, so that
 * pair gets no part. A name keeps its cap and gains only its part, so one rare long name does not push the other columns
 * away. When the columns do not fit, names and texts shrink toward their floors in proportion to the width they can give,
 * and then labels do. If even the floors do not fit, the table is as wide as its floors and the page scrolls it.
 */
export function columnWidths(columns: ReadonlyArray<{ shape: ColumnShape; natural: number }>, available: number): number[] {
  const widths = columns.map(({ shape, natural }) => Math.min(natural, limits(shape)?.cap ?? natural));
  const total = widths.reduce((sum, width) => sum + width, 0);
  if (total <= available) {
    let spare = available - total;
    const needs = columns.map(({ shape, natural }, index) => shape === 'text' ? natural - widths[index]! : 0);
    const need = needs.reduce((sum, width) => sum + width, 0);
    if (need > 0) {
      const given = Math.min(spare, need);
      needs.forEach((width, index) => { widths[index]! += given * (width / need); });
      spare -= given;
    }
    const right = (index: number) => columns[index]!.shape === 'number';
    const receivers: number[] = [];
    for (let index = 0; index + 1 < columns.length; index += 1) {
      if (!right(index)) receivers.push(index);
      else if (right(index + 1)) receivers.push(index + 1);
    }
    if (columns.length > 0 && !right(columns.length - 1)) receivers.push(columns.length - 1);
    for (const index of receivers) widths[index]! += spare / receivers.length;
    return widths.map(Math.floor);
  }
  let deficit = total - available;
  for (const stage of STAGES) {
    const give = columns.map(({ shape }, index) => stage.has(shape) ? Math.max(0, widths[index]! - Math.min(widths[index]!, limits(shape)!.floor)) : 0);
    const givable = give.reduce((sum, width) => sum + width, 0);
    if (givable === 0) continue;
    const taken = Math.min(deficit, givable);
    give.forEach((width, index) => { widths[index]! -= taken * (width / givable); });
    deficit -= taken;
    if (deficit <= 0) break;
  }
  return widths.map(Math.floor);
}
