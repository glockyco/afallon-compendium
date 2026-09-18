import { expect, test } from "bun:test";
import { openNormalizedDatabase, recordCoverageIssue } from "./database";
import { queryCatalogCoverage, queryCatalogEntity, queryCatalogImagery, queryCatalogItemSources, queryCatalogMaps, queryCatalogSearch, queryConditions, queryDropRows, queryVendorRows } from "./queries";

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
    db.query("INSERT INTO conditions VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)").run("progression", "build", "merchant", "npcs:3", 0, "all", "/merchants/0", JSON.stringify({ sourceName: "Journeyman Trade", groups: [{ checkCount: true, requiredCount: 1, requirements: [{ requirementType: "skill", skillID: 4, amount1: 10 }] }] }), "[]");
    db.query("INSERT INTO conditions VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)").run("empty", "build", "quest", "quests:7", 0, "inline-requirements", "/quests/7", JSON.stringify({ nativeGroupCount: 0, groups: [] }), "[]");
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
    expect(queryConditions(db).records).toEqual([{ conditionId: "progression", semantics: "all", label: "Journeyman Trade", requirements: [{ mode: "all", requiredCount: 1, requirements: [{ type: "skill", label: "Trade 10", target: { entityKey: "skills:4", label: "Trade" }, amount: 10, secondaryAmount: null }] }] }]);
    expect(queryCatalogCoverage(db).records).toMatchObject({ occurrenceCount: 1, unresolvedIssues: [{ kind: "inactive-merchant-binding", subjectKey: "merchant:2:1", occurrenceCount: 1 }] });

    const dropRows = queryDropRows(db).records;
    const fromBoss = dropRows.filter((row) => row.owner.entityKey === "npcs:2");
    const fromDropItem = dropRows.filter((row) => row.item.entityKey === "items:1");
    expect(fromBoss).toEqual(fromDropItem);
    expect(fromBoss).toEqual([{ context: "npc", owner: { entityKey: "npcs:2", label: "Boss" }, item: { entityKey: "items:1", label: "Sword" }, lootTableId: 9, entryIndex: 0, min: 1, max: 2, rawRate: 12.34, displayedChance: 12.3, levelBand: null, conditionIds: [], placementIds: [] }]);
  } finally { db.close(); }
});

test("groups and deduplicates the authored requirements for items:1040", () => {
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
    db.query("INSERT INTO conditions VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?), (?, ?, ?, ?, ?, ?, ?, ?, ?)").run(
      "a-template", "build", "entity", "items:1040", 0, "requirements-template", "/items/1040/template", JSON.stringify({ groups: [classes] }), "[]",
      "b-inline", "build", "entity", "items:1040", 1, "inline-requirements", "/items/1040/inline", JSON.stringify({ groups: [classes, level] }), "[]",
    );

    expect(queryConditions(db).records.flatMap((condition) => condition.requirements)).toEqual([
      { mode: "any", requiredCount: 1, requirements: [
        { type: "Class", label: "Shieldmaster", target: { entityKey: "classes:0", label: "Shieldmaster" }, amount: null, secondaryAmount: null },
        { type: "Class", label: "Assassin", target: { entityKey: "classes:5", label: "Assassin" }, amount: null, secondaryAmount: null },
      ] },
      { mode: "all", requiredCount: null, requirements: [
        { type: "Level", label: "Level 27", target: null, amount: 27, secondaryAmount: null },
      ] },
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
