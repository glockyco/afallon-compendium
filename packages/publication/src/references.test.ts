import { expect, test } from "bun:test";
import type { CatalogEntityRow, CatalogFacts, CatalogItemFacts, CatalogNpcFacts, CatalogProgressionFact, CatalogRelations } from "@afallon/contracts/catalog";
import { buildEntityReferences, createReferenceResolver } from "./references";

const entity = (kind: string, nativeId: number, name: string): CatalogEntityRow => ({
  entityKey: `${kind}:${nativeId}`, kind, nativeId, name, description: null, iconAssetName: null, artwork: [],
});

const emptyFacts: CatalogFacts = { entities: [], items: [], npcs: [], quests: [], tasks: [], places: [], raceStarts: [], properties: [], abilities: [], recipes: [], gearSets: [], progression: { facts: [], links: [], talentNodes: [], spellbookNodes: [], learners: [], unlocks: [], appliers: [], offeredClasses: [], mechanicsRules: [] }, gatheringNodes: [], adventurerItems: [], adventurerWorld: null, dungeonFinderTank: null, adventurerInviteEffects: [], itemLootTables: [] };
const emptyRelations: CatalogRelations = { drops: [], vendors: [], gathers: [], containers: [], interactions: [], quests: [], recipes: [], placements: [], transitions: [], conditions: [], gatedSources: [] };

function npcFact(entityKey: string, health = 100): CatalogNpcFacts {
  return { entityKey, minLevel: 100, maxLevel: 100, scalesWithPlayer: false, npcType: null, creatureType: null, family: null,
    faction: null, species: null, isMerchant: false, isQuestGiver: false, isCombatEnabled: true, isAuctioneer: false, isBanker: false, isFlightMaster: false, hunterTamable: false, hunterBeastRole: null, equipmentAppearanceSelections: null, adventurer: null, flightNetwork: null, minRespawn: null, maxRespawn: null,
    minExperience: null, maxExperience: null, lowerLevelExperienceModifier: null, higherLevelExperienceModifier: null, experienceBonusPerLevel: null, immuneToStun: false, immuneToSlow: false, aggroRange: null, stats: [{ stat: { entityKey: "stats:1", label: "Health" }, amount: health, isPercent: false, startingValue: null, perLevel: null, minValue: null, maxValue: null, startPercentage: null }], abilityPhases: [],
    factionRewards: [], linkedNpc: null, lootSpecialization: null };
}

function itemFact(entityKey: string, armorType: string): CatalogItemFacts {
  return { entityKey, rarity: "COMMON", itemType: "ARMOR", armorSlot: "CHEST", weaponSlot: null, weaponType: null, armorType, attackSpeed: null,
    minDamage: null, maxDamage: null, stats: [], randomStatsMax: 0, randomStats: [], sockets: [], gem: null, enchantment: null,
    sellPrice: null, sellCurrency: null, buyPrice: null, buyCurrency: null, currency: null, stackLimit: 1, questDropOnly: false, corruptionToken: false,
    equipmentRequirements: [], useConditions: [], actionAbilities: [], gameActions: [], useLines: [], conditionIds: [], gearSet: null };
}

const placement = (placementId: string, npcEntityKey: string, area: string) => ({ placementId, sceneNativeId: 10, sceneKey: "scenes:10", mapSpaceId: "world", label: null, area, roles: [{ role: "npc", npcEntityKey, scope: "authored" }], families: [], randomChoices: [] });

test("groups the records of one creature name into one page whose variants need no label when their facts match", () => {
  const entities = [entity("npcs", 206, "Fenric Doryn"), entity("npcs", 225, "fenric doryn"), entity("npcs", 234, "Fenric Doryn")];
  const facts: CatalogFacts = { ...emptyFacts, entities, npcs: entities.map((row) => npcFact(row.entityKey)) };
  const { refs, pages } = buildEntityReferences(entities, { facts, relations: emptyRelations });
  expect([...pages.keys()]).toEqual(["npcs:206"]);
  expect(pages.get("npcs:206")).toMatchObject({ ref: { name: "Fenric Doryn", slug: "fenric-doryn" }, variantFields: [] });
  expect(refs.get("npcs:225")).toMatchObject({ key: "npcs:206", name: "Fenric Doryn", slug: "fenric-doryn", variant: "n225" });
  expect(() => (refs as Map<string, unknown>).clear()).toThrow("frozen");
});

test("names the variant in a record reference when the variants differ in facts that the page shows", () => {
  const entities = [entity("scenes", 10, "World"), entity("npcs", 1, "Cragborn Alpha"), entity("npcs", 2, "Cragborn Alpha")];
  const facts: CatalogFacts = { ...emptyFacts, entities, npcs: [npcFact("npcs:1", 800), npcFact("npcs:2", 300)] };
  const relations: CatalogRelations = { ...emptyRelations, placements: [placement("p1", "npcs:1", "Skittershade mine"), placement("p2", "npcs:2", "Glacier cave")] };
  const { refs, pages } = buildEntityReferences(entities, { facts, relations });
  expect(pages.get("npcs:1")?.variantFields).toEqual(["stats"]);
  expect(refs.get("npcs:2")).toMatchObject({ key: "npcs:1", name: "Cragborn Alpha (Glacier Cave)", variant: "glacier-cave" });
});

test("does not treat stats in another order or a stat of zero as a difference between variants", () => {
  const entities = [entity("npcs", 76, "Outlaw Rogue"), entity("npcs", 77, "Outlaw Rogue")];
  const stat = (entityKey: string, label: string, amount: number) => ({ stat: { entityKey, label }, amount, isPercent: false, startingValue: null, perLevel: null, minValue: null, maxValue: null, startPercentage: null });
  const first = { ...npcFact("npcs:76"), stats: [stat("stats:1", "Health", 687.2), stat("stats:2", "Strength", 9)] };
  const second = { ...npcFact("npcs:77"), stats: [stat("stats:2", "Strength", 9), stat("stats:1", "Health", 687.2), stat("stats:3", "Spirit", 0)] };
  const { pages } = buildEntityReferences(entities, { facts: { ...emptyFacts, entities, npcs: [first, second] }, relations: emptyRelations });
  expect(pages.get("npcs:76")?.variantFields).toEqual([]);
});

test("publishes one ability page whose versions group the records that share their rank texts", () => {
  const ranks = (text: string) => [{ rankIndex: 0, lines: [{ spans: [{ text, tone: null, italic: false }] }] }];
  const entities = [entity("abilities", 0, "Cleave"), entity("abilities", 72, "Cleave"), entity("abilities", 95, "Cleave")];
  const facts: CatalogFacts = { ...emptyFacts, entities, abilities: [
    { entityKey: "abilities:0", ranks: ranks("Cooldown: 4 sec") }, { entityKey: "abilities:72", ranks: ranks("Cooldown: 1 sec") }, { entityKey: "abilities:95", ranks: ranks("Cooldown: 1 sec") },
  ] };
  const { refs, pages } = buildEntityReferences(entities, { facts, relations: emptyRelations });
  expect(pages.get("abilities:0")?.versions.map((version) => [version.anchor, version.members.map((member) => member.entityKey)])).toEqual([["n0", ["abilities:0"]], ["n72", ["abilities:72", "abilities:95"]]]);
  expect(refs.get("abilities:95")).toMatchObject({ key: "abilities:0", name: "Cleave", slug: "cleave", variant: "n72" });
});

test("qualifies separate items of one name by the fact that differs, and compares names without case", () => {
  const entities = [entity("items", 0, "Peasant Chest"), entity("items", 4, "Peasant chest"), entity("stats", 3, "Power")];
  const facts: CatalogFacts = { ...emptyFacts, entities, items: [itemFact("items:0", "CLOTH"), itemFact("items:4", "LEATHER")] };
  const { refs } = buildEntityReferences(entities, { facts, relations: emptyRelations });
  expect(refs.get("items:0")).toMatchObject({ name: "Peasant Chest (Cloth)", slug: "peasant-chest-cloth" });
  expect(refs.get("items:4")).toMatchObject({ name: "Peasant Chest (Leather)", slug: "peasant-chest-leather" });
  expect(refs.get("stats:3")).toEqual({ key: "stats:3", kind: "stats", name: "Power" });
});

test("connected effects get stable pages while orphan effects stay plain text", () => {
  const entities = [entity("effects", 435, ""), entity("effects", 301, "RESET RENT TIMER 2"), entity("effects", 62, "Potion Sickness")];
  const effects = entities.map((row) => ({ kind: "effects", entityKey: row.entityKey, name: row.name,
    details: { effectType: { name: row.nativeId === 435 ? "Dismount" : "DamageOverTime" } } }) as CatalogProgressionFact);
  const facts: CatalogFacts = { ...emptyFacts, entities, progression: { ...emptyFacts.progression, facts: effects } };
  const conditions: CatalogRelations["conditions"] = [{
    conditionId: "potion-gate", label: "Potion Sickness must be inactive", semantics: "condition", scope: null,
    requirements: [{ mode: "all", checkCount: false, requiredCount: null, requirements: [{
      type: { name: "Effect", value: 4 }, effectCondition: { name: "Effect", value: 0 },
      references: { effect: { entityKey: "effects:62", label: "Potion Sickness" } },
    } as CatalogRelations["conditions"][number]["requirements"][number]["requirements"][number]] }],
  }];
  const sources = [{ effectKey: "effects:435", family: "interactableObject", sourceId: "door",
    place: { entityKey: "scenes:10", label: "Duskfall Depths" }, placementIds: ["door-1"], label: "Exit" }];
  const { refs, pages } = buildEntityReferences(entities, { facts, relations: { ...emptyRelations, conditions }, effectWorldSources: sources });
  expect(pages.get("effects:435")?.ref.name).toBe("Unnamed Dismount Effect");
  expect(pages.has("effects:62")).toBe(true);
  expect(pages.has("effects:301")).toBe(false);
  expect(createReferenceResolver(refs)({ entityKey: "effects:301", label: "RESET RENT TIMER 2" })).toEqual({ key: null, label: "Reset Rent Timer 2" });
});

test("a verified mechanics link publishes an effect, but an unknown rule does not", () => {
  const entities = [entity("effects", 515, "Beacon of Chaos"), entity("effects", 516, "Engorged")];
  const facts: CatalogFacts = { ...emptyFacts, entities, progression: {
    ...emptyFacts.progression,
    facts: entities.map((row) => ({ kind: "effects", entityKey: row.entityKey, name: row.name,
      details: { effectType: { name: "EffectChecker" } } }) as CatalogProgressionFact),
    mechanicsRules: entities.map((row, index) => ({
      ruleId: `affix-${index}`, topic: "heroic-tier", section: "affixes", ordinal: index,
      status: index === 0 ? "verified" : "unknown", phrase: "{#0} changes combat.", operands: {},
      links: [{ entityKey: row.entityKey, label: row.name! }], sources: [], placements: [],
    })),
  } };
  const { refs, pages } = buildEntityReferences(entities, { facts, relations: emptyRelations });
  expect(pages.get("effects:515")?.ref.slug).toBe("beacon-of-chaos");
  expect(pages.has("effects:516")).toBe(false);
  expect(refs.get("effects:516")).toMatchObject({ name: "Engorged" });
  expect(refs.get("effects:516")).not.toHaveProperty("slug");
});

test("a withheld effect stays named and illustrated without gaining a page", () => {
  const marker = entity("effects", 515, "Beacon of Chaos");
  const icon = { url: "art/beacon.webp", sha256: "a".repeat(64), bytes: 12, width: 32, height: 32 };
  const { refs, pages } = buildEntityReferences([marker], {
    excluded: new Set([marker.entityKey]), artByEntity: new Map([[marker.entityKey, { icon }]]),
  });
  expect(pages.has(marker.entityKey)).toBe(false);
  expect(createReferenceResolver(refs)({ entityKey: marker.entityKey, label: marker.name! })).toEqual({
    key: null, label: marker.name!, icon,
  });
});

test("different effects can share their authored name without displaying record numbers", () => {
  const entities = [entity("effects", 144, "Corruption"), entity("effects", 215, "Corruption")];
  const facts: CatalogFacts = { ...emptyFacts, entities, progression: {
    ...emptyFacts.progression,
    facts: entities.map((row) => ({ kind: "effects", entityKey: row.entityKey, name: row.name,
      details: { effectType: { name: "Stat" } } }) as CatalogProgressionFact),
  } };
  const sources = entities.map((row) => ({ effectKey: row.entityKey, family: "interactableObject", sourceId: row.entityKey,
    place: null, placementIds: [row.entityKey], label: null }));
  const { pages } = buildEntityReferences(entities, { facts, relations: emptyRelations, effectWorldSources: sources });
  expect([...pages.values()].map((page) => page.ref.name)).toEqual(["Corruption", "Corruption"]);
  expect(new Set([...pages.values()].map((page) => page.ref.slug)).size).toBe(2);
});

test("reviewed effect names replace public references but preserve the authored URL", () => {
  const effects = [entity("effects", 280, "Stacking effect done"), entity("effects", 515, "Beacon of Chaos")];
  const facts: CatalogFacts = { ...emptyFacts, entities: effects, progression: {
    ...emptyFacts.progression, facts: effects.map((row) => ({ kind: "effects", entityKey: row.entityKey, name: row.name,
      details: { effectType: { name: "EffectChecker" } } }) as CatalogProgressionFact),
  } };
  const sources = [{ effectKey: "effects:280", family: "interactableObject", sourceId: "grave",
    place: null, placementIds: ["grave"], label: "Bless Grave" }];
  const displayName = { key: "effects:280", name: "Challenge Progress", evidence: "Challenge objective evidence." };
  const original = buildEntityReferences(effects, { facts, relations: emptyRelations, effectWorldSources: sources });
  const published = buildEntityReferences(effects, { facts, relations: emptyRelations, effectWorldSources: sources, effectDisplayNames: [displayName] });
  expect(published.refs.get("effects:280")).toMatchObject({ name: "Challenge Progress", slug: "stacking-effect-done" });
  expect(published.pages.get("effects:280")?.ref).toEqual(published.refs.get("effects:280"));
  expect(published.refs.get("effects:280")?.slug).toBe(original.refs.get("effects:280")?.slug);
  const excluded = buildEntityReferences(effects, { facts, relations: emptyRelations, effectWorldSources: sources,
    excluded: new Set(["effects:280"]), effectDisplayNames: [displayName] });
  expect(excluded.pages.has("effects:280")).toBe(false);
  expect(excluded.refs.get("effects:280")).toEqual({ key: "effects:280", kind: "effects", name: "Challenge Progress" });
  expect(createReferenceResolver(excluded.refs)({ entityKey: "effects:280", label: "Stacking Effect Done" }))
    .toEqual({ key: null, label: "Challenge Progress" });
  expect(() => buildEntityReferences(effects, { facts, effectDisplayNames: [{ ...displayName, key: "effects:999" }] })).toThrow("unknown effect");
  expect(() => buildEntityReferences(effects, { facts, effectDisplayNames: [{ ...displayName, key: "items:280" }] })).toThrow("unknown effect");
  expect(() => buildEntityReferences(effects, { facts, effectDisplayNames: [{ ...displayName, name: "BEACON  OF CHAOS" }] })).toThrow("collides with another effect");
  expect(() => buildEntityReferences(effects, { facts, effectDisplayNames: [displayName, { ...displayName, key: "effects:515", name: "Challenge Progress" }] })).toThrow("collides with another effect");
});

test("qualifies places of one name by the area of their entrance and numbers places that share it", () => {
  const entities = [entity("scenes", 47, "Afallon"), entity("scenes", 31, "Cave"), entity("scenes", 32, "Cave"), entity("scenes", 34, "Cave"), entity("scenes", 43, "Glacier Cave"), entity("scenes", 44, "Glacier Cave")];
  const place = (entityKey: string, levelRange: { min: number; max: number } | null) => ({ entityKey, placeType: "zone" as const, guideIncluded: false, guideDescription: null, levelRange, mapSpaceIds: [], bosses: [], parentSceneKey: null });
  const facts: CatalogFacts = { ...emptyFacts, entities, places: [place("scenes:31", { min: 15, max: 30 }), place("scenes:32", { min: 15, max: 30 }), place("scenes:34", { min: 15, max: 30 }), place("scenes:43", null), place("scenes:44", { min: 20, max: 30 })] };
  const door = (placementId: string, area: string) => ({ placementId, sceneNativeId: 47, sceneKey: "scenes:47", mapSpaceId: "world", label: null, area, roles: [], families: [], randomChoices: [] });
  const relations: CatalogRelations = { ...emptyRelations, placements: [door("d31", "Coalway woods"), door("d32", "Coalway woods"), door("d34", "Oakenvale")], transitions: [
    { transitionId: "t31", sourceSceneKey: "scenes:47", destinationSceneKey: "scenes:31", transitionKind: "effect-teleport", placementIds: ["d31"], start: null },
    { transitionId: "t32", sourceSceneKey: "scenes:47", destinationSceneKey: "scenes:32", transitionKind: "effect-teleport", placementIds: ["d32"], start: null },
    { transitionId: "t34", sourceSceneKey: "scenes:47", destinationSceneKey: "scenes:34", transitionKind: "effect-teleport", placementIds: ["d34"], start: null },
  ] };
  const { refs } = buildEntityReferences(entities, { facts, relations });
  expect(["scenes:31", "scenes:32", "scenes:34", "scenes:43", "scenes:44"].map((key) => refs.get(key)?.name)).toEqual(["Cave (Coalway Woods 1)", "Cave (Coalway Woods 2)", "Cave (Oakenvale)", "Glacier Cave (1)", "Glacier Cave (Level 20–30)"]);
});

test("labels variants that no fact tells apart by their position and keeps native id anchors for them", () => {
  const entities = [entity("npcs", 76, "Outlaw Rogue"), entity("npcs", 77, "Outlaw Rogue"), entity("npcs", 90, "Outlaw Rogue")];
  const facts: CatalogFacts = { ...emptyFacts, entities, npcs: [npcFact("npcs:76", 100), npcFact("npcs:77", 200), npcFact("npcs:90", 300)] };
  const { refs, pages } = buildEntityReferences(entities, { facts, relations: emptyRelations });
  const members = pages.get("npcs:76")!.members;
  expect(members.map((member) => member.anchor)).toEqual(["n76", "n77", "n90"]);
  expect(new Set(members.map((member) => member.label)).size).toBe(3);
  expect(members.every((member, index) => member.label.endsWith(String(index + 1)))).toBe(true);
  expect(refs.get("npcs:77")).toMatchObject({ name: `Outlaw Rogue (${members[1]!.label})`, variant: "n77" });
});

test("gives each unnamed record its own page and a name without its native id", () => {
  const entities = [entity("npcs", 125, ""), entity("npcs", 130, "  "), entity("scenes", 1, "")];
  const facts: CatalogFacts = { ...emptyFacts, entities, npcs: [npcFact("npcs:125"), npcFact("npcs:130")] };
  const { refs, pages } = buildEntityReferences(entities, { facts, relations: emptyRelations });
  expect([...pages.keys()]).toEqual(["npcs:125", "npcs:130", "scenes:1"]);
  expect(["npcs:125", "npcs:130", "scenes:1"].map((key) => refs.get(key)?.name)).toEqual(["Unnamed NPC (1)", "Unnamed NPC (2)", "Unnamed Place"]);
});

test("spaces the code-named words of abilities and effects but keeps abbreviations and item names", () => {
  const { refs } = buildEntityReferences([entity("abilities", 5, "BoarAttack1"), entity("abilities", 6, "Spider Attack2"), entity("abilities", 7, "AoE Cursed"),
    entity("effects", 20, "HealingPotion"), entity("effects", 21, "Hailstorm DoT"), entity("items", 30, "Large FirePlace")]);
  expect(["abilities:5", "abilities:6", "abilities:7", "effects:20", "effects:21", "items:30"].map((key) => refs.get(key)?.name))
    .toEqual(["Boar Attack 1", "Spider Attack 2", "AoE Cursed", "Healing Potion", "Hailstorm DoT", "Large FirePlace"]);
  expect(refs.get("abilities:5")?.slug).toBe("boar-attack-1");
});

test("drops apostrophes instead of splitting a slug", () => {
  const { refs } = buildEntityReferences([entity("items", 1040, "Oathbreaker's Edge"), entity("abilities", 8, "Nature’s Grasp")]);
  expect(refs.get("items:1040")?.slug).toBe("oathbreakers-edge");
  expect(refs.get("abilities:8")?.slug).toBe("natures-grasp");
});

test("adds the native id when distinct names produce the same slug", () => {
  const { refs } = buildEntityReferences([entity("items", 11, "A B"), entity("items", 12, "A-B")]);
  expect(refs.get("items:11")?.slug).toBe("a-b");
  expect(refs.get("items:12")?.slug).toBe("a-b-12");
});

test("a record that shares its name only with an excluded record loses its qualifier", () => {
  const catacombs = [entity("scenes", 29, "Coalway catacombs"), entity("scenes", 37, "Coalway catacombs")];
  expect(buildEntityReferences(catacombs).refs.get("scenes:37")).toMatchObject({ name: "Coalway Catacombs (2)", slug: "coalway-catacombs-2" });
  const { refs, pages } = buildEntityReferences(catacombs, { excluded: new Set(["scenes:29"]) });
  expect(refs.get("scenes:37")).toMatchObject({ name: "Coalway Catacombs", slug: "coalway-catacombs" });
  // The excluded record keeps its formatted name for text, but it has no page and no link.
  expect(refs.get("scenes:29")).toEqual({ key: "scenes:29", kind: "places", name: "Coalway Catacombs" });
  expect([...pages.keys()]).toEqual(["scenes:37"]);
});

test("recipes link the product Crafting section, a skill row, or plain text", () => {
  const entities = [entity("recipes", 1, "Runeweave Regalia"), entity("items", 1, "Runeweave Regalia"),
    entity("recipes", 2, "Ring of Bleed Damage"), entity("items", 2, "Bloodthrall Signet"),
    entity("recipes", 3, "Demonic Bulwark Looted"), entity("skills", 1, "Smithing"), entity("recipes", 4, "Unmapped Craft")];
  const facts: CatalogFacts = { ...emptyFacts, entities, recipes: [
    { entityKey: "recipes:1", skill: null, station: null, learnedByDefault: true, ranks: [] },
    { entityKey: "recipes:2", skill: null, station: null, learnedByDefault: false, ranks: [] },
    { entityKey: "recipes:3", skill: { entityKey: "skills:1", label: "Smithing" }, station: null, learnedByDefault: false, ranks: [] },
    { entityKey: "recipes:4", skill: null, station: null, learnedByDefault: false, ranks: [] },
  ] };
  const relations: CatalogRelations = { ...emptyRelations, recipes: [
    { recipe: { entityKey: "recipes:1", label: "Runeweave Regalia" }, item: { entityKey: "items:1", label: "Runeweave Regalia" }, role: "product", count: 1, rank: 0, chance: 100 },
    { recipe: { entityKey: "recipes:2", label: "Ring of Bleed Damage" }, item: { entityKey: "items:2", label: "Bloodthrall Signet" }, role: "product", count: 1, rank: 0, chance: 100 },
  ] };
  const { refs, pages } = buildEntityReferences(entities, { facts, relations });
  expect(pages.has("recipes:1")).toBe(false);
  expect(refs.get("recipes:1")).toEqual({ key: "items:1", kind: "items", name: "Runeweave Regalia", slug: "runeweave-regalia", variant: "crafting" });
  expect(refs.get("recipes:2")).toEqual({ key: "items:2", kind: "items", name: "Ring of Bleed Damage", slug: "bloodthrall-signet", variant: "crafting" });
  expect(refs.get("recipes:3")).toEqual({ key: "skills:1", kind: "skills", name: "Demonic Bulwark Looted", slug: "smithing", variant: "recipe-demonic-bulwark-looted" });
  expect(refs.get("recipes:4")).toEqual({ key: "recipes:4", kind: "recipes", name: "Unmapped Craft" });
});
