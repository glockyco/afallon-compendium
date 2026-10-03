import { expect, test } from 'bun:test';
import type { StaticDocument } from '@afallon/contracts/public';
import { absolutePageUrl, briefDescription, entityDescription, jsonLdScript } from './seo';

const item = (overrides: Record<string, unknown> = {}): StaticDocument => ({
  kind: 'items', document: {
    ref: { name: "Footman's Bulwark" }, facts: { rarity: 'Uncommon', itemType: 'Shield' },
    droppedBy: [{ counterpart: { name: 'Forest Scout' }, creatureLevel: { min: 6, max: 14 } }],
    soldBy: [], inContainers: [], collectedFrom: [], ...overrides,
  },
}) as unknown as StaticDocument;

test('summarizes item rarity and level-restricted drops without implying every creature drops it', () => {
  expect(entityDescription(item())).toBe("Footman's Bulwark is an uncommon shield in Afallon. Dropped by level 6–14 Forest Scout.");
});

test('a world drop from any creature states its actual eligible levels', () => {
  expect(entityDescription(item({ droppedBy: [{ counterpart: { label: 'Any creature' }, creatureLevel: { min: 6, max: 14 } }] }))).toContain('Dropped by level 6–14 creatures.');
  expect(entityDescription(item({ droppedBy: [{ counterpart: { label: 'Any creature' }, creatureLevel: { min: 1 } }] }))).toContain('Dropped by creatures.');
});

test('uses an available container source before creature drops and never invents absent sources', () => {
  expect(entityDescription(item({ inContainers: [{ label: 'Locked Wooden Treasure Chest' }] }))).toContain('Find it in Locked Wooden Treasure Chest or from level 6–14 Forest Scout.');
  expect(entityDescription(item({ droppedBy: [] }))).toBe("Footman's Bulwark is an uncommon shield in Afallon.");
});

test('uses only known NPC level and place, without inventing a location for an unplaced NPC', () => {
  const npc = (locations: unknown[]) => ({ kind: 'npcs', document: {
    ref: { name: 'Training Dummy' }, facts: { npcType: 'Creature', level: { min: 5, max: 5 } },
    locations, places: [],
  } }) as unknown as StaticDocument;
  expect(entityDescription(npc([{ label: 'Oakwood Training Grounds' }]))).toBe('Training Dummy is a creature, level 5 in Afallon. Find Training Dummy in Oakwood Training Grounds.');
  expect(entityDescription(npc([]))).toBe('Training Dummy is a creature, level 5 in Afallon.');
  const scalingNpc = { kind: 'npcs', document: {
    ref: { name: 'Training Dummy' }, facts: { npcType: 'MOB', creatureType: 'MECHANICAL', level: { min: 15, max: 30, scales: true }, roles: [] },
    locations: [{ label: 'Oakenvale' }], places: [],
  } } as unknown as StaticDocument;
  expect(entityDescription(scalingNpc)).toBe('Training Dummy is a mechanical creature in Afallon. Find Training Dummy in Oakenvale. Levels 15–30 scale with the player.');
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
