import { expect, test } from "bun:test";
import { openNormalizedDatabase, recordCoverageIssue } from "./database";
import { queryCatalogCoverage, queryCatalogEntity, queryCatalogImagery, queryCatalogItemSources, queryCatalogMaps, queryCatalogSearch, queryConditions, queryContainerRows, queryDropRows, queryVendorRows, queryQuestRows, queryInteractionRows, queryContainment, queryGatedSources, queryCatalogFacts } from "./queries";
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
    db.query("INSERT INTO conditions VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").run("progression", "build", "merchant", "npcs:3", 0, "all", null, "/merchants/0", JSON.stringify({ sourceName: "Journeyman Trade", groups: [{ checkCount: true, requiredCount: 1, requirements: [{ requirementType: "skill", skillID: 4, amount1: 10 }] }] }), "[]");
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
    expect(queryConditions(db).records).toMatchObject([{ conditionId: "progression", semantics: "all", scope: null, label: "Journeyman Trade", requirements: [{ mode: "all", checkCount: true, requiredCount: 1, requirements: [{ type: { name: "skill" }, label: "Trade 10", references: { skill: { entityKey: "skills:4", label: "Trade" } }, amounts: { primary: 10, secondary: 0 } }] }] }]);
    expect(queryCatalogCoverage(db).records).toMatchObject({ occurrenceCount: 1, unresolvedIssues: [{ kind: "inactive-merchant-binding", subjectKey: "merchant:2:1", occurrenceCount: 1 }] });

    const dropRows = queryDropRows(db).records;
    const fromBoss = dropRows.filter((row) => row.owner.entityKey === "npcs:2");
    const fromDropItem = dropRows.filter((row) => row.item.entityKey === "items:1");
    expect(fromBoss).toEqual(fromDropItem);
    expect(fromBoss).toEqual([{ context: "npc", owner: { entityKey: "npcs:2", label: "Boss" }, item: { entityKey: "items:1", label: "Sword" }, lootTableId: 9, entryIndex: 0, min: 1, max: 2, rawRate: 12.34, displayedChance: 12.3, levelBand: null, conditionIds: [], placementIds: [] }]);
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
    const levelGroup = { mode: "all", checkCount: false, requiredCount: null, requirements: [{ type: { name: "Level" }, rule: { name: "Mandatory" }, label: "Level 27", amounts: { primary: 27, secondary: 0 } }] };
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
    const weapons = ["AXE", "One handed sword", "Two handed sword"].map((name) => ({ requirementType: "Item", conditionRule: "Optional", ownership: named(2, "Equipped"), itemCondition: named(2, "WeaponType"), weaponType: entry(name) }));
    const region = { requirementType: "Region", conditionRule: "Mandatory", region: entry("Quest complete") };
    const combat = { requirementType: "CombatState", conditionRule: "Mandatory", boolBalue1: false };
    const insert = db.query("INSERT INTO conditions(condition_id, build_id, owner_type, owner_key, ordinal, semantics, scope, source_field_path, payload_json, provenance_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    insert.run("effect", "build", "entity", "items:13", 0, "inline-requirements", "use", "/effect", group([effect]), "[]");
    insert.run("weapons", "build", "entity", "items:954", 0, "inline-requirements", "use", "/weapons", group(weapons), "[]");
    insert.run("region", "build", "entity", "items:222", 0, "inline-requirements", "use", "/region", group([region]), "[]");
    insert.run("combat", "build", "entity", "items:235", 0, "inline-requirements", "use", "/combat", group([combat]), "[]");

    expect(queryConditions(db).records.map((condition) => [condition.scope, condition.label])).toEqual([
      ["use", "Out of combat"],
      ["use", "Potion Sickness is inactive"],
      ["use", "Region Quest complete"],
      ["use", "Equipped AXE or Equipped One handed sword or Equipped Two handed sword"],
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
    for (const [kind, id, name] of [["quests", 8, "Wrath of the Matriarch"], ["stats", 1, "Power"]] as const) entity.run("build", kind, id, `${kind}:${id}`, name, null, null, null, "{}", "[]");
    const insert = db.query("INSERT INTO conditions VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    const group = (requirement: unknown) => JSON.stringify({ groups: [{ requirements: [requirement] }] });
    insert.run("a", "build", "entity", "quests:9", 0, "requirements", null, null, group({ requirementType: "Quest", questID: 8, questState: { value: 4, name: "turnedIn" } }), "[]");
    insert.run("b", "build", "entity", "quests:9", 1, "requirements", null, null, group({ requirementType: "Level", amount1: 16, value: { value: 2, name: "EqualOrAbove" } }), "[]");
    insert.run("c", "build", "entity", "quests:9", 2, "requirements", null, null, group({ requirementType: "Stat", statID: 1, amount1: 150, value: { value: 3, name: "EqualOrBelow" } }), "[]");
    const requirements = queryConditions(db).records.flatMap((condition) => condition.requirements.flatMap((group) => group.requirements));
    expect(requirements.map(({ label }) => label)).toEqual(["Wrath of the Matriarch turned in", "Level 16 or higher", "Power 150 or lower"]);
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
