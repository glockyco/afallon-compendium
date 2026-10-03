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

test('same-kind collisions do not repeat the kind and prefer a short true qualifier', async () => {
  const teleport = (slug: string, destination: string) => ({ kind: 'effects', document: {
    ref: { key: `effects:${slug}`, kind: 'effects', name: 'Unnamed Teleport Effect', slug },
    type: 'Teleport', stackLimit: 1, ranks: [{ rank: 0, actions: [{ label: 'Destination Scene', target: { key: `places:${destination}`, kind: 'places', name: destination } }] }],
    appliedBy: [], worldSources: [],
  } }) as unknown as StaticDocument;
  const one = teleport('unnamed-teleport-effect', 'Afallon'), two = teleport('unnamed-teleport-effect-other', 'Cave');
  const pages = [one, two];
  const indexes = { entries: pages.map((page) => ({ ref: page.document.ref, document: { path: 'resource' } })) } as unknown as MapIndexes;
  const loader = { loadPageForRef: async (ref: { key: string }) => pages.find((page) => page.document.ref.key === ref.key)! } as Pick<MapDataLoader, 'loadPageForRef'>;
  expect((await pageTitle(one, kinds, indexes, loader)).title).toBe('Unnamed Teleport Effect (travels to Afallon) | Afallon Wiki');

  const shared = (kind: string, slug: string, amount: number, source?: string) => ({ kind, document: {
    ref: { key: `${kind}:${slug}`, kind, name: 'Fire Damage', slug },
    type: 'Stat', stackLimit: 1, ranks: [{ rank: 0, actions: [{ label: 'Changes', amount, target: { key: 'stats:9', kind: 'stats', name: 'Fire Damage' } }] }],
    appliedBy: source ? [{ source: { key: null, label: source } }] : [], worldSources: [],
  } }) as unknown as StaticDocument;
  const effect = shared('effects', 'fire-damage-87', 10, 'Minor Potion of Fire Damage');
  const other = shared('effects', 'fire-damage', 20);
  const stat = shared('stats', 'fire-damage', 0);
  const corpus = [effect, other, stat];
  const collisionIndex = { entries: corpus.map((page) => ({ ref: page.document.ref, document: { path: 'resource' } })) } as unknown as MapIndexes;
  const collisionLoader = { loadPageForRef: async (ref: { key: string }) => corpus.find((page) => page.document.ref.key === ref.key)! } as Pick<MapDataLoader, 'loadPageForRef'>;
  expect((await pageTitle(effect, [...kinds, { kind: 'stats', label: 'Stat' } as PublicKindEntry], collisionIndex, collisionLoader)).title)
    .toBe('Fire Damage (Effect, 10 Fire Damage) | Afallon Wiki');
});
