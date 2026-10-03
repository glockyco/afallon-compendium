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
  expect(entityDescription(item({ collectedFrom: [{ label: 'Wooden Treasure Chest (Locked)' }] }))).toContain('Found in locked wooden treasure chests. Forest Scout can drop it at levels 6–14.');
  expect(entityDescription(item({ droppedBy: [] }))).not.toMatch(/can drop|sells it|Found in/);
});

test('uses only known NPC level and place, without inventing a location for an unplaced NPC', () => {
  const npc = (locations: unknown[]) => ({ kind: 'npcs', document: {
    ref: { name: 'Training Dummy' }, facts: { npcType: 'Creature', level: { min: 5, max: 5 } },
    locations, places: [], drops: [],
  } }) as unknown as StaticDocument;
  expect(entityDescription(npc([{ label: 'Oakwood Training Grounds' }]))).toContain('creature, level 5 in Afallon. Found in Oakwood Training Grounds.');
  expect(entityDescription(npc([]))).not.toContain('Found in');
  const scalingNpc = { kind: 'npcs', document: {
    ref: { name: 'Training Dummy' }, facts: { npcType: 'MOB', creatureType: 'MECHANICAL', level: { min: 15, max: 30, scales: true }, roles: [] },
    locations: [{ label: 'Oakenvale' }], places: [], drops: [],
  } } as unknown as StaticDocument;
  expect(entityDescription(scalingNpc)).toContain('mechanical creature in Afallon. Found in Oakenvale. Its level adjusts to your character.');
});

test('an oversized source does not cut a fact in half', () => {
  const description = entityDescription(item({ inContainers: [{ label: 'A '.repeat(100) + 'Treasure' }] }));
  expect(description).toContain('uncommon shield in Afallon.');
  expect(description).not.toContain('Collected from A');
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

test('related names do not substitute for abilities, places, and stat facts', () => {
  const ability = { kind: 'abilities', document: {
    ref: { name: 'Summon Priest' }, description: null, versions: [{
      appliedEffects: [{ effect: { key: 'effects:409', kind: 'effects', name: 'Summon Thamiel Priest Companion' } }],
      ranks: [{ lines: [{ spans: [{ tone: 'effect', text: 'Summons Thamiel' }] }] }],
      learnedBy: [], usedBy: [],
    }],
  } } as unknown as StaticDocument;
  expect(entityDescription(ability)).toContain('It summons Thamiel.');
  expect(entityDescription(ability)).not.toContain('It applies Summon Thamiel Priest Companion');
  const sameNameAbility = { kind: 'abilities', document: { ref: { name: 'Cleave' }, description: null,
    versions: [{ learnedBy: [], usedBy: [], ranks: [], appliedEffects: [{ effect: { key: 'effects:0', kind: 'effects', name: 'Cleave' } }] }],
  } } as unknown as StaticDocument;
  expect(entityDescription(sameNameAbility)).not.toContain('It applies Cleave');
  const station = { kind: 'craftingStations', document: { ref: { name: 'Alchemy' },
    skills: [{ key: 'skills:8', kind: 'skills', name: 'Alchemy' }],
    places: [{ label: 'Chillwind Heights' }], recipes: [{ product: { name: 'Elixir' } }],
  } } as unknown as StaticDocument;
  expect(entityDescription(station)).toContain('Make 1 recipe at an Alchemy station in Afallon. Find one in Chillwind Heights.');
  const place = { kind: 'places', document: {
    ref: { name: 'Sanctum of the Veilpiercer' }, facts: { placeType: 'zone' }, description: null,
    bosses: [], entrances: [{ place: { key: 'scenes:47', kind: 'places', name: 'Afallon' },
      placements: [{ label: 'Veilpiercer Staging Grounds' }] }],
  } } as unknown as StaticDocument;
  expect(entityDescription(place)).toContain('Enter from Veilpiercer Staging Grounds in Afallon.');
  const stat = { kind: 'stats', document: { ref: { name: 'Health' }, description: 'Death occurs when reaching 0.', category: 'General' } } as unknown as StaticDocument;
  expect(entityDescription(stat)).toBe('Health is an Afallon stat. Death occurs when reaching 0.');
});

test('ability and effect summaries prefer verified scaling over a conflicting game description', () => {
  const intellect = { key: 'stats:28', kind: 'stats', name: 'Intellect' };
  const strength = { key: 'stats:27', kind: 'stats', name: 'Strength' };
  const ability = { kind: 'abilities', document: {
    ref: { name: 'Brutal Slice' }, description: 'A powerful strike dealing high physical damage.',
    versions: [{ learnedBy: [], usedBy: [], ranks: [], appliedEffects: [{ scaling: {
      mainType: 'Magical', stats: [{ stat: intellect, coefficientPercent: 100, source: 'damageType' }],
    } }] }],
  } } as unknown as StaticDocument;
  expect(entityDescription(ability)).toContain('Scales with Intellect.');
  expect(entityDescription(ability)).not.toContain('physical damage');
  const weapon = { kind: 'effects', document: {
    ref: { name: 'Toxic Fang' }, type: 'Instant Damage', description: null, stackLimit: 1, appliedBy: [],
    ranks: [{ actions: [], scaling: { weaponPercent: 150, stats: [{ stat: strength, coefficientPercent: 100, source: 'damageType' }],
      baseKind: 'flat', baseAmount: 0 } }],
  } } as unknown as StaticDocument;
  expect(entityDescription(weapon)).toContain('150% of selected weapon damage and scales with Strength.');
  const unknown = { ...weapon, document: { ...weapon.document, ranks: [{ actions: [{ label: 'Authored Damage', amount: 25 }],
    scaling: { weaponPercent: 0, stats: [], baseKind: 'unknown', baseAmount: 25 } }] } } as unknown as StaticDocument;
  expect(entityDescription(unknown)).not.toContain('base damage is 25');
});

test('internal qualifiers stay out of quest and self-named companion snippets', () => {
  const quest = { kind: 'quests', document: {
    ref: { name: 'The Drowned Archon' }, facts: {}, objectives: [],
    starts: [{ kind: 'npc', npc: { key: 'npcs:123', kind: 'npcs', name: 'Lysander Blazeborn (Afallon)' } }],
  } } as unknown as StaticDocument;
  expect(entityDescription(quest)).toBe('The Drowned Archon is an Afallon quest. Start it with Lysander Blazeborn.');
  const companion = { kind: 'effects', document: {
    ref: { name: 'Fenric Blackwell' }, type: 'Pet',
    ranks: [{ actions: [{ label: 'Summons', target: { key: 'npcs:45', kind: 'npcs', name: 'Fenric Blackwell' } }] }],
    appliedBy: [], stackLimit: 1,
  } } as unknown as StaticDocument;
  expect(entityDescription(companion)).toBe('Fenric Blackwell can be summoned as a companion in Afallon.');
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
