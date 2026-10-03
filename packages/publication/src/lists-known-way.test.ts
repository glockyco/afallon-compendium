import { expect, test } from 'bun:test';
import type { PublicAbility, PublicDocument, PublicItem, PublicNpc, PublicQuest, Ref } from '@afallon/contracts/public';
import { PUBLIC_KIND_BY_KIND } from './kind-registry';
import { buildKindLists, itemHasKnownWay } from './lists';

const npcRef = (name: string) => ({ key: `npcs:${name}`, kind: 'npcs' as const, name, slug: name.toLowerCase() });
const itemRef = (name: string) => ({ key: `items:${name}`, kind: 'items' as const, name, slug: name.toLowerCase() });
const abilityRef = (name: string) => ({ key: `abilities:${name}`, kind: 'abilities' as const, name, slug: name.toLowerCase() });

function item(name: string): PublicItem {
  return { ref: itemRef(name), description: null, art: {}, facts: { itemType: 'WEAPON', weaponType: 'SWORD', minDamage: 8, maxDamage: 13,
    stats: [], randomStats: [], randomStatsMax: 0, sockets: [], stackLimit: 1, questDropOnly: false, corruptionToken: false,
    actionAbilities: [], useLines: [], equipmentRequirements: [], useConditions: [] },
  sourceSpotCount: 0, sourceAvailabilities: [], droppedBy: [], soldBy: [], buys: [], gatheredFrom: [], inContainers: [], collectedFrom: [], rewardedBy: [], givenBy: [], usedInRecipes: [], usedInQuests: [], startingGearOf: [], startingGearOfAdventurers: [], fromItems: [], gainedFromItems: [], lootTables: [], questPickups: [], placedRules: [], adventurers: [], whenUsed: { chests: [], packs: [], itemChanges: [] }, appliesEffects: [] } as PublicItem;
}
function npc(name: string, roles: string[] = []): PublicNpc {
  return { ref: npcRef(name), description: null, art: {}, facts: { roles, stats: [], immunities: [] }, variantFields: [], variants: [{ key: npcRef(name).key, anchor: `n-${name}`, label: name, facts: {} }],
    locations: [], places: [], spotCount: 0, drops: [], sells: [], quests: [], abilityPhases: [], factionRewards: [], usedInQuests: [], bossOf: [], placedRules: [], appliedEffects: [], summonedBy: [], spawnedBy: [], recruitedByActions: [] } as PublicNpc;
}
function ability(name: string): PublicAbility {
  return { ref: abilityRef(name), description: null, art: {}, versions: [{ keys: [abilityRef(name).key], anchor: `n-${name}`, ranks: [{ rankIndex: 0, lines: [] }], useRequirements: [], learnedBy: [], usedBy: [], usedByItems: [], taughtBy: [], appliedEffects: [], unlockedByActions: [], scalesWith: [] }] } as PublicAbility;
}
function rows(documents: PublicDocument[]) {
  const lists = buildKindLists({ buildId: 'test', catalogId: 'test' }, [PUBLIC_KIND_BY_KIND.items, PUBLIC_KIND_BY_KIND.npcs, PUBLIC_KIND_BY_KIND.abilities],
    new Map(documents.map((document) => [document.ref.key, document])));
  return new Map([...lists].map(([kind, parts]) => [kind, parts.flatMap((part) => part.rows)]));
}

test('item acquisition excludes unbound loot and self-consumption but admits bound world loot and recovered gear', () => {
  const alone = item('Unbound Candy');
  const unbound = { ...alone, lootTables: [{ name: 'Halloween loot' }] };
  expect(itemHasKnownWay(unbound)).toBe(false);
  expect(itemHasKnownWay({ ...alone, whenUsed: { chests: [], packs: [], itemChanges: [{ action: 'Remove', item: alone.ref, count: 1 }] } })).toBe(false);
  expect(itemHasKnownWay({ ...unbound, lootTables: [{ name: 'Halloween loot', source: npcRef('Harvester') }] })).toBe(true);
  expect(itemHasKnownWay({ ...unbound, lootTables: [{ name: 'World drops', world: true }] })).toBe(true);
  expect(itemHasKnownWay({ ...alone, startingGearOfAdventurers: [npcRef('Eldeth')] })).toBe(true);
  expect(itemHasKnownWay({ ...alone, gainedFromItems: [itemRef('Crate')] })).toBe(true);
  const dungeonToken = item('Corruption Token');
  dungeonToken.facts.dungeonRewards = [{ place: { key: 'places:1', kind: 'places', name: 'Duskfall Depths', slug: 'duskfall-depths' }, bosses: [], guaranteed: true }];
  expect(itemHasKnownWay(dungeonToken)).toBe(true);
  const projected = rows([alone, { ...item('Known Sword'), startingGearOf: [{ class: { key: 'classes:1', kind: 'classes', name: 'Warrior', slug: 'warrior' } }] }]);
  expect(projected.get('items')?.map((row) => [row.ref.name, row.facets.knownWay, row.values.damage])).toEqual([
    ['Unbound Candy', ['unknown'], '8–13'], ['Known Sword', ['known'], '8–13'],
  ]);
});

test('an unplaced NPC is visible through adventurer, summon, spawn, recruitment or a different published page', () => {
  const hidden = npc('Unmet Shade');
  const summoned = { ...npc('Summoned Shade'), summonedBy: [abilityRef('Summon Shade')] as Ref[] };
  const spawned = { ...npc('Spawned Shade'), spawnedBy: [{ label: 'Ancient Gate', place: { key: null, label: 'Catacombs' } }] };
  const recruited = { ...npc('Recruited Shade'), recruitedByActions: [{ label: 'Dialogue' }] };
  const adventurer = { ...npc('Eldeth Goldvein'), adventurer: { class: { key: 'classes:6', kind: 'classes' as const, name: 'Druid', slug: 'druid' }, role: 'Tank' as const, startingLevel: 7, joinAfterHours: 0, priorityAbilities: [] } };
  const referenced = npc('Quest Giver');
  const witness: PublicQuest = { ref: { key: 'quests:1', kind: 'quests', name: 'Answer the Call', slug: 'answer-the-call' },
    description: null, art: {}, facts: { repeatable: false, turnInWithoutNpc: false, requirements: [] },
    starts: [{ kind: 'npc', npc: referenced.ref, areas: [] }], turnIns: [], objectives: [], itemsGiven: [],
    rewards: [], rewardChoices: [], chainQuests: [], unlocks: [], worldChanges: [], placedRules: [] };
  const list = rows([hidden, summoned, spawned, recruited, adventurer, referenced, witness]).get('npcs')!;
  expect(list.map((row) => [row.ref.name, row.facets.knownWay])).toEqual([
    ['Unmet Shade', ['unknown']], ['Summoned Shade', ['known']], ['Spawned Shade', ['known']],
    ['Recruited Shade', ['known']], ['Eldeth Goldvein', ['known']], ['Quest Giver', ['known']],
  ]);
  expect(list.find((row) => row.ref.name === 'Eldeth Goldvein')).toMatchObject({ values: { level: '7', role: 'Adventurer, Tank', class: 'Druid', partyRole: 'Tank', place: null }, facets: { role: ['Adventurer', 'Tank'] } });
});

test('boss role omits redundant enemy and an action unlock is a known ability use', () => {
  const boss = npc('The Bulwark', ['boss', 'enemy']);
  boss.facts.level = { min: 21, max: 21, scales: false };
  const shout = ability('Shout');
  const unlocked = { ...ability('Summon Ally'), versions: [{ ...ability('Summon Ally').versions[0]!, unlockedByActions: [{ label: 'Dialogue' }] }] };
  const result = rows([boss, shout, unlocked]);
  expect(result.get('npcs')?.[0]).toMatchObject({ values: { role: 'boss', level: '21' }, facets: { role: ['boss'] } });
  expect(result.get('abilities')?.map((row) => [row.ref.name, row.facets.knownWay, row.facets.sourceKind, row.values.source])).toEqual([
    ['Shout', ['unknown'], [], null], ['Summon Ally', ['known'], ['Interaction'], 'Dialogue'],
  ]);
});

test('an NPC row carries the numbers behind its level text, so a Level filter can match it', () => {
  const bandit = npc('Bandit');
  bandit.facts.level = { min: 15, max: 30, scales: true };
  const shade = npc('Shade');
  shade.facts.level = { min: 40, scales: true };
  const adventurer = { ...npc('Eldeth Goldvein'), adventurer: { class: { key: 'classes:6', kind: 'classes' as const, name: 'Druid', slug: 'druid' }, role: 'Tank' as const, startingLevel: 7, joinAfterHours: 0, priorityAbilities: [] } };
  const list = rows([bandit, shade, adventurer, npc('Unknown')]).get('npcs')!;
  expect(list.map((row) => [row.ref.name, row.values.level, row.ranges?.level])).toEqual([
    ['Bandit', '15–30', { min: 15, max: 30 }], ['Shade', '40+', { min: 40 }], ['Eldeth Goldvein', '7', { min: 7, max: 7 }], ['Unknown', null, undefined],
  ]);
});
