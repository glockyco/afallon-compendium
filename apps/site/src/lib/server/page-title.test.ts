import { expect, test } from 'bun:test';
import type { PublicKindEntry, StaticDocument } from '@afallon/contracts/public';
import type { MapIndexes, MapDataLoader } from '../map-data';
import { pageTitle } from './page-title';

const kinds = [{ kind: 'abilities', label: 'Ability' }, { kind: 'effects', label: 'Effect' }] as PublicKindEntry[];
const document = (kind: 'abilities' | 'effects', name: string, slug: string, stackLimit = 1): StaticDocument =>
  ({ kind, document: { ref: { key: `${kind}:${slug}`, kind, name, slug }, type: 'Damage Over Time', stackLimit, ranks: [{ rank: 0, actions: [{ label: 'Authored Damage', amount: 35 }] }], appliedBy: [], worldSources: [] } }) as unknown as StaticDocument;

test('shared names receive visible kind and effect distinctions, unique names stay plain', async () => {
  const unique = document('abilities', 'Ambush', 'ambush');
  const ability = document('abilities', 'Bleeding Strike', 'bleeding-strike');
  const one = document('effects', 'Bleeding Strike', 'bleeding-strike', 1);
  const two = document('effects', 'Bleeding   Strike', 'bleeding-strike-404', 2);
  const pages = [unique, ability, one, two];
  const indexes = { entries: pages.map((page) => ({ ref: page.document.ref, document: { path: 'resource' } })) } as unknown as MapIndexes;
  const loader = { loadPageForRef: async (ref: { key: string }) => pages.find((page) => page.document.ref.key === ref.key)! } as Pick<MapDataLoader, 'loadPageForRef'>;
  expect((await pageTitle(unique, kinds, indexes, loader)).title).toBe('Ambush | Afallon Wiki');
  expect((await pageTitle(ability, kinds, indexes, loader)).title).toBe('Bleeding Strike (Ability) | Afallon Wiki');
  expect(await pageTitle(one, kinds, indexes, loader)).toEqual({ title: 'Bleeding Strike (Effect, stacks up to 1) | Afallon Wiki', effectSubtitle: 'stacks up to 1' });
  expect((await pageTitle(two, kinds, indexes, loader)).effectSubtitle).toBe('stacks up to 2');
});
