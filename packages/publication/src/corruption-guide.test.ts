import { expect, test } from "bun:test";
import { Value } from "typebox/value";
import type { CatalogCorruptionFacts, CatalogFacts } from "@afallon/contracts/catalog";
import { CorruptionGuideSchema, type CorruptionGuide, type EntityRef } from "@afallon/contracts/public";
import { projectMechanicsDocuments } from "./mechanics";
import { createReferenceResolver } from "./references";

const endpoint = (entityKey: string, label: string) => ({ entityKey, label });
const names = ["Duskfall Depths", "Felheart Crucible", "Tidefallen Grotto", "The Underglow", "Barrowdeep"];
const times = [[800, 500, 300, 3], [300, 160, 100, 3], [860, 500, 300, 3], [860, 500, 300, 2], [860, 500, 300, 3]];
const corruption: CatalogCorruptionFacts = {
  maxLevel: 30, gearAllStatsPercentPerLevel: 5,
  gearStatBonuses: [{ stat: endpoint("stats:0", "Health"), amountPerLevel: 15, isPercent: true, sourceFieldPath: "gear/0" },
    { stat: endpoint("stats:53", "Item power"), amountPerLevel: 5, isPercent: false, sourceFieldPath: "gear/1" }],
  mobStatBonuses: [{ stat: endpoint("stats:27", "Strength"), amountPerLevel: 10, isPercent: true, sourceFieldPath: "mob/0" },
    { stat: endpoint("stats:28", "Intellect"), amountPerLevel: 10, isPercent: true, sourceFieldPath: "mob/1" },
    { stat: endpoint("stats:0", "Health"), amountPerLevel: 20, isPercent: true, sourceFieldPath: "mob/2" }],
  affixesPerToken: 3, affixes: [{ id: 0, name: "Bolstering", description: "Nearby allies grow stronger.", available: true },
    { id: 6, name: "Spiteful", description: "Ghosts appear.", available: false }],
  token: endpoint("items:564", "Corruption Token"), heart: endpoint("items:162", "Heart of Corruption"),
  dungeons: names.map((name, index) => ({ scene: endpoint(`scenes:${25 + index}`, name), totalSeconds: times[index]![0]!,
    firstRemainingSeconds: times[index]![1]!, secondRemainingSeconds: times[index]![2]!, maxLootItems: times[index]![3]!,
    bosses: index === 3 ? [endpoint("npcs:360", "Fangbloom"), endpoint("npcs:364", "Sporelord Thalvun")] : [],
    lootTables: index === 3 ? [endpoint("lootTables:137", "Sporelord"), endpoint("lootTables:139", "Fangbloom")] : [],
    token: endpoint("items:564", "Corruption Token"), provenance: [] })),
  heartRequirements: [{ sourceId: "stone", place: endpoint("scenes:25", "Duskfall Depths"), count: 1, consume: true, sourceFieldPath: "requirement", provenance: [] }],
  provenance: [],
};
const refs = new Map<string, EntityRef>([
  ...names.map((name, index) => [`scenes:${25 + index}`, { key: `scenes:${25 + index}`, kind: "places" as const, name, slug: name.toLowerCase().replaceAll(" ", "-") }] as const),
  ["items:564", { key: "items:564", kind: "items" as const, name: "Corruption Token", slug: "corruption-token" }] as const,
  ["items:162", { key: "items:162", kind: "items" as const, name: "Heart of Corruption", slug: "heart-of-corruption" }] as const,
  ["items:16", { key: "items:16", kind: "items" as const, name: "Novice Plate Chest", slug: "novice-plate-chest" }] as const,
  ["npcs:360", { key: "npcs:360", kind: "npcs" as const, name: "Fangbloom", slug: "fangbloom" }] as const,
  ["npcs:364", { key: "npcs:364", kind: "npcs" as const, name: "Sporelord Thalvun", slug: "sporelord-thalvun" }] as const,
]);
const published = new Set(refs.keys());
const facts = {
  corruption,
  entities: [{ entityKey: "items:16", kind: "items", name: "Novice Plate Chest" }],
  items: [{ entityKey: "items:16", stats: [{ stat: endpoint("stats:2", "Stamina"), amount: 2, isPercent: false },
    { stat: endpoint("stats:53", "Item power"), amount: 15, isPercent: false }] }],
  progression: { mechanicsRules: [] },
} as unknown as CatalogFacts;
const stoneSpot = { placementId: "stone-placement", mapSpaceId: "coalway", label: "Challenge stone" };
const transitions = [
  { transitionId: "stone-transition", sourceSceneKey: "scenes:47", destinationSceneKey: "scenes:25",
    transitionKind: "effect-teleport", placementIds: [stoneSpot.placementId], start: null },
  { transitionId: "stone-corrupted-transition", sourceSceneKey: "scenes:47", destinationSceneKey: "scenes:26",
    transitionKind: "effect-teleport", placementIds: [stoneSpot.placementId], start: null },
];
const guide = (source: CatalogFacts = facts, routes: readonly { sourceId: string; placementId: string; stoneName: string; regionName: string; transitionIds: string[] }[] =
  [{ sourceId: "stone", placementId: stoneSpot.placementId, stoneName: "Challenge Stone Poison", regionName: "Coalway Swamp", transitionIds: ["stone-transition", "stone-corrupted-transition"] }]) =>
  projectMechanicsDocuments(source, published, new Map(), createReferenceResolver(refs), new Map(),
    transitions, new Map([[stoneSpot.placementId, stoneSpot]]), routes).get("mechanics:corruption") as CorruptionGuide;

test("corruption guide projects authored item and time-remaining thresholds from captured facts", () => {
  const document = guide();
  expect(Value.Check(CorruptionGuideSchema, document)).toBe(true);
  expect(document.example).toMatchObject({ item: { slug: "novice-plate-chest" }, level: 1, baseStat: 2, calculatedStat: 2.1, basePower: 15, calculatedPower: 20 });
  expect(document.dungeons.map((row) => [row.totalSeconds, row.firstRemainingSeconds, row.secondRemainingSeconds, row.maxLootItems])).toEqual(times);
  expect(document.dungeons[3]?.bosses?.map((boss) => boss.name)).toEqual(["Fangbloom", "Sporelord Thalvun"]);
  expect(document.dungeons[3]?.lootTables).toEqual(["Sporelord", "Fangbloom"]);
  expect(document.token?.key).toBe("items:564");
  expect(document.heart?.key).toBe("items:162");
  expect(document.heartRequirements).toEqual([{ stoneName: "Challenge Stone Poison", regionName: "Coalway Swamp",
    place: expect.objectContaining({ name: "Duskfall Depths" }), destinations: [
      expect.objectContaining({ name: "Duskfall Depths" }), expect.objectContaining({ name: "Felheart Crucible" }),
    ], spot: stoneSpot, count: 1 }]);
  expect(document.affixes).toEqual([{ name: "Bolstering", description: "Nearby allies grow stronger.", available: true },
    { name: "Spiteful", description: "Ghosts appear.", available: false }]);
  expect(document.steps.find((step) => step.id === "compare-corrupted-gear")?.rules).toEqual(["corruption-gear"]);
  expect(document.rules.find((row) => row.id === "corruption-gear")?.sources.length).toBeGreaterThan(0);
});
test("a stone without a discovered child teleport does not inherit its host scene as its destination", () => {
  expect(guide(facts, []).heartRequirements).toEqual([{ place: expect.objectContaining({ name: "Duskfall Depths" }), count: 1, destinations: [] }]);
});

test("unpublished but named stone destinations remain readable without fabricated links", () => {
  const frost = projectMechanicsDocuments({
    ...facts,
    entities: [...facts.entities, { entityKey: "scenes:31", kind: "scenes", name: "Challenge stone frost" },
      { entityKey: "scenes:32", kind: "scenes", name: "Challenge stone frost corrupted" }],
  } as CatalogFacts, published, new Map(), createReferenceResolver(refs), new Map(),
  [...transitions, { transitionId: "frost", sourceSceneKey: "scenes:47", destinationSceneKey: "scenes:31",
    transitionKind: "effect-teleport", placementIds: [stoneSpot.placementId], start: null },
    { transitionId: "frost-corrupted", sourceSceneKey: "scenes:47", destinationSceneKey: "scenes:32",
      transitionKind: "effect-teleport", placementIds: [stoneSpot.placementId], start: null }],
  new Map([[stoneSpot.placementId, stoneSpot]]),
  [{ sourceId: "stone", placementId: stoneSpot.placementId, stoneName: "Challenge Stone Frost",
    regionName: "Coalway Swamp", transitionIds: ["frost", "frost-corrupted"] }]).get("mechanics:corruption") as CorruptionGuide;
  expect(frost.heartRequirements?.[0]?.destinations).toEqual([]);
  expect(frost.heartRequirements?.[0]?.unlinkedDestinations).toEqual(["Challenge Stone Frost", "Challenge Stone Frost Corrupted"]);
});

test("unavailable build inputs cannot create numeric guide claims or an item example", () => {
  const unavailable = guide({ ...facts, corruption: { ...corruption, maxLevel: null, gearAllStatsPercentPerLevel: null,
    gearStatBonuses: null, mobStatBonuses: null, affixesPerToken: null, affixes: null, heartRequirements: null,
    dungeons: [{ ...corruption.dungeons[0]!, totalSeconds: null, firstRemainingSeconds: null, secondRemainingSeconds: null, maxLootItems: null, bosses: null, lootTables: null }] } });
  expect(unavailable.maxLevel).toBeUndefined();
  expect(unavailable.gearAllStatsPercentPerLevel).toBeUndefined();
  expect(unavailable.affixesPerToken).toBeUndefined();
  expect(unavailable.gearStatBonuses).toBeUndefined();
  expect(unavailable.mobStatBonuses).toBeUndefined();
  expect(unavailable.example).toBeUndefined();
  expect(unavailable.affixes).toBeUndefined();
  expect(unavailable.heartRequirements).toBeUndefined();
  expect(unavailable.unknowns).toContain("Challenge-stone requirements are unavailable.");
  expect(unavailable.dungeons[0]).toEqual({ place: expect.objectContaining({ name: "Duskfall Depths" }) });
});

test("token and Heart must resolve to separate published pages", () => {
  expect(() => guide({ ...facts, corruption: { ...corruption, heart: corruption.token } })).toThrow("distinct published item pages");
});
