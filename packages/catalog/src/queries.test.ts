import { expect, test } from "bun:test";
import { openNormalizedDatabase, recordCoverageIssue } from "./database";
import { queryCatalogCoverage, queryCatalogEntity, queryCatalogImagery, queryCatalogItemSources, queryCatalogMaps, queryCatalogSearch, queryConditions, queryContainerRows, queryDropRows, queryVendorRows, queryQuestRewardTypes, queryQuestRows, queryInteractionRows, queryContainment, queryGatedSources, queryCatalogFacts } from "./queries";
import { relationRows } from "./relations";
import { containerTypeFromHierarchyPath } from "./world";

test("returns the same conditional vendor and boss drop rows from both endpoints", () => {
  const db = openNormalizedDatabase(":memory:");
  try {
    const catalogId = "f".repeat(64), evidence = "e".repeat(64);
    db.query("INSERT INTO normalized_builds VALUES (?, ?, ?)").run("build", "catalog.v1", "{}");
    db.query("INSERT INTO catalog_metadata VALUES (?, ?, ?, ?, ?)").run(catalogId, "build", "catalog.v1", "{}", evidence);
    db.query("INSERT INTO canonical_entities VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?), (?, ?, ?, ?, ?, ?, ?, ?, ?, ?), (?, ?, ?, ?, ?, ?, ?, ?, ?, ?), (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").run(
      "build", "npcs", 2, "npcs:2", "Boss", null, null, null, "{}", "[]",
      "build", "npcs", 3, "npcs:3", "Vendor", null, null, null, "{}", "[]",
      "build", "items", 1, "items:1", "Sword", null, null, null, "{}", "[]",
      "build", "skills", 4, "skills:4", "Trade", null, null, null, "{}", "[]",
    );
    db.query("INSERT INTO npc_facts(entity_key, scales_with_player, is_merchant, is_quest_giver, is_combat_enabled, immune_to_stun, immune_to_slow, provenance_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?), (?, ?, ?, ?, ?, ?, ?, ?)").run(
      "npcs:2", 0, 0, 0, 1, 0, 0, "[]",
      "npcs:3", 0, 1, 0, 0, 0, 0, "[]",
    );
    db.query("INSERT INTO conditions VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").run("progression", "build", "merchant", "npcs:3", 0, "all", null, "/merchants/0", JSON.stringify({ sourceName: "Journeyman Trade", groups: [{ checkCount: true, requiredCount: 1, requirements: [{ requirementType: "Skill", skillID: 4, amount1: 10 }] }] }), "[]");
    db.query("INSERT INTO conditions VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").run("empty", "build", "quest", "quests:7", 0, "inline-requirements", null, "/quests/7", JSON.stringify({ nativeGroupCount: 0, groups: [] }), "[]");
    db.query("INSERT INTO merchant_tables VALUES (?, ?, ?, ?)").run("build", 7, "Stock", "{}");
    db.query("INSERT INTO merchant_bindings VALUES (?, ?, ?, ?, ?, ?), (?, ?, ?, ?, ?, ?)").run("build", "npcs:3", 7, 0, "progression", "{}", "build", "npcs:2", 7, 1, null, "{}");
    recordCoverageIssue(db, { buildId: "build", kind: "inactive-merchant-binding", subjectKey: "merchant:2:1", semanticDiscriminator: "", state: "unresolved", runId: "run", artifactHash: evidence, sourceKey: "relationships", recordPath: "/merchantBindings/1", evidence: {} });
    db.query("INSERT INTO merchant_stock VALUES (?, ?, ?, ?, ?, ?, ?)").run("build", 7, 0, "items:1", null, 25, "{}");
    db.query("INSERT INTO loot_tables VALUES (?, ?, ?, ?)").run("build", 9, 0, "{}");
    db.query("INSERT INTO loot_bindings VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").run("boss-drop", "build", "npc", "npcs:2", 9, 0, 12.34, "authored", null, "{}");
    db.query("INSERT INTO loot_entries VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)").run("build", 9, 0, "items:1", 1, 2, 12.34, "authored", "{}");

    const vendorRows = queryVendorRows(db).records;
    const fromVendor = vendorRows.filter((row) => row.npc.entityKey === "npcs:3");
    const fromVendorItem = vendorRows.filter((row) => row.item.entityKey === "items:1");
    expect(fromVendor).toEqual(fromVendorItem);
    expect(fromVendor).toEqual([{ npc: { entityKey: "npcs:3", label: "Vendor" }, item: { entityKey: "items:1", label: "Sword" }, currency: null, cost: 25, merchantTableId: 7, stockIndex: 0, conditionIds: ["progression"], placementIds: [] }]);
    expect(queryConditions(db).records).toMatchObject([{ conditionId: "progression", semantics: "all", scope: null, label: "Journeyman Trade", requirements: [{ mode: "all", checkCount: true, requiredCount: 1, requirements: [{ type: { name: "Skill" }, label: "Trade 10", references: { skill: { entityKey: "skills:4", label: "Trade" } }, amounts: { primary: 10, secondary: 0 } }] }] }]);
    expect(queryCatalogCoverage(db).records).toMatchObject({ occurrenceCount: 1, unresolvedIssues: [{ kind: "inactive-merchant-binding", subjectKey: "merchant:2:1", occurrenceCount: 1 }] });

    const dropRows = queryDropRows(db).records;
    const fromBoss = dropRows.filter((row) => row.owner.entityKey === "npcs:2");
    const fromDropItem = dropRows.filter((row) => row.item.entityKey === "items:1");
    expect(fromBoss).toEqual(fromDropItem);
    expect(fromBoss).toEqual([{ context: "npc", owner: { entityKey: "npcs:2", label: "Boss" }, item: { entityKey: "items:1", label: "Sword" }, lootTableId: 9, entryIndex: 0, min: 1, max: 2, rawRate: 12.34, displayedChance: 12.3, tableRate: 12.34, tableMinimum: null, tableLimit: null, creatureLevel: null, conditionIds: [], placementIds: [] }]);
  } finally { db.close(); }
});

test("world loot reaches the creature levels of its binding and of the item's level band", () => {
  const db = openNormalizedDatabase(":memory:");
  try {
    db.query("INSERT INTO normalized_builds VALUES (?, ?, ?)").run("build", "catalog.v1", "{}");
    db.query("INSERT INTO catalog_metadata VALUES (?, ?, ?, ?, ?)").run("f".repeat(64), "build", "catalog.v1", "{}", "e".repeat(64));
    for (const id of [1, 2, 3]) db.query("INSERT INTO canonical_entities (build_id, kind, native_id, entity_key, name, internal_name, description, source_key, details_json, provenance_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").run("build", "items", id, `items:${id}`, `Item ${id}`, null, null, null, "{}", "[]");
    // Table 5 gives any item. Table 6 is a level-band table with a limit of two items and a minimum of one.
    db.query("INSERT INTO loot_tables VALUES (?, ?, ?, ?), (?, ?, ?, ?)").run("build", 5, 0, "{}", "build", 6, 1, JSON.stringify({ limitDroppedItems: true, maxDroppedItems: 2, hasMinimumDrops: true, minDroppedItems: 1 }));
    const bind = (index: number, table: number, rate: number, min: number, max: number) => db.query("INSERT INTO loot_bindings VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").run(`world-${index}`, "build", "world", null, table, index, rate, "authored", null, JSON.stringify({ minimumNPCLevel: min, maximumNPCLevel: max }));
    bind(0, 5, 30, 0, 0); bind(1, 6, 5, 7, 20); bind(2, 6, 5, 20, 0);
    db.query("INSERT INTO loot_entries VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?), (?, ?, ?, ?, ?, ?, ?, ?, ?), (?, ?, ?, ?, ?, ?, ?, ?, ?), (?, ?, ?, ?, ?, ?, ?, ?, ?)").run(
      "build", 5, 0, "items:1", 1, 1, 0.8, "authored", "{}", "build", 6, 0, "items:2", 1, 1, 2.5, "authored", "{}",
      "build", 6, 1, "items:3", 1, 1, 2.5, "authored", "{}", "build", 6, 2, "items:1", 1, 1, 2.5, "authored", "{}",
    );
    const eligibility = (requiredLevel: number) => JSON.stringify({ worldLootSettings: { minimumNPCRank: 0, minimumNPCRankName: "MOB" }, levelEligibility: { requiredLevel, levelBand: { range: 4 } } });
    const source = (item: string, key: string, requiredLevel: number) => db.query("INSERT INTO item_sources VALUES (?, ?, ?, ?, ?, ?, ?)").run(item, "world-loot", key, "[]", "[]", eligibility(requiredLevel), "null");
    source("items:1", "0:0", 0); source("items:2", "1:0", 8); source("items:3", "1:1", 26); source("items:1", "1:2", 0);
    source("items:2", "2:0", 8); source("items:3", "2:1", 26); source("items:1", "2:2", 0);
    const levels = queryDropRows(db).records.map((row) => [row.item.entityKey, row.lootTableId, row.creatureLevel, row.owner.label, row.tableRate, row.tableMinimum, row.tableLimit]);
    expect(levels).toEqual([
      ["items:1", 5, { min: 1, max: null }, "Any creature", 30, null, null],
      // Level 8 reaches creatures of levels 4 to 12, and the binding keeps 7 to 12. Level 26 is outside 7 to 20.
      ["items:2", 6, { min: 7, max: 12 }, "Any creature", 5, 1, 2],
      ["items:1", 6, { min: 7, max: 20 }, "Any creature", 5, 1, 2],
      ["items:3", 6, { min: 22, max: 30 }, "Any creature", 5, 1, 2],
      ["items:1", 6, { min: 20, max: null }, "Any creature", 5, 1, 2],
    ]);
  } finally { db.close(); }
});

test("derives readable container types and exposes their place", () => {
  expect(containerTypeFromHierarchyPath("GAMEPLAY[0]/Backpack (1)[1]/Loot[0]")).toBe("Backpack");
  expect(containerTypeFromHierarchyPath("GAMEPLAY[0]/Adventurer’s Supply Pack loot[3]/Shieldmaster[2]/Plate 0-150[0]/Plate loot 0-150[0]")).toBe("Backpack");
  expect(containerTypeFromHierarchyPath("GAMEPLAY[0]/Loot[0]")).toBeNull();
  const db = openNormalizedDatabase(":memory:");
  try {
    db.query("INSERT INTO normalized_builds VALUES (?, ?, ?)").run("build", "catalog.v1", "{}");
    db.query("INSERT INTO catalog_metadata VALUES (?, ?, ?, ?, ?)").run("c".repeat(64), "build", "catalog.v1", "{}", "e".repeat(64));
    db.query("INSERT INTO identity_scenes VALUES (?, ?, ?)").run("build", 31, "cave");
    db.query("INSERT INTO map_spaces VALUES (?, ?, ?)").run("build", "world", "World");
    db.query("INSERT INTO canonical_entities VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?), (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").run(
      "build", "items", 14, "items:14", "Novice Plate Boots", null, null, null, "{}", "[]",
      "build", "scenes", 31, "scenes:31", "Coalway Cave", null, null, null, "{}", "[]",
    );
    db.query("INSERT INTO placements (placement_id, build_id, scene_native_id, scene_path, map_space_id, world_x, world_y, world_z, map_x, map_y, shape_json, provenance_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").run("chest-placement", "build", 31, "cave", "world", 0, 0, 0, 5, 5, "null", "[]");
    db.query("INSERT INTO item_sources VALUES (?, ?, ?, ?, ?, ?, ?)").run("items:14", "container", "output-hash", "[\"chest-placement\"]", "[]", JSON.stringify({ sourceId: "chest-source", containerType: "Backpack", min: 1, max: 1, rawRate: 100 }), "null");

    expect(queryContainerRows(db).records).toEqual([{ containerType: "Backpack", sourceId: "chest-source", place: { entityKey: "scenes:31", label: "Coalway Cave" }, item: { entityKey: "items:14", label: "Novice Plate Boots" }, min: 1, max: 1, rawRate: 100, availability: [], placementIds: ["chest-placement"] }]);
  } finally { db.close(); }
});

test("keeps each condition's requirements and combines one item's conditions once for items:1040", () => {
  const db = openNormalizedDatabase(":memory:");
  try {
    db.query("INSERT INTO normalized_builds VALUES (?, ?, ?)").run("build", "catalog.v1", "{}");
    db.query("INSERT INTO catalog_metadata VALUES (?, ?, ?, ?, ?)").run("c".repeat(64), "build", "catalog.v1", "{}", "e".repeat(64));
    db.query("INSERT INTO canonical_entities VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?), (?, ?, ?, ?, ?, ?, ?, ?, ?, ?), (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").run(
      "build", "items", 1040, "items:1040", "Melee Weapon", null, null, null, "{}", "[]",
      "build", "classes", 0, "classes:0", "Shieldmaster", null, null, null, "{}", "[]",
      "build", "classes", 5, "classes:5", "Assassin", null, null, null, "{}", "[]",
    );
    const classes = { checkCount: false, requiredCount: 1, requirements: [{ requirementType: "Class", conditionRule: "Optional", classID: 0, amount1: 0, amount2: 0 }, { requirementType: "Class", conditionRule: "Optional", classID: 5, amount1: 0, amount2: 0 }] };
    const level = { checkCount: false, requiredCount: 0, requirements: [{ requirementType: "Level", conditionRule: "Mandatory", levelsID: -1, amount1: 27, amount2: 0 }] };
    db.query("INSERT INTO conditions VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?), (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").run(
      "a-template", "build", "entity", "items:1040", 0, "requirements-template", "equipment", "/items/1040/template", JSON.stringify({ groups: [classes] }), "[]",
      "b-inline", "build", "entity", "items:1040", 1, "inline-requirements", "equipment", "/items/1040/inline", JSON.stringify({ groups: [classes, level] }), "[]",
    );

    // Both conditions keep the class group: a consumer selects conditions by ID and must not find one emptied.
    const classGroup = { mode: "any", checkCount: false, requiredCount: null, requirements: [
      { type: { name: "Class" }, rule: { name: "Optional" }, label: "Shieldmaster", references: { class: { entityKey: "classes:0", label: "Shieldmaster" } } },
      { type: { name: "Class" }, rule: { name: "Optional" }, label: "Assassin", references: { class: { entityKey: "classes:5", label: "Assassin" } } },
    ] };
    const levelGroup = { mode: "all", checkCount: false, requiredCount: null, requirements: [{ type: { name: "Level" }, rule: { name: "Mandatory" }, label: "level 27", amounts: { primary: 27, secondary: 0 } }] };
    expect(queryConditions(db).records).toMatchObject([
      { conditionId: "a-template", scope: "equipment", requirements: [classGroup] },
      { conditionId: "b-inline", scope: "equipment", requirements: [classGroup, levelGroup] },
    ]);
    db.query("INSERT INTO item_facts(entity_key, random_stats_max, stack_limit, quest_drop_only, corruption_token, action_abilities_json, use_lines_json, condition_ids_json, provenance_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)").run(
      "items:1040", 0, 1, 0, 0, "[]", "[]", JSON.stringify(["a-template", "b-inline"]), "[]",
    );
    expect(queryCatalogFacts(db).records.items[0]?.equipmentRequirements).toMatchObject([classGroup, levelGroup]);
  } finally { db.close(); }
});

test("renders complete classified item use predicates", () => {
  const db = openNormalizedDatabase(":memory:");
  try {
    db.query("INSERT INTO normalized_builds VALUES (?, ?, ?)").run("build", "catalog.v1", "{}");
    db.query("INSERT INTO catalog_metadata VALUES (?, ?, ?, ?, ?)").run("c".repeat(64), "build", "catalog.v1", "{}", "e".repeat(64));
    db.query("INSERT INTO canonical_entities VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").run("build", "effects", 30, "effects:30", "Potion Sickness", null, null, null, "{}", "[]");
    const named = (value: number, name: string) => ({ value, name });
    const entry = (name: string) => ({ nativeId: -1, name, internalName: name, fileName: `${name}_TYPE`, description: "", nativeType: "Game.Entry", text: name });
    const group = (requirements: unknown[]) => JSON.stringify({ groups: [{ checkCount: false, requiredCount: 0, requirements }] });
    const effect = { requirementType: "Effect", conditionRule: "Mandatory", effectID: 30, state: named(1, "Inactive") };
    // The game compares stacks only when the first flag is set.
    const stacks = { requirementType: "Effect", conditionRule: "Mandatory", effectID: 30, state: named(0, "Active"), boolBalue1: true, amount1: 34, value: named(3, "EqualOrAbove") };
    const weapons = ["AXE", "One handed sword", "Two handed sword"].map((name) => ({ requirementType: "Item", conditionRule: "Optional", ownership: named(2, "Equipped"), itemCondition: named(2, "WeaponType"), weaponType: entry(name) }));
    const region = { requirementType: "Region", conditionRule: "Mandatory", region: entry("Quest complete") };
    const combat = { requirementType: "CombatState", conditionRule: "Mandatory", boolBalue1: false };
    const insert = db.query("INSERT INTO conditions(condition_id, build_id, owner_type, owner_key, ordinal, semantics, scope, source_field_path, payload_json, provenance_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    insert.run("effect", "build", "entity", "items:13", 0, "inline-requirements", "use", "/effect", group([effect]), "[]");
    insert.run("weapons", "build", "entity", "items:954", 0, "inline-requirements", "use", "/weapons", group(weapons), "[]");
    insert.run("region", "build", "entity", "items:222", 0, "inline-requirements", "use", "/region", group([region]), "[]");
    insert.run("combat", "build", "entity", "items:235", 0, "inline-requirements", "use", "/combat", group([combat]), "[]");
    insert.run("stacks", "build", "entity", "items:236", 0, "inline-requirements", "use", "/stacks", group([stacks]), "[]");

    expect(queryConditions(db).records.map((condition) => [condition.scope, condition.label])).toEqual([
      ["use", "Out of combat"],
      ["use", "Potion Sickness is inactive"],
      ["use", "Region Quest complete"],
      ["use", "Potion Sickness is active with 34 or more stacks"],
      ["use", "Axe equipped or One Handed Sword equipped or Two Handed Sword equipped"],
    ]);
  } finally { db.close(); }
});

test("returns stable ordered catalog records with exact identity", () => {
  const db = openNormalizedDatabase(":memory:");
  try {
    const catalogId = "c".repeat(64);
    db.query("INSERT INTO normalized_builds VALUES (?, ?, ?)").run("build", "catalog.v1", "{}");
    db.query("INSERT INTO catalog_metadata VALUES (?, ?, ?, ?, ?)").run(catalogId, "build", "catalog.v1", "{}", "a".repeat(64));
    db.query("INSERT INTO map_spaces VALUES (?, ?, ?), (?, ?, ?)").run("build", "z-map", "Z", "build", "a-map", "A");
    db.query("INSERT INTO canonical_entities VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?), (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").run(
      "build", "npcs", 2, "npcs:2", "Zulu", null, null, null, "{}", "[]",
      "build", "items", 1, "items:1", "Alpha", null, "Item", null, "{}", "[{\"path\":\"canonical\"}]",
    );
    db.query("INSERT INTO item_sources VALUES (?, ?, ?, ?, ?, ?, ?), (?, ?, ?, ?, ?, ?, ?)").run(
      "items:1", "world", "z", "[]", "[]", "{}", "null",
      "items:1", "merchant", "a", "[]", "[]", "{}", "null",
    );
    db.query("INSERT INTO imagery_assets VALUES (?, ?, ?, ?, ?, ?, ?, ?), (?, ?, ?, ?, ?, ?, ?, ?)").run(
      "z", "build", "a-map", "captured", "d".repeat(64), 2, "{}", "[]",
      "a", "build", "a-map", "game-map", "b".repeat(64), 1, "{}", "[]",
    );
    const issue = { buildId: "build", kind: "gap", subjectKey: "subject", semanticDiscriminator: "", state: "unresolved" as const, runId: "run", artifactHash: "e".repeat(64), sourceKey: "canonical" };
    recordCoverageIssue(db, { ...issue, recordPath: "records/2", evidence: {} });
    recordCoverageIssue(db, { ...issue, recordPath: "records/1", evidence: {} });

    const queries = [
      () => queryCatalogMaps(db),
      () => queryCatalogSearch(db),
      () => queryCatalogEntity(db, "items:1"),
      () => queryCatalogItemSources(db, "items:1"),
      () => queryCatalogImagery(db, "a-map"),
      () => queryCatalogCoverage(db),
    ];
    for (const query of queries) {
      const first = query();
      expect(query()).toEqual(first);
      expect(first).toMatchObject({ buildId: "build", catalogId });
    }
    expect(queryCatalogMaps(db).records.map((row) => row.mapSpaceId)).toEqual(["a-map", "z-map"]);
    expect(queryCatalogSearch(db).records.map((row) => row.entityKey)).toEqual(["items:1", "npcs:2"]);
    expect(queryCatalogItemSources(db, "items:1").records.map((row) => row.sourceKind)).toEqual(["merchant", "world"]);
    expect(queryCatalogImagery(db, "a-map").records.map((row) => row.kind)).toEqual(["captured", "game-map"]);
    expect(queryCatalogCoverage(db).records).toMatchObject({ occurrenceCount: 2, unresolvedIssues: [{ occurrenceCount: 2 }] });
  } finally { db.close(); }
});

test("typed currency rewards never expose a stale item endpoint or item source", () => {
  const evidence = { path: "relationships.json", sha256: "a".repeat(64) };
  const relationships = { merchantTables: [], merchantBindings: [], merchantStock: [], lootTables: [], npcLootBindings: [], worldLootBindings: [], lootEntries: [], clothDrops: { tiers: [] }, npcQuestBindings: [], questObjectives: [], questItemsGiven: [], questRewards: [{ questID: 8, rewardType: "currency", itemID: 1, currencyID: 2, treePointID: -1, factionID: -1, weaponTemplateID: -1, rewardIndex: 0, rewardSource: "rewardsGiven" }], resourceYields: [] };
  const relations = relationRows(relationships as never, {} as never, { dynamicTables: [], linkedNpcs: [] } as never, [], new Set(["quests:8", "items:1", "currencies:2"]), new Map(), evidence, evidence, []);
  expect(relations.questAssociations[0]).toMatchObject({ itemID: null });
  expect(relations.itemIndex.has(1)).toBe(false);

  const db = openNormalizedDatabase(":memory:");
  try {
    db.query("INSERT INTO normalized_builds VALUES (?, ?, ?)").run("build", "schema", "{}");
    db.query("INSERT INTO catalog_metadata VALUES (?, ?, ?, ?, ?)").run("c".repeat(64), "build", "schema", "{}", "d".repeat(64));
    const entity = db.query("INSERT INTO canonical_entities VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    for (const [kind, id, name] of [["quests", 8, "Quest"], ["items", 1, "Stale item"], ["currencies", 2, "Gold Coin"]] as const) entity.run("build", kind, id, `${kind}:${id}`, name, null, null, null, "{}", "[]");
    db.query("INSERT INTO quest_facts(entity_key, repeatable, turn_in_without_npc, condition_ids_json, provenance_json) VALUES (?, ?, ?, ?, ?)").run("quests:8", 0, 0, "[]", "[]");
    db.query("INSERT INTO quest_rewards VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)").run("quests:8", "given", 0, "currency", "currencies:2", "Gold Coin", 40, null, "[]");
    db.query("INSERT INTO quest_associations VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)").run("authored-reward", "build", "quest-reward", null, "quests:8", null, null, null, JSON.stringify(relations.questAssociations[0]));
    expect(queryQuestRows(db).records).toMatchObject([{ kind: "reward", counterpart: { entityKey: "currencies:2", label: "Gold Coin" }, count: 40, rewardType: "currency" }]);
  } finally { db.close(); }
});

test("quest reward types count untargeted rewards and choices but not supplied items", () => {
  const db = openNormalizedDatabase(":memory:");
  try {
    db.query("INSERT INTO normalized_builds VALUES (?, ?, ?)").run("build", "schema", "{}");
    db.query("INSERT INTO catalog_metadata VALUES (?, ?, ?, ?, ?)").run("c".repeat(64), "build", "schema", "{}", "d".repeat(64));
    const entity = db.query("INSERT INTO canonical_entities VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    for (const [kind, id] of [["quests", 8], ["quests", 9], ["items", 1]] as const) entity.run("build", kind, id, `${kind}:${id}`, `${kind} ${id}`, null, null, null, "{}", "[]");
    const quest = db.query("INSERT INTO quest_facts(entity_key, repeatable, turn_in_without_npc, condition_ids_json, provenance_json) VALUES (?, ?, ?, ?, ?)");
    quest.run("quests:8", 0, 0, "[]", "[]");
    quest.run("quests:9", 0, 0, "[]", "[]");
    const reward = db.query("INSERT INTO quest_rewards VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
    reward.run("quests:8", "given", 0, "Experience", null, null, null, 120, "[]");
    reward.run("quests:8", "pick", 0, "item", "items:1", "Blade", 1, null, "[]");
    reward.run("quests:9", "given", 0, "Experience", null, null, null, 40, "[]");
    reward.run("quests:9", "itemGiven", 0, "item", "items:1", "Blade", 1, null, "[]");
    const types = queryQuestRewardTypes(db).records;
    expect(types.get("quests:8")).toEqual(["Experience", "item", "item choice"]);
    expect(types.get("quests:9")).toEqual(["Experience"]);
  } finally { db.close(); }
});

test("inactive NPC quest bindings are retained as evidence but excluded from quest rows", () => {
  const evidence = { path: "relationships.json", sha256: "a".repeat(64) }, blockers: Array<{ kind: string }> = [];
  const relationships = { merchantTables: [], merchantBindings: [], merchantStock: [], lootTables: [], npcLootBindings: [], worldLootBindings: [], lootEntries: [], clothDrops: { tiers: [] }, npcQuestBindings: [{ ownerNativeId: 3, questID: 8, association: "given", associationIndex: 0 }], questObjectives: [], questItemsGiven: [], questRewards: [], resourceYields: [] };
  const relations = relationRows(relationships as never, {} as never, { dynamicTables: [], linkedNpcs: [] } as never, [], new Set(["npcs:3", "quests:8"]), new Map([["npcs:3", { isQuestGiver: false }]]), evidence, evidence, blockers as never);
  expect(blockers).toMatchObject([{ kind: "inactive-quest-binding" }]);
  expect(relations.questAssociations).toMatchObject([{ associationKind: "npc-quest" }]);
  const db = openNormalizedDatabase(":memory:");
  try {
    db.query("INSERT INTO normalized_builds VALUES (?, ?, ?)").run("build", "schema", "{}");
    db.query("INSERT INTO catalog_metadata VALUES (?, ?, ?, ?, ?)").run("c".repeat(64), "build", "schema", "{}", "d".repeat(64));
    const entity = db.query("INSERT INTO canonical_entities VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    for (const [kind, id] of [["quests", 8], ["npcs", 3]] as const) entity.run("build", kind, id, `${kind}:${id}`, `${kind} ${id}`, null, null, null, "{}", "[]");
    db.query("INSERT INTO quest_facts(entity_key, repeatable, turn_in_without_npc, condition_ids_json, provenance_json) VALUES (?, ?, ?, ?, ?)").run("quests:8", 0, 0, "[]", "[]");
    db.query("INSERT INTO npc_facts(entity_key, scales_with_player, is_merchant, is_quest_giver, is_combat_enabled, immune_to_stun, immune_to_slow, provenance_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").run("npcs:3", 0, 0, 0, 0, 0, 0, "[]");
    db.query("INSERT INTO quest_associations VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)").run("binding", "build", "npc-quest", "npcs:3", "quests:8", null, null, null, JSON.stringify(relations.questAssociations[0]));
    expect(queryQuestRows(db).records).toEqual([]);
    db.query("UPDATE npc_facts SET is_quest_giver = 1 WHERE entity_key = 'npcs:3'").run();
    expect(queryQuestRows(db).records).toMatchObject([{ kind: "giver", counterpart: { entityKey: "npcs:3" } }]);
  } finally { db.close(); }
});

test("requirement spans link quest states and retain numeric comparisons", () => {
  const db = openNormalizedDatabase(":memory:");
  try {
    db.query("INSERT INTO normalized_builds VALUES (?, ?, ?)").run("build", "schema", "{}");
    const entity = db.query("INSERT INTO canonical_entities VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    db.query("INSERT INTO catalog_metadata VALUES (?, ?, ?, ?, ?)").run("c".repeat(64), "build", "schema", "{}", "d".repeat(64));
    for (const [kind, id, name] of [["quests", 8, "Wrath of the Matriarch"], ["stats", 1, "Power"], ["items", 364, "Fish bait"], ["skills", 8, "Fishing"], ["items", 30, "Gold"], ["currencies", 0, "Gold Coin"]] as const) entity.run("build", kind, id, `${kind}:${id}`, name, null, null, null, "{}", "[]");
    const insert = db.query("INSERT INTO conditions VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    const group = (requirement: unknown) => JSON.stringify({ groups: [{ requirements: [requirement] }] });
    insert.run("a", "build", "entity", "quests:9", 0, "requirements", null, null, group({ requirementType: "Quest", questID: 8, questState: { value: 4, name: "turnedIn" } }), "[]");
    insert.run("b", "build", "entity", "quests:9", 1, "requirements", null, null, group({ requirementType: "Level", amount1: 16, value: { value: 2, name: "EqualOrAbove" } }), "[]");
    insert.run("c", "build", "entity", "quests:9", 2, "requirements", null, null, group({ requirementType: "Stat", statID: 1, amount1: 150, value: { value: 3, name: "EqualOrBelow" } }), "[]");
    // Authored rows keep stale identifiers of other types; the game reads only the identifier of the requirement's type.
    insert.run("d", "build", "entity", "quests:9", 3, "requirements", null, null, group({ requirementType: "Skill", skillID: 8, itemID: 364, amount1: 110, value: { value: 2, name: "EqualOrAbove" } }), "[]");
    insert.run("e", "build", "entity", "quests:9", 4, "requirements", null, null, group({ requirementType: "Currency", currencyID: 0, itemID: 30, amount1: 1200, value: { value: 2, name: "EqualOrAbove" } }), "[]");
    const requirements = queryConditions(db).records.flatMap((condition) => condition.requirements.flatMap((group) => group.requirements));
    expect(requirements.map(({ label }) => label)).toEqual(["Wrath of the Matriarch turned in", "level 16 or higher", "Power 150 or lower", "Fishing 110 or higher", "Gold Coin 1200 or higher"]);
    expect(requirements[0]?.spans).toEqual([{ endpoint: { entityKey: "quests:8", label: "Wrath of the Matriarch" } }, { text: " turned in" }]);
    expect(requirements[2]?.spans).toEqual([{ endpoint: { entityKey: "stats:1", label: "Power" } }, { text: " 150 or lower" }]);
  } finally { db.close(); }
});

test("joins world offers, object starts, objective completions, availability, interaction loot, and areas", () => {
  const db = openNormalizedDatabase(":memory:");
  try {
    db.query("INSERT INTO normalized_builds VALUES (?, ?, ?)").run("build", "schema", "{}");
    db.query("INSERT INTO catalog_metadata VALUES (?, ?, ?, ?, ?)").run("c".repeat(64), "build", "schema", "{}", "d".repeat(64));
    db.query("INSERT INTO identity_scenes VALUES (?, ?, ?)").run("build", 1, "scene");
    db.query("INSERT INTO map_spaces VALUES (?, ?, ?)").run("build", "map", "Map");
    const entity = db.query("INSERT INTO canonical_entities VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    for (const [kind, id, name] of [["quests", 1, "First"], ["quests", 2, "Second"], ["tasks", 3, "Collect"], ["items", 4, "Egg"], ["scenes", 1, "Woods"]] as const) entity.run("build", kind, id, `${kind}:${id}`, name, null, null, null, "{}", "[]");
    db.query("INSERT INTO quest_facts(entity_key, repeatable, turn_in_without_npc, condition_ids_json, provenance_json) VALUES (?, ?, ?, ?, ?), (?, ?, ?, ?, ?)").run("quests:1", 0, 0, "[]", "[]", "quests:2", 0, 0, "[]", "[]");
    db.query("INSERT INTO task_facts VALUES (?, ?, ?, ?, ?, ?, ?, ?)").run("tasks:3", "getItem", "items:4", "Egg", 2, 0, null, "[]");
    db.query("INSERT INTO world_quest_facts VALUES (?, ?, ?, ?, ?, ?, ?, ?)").run("quests:1", 8, 600, 900, 300, 60, 30, "[]");
    db.query("INSERT INTO regions VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").run("camp", "build", 1, "scene", "Camp", null, "box", "{}", "map", "{}", "[]");
    for (const [placementId, sourceId, index, family] of [["zone-place", "zone", 1, "worldQuestZone"], ["object-place", "object", 2, "interactableObject"]] as const) {
      db.query("INSERT INTO placement_identities VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)").run(placementId, "build", 1, "a".repeat(64), "b".repeat(64), "scene", placementId, "scene", null);
      db.query("INSERT INTO source_identities VALUES (?, ?, ?, ?, ?, ?, ?)").run(sourceId, placementId, "build", 1, String(index), family, "Game");
      db.query("INSERT INTO placements(placement_id, build_id, scene_native_id, scene_path, map_space_id, world_x, world_y, world_z, map_x, map_y, shape_json, provenance_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").run(placementId, "build", 1, "scene", "map", 0, 0, 0, 1, 1, "null", "[]");
      db.query("INSERT INTO placement_sources VALUES (?, ?, ?, ?)").run(placementId, sourceId, JSON.stringify([family]), "[]");
      db.query("INSERT INTO placement_areas VALUES (?, ?, ?)").run(placementId, "camp", "Camp");
      db.query("INSERT INTO source_details VALUES (?, ?, ?, ?, ?)").run(`${sourceId}-detail`, sourceId, placementId, family, JSON.stringify({ interactableName: "Purse" }));
    }
    db.query("INSERT INTO conditions VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").run("night", "build", "world-source", "source:zone", 0, "requirements-template", null, null, JSON.stringify({ groups: [{ requirements: [{ requirementType: "Time" }] }] }), "[]");
    db.query("INSERT INTO source_gates VALUES (?, ?, ?, ?, ?, ?, ?)").run("gate", "zone", "zone", "night", "requires", null, "[]");
    const association = db.query("INSERT INTO quest_associations VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
    association.run("world", "build", "world-quest-offer", null, "quests:1", null, null, "zone", JSON.stringify({ payload: { zoneRespawnCooldown: 20, poolQuestIDs: [1, 2] } }));
    association.run("start", "build", "interaction-quest", null, "quests:1", null, null, "object", JSON.stringify({ payload: { objectName: "Purse" } }));
    association.run("objective", "build", "quest-objective", null, "quests:1", "tasks:3", null, null, JSON.stringify({ objectiveIndex: 0 }));
    association.run("complete", "build", "interaction-task", null, null, "tasks:3", null, "object", JSON.stringify({ payload: { objectName: "Purse" } }));
    db.query("INSERT INTO item_sources VALUES (?, ?, ?, ?, ?, ?, ?)").run("items:4", "interaction", "output", "[\"object-place\"]", "[]", JSON.stringify({ sourceId: "object", objectName: "Purse", min: 1, max: 2, rawRate: 50 }), "null");

    expect(queryCatalogFacts(db).records.quests[0]?.worldQuest).toEqual({ availableSeconds: 600, cooldownAfterCompletionSeconds: 900, cooldownAfterExpirySeconds: 300, cooldownJitterSeconds: 60, initialRollSeconds: 30 });
    const questRows = queryQuestRows(db).records;
    expect(questRows.find((row) => row.kind === "objectStart")).toMatchObject({ sourceId: "object", label: "Purse", placementIds: ["object-place"] });
    expect(questRows.find((row) => row.kind === "objective")).toMatchObject({ counterpart: { entityKey: "items:4", label: "Egg" }, completions: [{ sourceId: "object", label: "Purse", placementIds: ["object-place"] }] });
    expect(questRows.find((row) => row.kind === "worldOffer")).toMatchObject({ sourceId: "zone", worldOffer: { zoneDelaySeconds: 20, pool: [{ entityKey: "quests:1" }, { entityKey: "quests:2" }] }, availability: [{ effect: "requires", conditionId: "night" }], placementIds: ["zone-place"] });
    expect(queryInteractionRows(db).records).toMatchObject([{ objectName: "Purse", item: { entityKey: "items:4" }, min: 1, max: 2, rawRate: 50, placementIds: ["object-place"] }]);
    expect(queryGatedSources(db).records).toMatchObject([{ sourceId: "zone", family: "worldQuestZone", placementIds: ["zone-place"], availability: [{ conditionId: "night" }] }]);
    expect(queryContainment(db).records.map((row) => row.area)).toEqual(["Camp", "Camp"]);
  } finally { db.close(); }
});

test("progression requirements name talents, learned abilities, and costs", () => {
  const db = openNormalizedDatabase(":memory:");
  try {
    db.query("INSERT INTO normalized_builds VALUES (?, ?, ?)").run("build", "catalog.v1", "{}");
    db.query("INSERT INTO catalog_metadata VALUES (?, ?, ?, ?, ?)").run("c".repeat(64), "build", "catalog.v1", "{}", "e".repeat(64));
    db.query("INSERT INTO canonical_entities VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?), (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").run("build", "abilities", 0, "abilities:0", "Cleave", null, null, null, "{}", "[]", "build", "stats", 121, "stats:121", "Mana", null, null, null, "{}", "[]");
    db.query("INSERT INTO progression_facts VALUES (?, ?, ?, ?, ?)").run("bonuses:288", "bonuses", "Weighted Strikes", "{}", "[]");
    const named = (value: number, name: string) => ({ value, name });
    const group = (requirement: unknown) => JSON.stringify({ groups: [{ checkCount: false, requiredCount: 0, requirements: [{ conditionRule: "Mandatory", knowledge: named(0, "Known"), ...(requirement as object) }] }] });
    const insert = db.query("INSERT INTO conditions(condition_id, build_id, owner_type, owner_key, ordinal, semantics, scope, source_field_path, payload_json, provenance_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    insert.run("a-rank", "build", "talentTreeNode", "talentTrees:18:3", 0, "inline-requirements", null, "/rank", group({ requirementType: "Bonus", bonusID: 288, amount1: 4, value: named(3, "EqualOrAbove") }), "[]");
    insert.run("b-learned", "build", "talentTreeNode", "talentTrees:0:2", 0, "inline-requirements", null, "/learned", group({ requirementType: "Ability", abilityID: 0, amount1: 0, value: named(0, "Equal") }), "[]");
    insert.run("c-cost", "build", "abilityRank", "abilities:362:0", 0, "inline-requirements", null, "/cost", group({ requirementType: "StatCost", statID: 121, amount1: 9, value: named(0, "Equal") }), "[]");
    expect(queryConditions(db).records.map((condition) => condition.label)).toEqual(["Weighted Strikes rank 4 or higher", "Cleave learned", "Costs 9 Mana"]);
  } finally { db.close(); }
});

test("consumed requirements read as costs, phrases stay lowercase inside a sentence, and a condition starts with a capital", () => {
  const db = openNormalizedDatabase(":memory:");
  try {
    db.query("INSERT INTO normalized_builds VALUES (?, ?, ?)").run("build", "catalog.v1", "{}");
    db.query("INSERT INTO catalog_metadata VALUES (?, ?, ?, ?, ?)").run("c".repeat(64), "build", "catalog.v1", "{}", "e".repeat(64));
    db.query("INSERT INTO canonical_entities VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?), (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").run("build", "currencies", 0, "currencies:0", "Gold Coin", null, null, null, "{}", "[]", "build", "items", 7, "items:7", "Iron Bar", null, null, null, "{}", "[]");
    const named = (value: number, name: string) => ({ value, name });
    const group = (requirement: unknown) => JSON.stringify({ groups: [{ checkCount: false, requiredCount: 0, requirements: [{ conditionRule: "Mandatory", ...(requirement as object) }] }] });
    const insert = db.query("INSERT INTO conditions(condition_id, build_id, owner_type, owner_key, ordinal, semantics, scope, source_field_path, payload_json, provenance_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    insert.run("a-gold", "build", "interaction", "sign", 0, "requirements-template", null, "/gold", group({ requirementType: "Currency", currencyID: 0, amount1: 100, value: named(2, "EqualOrAbove"), consume: true }), "[]");
    insert.run("b-bars", "build", "interaction", "sign", 1, "requirements-template", null, "/bars", group({ requirementType: "Item", itemID: 7, amount1: 20, ownership: named(0, "Owned"), consume: true }), "[]");
    insert.run("c-kept", "build", "interaction", "door", 0, "requirements-template", null, "/key", group({ requirementType: "Item", itemID: 7, amount1: 1, ownership: named(0, "Owned"), consume: false }), "[]");
    insert.run("d-held", "build", "interaction", "gate", 0, "requirements-template", null, "/gold", group({ requirementType: "Currency", currencyID: 0, amount1: 50, value: named(2, "EqualOrAbove"), consume: false }), "[]");
    const conditions = queryConditions(db).records;
    expect(conditions.flatMap((condition) => condition.requirements.flatMap((entry) => entry.requirements.map((requirement) => requirement.label))))
      .toEqual(["costs 100 Gold Coin", "uses up 20 Iron Bar", "has Iron Bar", "Gold Coin 50 or higher"]);
    expect(conditions.map((condition) => condition.label)).toEqual(["Costs 100 Gold Coin", "Uses up 20 Iron Bar", "Has Iron Bar", "Gold Coin 50 or higher"]);
  } finally { db.close(); }
});

test("race start facts name only captured scenes and retain the authored first-spawn position", () => {
  const db = openNormalizedDatabase(":memory:");
  try {
    db.query("INSERT INTO normalized_builds VALUES (?, ?, ?)").run("build", "catalog.v1", "{}");
    db.query("INSERT INTO catalog_metadata VALUES (?, ?, ?, ?, ?)").run("c".repeat(64), "build", "catalog.v1", "{}", "e".repeat(64));
    const insertEntity = db.query("INSERT INTO canonical_entities VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    insertEntity.run("build", "races", 1, "races:1", "Human", null, null, 1, "{}", "[]");
    insertEntity.run("build", "races", 7, "races:7", "Orc", null, null, 7, "{}", "[]");
    insertEntity.run("build", "scenes", 22, "scenes:22", "Abandoned Quarry", null, null, 22, "{}", "[]");
    const insertStart = db.query("INSERT INTO race_starts VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
    insertStart.run("races:1", 22, "scenes:22", 18, JSON.stringify({ x: 1065.1, y: 32.97, z: -634.39 }), "GameDatabase.Races[1].startingSceneID", "GameDatabase.Races[1].startingPositionID", "[]");
    insertStart.run("races:7", 99, null, 35, null, "GameDatabase.Races[7].startingSceneID", "GameDatabase.Races[7].startingPositionID", "[]");
    expect(queryCatalogFacts(db).records.raceStarts).toEqual([
      { race: { entityKey: "races:1", label: "Human" }, scene: { entityKey: "scenes:22", label: "Abandoned Quarry" }, startingSceneId: 22, startingPositionId: 18, position: { x: 1065.1, y: 32.97, z: -634.39 } },
      { race: { entityKey: "races:7", label: "Orc" }, scene: null, startingSceneId: 99, startingPositionId: 35, position: null },
    ]);
  } finally { db.close(); }
});

test("adventurer rules read captured job bounds, tank thresholds, and the invite's actual pet target", () => {
  const db = openNormalizedDatabase(":memory:");
  try {
    db.query("INSERT INTO normalized_builds VALUES (?, ?, ?)").run("build", "catalog.v1", "{}");
    db.query("INSERT INTO catalog_metadata VALUES (?, ?, ?, ?, ?)").run("c".repeat(64), "build", "catalog.v1", "{}", "e".repeat(64));
    const empty = queryCatalogFacts(db).records;
    expect([empty.adventurerWorld, empty.dungeonFinderTank, empty.adventurerInviteEffects]).toEqual([null, null, []]);
    const evidence = [{ path: "objects/world", sha256: "a".repeat(64), pointer: "/adventurerWorldSettings" }];
    const sourceFieldPaths = {
      maximumPresent: "AdventurerWorldSettings.MaximumPresent", minimumJobSeconds: "AdventurerWorldSettings.MinimumJobSeconds",
      maximumJobSeconds: "AdventurerWorldSettings.MaximumJobSeconds", experienceBarPerJob: "AdventurerWorldSettings.ExperienceBarPerJob",
      goldPerLevelPerJob: "AdventurerWorldSettings.GoldPerLevelPerJob", equipmentRewardChance: "AdventurerWorldSettings.EquipmentRewardChance",
    };
    db.query("INSERT INTO adventurer_world_settings VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").run("build", "AdventurerWorld", 0.4,
      JSON.stringify([{ name: "Coalway Woods", sourceFieldPath: "AdventurerWorldSettings.JobRegionNames[0]" }, { name: "Frostveil", sourceFieldPath: "AdventurerWorldSettings.JobRegionNames[1]" }]),
      12, 120, 360, 0.05, 2, JSON.stringify(sourceFieldPaths), JSON.stringify(evidence));
    const tankPaths = { tankItemPowerShare: "DungeonFinderSettings.TankItemPowerShare", tankGearPieces: "DungeonFinderSettings.TankGearPieces" };
    db.query("INSERT INTO dungeon_finder_tank_settings VALUES (?, ?, ?, ?, ?)").run("build", 0.6, 4, JSON.stringify(tankPaths), JSON.stringify(evidence));
    const insertEntity = db.query("INSERT INTO canonical_entities VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    insertEntity.run("build", "npcs", 3, "npcs:3", "Guardian", null, null, 3, "{}", "[]");
    insertEntity.run("build", "effects", 21, "effects:21", "Call Guardian", null, null, 21, "{}", "[]");
    db.query("INSERT INTO progression_facts VALUES (?, ?, ?, ?, ?)").run("effects:21", "effects", "Call Guardian", JSON.stringify({ effectType: { value: 14, name: "Pet" }, duration: 45, endless: false, ranks: [] }), "[]");
    const petPaths = { petNpcId: "GameDatabase.GetEffects()[21].ranks[0].petNPCDataID", petDuration: "GameDatabase.GetEffects()[21].ranks[0].petDuration", petSpawnCount: "GameDatabase.GetEffects()[21].ranks[0].petSPawnCount" };
    db.query("INSERT INTO adventurer_invite_effects VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").run("npcs:3", "effects:21", JSON.stringify({ value: 14, name: "Pet" }), 45, 0,
      JSON.stringify({ petNpcId: 3, petDuration: 0, petSpawnCount: 1, sourceFieldPaths: petPaths }), "GameDatabase.GetNPCs()[3].InviteEffectID", "GameDatabase.GetEffects()[21]", "GameDatabase.GetEffects()[21].ranks[0]",
      JSON.stringify({ effectType: "GameDatabase.GetEffects()[21].effectType", duration: "GameDatabase.GetEffects()[21].duration", endless: "GameDatabase.GetEffects()[21].endless" }), JSON.stringify(evidence));
    const facts = queryCatalogFacts(db).records;
    expect(facts.adventurerWorld).toMatchObject({ minimumJobSeconds: 120, maximumJobSeconds: 360, maximumPresent: 12,
      experienceBarPerJob: 0.05, goldPerLevelPerJob: 2, equipmentRewardChance: 0.4,
      jobRegionNames: [{ name: "Coalway Woods" }, { name: "Frostveil" }], sourceFieldPaths, provenance: evidence });
    expect(facts.dungeonFinderTank).toMatchObject({ tankItemPowerShare: 0.6, tankGearPieces: 4, sourceFieldPaths: tankPaths });
    expect(facts.adventurerInviteEffects).toMatchObject([{ adventurer: { entityKey: "npcs:3", label: "Guardian" },
      effect: { entityKey: "effects:21", label: "Call Guardian" }, effectType: { value: 14, name: "Pet" }, duration: 45, endless: false,
      inviteEffectSourceFieldPath: "GameDatabase.GetNPCs()[3].InviteEffectID",
      firstRank: { petNpcId: 3, pet: { entityKey: "npcs:3", label: "Guardian" }, petDuration: 0, petSpawnCount: 1, sourceFieldPaths: petPaths } }]);
  } finally { db.close(); }
});
