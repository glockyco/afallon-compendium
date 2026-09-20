import { expect, test } from "bun:test";
import type { NormalizedDatabaseInput, NormalizedEntity } from "@afallon/contracts/catalog";
import { collectTypedFacts } from "./normalize";
import type { AdmittedCatalog } from "./evidence";
import type { Blocker } from "./context";

const reference = { path: "objects/support.json", sha256: "a".repeat(64) };

function entity(kind: string, nativeId: number, name: string): NormalizedEntity {
  return { entityKey: `${kind}:${nativeId}`, buildId: "build", kind, nativeId, name, internalName: null, description: null, sourceKey: nativeId, publicData: { localization: null, gameplay: null, icon: null }, provenance: [reference] };
}

// `collectTypedFacts` reads only these families for a gear set, so the fixture carries them and
// nothing else. The cast keeps the fixture to the fields the path under test consults.
function admitted(gearSetGameplay: unknown): AdmittedCatalog {
  return {
    canonical: { value: { items: [], npcs: [], quests: [], scenes: [], regions: [], properties: [], stats: [] }, reference },
    relationships: { value: { tasks: [] }, reference },
    lootRules: { value: { itemLevels: [] }, reference },
    support: { value: { tables: { gearSets: [{ sourceKey: 17, entry: { nativeId: 17, name: "Adept Leather", internalName: "Adept Leather" }, gameplay: gearSetGameplay }] } }, reference },
    artwork: null,
  } as unknown as AdmittedCatalog;
}

function admittedNpc(npcGameplay: unknown): AdmittedCatalog {
  return {
    canonical: { value: { items: [], npcs: [{ nativeId: 399, gameplay: npcGameplay }], quests: [], scenes: [], regions: [], properties: [], stats: [] }, reference },
    relationships: { value: { tasks: [] }, reference },
    lootRules: { value: { itemLevels: [] }, reference },
    support: { value: { tables: {} }, reference },
    artwork: null,
  } as unknown as AdmittedCatalog;
}

const gameplay = {
  itemsInSet: [{ sourceIndex: 0, itemId: 538 }, { sourceIndex: 1, itemId: 539 }],
  gearSetTiers: [
    { tierIndex: 0, equippedAmount: 3, stats: [{ sourceIndex: 0, statId: 12, amount: 10, isPercent: true }, { sourceIndex: 1, statId: 126, amount: 10, isPercent: false }] },
    { tierIndex: 1, equippedAmount: 7, stats: [{ sourceIndex: 0, statId: 0, amount: 200, isPercent: false }] },
  ],
};

test("resolves every gear set member and tier stat to its entity", () => {
  const entities = [entity("gearSets", 17, "Adept Leather"), entity("items", 538, "Adept Leather belt"), entity("items", 539, "Adept Leather boots"), entity("stats", 12, "Poison Damage"), entity("stats", 126, "Dodge chance"), entity("stats", 0, "Health")];
  const blockers: Blocker[] = [];
  const rows = collectTypedFacts(admitted(gameplay), entities, [] as NormalizedDatabaseInput["bindings"], [], blockers);

  expect(blockers).toEqual([]);
  expect(rows.gearSetFacts).toEqual([{ entityKey: "gearSets:17", provenance: [{ ...reference, pointer: "/tables/gearSets/0" }] }]);
  expect(rows.gearSetMembers.map((row) => [row.memberIndex, row.item])).toEqual([
    [0, { entityKey: "items:538", label: "Adept Leather belt" }],
    [1, { entityKey: "items:539", label: "Adept Leather boots" }],
  ]);
  expect(rows.gearSetTiers.map((row) => [row.tierIndex, row.equipped])).toEqual([[0, 3], [1, 7]]);
  expect(rows.gearSetTierStats.map((row) => [row.tierIndex, row.stat.label, row.amount, row.isPercent])).toEqual([
    [0, "Poison Damage", 10, true],
    [0, "Dodge chance", 10, false],
    [1, "Health", 200, false],
  ]);
});

test("normalizes adventurer references and an authored flight network", () => {
  const npcGameplay = {
    npcType: { value: 9, name: "ADVENTURER" }, creatureType: { value: 2, name: "HUMANOID" }, isFlightMaster: true, flightNetworkResourcePath: "FlightPaths/Afallon Flight Network 1", flightStopId: "camp", flightInteractionDistance: 8,
    adventurer: { authored: true, classId: 1, preferredTreeId: 3, keepPhaseAbilities: true, raceId: 6, aiLogicTemplateKey: "Templates/Healer", specialization: { available: true, classId: 1, role: { value: 2, name: "Healer" }, preferredTreeId: 3, behaviorName: "Support", priorityAbilities: [10], blockedAbilities: [11], blockedBonuses: [2], allowedForms: [4] } },
    flightNetwork: { available: true, networkId: "Afallon", sceneName: "Coalway outdoors", mapWorldBounds: { x: 0, y: 0, width: 100, height: 100 }, minimumFlyoverHeight: 40, currencyId: 5, stops: [{ id: "camp", name: "Camp", landingPosition: { x: 1, y: 2, z: 3 }, landingYaw: 90, knownInitially: true }], routes: [{ from: "camp", to: "camp", bidirectional: true, fare: 5, speed: 20, departureCruiseWaypoint: 0, arrivalCruiseWaypoint: 0, waypoints: [] }] },
  };
  const entities = [entity("npcs", 399, "Skywarden"), entity("classes", 1, "Cleric"), entity("races", 6, "Human"), entity("talentTrees", 3, "Restoration"), entity("abilities", 10, "Heal"), entity("abilities", 11, "Strike"), entity("currencies", 5, "Silver")];
  const blockers: Blocker[] = [];
  const rows = collectTypedFacts(admittedNpc(npcGameplay), entities, [] as NormalizedDatabaseInput["bindings"], [], blockers);

  expect(blockers).toEqual([]);
  expect(rows.npcFacts[0]?.adventurer).toMatchObject({ class: { entityKey: "classes:1", label: "Cleric" }, race: { entityKey: "races:6", label: "Human" }, preferredTree: { entityKey: "talentTrees:3", label: "Restoration" }, specialization: { role: "Healer", priorityAbilities: [{ entityKey: "abilities:10", label: "Heal" }] } });
  expect(rows.npcFacts[0]?.flightNetwork).toMatchObject({ networkId: "Afallon", stopId: "camp", currency: { entityKey: "currencies:5", label: "Silver" }, stops: [{ id: "camp" }] });
});

test("keeps an unresolvable gear set member as an unresolved endpoint and a coverage issue", () => {
  const entities = [entity("gearSets", 17, "Adept Leather"), entity("items", 538, "Adept Leather belt"), entity("stats", 12, "Poison Damage"), entity("stats", 126, "Dodge chance"), entity("stats", 0, "Health")];
  const blockers: Blocker[] = [];
  const rows = collectTypedFacts(admitted(gameplay), entities, [] as NormalizedDatabaseInput["bindings"], [], blockers);

  expect(rows.gearSetMembers.map((row) => row.item)).toEqual([
    { entityKey: "items:538", label: "Adept Leather belt" },
    { entityKey: null, label: "Item 539" },
  ]);
  expect(blockers).toEqual([{
    kind: "missing-reference",
    key: "/tables/gearSets/0/gameplay/itemsInSet/1:items:539",
    detail: "Typed fact references missing items:539.",
    provenance: [{ ...reference, pointer: "/tables/gearSets/0" }],
  }]);
});
