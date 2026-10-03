import type { ArtRef, EntityRef } from '@afallon/contracts/public';

/** An entry on a level axis. A missing range is not equivalent to a level-one entry. */
export type ProgressionEntry = {
  ref: EntityRef;
  group: string;
  range: { min: number; max: number } | null;
  artwork?: ArtRef | null;
  detail?: string;
  mapHref?: string;
};

export type ProgressionGroup<T extends ProgressionEntry> = { label: string; entries: T[]; unknown: boolean };

/** Place known categories in order of first available level; keep all unknown ranges together at the end. */
export function progressionGroups<T extends ProgressionEntry>(entries: readonly T[]): ProgressionGroup<T>[] {
  const groups = new Map<string, T[]>();
  const unknown: T[] = [];
  for (const entry of entries) {
    if (!entry.range) { unknown.push(entry); continue; }
    const group = groups.get(entry.group) ?? [];
    group.push(entry);
    groups.set(entry.group, group);
  }
  const compare = (a: T, b: T) => a.range!.min - b.range!.min || a.range!.max - b.range!.max || a.ref.name.localeCompare(b.ref.name);
  const known = [...groups].map(([label, rows]) => ({ label, entries: rows.sort(compare), unknown: false }));
  known.sort((a, b) => a.entries[0]!.range!.min - b.entries[0]!.range!.min || a.label.localeCompare(b.label));
  if (unknown.length) known.push({ label: 'Level Range Unknown', entries: unknown.sort((a, b) => a.ref.name.localeCompare(b.ref.name)), unknown: true });
  return known;
}

/** Inclusive levels occupy one unit apiece, even when a range consists of a single level. */
export function rangePosition(range: { min: number; max: number }, axisEnd: number): { left: number; width: number } {
  return { left: (range.min - 1) / axisEnd * 100, width: (range.max - range.min + 1) / axisEnd * 100 };
}

export function progressionAxis(entries: readonly ProgressionEntry[], readerLevel?: number): number {
  return Math.max(1, readerLevel ?? 1, ...entries.flatMap((entry) => entry.range ? [entry.range.max] : []));
}

/** Round level landmarks; the exact endpoint is shown beside the axis when not round. */
export function levelTicks(axisEnd: number): number[] {
  const ticks = [1];
  for (let level = 10; level <= axisEnd; level += 10) ticks.push(level);
  return ticks;
}
