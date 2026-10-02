import { expect, test } from "bun:test";
import type { CatalogEntityRow, CatalogFacts, CatalogRelations, CatalogTransitionRow } from "@afallon/contracts/catalog";
import type { PublicationExclusion } from "@afallon/contracts/public";
import { assertExclusionEvidence, withoutExcludedRelations, type ExclusionEvidenceInput } from "./exclusions";

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

test("a crafting station stays excluded only while it has no map spot and makes no published recipe", () => {
  const savers: PublicationExclusion = { key: "craftingStations:4", reason: "progress-flag", evidence: "Savers makes only progress-flag recipes and stands nowhere." };
  const recipe = (entityKey: string) => ({ ...({} as CatalogFacts["recipes"][number]), entityKey, station: { entityKey: "craftingStations:4", label: "Savers" } });
  assertExclusionEvidence([savers], { ...input, facts: { ...facts, recipes: [recipe("recipes:36")] } });
  expect(() => assertExclusionEvidence([savers], { ...input, facts: { ...facts, recipes: [recipe("recipes:36"), recipe("recipes:5")] } }))
    .toThrow("Exclusion craftingStations:4 (progress-flag) no longer holds: the station makes a published recipe.");
  expect(() => assertExclusionEvidence([savers], { ...input, placementIdsByKey: new Map([["craftingStations:4", ["p1"]]]) })).toThrow("the station has a map spot");
});

test("no relation row names an excluded record", () => {
  const teleport = (destinationSceneKey: string): CatalogTransitionRow => ({ transitionId: destinationSceneKey, sourceSceneKey: "scenes:47", destinationSceneKey, transitionKind: "effect-teleport", placementIds: [], start: null });
  const kept = withoutExcludedRelations({ ...relations, transitions: [teleport("scenes:18"), teleport("scenes:14")] }, new Set(["scenes:18"]));
  expect(kept.transitions.map((row) => row.destinationSceneKey)).toEqual(["scenes:14"]);
});
