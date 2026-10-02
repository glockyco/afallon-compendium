import { expect, test } from "bun:test";
import type { CatalogEntityRow, CatalogFacts, CatalogRelations, CatalogTransitionRow } from "@afallon/contracts/catalog";
import type { PublicationExclusion } from "@afallon/contracts/public";
import { assertExclusionEvidence, withoutExcludedRelations, type ExclusionEvidenceInput } from "./exclusions";
import { buildEntityReferences, createReferenceResolver } from "./references";
import { auditPublicTooltipCoverage } from "./tooltip-coverage";

const entity = (kind: string, nativeId: number, name: string): CatalogEntityRow => ({ entityKey: `${kind}:${nativeId}`, kind, nativeId, name, description: null, iconAssetName: null, artwork: [] });
const relations: CatalogRelations = { drops: [], vendors: [], gathers: [], containers: [], interactions: [], quests: [], recipes: [], placements: [], transitions: [], conditions: [], gatedSources: [] };
const facts: CatalogFacts = { entities: [], items: [], npcs: [], quests: [], tasks: [], places: [], raceStarts: [], properties: [], abilities: [], recipes: [], gearSets: [], progression: { facts: [], links: [], talentNodes: [], spellbookNodes: [], learners: [], unlocks: [], appliers: [], offeredClasses: [], mechanicsRules: [] }, gatheringNodes: [], adventurerItems: [], adventurerWorld: null, dungeonFinderTank: null, adventurerInviteEffects: [], itemLootTables: [] };
const input: ExclusionEvidenceInput = { entities: [entity("items", 417, "DEV RING"), entity("npcs", 124, "SM_hc_Inn"), entity("scenes", 18, "Challenge stone frost"), entity("craftingStations", 4, "Savers")], facts, relations, spawnCandidates: new Set(), startingGear: new Map(),
  placementIdsByKey: new Map(), excluded: new Set(["recipes:36"]) };
const devRing: PublicationExclusion = { key: "items:417", reason: "test-record", evidence: "The name DEV RING marks a developer record." };
const inn: PublicationExclusion = { key: "npcs:124", reason: "unplaced-record", evidence: "SM_hc_Inn is a model name with no role or placement." };

test("an exclusion fails and names its entry when the catalog contradicts its evidence", () => {
  assertExclusionEvidence([devRing, inn], input);
  const sold: CatalogRelations = { ...relations, vendors: [{ npc: { entityKey: "npcs:2", label: "Vendor" }, item: { entityKey: "items:417", label: "DEV RING" }, currency: null, cost: 5, merchantTableId: 1, stockIndex: 0, conditionIds: [], placementIds: [] }] };
  expect(() => assertExclusionEvidence([devRing], { ...input, relations: sold })).toThrow("Exclusion items:417 (test-record) no longer holds: the item has a source.");
  const startingGear = new Map([["items:417", [{ key: "classes:1", kind: "classes" as const, name: "Wizard", slug: "wizard" }]]]);
  expect(() => assertExclusionEvidence([devRing], { ...input, startingGear })).toThrow("the item has a source");
  const placed: CatalogRelations = { ...relations, placements: [{ placementId: "p1", sceneNativeId: 11, sceneKey: "scenes:11", mapSpaceId: "world", label: null, area: null, roles: [{ role: "npc", npcEntityKey: "npcs:124", scope: "authored" }], families: [], randomChoices: [] }] };
  expect(() => assertExclusionEvidence([inn], { ...input, relations: placed })).toThrow("Exclusion npcs:124 (unplaced-record) no longer holds: the NPC has a placement.");
  expect(() => assertExclusionEvidence([inn], { ...input, spawnCandidates: new Set(["npcs:124"]) })).toThrow("the NPC is a spawn candidate");
  expect(() => assertExclusionEvidence([{ ...devRing, key: "items:999" }], input)).toThrow("Exclusion items:999 (test-record) names a record that the catalog lacks.");
});

test("content-free NPC exclusion stops when a useful relationship appears", () => {
  const absent: PublicationExclusion = { key: "npcs:124", reason: "content-free-record", evidence: "No location or gameplay relationship." };
  assertExclusionEvidence([absent], input);
  const stock: CatalogRelations = { ...relations, vendors: [{
    npc: { entityKey: absent.key, label: "Innkeeper" }, item: { entityKey: "items:1", label: "Potion" },
    currency: null, cost: 5, merchantTableId: 1, stockIndex: 0, conditionIds: [], placementIds: [],
  }] };
  expect(() => assertExclusionEvidence([absent], { ...input, relations: stock })).toThrow("the NPC has drops, stock, or a quest");
  expect(() => assertExclusionEvidence([absent], { ...input, entities: input.entities.map((row) => row.entityKey === absent.key ? { ...row, description: "Offers passage." } : row) }))
    .toThrow("the NPC has a description");
  const bareRole = { ...({} as CatalogFacts["npcs"][number]), entityKey: absent.key, isQuestGiver: true, abilityPhases: [], factionRewards: [] };
  assertExclusionEvidence([absent], { ...input, facts: { ...facts, npcs: [bareRole] } });
  expect(() => assertExclusionEvidence([absent], { ...input, facts: { ...facts, npcs: [{
    ...bareRole, linkedNpc: { entityKey: "npcs:2", label: "Companion" },
  }] } })).toThrow("the NPC has an ability or gameplay relationship");
});

test("a crafting station stays excluded only while it has no map spot and makes no published recipe", () => {
  const savers: PublicationExclusion = { key: "craftingStations:4", reason: "progress-flag", evidence: "Savers makes only progress-flag recipes and stands nowhere." };
  const recipe = (entityKey: string) => ({ ...({} as CatalogFacts["recipes"][number]), entityKey, station: { entityKey: "craftingStations:4", label: "Savers" } });
  assertExclusionEvidence([savers], { ...input, facts: { ...facts, recipes: [recipe("recipes:36")] } });
  expect(() => assertExclusionEvidence([savers], { ...input, facts: { ...facts, recipes: [recipe("recipes:36"), recipe("recipes:5")] } }))
    .toThrow("Exclusion craftingStations:4 (progress-flag) no longer holds: the station makes a published recipe.");
  expect(() => assertExclusionEvidence([savers], { ...input, placementIdsByKey: new Map([["craftingStations:4", ["p1"]]]) })).toThrow("the station has a map spot");
});
test("a timer-only ability is excluded only while it has no effect, learner, user, or item use", () => {
  const rock = { ...entity("abilities", 46, "AoE Rock Attack"), name: "AoE Rock Attack" };
  const exclusion: PublicationExclusion = { key: rock.entityKey, reason: "content-free-record", evidence: "Only cast timing is known, with no effect, learner, creature user, or item use." };
  const timer = { spans: [{ text: "Cooldown: 15 sec", tone: "muted" as const, italic: false }] };
  const ability = { entityKey: rock.entityKey, ranks: [{ rankIndex: 0, lines: [timer] }] };
  const given = { ...input, entities: [rock], facts: { ...facts, abilities: [ability] } };
  assertExclusionEvidence([exclusion], given);
  const references = buildEntityReferences([rock], { facts: given.facts, relations, excluded: new Set([rock.entityKey]) });
  expect(references.pages.has(rock.entityKey)).toBe(false);
  expect(createReferenceResolver(references.refs)({ entityKey: rock.entityKey, label: rock.name })).toEqual({ key: null, label: rock.name });
  expect(auditPublicTooltipCoverage(given.facts, relations, new Map(), undefined, new Set([rock.entityKey]))).toEqual([]);
  expect(auditPublicTooltipCoverage(given.facts, relations, new Map())).toContain(`Ability ${rock.entityKey} has no public document.`);
  const fails = (changed: ExclusionEvidenceInput, reason: string) =>
    expect(() => assertExclusionEvidence([exclusion], changed)).toThrow(`Exclusion abilities:46 (content-free-record) no longer holds: ${reason}.`);
  fails({ ...given, entities: [{ ...rock, description: "A spell that harms nearby enemies." }] }, "the ability has a description");
  fails({ ...given, facts: { ...given.facts, abilities: [{ ...ability, ranks: [{ rankIndex: 0, lines: [timer, { spans: [{ text: "Deals damage", tone: "damage", italic: false }] }] }] }] } }, "the ability describes an effect");
  fails({ ...given, facts: { ...given.facts, progression: { ...facts.progression, learners: [{ owner: { entityKey: "classes:1", label: "Druid" }, ability: rock.entityKey, via: "autoAttack", source: null, level: null, tier: null, row: null }] } } }, "the ability has a learner");
  const npc = { entityKey: "npcs:1", adventurer: null, abilityPhases: [{ abilities: [{ ability: { entityKey: rock.entityKey, label: rock.name }, rankIndex: 0 }] }] } as CatalogFacts["npcs"][number];
  fails({ ...given, facts: { ...given.facts, npcs: [npc] } }, "a creature uses the ability");
  const item = { entityKey: "items:1", actionAbilities: [{ ability: { entityKey: rock.entityKey, label: rock.name } }], gameActions: [] } as unknown as CatalogFacts["items"][number];
  fails({ ...given, facts: { ...given.facts, items: [item] } }, "an item uses the ability");
  fails({ ...given, facts: { ...given.facts, progression: { ...facts.progression, appliers: [{ source: { entityKey: rock.entityKey, label: rock.name }, effect: "effects:1", via: "ability", rank: 0, chance: 1 }] } } }, "the ability applies an effect");
});

test("no relation row names an excluded record", () => {
  const teleport = (destinationSceneKey: string): CatalogTransitionRow => ({ transitionId: destinationSceneKey, sourceSceneKey: "scenes:47", destinationSceneKey, transitionKind: "effect-teleport", placementIds: [], start: null });
  const kept = withoutExcludedRelations({ ...relations, transitions: [teleport("scenes:18"), teleport("scenes:14")] }, new Set(["scenes:18"]));
  expect(kept.transitions.map((row) => row.destinationSceneKey)).toEqual(["scenes:14"]);
});

test("reviewed thin items reappear if their catalog gains an actionable fact or any inbound reference", () => {
  const records = [
    { ...entity("items", 50, "Alchemy table"), description: "A portable alchemist's workbench, stained by a hundred experiments." },
    { ...entity("items", 84, "Forest Demon Quest"), description: "" },
    { ...entity("items", 835, "Expedition Supply Pack"), description: "A weatherproofed canvas pack stamped with the Emberpeak Expedition seal. Rations, lamp oil, and a coil of good dwarven rope." },
  ];
  const item = (key: string) => ({ entityKey: key, actionAbilities: [], useLines: [], stats: [], randomStats: [], sockets: [], gem: null,
    enchantment: null, gearSet: null, currency: null, corruptionToken: false, equipmentRequirements: [], useConditions: [],
    gameActions: key === "items:835" ? [] : key === "items:50"
      ? [{ type: "GameObject", alterAction: "Gain", amount: 0, target: null }, { type: "Item", alterAction: "Remove", amount: 1, target: { entityKey: key, label: key } }]
      : [{ type: "Item", alterAction: "Remove", amount: 1, target: { entityKey: key, label: key } }, { type: "Quest", alterAction: "Gain", amount: 0, target: null }],
  } as unknown as CatalogFacts["items"][number]);
  const itemFacts = { ...facts, items: records.map((record) => item(record.entityKey)) };
  const entries: PublicationExclusion[] = records.map((record) => ({ key: record.entityKey, reason: "content-free-record", evidence: "No identified source or use." }));
  const evidence: ExclusionEvidenceInput = { ...input, entities: records, facts: itemFacts, relations, lootItemKeys: new Set() };
  assertExclusionEvidence(entries, evidence);
  expect(() => assertExclusionEvidence(entries, { ...evidence, entities: records.map((row) => row.entityKey === "items:84" ? { ...row, description: "Grants an ability" } : row) })).toThrow("the item's description names a use");
  expect(() => assertExclusionEvidence(entries, { ...evidence, facts: { ...itemFacts, items: itemFacts.items.map((row) => row.entityKey === "items:50" ? { ...row, stats: [{ stat: { entityKey: "stats:20", label: "Armor" }, amount: 3, isPercent: false }] } : row) } })).toThrow("the item has a usable fact");
  expect(() => assertExclusionEvidence(entries, { ...evidence, relations: { ...relations, quests: [{ counterpart: { entityKey: "items:835", label: "Expedition Supply Pack" } } as CatalogRelations["quests"][number]] } })).toThrow("the item is named in a relation");
  expect(() => assertExclusionEvidence(entries, { ...evidence, lootItemKeys: new Set(["items:835"]) })).toThrow("a loot table grants the item");
  expect(() => assertExclusionEvidence(entries, { ...evidence, facts: { ...itemFacts, items: itemFacts.items.map((row) => row.entityKey === "items:84" ? { ...row, gameActions: [...row.gameActions, { ...row.gameActions[1]!, target: { entityKey: "quests:5", label: "Forest Demon" } }] } : row) } })).toThrow("the item has an identified use");
});

test("a withheld place must stay free of player-facing content", () => {
  const empty = entity("scenes", 12, "Sylvan Thickets");
  const place: CatalogFacts["places"][number] = {
    entityKey: empty.entityKey, placeType: "zone", guideIncluded: false, guideDescription: null,
    levelRange: null, mapSpaceIds: [], bosses: [], parentSceneKey: null,
  };
  const exclusion: PublicationExclusion = { key: empty.entityKey, reason: "content-free-record",
    evidence: "No map space, description, artwork, level, inhabitants, quest objective, or placement." };
  const state: ExclusionEvidenceInput = { ...input, entities: [empty], facts: { ...facts, places: [place] } };
  assertExclusionEvidence([exclusion], state);
  expect(() => assertExclusionEvidence([exclusion], { ...state, entities: [{ ...empty, description: "A mountain area" }] }))
    .toThrow("scene has a description");
  expect(() => assertExclusionEvidence([exclusion], { ...state, facts: { ...state.facts, places: [{ ...place, mapSpaceIds: ["world"] }] } }))
    .toThrow("scene has a map space");
});
