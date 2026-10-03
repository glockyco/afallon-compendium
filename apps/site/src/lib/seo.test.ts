import { expect, test } from 'bun:test';
import type { ArtRef, StaticDocument } from '@afallon/contracts/public';
import { absolutePageUrl, entityDescription, entitySocialArt, jsonLdScript } from './seo';

const item = (overrides: Record<string, unknown> = {}): StaticDocument => ({
  kind: 'items', document: {
    ref: { name: "Footman's Bulwark" }, facts: { rarity: 'Uncommon', itemType: 'Shield' },
    droppedBy: [{ counterpart: { name: 'Forest Scout' }, creatureLevel: { min: 6, max: 14 } }],
    soldBy: [], inContainers: [], collectedFrom: [], ...overrides,
  },
}) as unknown as StaticDocument;

test('summarizes item rarity and level-restricted drops without implying every creature drops it', () => {
  expect(entityDescription(item())).toContain('uncommon shield in Afallon. Forest Scout can drop it at levels 6–14.');
});

test('a world drop from any creature states its actual eligible levels', () => {
  expect(entityDescription(item({ droppedBy: [{ counterpart: { key: null, label: 'Any creature' }, creatureLevel: { min: 6, max: 14 } }] }))).toContain('It can drop from creatures at levels 6–14.');
  expect(entityDescription(item({ droppedBy: [{ counterpart: { key: null, label: 'Any creature' }, creatureLevel: { min: 1 } }] }))).toContain('It can drop from creatures.');
});

test('uses an available container source before creature drops and never invents absent sources', () => {
  expect(entityDescription(item({ inContainers: [{ label: 'Locked Wooden Treasure Chest' }] }))).toContain('Find it in Locked Wooden Treasure Chest. Forest Scout can drop it at levels 6–14.');
  expect(entityDescription(item({ droppedBy: [] }))).not.toMatch(/can drop|sells it|Find it in/);
});

test('uses only known NPC level and place, without inventing a location for an unplaced NPC', () => {
  const npc = (locations: unknown[]) => ({ kind: 'npcs', document: {
    ref: { name: 'Training Dummy' }, facts: { npcType: 'Creature', level: { min: 5, max: 5 } },
    locations, places: [], drops: [],
  } }) as unknown as StaticDocument;
  expect(entityDescription(npc([{ label: 'Oakwood Training Grounds' }]))).toContain('creature, level 5 in Afallon. Find Training Dummy in Oakwood Training Grounds.');
  expect(entityDescription(npc([]))).not.toContain('Find Training Dummy in');
  const scalingNpc = { kind: 'npcs', document: {
    ref: { name: 'Training Dummy' }, facts: { npcType: 'MOB', creatureType: 'MECHANICAL', level: { min: 15, max: 30, scales: true }, roles: [] },
    locations: [{ label: 'Oakenvale' }], places: [], drops: [],
  } } as unknown as StaticDocument;
  expect(entityDescription(scalingNpc)).toContain('mechanical creature in Afallon. Find Training Dummy in Oakenvale. Its level adjusts to your character.');
});

test('an oversized source does not cut a fact in half', () => {
  const description = entityDescription(item({ inContainers: [{ label: 'A '.repeat(100) + 'Treasure' }] }));
  expect(description).toContain('uncommon shield in Afallon.');
  expect(description).not.toContain('Find it in A');
});

test('equipment and quest summaries use complete player-facing facts', () => {
  const gloves = item({ ref: { name: "Scout's Gloves" }, facts: { rarity: 'Uncommon', itemType: 'ARMOR', armorType: 'LEATHER', slot: 'GLOVES' }, droppedBy: [] });
  expect(entityDescription(gloves)).toContain("Scout's Gloves is a pair of uncommon leather gloves in Afallon.");
  const quest = { kind: 'quests', document: {
    ref: { name: 'Eggs-traordinary Collection' }, description: null,
    facts: { levelRange: { min: 15, max: 30 } },
    objectives: [{ type: 'getItem', count: 10, target: { key: 'items:90', kind: 'items', name: 'Funnel Weaver Egg' } }],
    starts: [{ kind: 'npc', npc: { key: 'npcs:58', kind: 'npcs', name: 'Esko' } }],
  } } as unknown as StaticDocument;
  expect(entityDescription(quest)).toContain('Collect Funnel Weaver Egg (10 needed). Start it with Esko.');
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
