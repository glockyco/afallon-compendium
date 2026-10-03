import { expect, test } from 'bun:test';
import type { ArtRef, StaticDocument } from '@afallon/contracts/public';
import { absolutePageUrl, briefDescription, entityDescription, entitySocialArt, jsonLdScript } from './seo';

const item = (overrides: Record<string, unknown> = {}): StaticDocument => ({
  kind: 'items', document: {
    ref: { name: "Footman's Bulwark" }, facts: { rarity: 'Uncommon', itemType: 'Shield' },
    droppedBy: [{ counterpart: { name: 'Forest Scout' }, creatureLevel: { min: 6, max: 14 } }],
    soldBy: [], inContainers: [], collectedFrom: [], ...overrides,
  },
}) as unknown as StaticDocument;

test('summarizes item rarity and level-restricted drops without implying every creature drops it', () => {
  expect(entityDescription(item())).toContain('uncommon shield in Afallon. Dropped by level 6–14 Forest Scout.');
  expect(entityDescription(item())).toContain('Afallon Compendium wiki');
});

test('a world drop from any creature states its actual eligible levels', () => {
  expect(entityDescription(item({ droppedBy: [{ counterpart: { label: 'Any creature' }, creatureLevel: { min: 6, max: 14 } }] }))).toContain('Dropped by level 6–14 creatures.');
  expect(entityDescription(item({ droppedBy: [{ counterpart: { label: 'Any creature' }, creatureLevel: { min: 1 } }] }))).toContain('Dropped by creatures.');
});

test('uses an available container source before creature drops and never invents absent sources', () => {
  expect(entityDescription(item({ inContainers: [{ label: 'Locked Wooden Treasure Chest' }] }))).toContain('Find it in Locked Wooden Treasure Chest or from level 6–14 Forest Scout.');
  expect(entityDescription(item({ droppedBy: [] }))).not.toMatch(/Dropped by|Sold by|Find it in/);
});

test('uses only known NPC level and place, without inventing a location for an unplaced NPC', () => {
  const npc = (locations: unknown[]) => ({ kind: 'npcs', document: {
    ref: { name: 'Training Dummy' }, facts: { npcType: 'Creature', level: { min: 5, max: 5 } },
    locations, places: [],
  } }) as unknown as StaticDocument;
  expect(entityDescription(npc([{ label: 'Oakwood Training Grounds' }]))).toContain('creature, level 5 in Afallon. Find Training Dummy in Oakwood Training Grounds.');
  expect(entityDescription(npc([]))).not.toContain('Find Training Dummy in');
  const scalingNpc = { kind: 'npcs', document: {
    ref: { name: 'Training Dummy' }, facts: { npcType: 'MOB', creatureType: 'MECHANICAL', level: { min: 15, max: 30, scales: true }, roles: [] },
    locations: [{ label: 'Oakenvale' }], places: [],
  } } as unknown as StaticDocument;
  expect(entityDescription(scalingNpc)).toContain('mechanical creature in Afallon. Find Training Dummy in Oakenvale. Levels 15–30 scale with the player.');
});

test('keeps the boundary intact and omits a partial final word', () => {
  expect(briefDescription('First second third', 12)).toBe('First second');
  expect(briefDescription('Short', 5)).toBe('Short');
  expect(briefDescription('One\n  two ', 7)).toBe('One two');
  expect(briefDescription('Supercalifragilisticexpialidocious'.repeat(10))).toBe('Explore Afallon in the compendium.');
  expect(briefDescription('A '.repeat(77) + 'bigword').length).toBeLessThanOrEqual(155);
  expect(entityDescription(item({ inContainers: [{ label: 'A '.repeat(100) + 'Treasure' }] })).length).toBeLessThanOrEqual(155);
});

test('canonical URLs ignore query and preserve slash paths', () => {
  expect(absolutePageUrl('/map/')).toBe('https://afallon.compendiums.org/map/');
  expect(absolutePageUrl('/items/footmans-bulwark')).toBe('https://afallon.compendiums.org/items/footmans-bulwark/');
});

test('structured names remain valid JSON without closing their script', () => {
  const script = jsonLdScript({ '@type': 'BreadcrumbList', name: '<script>alert(1)</script>' });
  expect(script.match(/<\/script>/g)).toHaveLength(1);
  expect(JSON.parse(script.slice(script.indexOf('>') + 1, -9)).name).toBe('<script>alert(1)</script>');
});

test('sharing art prefers usable artwork and does not upscale small icons', () => {
  const art = (width: number, height: number): ArtRef => ({ url: `art/${'a'.repeat(64)}.webp`, width, height, sha256: 'a'.repeat(64), bytes: 100 });
  const page = (artwork?: ArtRef, portrait?: ArtRef, icon?: ArtRef) =>
    ({ kind: 'places', document: { ref: { name: 'Oakenvale' }, art: { artwork, portrait, icon } } }) as unknown as StaticDocument;
  expect(entitySocialArt(page(art(1200, 700), art(500, 500)))).toEqual(art(1200, 700));
  expect(entitySocialArt(page(art(150, 600), art(400, 400)))).toEqual(art(400, 400));
  expect(entitySocialArt(page(undefined, undefined, art(64, 64)))).toBeUndefined();
});
