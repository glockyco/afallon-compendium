import type { EntityRef, PublicDocument, PublicEffect } from '@afallon/contracts/public';

/** A different source can apply the same effect without creating a different gameplay outcome. */
function gameplaySignature(effect: PublicEffect): string {
  const { ref, appliedBy, checkedBy, worldSources, explainedBy, ...gameplay } = effect;
  return JSON.stringify(gameplay);
}

function combineRows<Row>(first: readonly Row[], second: readonly Row[]): Row[] {
  const rows = [...first], seen = new Set(rows.map((row) => JSON.stringify(row)));
  for (const row of second) {
    const key = JSON.stringify(row);
    if (!seen.has(key)) { seen.add(key); rows.push(row); }
  }
  return rows;
}

/** Retarget links inside projected documents without modifying their shared input references. */
function retarget(value: unknown, replacements: ReadonlyMap<string, EntityRef>): unknown {
  if (!value || typeof value !== 'object') return value;
  if (Array.isArray(value)) {
    let updated: unknown[] | undefined;
    for (let index = 0; index < value.length; index++) {
      const child = retarget(value[index], replacements);
      if (child !== value[index]) {
        updated ??= value.slice();
        updated[index] = child;
      }
    }
    return updated ?? value;
  }
  const record = value as Record<string, unknown>;
  if (record.kind === 'effects' && typeof record.key === 'string') {
    const replacement = replacements.get(record.key);
    if (replacement) return record.variant ? { ...replacement, variant: record.variant } : replacement;
  }
  let updated: Record<string, unknown> | undefined;
  for (const [key, child] of Object.entries(record)) {
    const next = retarget(child, replacements);
    if (next !== child) {
      updated ??= { ...record };
      updated[key] = next;
    }
  }
  return updated ?? value;
}

/** Collapse only equal player-visible effects, preserving each distinct way to apply or check one. */
export function mergeEquivalentEffects(documents: Map<string, PublicDocument>, refs: Map<string, EntityRef>): ReadonlyMap<string, EntityRef> {
  const groups = new Map<string, PublicEffect[]>();
  for (const document of documents.values()) if (document.ref.kind === 'effects') {
    const effect = document as PublicEffect;
    const key = `${effect.ref.name.normalize('NFKC').toLowerCase()}\0${gameplaySignature(effect)}`;
    let group = groups.get(key);
    if (!group) { group = []; groups.set(key, group); }
    group.push(effect);
  }
  const replacements = new Map<string, EntityRef>();
  for (const group of groups.values()) {
    if (group.length < 2) continue;
    group.sort((left, right) => (left.ref.slug?.length ?? Infinity) - (right.ref.slug?.length ?? Infinity)
      || (left.ref.slug ?? '').localeCompare(right.ref.slug ?? ''));
    const keep = group[0]!;
    for (const duplicate of group.slice(1)) {
      keep.appliedBy = combineRows(keep.appliedBy, duplicate.appliedBy);
      keep.checkedBy = combineRows(keep.checkedBy, duplicate.checkedBy);
      keep.worldSources = combineRows(keep.worldSources, duplicate.worldSources);
      keep.explainedBy = combineRows(keep.explainedBy, duplicate.explainedBy);
      replacements.set(duplicate.ref.key, keep.ref);
      documents.delete(duplicate.ref.key);
      refs.set(duplicate.ref.key, keep.ref);
    }
  }
  if (replacements.size) for (const [key, document] of documents) documents.set(key, retarget(document, replacements) as PublicDocument);
  return replacements;
}
