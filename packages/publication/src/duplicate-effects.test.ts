import { expect, test } from 'bun:test';
import type { EntityRef, PublicDocument, PublicEffect } from '@afallon/contracts/public';
import { mergeEquivalentEffects } from './duplicate-effects';

test('equal effects share one page while keeping both distinct applying sources and retargeting links', () => {
  const first = { key: 'effects:403', kind: 'effects', name: 'Bleeding Strike', slug: 'bleeding-strike' } as EntityRef;
  const second = { key: 'effects:404', kind: 'effects', name: 'Bleeding Strike', slug: 'bleeding-strike-404' } as EntityRef;
  const source = (name: string): PublicEffect['appliedBy'][number] => ({ source: { key: null, label: name }, via: 'Ability' });
  const effect = (ref: EntityRef, appliedBy: PublicEffect['appliedBy']): PublicEffect => ({
    ref, art: {}, description: null, type: 'Damage Over Time', durationSeconds: 6, stackLimit: 1,
    ranks: [{ rank: 0, actions: [{ label: 'Authored Damage', amount: 35 }] }],
    appliedBy, checkedBy: [], worldSources: [], explainedBy: [],
  }) as unknown as PublicEffect;
  const documents = new Map<string, PublicDocument>([
    [first.key, effect(first, [source('Ground Slam')])],
    [second.key, effect(second, [source('Bleeding Strike')])],
    ['abilities:8', { ref: { key: 'abilities:8', kind: 'abilities', name: 'Lacerate', slug: 'lacerate' }, versions: [{ appliedEffects: [{ effect: second }] }] } as unknown as PublicDocument],
  ]);
  const refs = new Map([[first.key, first], [second.key, second]]);
  const replaced = mergeEquivalentEffects(documents, refs);
  expect(replaced.get(second.key)).toEqual(first);
  expect(documents.has(second.key)).toBe(false);
  expect((documents.get(first.key) as PublicEffect).appliedBy.map((row) => row.source.key === null ? row.source.label : row.source.name)).toEqual(['Ground Slam', 'Bleeding Strike']);
  const linked = documents.get('abilities:8') as unknown as { versions: { appliedEffects: { effect: EntityRef }[] }[] };
  expect(linked.versions[0]!.appliedEffects[0]!.effect).toEqual(first);
});

test('different stacking rules keep separate effects', () => {
  const docs = new Map<string, PublicDocument>();
  const refs = new Map<string, EntityRef>();
  for (const [key, stackLimit] of [['effects:403', 1], ['effects:404', 2]] as const) {
    const ref = { key, kind: 'effects', name: 'Bleeding Strike', slug: key === 'effects:403' ? 'bleeding-strike' : 'bleeding-strike-404' } as EntityRef;
    refs.set(key, ref);
    docs.set(key, { ref, art: {}, description: null, type: 'Damage Over Time', stackLimit, ranks: [], appliedBy: [], worldSources: [], checkedBy: [], explainedBy: [] } as unknown as PublicEffect);
  }
  expect(mergeEquivalentEffects(docs, refs).size).toBe(0);
  expect(docs.size).toBe(2);
});
