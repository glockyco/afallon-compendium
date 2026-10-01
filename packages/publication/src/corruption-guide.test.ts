import { expect, test } from "bun:test";
import { Value } from "typebox/value";
import type { CatalogCorruptionFacts, CatalogFacts, CatalogTransitionRow } from "@afallon/contracts/catalog";
import { CorruptionGuideSchema, type CorruptionGuide, type EntityRef, type PublicDocument, type PublicItem, type PublicPlace } from "@afallon/contracts/public";
import { corruptionRewards } from "./corruption-rewards";
import { attachChallengeStonePages } from "./index-resources";
import { projectChallengeStoneUses, projectMechanicsDocuments } from "./mechanics";
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
    lootTables: index === 0 ? [endpoint("lootTables:101", "First")] : index === 3 ? [endpoint("lootTables:137", "Sporelord"), endpoint("lootTables:139", "Fangbloom")] : [],
    token: endpoint("items:564", "Corruption Token"), provenance: [] })),
  heartRequirements: [{ sourceId: "stone", place: endpoint("scenes:25", "Duskfall Depths"), count: 1, consume: true, sourceFieldPath: "requirement", provenance: [] }],
  provenance: [],
};
const refs = new Map<string, EntityRef>([
  ...names.map((name, index) => [`scenes:${25 + index}`, { key: `scenes:${25 + index}`, kind: "places" as const, name, slug: name.toLowerCase().replaceAll(" ", "-") }] as const),
  ["items:564", { key: "items:564", kind: "items" as const, name: "Corruption Token", slug: "corruption-token" }] as const,
  ["items:162", { key: "items:162", kind: "items" as const, name: "Heart of Corruption", slug: "heart-of-corruption" }] as const,
  ["items:16", { key: "items:16", kind: "items" as const, name: "Novice Plate Chest", slug: "novice-plate-chest" }] as const,
  ["items:17", { key: "items:17", kind: "items" as const, name: "Axe", slug: "axe" }] as const,
  ["items:18", { key: "items:18", kind: "items" as const, name: "Blade", slug: "blade" }] as const,
  ["items:19", { key: "items:19", kind: "items" as const, name: "Aether Cloak", slug: "aether-cloak" }] as const,
  ["npcs:360", { key: "npcs:360", kind: "npcs" as const, name: "Fangbloom", slug: "fangbloom" }] as const,
  ["npcs:364", { key: "npcs:364", kind: "npcs" as const, name: "Sporelord Thalvun", slug: "sporelord-thalvun" }] as const,
]);
const published = new Set(refs.keys());
const facts = {
  corruption,
  entities: [{ entityKey: "items:16", kind: "items", name: "Novice Plate Chest" }],
  items: [{ entityKey: "items:16", itemType: "ARMOR", corruptionToken: false, stats: [{ stat: endpoint("stats:2", "Stamina"), amount: 2, isPercent: false },
    { stat: endpoint("stats:53", "Item power"), amount: 15, isPercent: false }] },
    { entityKey: "items:17", itemType: "WEAPON", corruptionToken: false },
    { entityKey: "items:18", itemType: "WEAPON", corruptionToken: false },
    { entityKey: "items:19", itemType: "ARMOR", corruptionToken: false }],
  progression: { mechanicsRules: [] },
} as unknown as CatalogFacts;
const stoneSpot = { placementId: "stone-placement", mapSpaceId: "coalway", label: "Challenge stone" };
const transitions: CatalogTransitionRow[] = [
  { transitionId: "stone-transition", sourceSceneKey: "scenes:47", destinationSceneKey: "scenes:25",
    transitionKind: "effect-teleport", placementIds: [stoneSpot.placementId], start: null },
  { transitionId: "stone-corrupted-transition", sourceSceneKey: "scenes:47", destinationSceneKey: "scenes:26",
    transitionKind: "effect-teleport", placementIds: [stoneSpot.placementId], start: null },
];
const entries = [
  { lootTableId: 101, itemKey: "items:16" }, { lootTableId: 101, itemKey: "items:18" },
  { lootTableId: 101, itemKey: "items:17" }, { lootTableId: 137, itemKey: "items:19" },
  { lootTableId: 139, itemKey: "items:19" }, { lootTableId: 139, itemKey: "items:17" },
];
const bossTables = new Map([["npcs:360", new Set([139])], ["npcs:364", new Set([137])]]);
const rewards = (source: CatalogFacts) => corruptionRewards(source.corruption!, source, entries, bossTables, published, createReferenceResolver(refs));
const route = { sourceId: "stone", placementId: stoneSpot.placementId, stoneName: "Challenge Stone Poison",
  regionName: "Coalway Swamp", transitionIds: ["stone-transition", "stone-corrupted-transition"] };
const uses = (source: CatalogFacts = facts, routes = [route], teleports = transitions) =>
  projectChallengeStoneUses(source, published, createReferenceResolver(refs), teleports,
    new Map([[stoneSpot.placementId, stoneSpot]]), routes);
const guide = (source: CatalogFacts = facts) =>
  projectMechanicsDocuments(source, published, new Map(), createReferenceResolver(refs), new Map(),
    new Map(), bossTables, rewards(source)).get("mechanics:corruption") as CorruptionGuide;

test("corruption guide projects authored item and time-remaining thresholds from captured facts", () => {
  const document = guide();
  expect(Value.Check(CorruptionGuideSchema, document)).toBe(true);
  const { tryIt, ...withoutPicker } = document;
  expect(Value.Check(CorruptionGuideSchema, withoutPicker)).toBe(false);
  expect(Value.Check(CorruptionGuideSchema, { ...document, example: { item: document.tryIt.defaultItem } })).toBe(false);
  expect(document.tryIt.defaultItem.name).toBe("Axe");
  expect(document.tryIt.groups.map((group) => group.place.name)).toEqual(["Duskfall Depths", "The Underglow"]);
  expect(document.tryIt.groups[0]?.items.map(({ item }) => item.name)).toEqual(["Axe", "Blade", "Novice Plate Chest"]);
  expect(document.tryIt.groups[1]?.items.map(({ item, bosses }) => [item.name, bosses.map((boss) => boss.name)]))
    .toEqual([["Aether Cloak", ["Fangbloom", "Sporelord Thalvun"]], ["Axe", ["Fangbloom"]]]);
  expect(rewards(facts).byItem.get("items:17")?.map(({ place, bosses }) => [place.name, bosses.map((boss) => boss.name)]))
    .toEqual([["Duskfall Depths", []], ["The Underglow", ["Fangbloom"]]]);
  expect(document.dungeons.map((row) => [row.totalSeconds, row.firstRemainingSeconds, row.secondRemainingSeconds, row.maxLootItems])).toEqual(times);
  expect(document.dungeons[3]?.bosses?.map((boss) => boss.name)).toEqual(["Fangbloom", "Sporelord Thalvun"]);
  expect(document.dungeons[3]?.rewardsFromBossDrops).toBe(true);
  expect(document.dungeons[3]).not.toHaveProperty("lootTables");
  expect(document.token?.key).toBe("items:564");
  expect(document).not.toHaveProperty("heart");
  expect(document.seeAlso).toEqual([{ lead: "For the item that starts challenge stones, see", ref: refs.get("items:162")! }]);
  expect(document).not.toHaveProperty("heartRequirements");
  expect(Value.Check(CorruptionGuideSchema, { ...document, heartRequirements: [] })).toBe(false);
  expect(document.rules.map((rule) => rule.id)).not.toContain("corruption-heart");
  expect(uses()).toEqual([{ stoneName: "Challenge Stone Poison", regionName: "Coalway Swamp",
    destinations: [expect.objectContaining({ name: "Duskfall Depths" }), expect.objectContaining({ name: "Felheart Crucible" })],
    spot: stoneSpot, count: 1 }]);
  expect(document.affixes).toEqual([{ name: "Bolstering", description: "Nearby allies grow stronger.", available: true },
    { name: "Spiteful", description: "Ghosts appear.", available: false }]);
  expect(document.steps.find((step) => step.id === "compare-corrupted-gear")?.rules).toEqual(["corruption-gear"]);
  expect(document.rules.find((row) => row.id === "corruption-gear")?.sources.length).toBeGreaterThan(0);
});

test("reward attribution requires every table to belong to a listed boss", () => {
  const changed = guide({ ...facts, corruption: { ...corruption, dungeons: corruption.dungeons.map((row, index) =>
    index === 3 ? { ...row, lootTables: [...row.lootTables!, endpoint("lootTables:999", "Other")] } : row) } });
  expect(changed.dungeons[3]?.rewardsFromBossDrops).toBe(false);
});
test("a stone without a discovered child teleport does not inherit its host scene as its destination", () => {
  expect(uses(facts, [])).toEqual([{ count: 1, destinations: [] }]);
});

test("unpublished Frost destinations remain readable without fabricated links", () => {
  const frost = uses({
    ...facts,
    entities: [...facts.entities, { entityKey: "scenes:31", kind: "scenes", name: "Challenge stone frost" },
      { entityKey: "scenes:32", kind: "scenes", name: "Challenge stone frost corrupted" }],
  } as CatalogFacts, [{ ...route, stoneName: "Challenge Stone Frost", transitionIds: ["frost", "frost-corrupted"] }],
  [...transitions, { transitionId: "frost", sourceSceneKey: "scenes:47", destinationSceneKey: "scenes:31",
    transitionKind: "effect-teleport", placementIds: [stoneSpot.placementId], start: null },
    { transitionId: "frost-corrupted", sourceSceneKey: "scenes:47", destinationSceneKey: "scenes:32",
      transitionKind: "effect-teleport", placementIds: [stoneSpot.placementId], start: null }]);
  expect(frost?.[0]?.destinations).toEqual([]);
  expect(frost?.[0]?.unlinkedDestinations).toEqual(["Challenge Stone Frost", "Challenge Stone Frost Corrupted"]);
});

test("seven scanned Heart stone routes answer eight linked challenge place pages", () => {
  const placeRefs: EntityRef[] = Array.from({ length: 8 }, (_, index) => ({
    key: `scenes:${100 + index}`, kind: "places", name: `Challenge ${index + 1}`, slug: `challenge-${index + 1}`,
  }));
  const sourceRefs = new Map([...refs, ...placeRefs.map((ref) => [ref.key, ref] as const)]);
  const requirements = Array.from({ length: 7 }, (_, index) => ({
    ...corruption.heartRequirements![0]!, sourceId: `stone-${index}`, count: index + 1,
  }));
  const stoneRoutes = requirements.map((row, index) => ({
    sourceId: row.sourceId, placementId: `spot-${index}`, stoneName: `Challenge Stone ${index + 1}`,
    regionName: index < 3 ? "Coalway Woods" : "Coalway Swamp",
    transitionIds: index === 0 ? ["teleport-0", "teleport-1"] : [`teleport-${index + 1}`],
  }));
  const spots = new Map(stoneRoutes.map((stone) => [stone.placementId,
    { placementId: stone.placementId, mapSpaceId: "world-surface", label: stone.regionName, categories: ["interactiveObject"] }] as const));
  const teleports: CatalogTransitionRow[] = placeRefs.map((ref, index) => ({
    transitionId: `teleport-${index}`, sourceSceneKey: "scenes:47", destinationSceneKey: ref.key,
    transitionKind: "effect-teleport", placementIds: [stoneRoutes[index === 0 ? 0 : index - 1]!.placementId], start: null,
  }));
  const source: CatalogFacts = { ...facts, corruption: { ...corruption, heartRequirements: requirements } };
  const projected = projectChallengeStoneUses(source, new Set(sourceRefs.keys()), createReferenceResolver(sourceRefs),
    teleports, spots, stoneRoutes)!;
  expect(projected).toHaveLength(7);
  expect(projected.map((row) => [row.count, row.stoneName, row.spot?.placementId, row.regionName, row.destinations.map((ref) => ref.key)]))
    .toEqual(stoneRoutes.map((route, index) => [index + 1, route.stoneName, route.placementId, route.regionName,
      placeRefs.slice(index === 0 ? 0 : index + 1, index === 0 ? 2 : index + 2).map((ref) => ref.key)]));
  const heart = { ref: refs.get("items:162")! } as PublicItem;
  const documents = new Map<string, PublicDocument>([[heart.ref.key, heart],
    ...placeRefs.map((ref) => [ref.key, { ref } as PublicPlace] as const)]);
  attachChallengeStonePages(documents, heart.ref.key, projected);
  expect((documents.get(heart.ref.key) as PublicItem).challengeStoneUses).toEqual(projected);
  for (const [index, ref] of placeRefs.entries()) {
    const start = (documents.get(ref.key) as PublicPlace).challengeStoneStart;
    const stone = stoneRoutes[index === 0 ? 0 : index - 1]!;
    expect(start).toEqual({ heart: heart.ref, stoneName: stone.stoneName, regionName: stone.regionName,
      spot: { placementId: stone.placementId, mapSpaceId: "world-surface", label: stone.regionName },
      count: index === 0 ? 1 : index });
  }
  expect(documents.size).toBe(9);
});

test("unavailable build settings cannot create numeric guide claims while rewards remain selectable", () => {
  const unavailable = guide({ ...facts, corruption: { ...corruption, maxLevel: null, gearAllStatsPercentPerLevel: null,
    gearStatBonuses: null, mobStatBonuses: null, affixesPerToken: null, affixes: null, heartRequirements: null,
    dungeons: [{ ...corruption.dungeons[0]!, totalSeconds: null, firstRemainingSeconds: null, secondRemainingSeconds: null, maxLootItems: null, bosses: null, lootTables: null },
      ...corruption.dungeons.slice(1)] } });
  expect(unavailable.maxLevel).toBeUndefined();
  expect(unavailable.gearAllStatsPercentPerLevel).toBeUndefined();
  expect(unavailable.affixesPerToken).toBeUndefined();
  expect(unavailable.gearStatBonuses).toBeUndefined();
  expect(unavailable.mobStatBonuses).toBeUndefined();
  expect(unavailable.tryIt.defaultItem.name).toBe("Axe");
  expect(unavailable.affixes).toBeUndefined();
  expect(unavailable).not.toHaveProperty("heartRequirements");
  expect(unavailable.unknowns).not.toContain("Challenge-stone requirements are unavailable.");
  expect(uses({ ...facts, corruption: { ...corruption, heartRequirements: null } })).toBeUndefined();
  expect(unavailable.dungeons[0]).toEqual({ place: expect.objectContaining({ name: "Duskfall Depths" }) });
});

test("token and Heart must resolve to separate published pages", () => {
  expect(() => guide({ ...facts, corruption: { ...corruption, heart: corruption.token } })).toThrow("distinct published item pages");
});

test("picker rejects missing reward weapons rather than inventing a default", () => {
  const withoutWeapons = { ...facts, items: facts.items.filter((item) => item.itemType !== "WEAPON") };
  expect(() => rewards(withoutWeapons)).toThrow("no published weapon");
});
