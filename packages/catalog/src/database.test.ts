import { expect, test } from "bun:test";
import type { Database } from "bun:sqlite";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { coverageIssueId, openNormalizedDatabase, populateNormalizedDatabase, recordCoverageIssue } from "./database";
import { queryCatalogFacts } from "./queries";
import type { NormalizedDatabaseInput } from "@afallon/contracts/catalog"

test("rejects unset table identities without partially adding definitions", async () => {
  const root = await mkdtemp(join(tmpdir(), "afallon-normalized-"));
  let db: Database | undefined;
  try {
    db = openNormalizedDatabase(join(root, "normalized.sqlite"));
    const reference = { path: "input.json", sha256: "0".repeat(64) };
    const input: NormalizedDatabaseInput = {
      buildId: "test", identityResults: [], entities: [], scenes: [], mapSpaces: [], bindings: [],
      placements: [], sources: [], roles: [], regions: [], conditions: [], spawnCandidates: [],
      merchantTables: [{ nativeId: 7, name: "Existing stock" }], merchantBindings: [], merchantStock: [],
      lootTables: [{ nativeId: 11, levelBandGear: false }], lootBindings: [], lootEntries: [], linkedNpcRules: [],
      resourceYields: [], questAssociations: [], transitions: [], itemSources: [], entityDetails: [], sourceDetails: [], patrolPaths: [], sceneSpawns: [], blockers: [], coverageOccurrences: [], exclusions: [], inputCoverage: null,
      provenance: { plan: reference, profile: reference, sources: [] },
    };
    populateNormalizedDatabase(db, input, []);
    let failure: unknown;
    try {
      populateNormalizedDatabase(db, { ...input, merchantTables: [{ nativeId: 8, name: "Uncommitted stock" }, { nativeId: -1, name: "Unset" }] }, []);
    } catch (error) { failure = error; }
    expect(failure).toMatchObject({ code: "SQLITE_CONSTRAINT_CHECK" });
    expect(db.query("SELECT merchant_table_id FROM merchant_tables ORDER BY merchant_table_id").all()).toEqual([{ merchant_table_id: 7 }]);
    expect(db.query("SELECT loot_table_id FROM loot_tables ORDER BY loot_table_id").all()).toEqual([{ loot_table_id: 11 }]);
  } finally {
    db?.close();
    await rm(root, { recursive: true, force: true });
  }
});

test("rolls back authored identities when a later domain constraint fails", () => {
  const db = openNormalizedDatabase(":memory:");
  const reference = { path: "objects/input", sha256: "a".repeat(64) };
  const input: NormalizedDatabaseInput = {
    buildId: "test", identityResults: [{ runId: "run-1", snapshotId: "run-1:target", snapshotPrefix: "target", snapshotSha256: reference.sha256, character: "Research", sceneHandle: 7, result: {
      schemaVersion: "compendium.placement-identities.v1", buildId: "test", sceneNativeId: 3, scenePath: "scene.unity", snapshotFrame: 1,
      identities: [{ sourceId: "source-1", placementId: "placement-1", componentInstanceId: 11, gameObjectInstanceId: 12, origin: "scene", sceneSourceSha256: "b".repeat(64), sourceSha256: "b".repeat(64), serializedFile: "scene", gameObjectPathId: "-12", componentPathId: "-11", loaderSourceId: null, typeName: "NPCSpawner", assembly: "Game", position: { x: 1, y: 2, z: 3 } }], unresolved: [],
    } }], entities: [], scenes: [], mapSpaces: [], bindings: [], placements: [], sources: [], roles: [], regions: [], conditions: [], spawnCandidates: [],
    merchantTables: [{ nativeId: -1, name: "Invalid table" }], merchantBindings: [], merchantStock: [], lootTables: [], lootBindings: [], lootEntries: [], linkedNpcRules: [], resourceYields: [], questAssociations: [], transitions: [], itemSources: [], entityDetails: [], sourceDetails: [], patrolPaths: [], sceneSpawns: [], blockers: [], coverageOccurrences: [], exclusions: [], inputCoverage: null, provenance: { plan: reference, profile: reference, sources: [] },
  };
  try {
    expect(() => populateNormalizedDatabase(db, input, [])).toThrow();
    expect(db.query("SELECT count(*) AS count FROM identity_runs").get()).toEqual({ count: 0 });
    expect(db.query("SELECT count(*) AS count FROM source_identities").get()).toEqual({ count: 0 });
    expect(db.query("SELECT count(*) AS count FROM placement_identities").get()).toEqual({ count: 0 });
    expect(db.query("SELECT count(*) AS count FROM normalized_builds").get()).toEqual({ count: 0 });
  } finally { db.close(); }
});

test("stores SQL NULL for a region without a map space", async () => {
  const root = await mkdtemp(join(tmpdir(), "afallon-normalized-"));
  let db: Database | undefined;
  try {
    db = openNormalizedDatabase(join(root, "normalized.sqlite"));
    const reference = { path: "input.json", sha256: "0".repeat(64) };
    const input: NormalizedDatabaseInput = {
      buildId: "test", identityResults: [], entities: [],
      scenes: [{ nativeId: 3, path: "scene.unity", name: null }], mapSpaces: [], bindings: [],
      placements: [], sources: [], roles: [],
      regions: [{
        regionId: "region-1", buildId: "test", sceneNativeId: 3, scenePath: "scene.unity",
        name: "Unmapped region", internalName: null, shape: "box",
        worldGeometry: { kind: "box", corners: [[0, 0], [1, 0], [1, 1], [0, 1]] },
        mapSpaceId: null, mapGeometry: null, provenance: [reference],
      }],
      conditions: [], spawnCandidates: [], merchantTables: [], merchantBindings: [], merchantStock: [],
      lootTables: [], lootBindings: [], lootEntries: [], linkedNpcRules: [], resourceYields: [],
      questAssociations: [], transitions: [], itemSources: [], entityDetails: [], sourceDetails: [], patrolPaths: [], sceneSpawns: [], blockers: [], coverageOccurrences: [], exclusions: [], inputCoverage: null,
      provenance: { plan: reference, profile: reference, sources: [] },
    };

    populateNormalizedDatabase(db, input, []);
    expect(db.query("SELECT map_space_id, map_geometry_json FROM regions WHERE region_id = 'region-1'").get()).toEqual({ map_space_id: null, map_geometry_json: null });
  } finally {
    db?.close();
    await rm(root, { recursive: true, force: true });
  }
});

test("stores every typed fact kind and shared artwork idempotently", () => {
  const db = openNormalizedDatabase(":memory:");
  const reference = { path: "objects/input", sha256: "d".repeat(64) };
  const provenance = [reference];
  const entity = (kind: string, nativeId: number) => ({ entityKey: `${kind}:${nativeId}`, buildId: "test", kind, nativeId, name: `${kind} ${nativeId}`, internalName: null, description: null, sourceKey: nativeId, publicData: { localization: null, gameplay: null, icon: null }, provenance });
  const entities = [entity("items", 1), entity("items", 2), entity("npcs", 3), entity("quests", 4), entity("scenes", 5), entity("properties", 6), entity("abilities", 7), entity("recipes", 8), entity("stats", 9), entity("factions", 10), entity("craftingStations", 11), entity("skills", 12), entity("gearSets", 13)];
  const input: NormalizedDatabaseInput = {
    buildId: "test", identityResults: [], entities, scenes: [], mapSpaces: [], bindings: [], placements: [], sources: [], roles: [], regions: [], conditions: [], spawnCandidates: [], merchantTables: [], merchantBindings: [], merchantStock: [], lootTables: [], lootBindings: [], lootEntries: [], linkedNpcRules: [], resourceYields: [], questAssociations: [], transitions: [], itemSources: [], entityDetails: [], sourceDetails: [], patrolPaths: [], sceneSpawns: [], blockers: [], coverageOccurrences: [], exclusions: [], inputCoverage: null,
    itemFacts: [{ entityKey: "items:1", rarity: "RARE", itemType: "WEAPON", armorSlot: null, weaponSlot: "MAIN_HAND", weaponType: "SWORD", armorType: null, attackSpeed: 1.2, minDamage: 3, maxDamage: 5, randomStatsMax: 1, gemType: "RED", enchantment: null, sellPrice: 4, sellCurrency: null, buyPrice: 8, buyCurrency: null, stackLimit: 1, questDropOnly: false, corruptionToken: false, levelRequirement: 2, actionAbilities: [{ entityKey: "abilities:7", label: "abilities 7" }], conditionIds: [], provenance }],
    itemStats: [{ entityKey: "items:1", statIndex: 0, stat: { entityKey: "stats:9", label: "stats 9" }, amount: 2, isPercent: false, provenance }], itemRandomStats: [{ entityKey: "items:1", statIndex: 0, stat: { entityKey: "stats:9", label: "stats 9" }, min: 1, max: 4, isPercent: false, whole: true, chance: 50, provenance }], itemGemStats: [{ entityKey: "items:1", statIndex: 0, stat: { entityKey: "stats:9", label: "stats 9" }, amount: 3, isPercent: true, provenance }], itemSockets: [{ entityKey: "items:1", socketIndex: 0, socketType: null, gemType: "RED", provenance }],
    npcFacts: [{ entityKey: "npcs:3", minLevel: 1, maxLevel: 2, scalesWithPlayer: false, npcType: "BOSS", creatureType: "HUMANOID", family: "TEST", faction: { entityKey: "factions:10", label: "factions 10" }, species: null, isMerchant: false, isQuestGiver: true, isCombatEnabled: true, minRespawn: 4, maxRespawn: 8, minExperience: 1, maxExperience: 2, immuneToStun: false, immuneToSlow: false, aggroRange: 5, linkedNpc: null, lootSpecialization: null, provenance }],
    npcStats: [{ entityKey: "npcs:3", statIndex: 0, stat: { entityKey: "stats:9", label: "stats 9" }, amount: 20, isPercent: false, provenance }], npcAbilityPhases: [{ entityKey: "npcs:3", phaseIndex: 0, name: "Opening", requirement: null, provenance }], npcPhaseAbilities: [{ entityKey: "npcs:3", phaseIndex: 0, abilityIndex: 0, ability: { entityKey: "abilities:7", label: "abilities 7" }, provenance }], npcFactionRewards: [{ entityKey: "npcs:3", rewardIndex: 0, faction: { entityKey: "factions:10", label: "factions 10" }, amount: 3, provenance }],
    questFacts: [{ entityKey: "quests:4", chainName: "Chain", chainOrder: 1, repeatable: false, turnInWithoutNpc: false, completedDescription: "Done", objectiveText: "Go", levelRequirement: 2, experience: 5, conditionIds: [], provenance }], questObjectives: [{ questEntityKey: "quests:4", objectiveIndex: 0, taskType: "killNPC", task: { entityKey: null, label: "Task" }, target: { entityKey: "npcs:3", label: "npcs 3" }, count: 1, keepItems: null, sceneName: null, provenance }], questRewards: [{ questEntityKey: "quests:4", rewardSet: "given", rewardIndex: 0, rewardType: "item", target: { entityKey: "items:1", label: "items 1" }, count: 1, experience: null, provenance }],
    placeFacts: [{ entityKey: "scenes:5", placeType: "dungeon", guideIncluded: true, guideDescription: "Place", levelMin: 1, levelMax: 3, mapSpaceIds: [], bosses: [{ entityKey: "npcs:3", label: "npcs 3" }], parentSceneKey: null, provenance }], propertyFacts: [{ entityKey: "properties:6", income: 2, purchasePrice: 10, sellPrice: 5, currency: null, propertyType: "House", provenance }], abilityFacts: [{ entityKey: "abilities:7", provenance }],
    recipeFacts: [{ entityKey: "recipes:8", skill: { entityKey: "skills:12", label: "skills 12" }, station: { entityKey: "craftingStations:11", label: "craftingStations 11" }, learnedByDefault: true, provenance }], recipeRanks: [{ entityKey: "recipes:8", rank: 0, unlockCost: 0, experience: 2, craftTime: 1, provenance }], recipeProducts: [{ entityKey: "recipes:8", rank: 0, productIndex: 0, item: { entityKey: "items:1", label: "items 1" }, count: 1, chance: 1, provenance }], recipeMaterials: [{ entityKey: "recipes:8", rank: 0, materialIndex: 0, item: { entityKey: "items:2", label: "items 2" }, count: 2, provenance }], craftingStationFacts: [{ entityKey: "craftingStations:11", maxDistance: 4, skillRefs: [{ entityKey: "skills:12", label: "skills 12" }], provenance }],
    gearSetFacts: [{ entityKey: "gearSets:13", provenance }], gearSetMembers: [{ entityKey: "gearSets:13", memberIndex: 0, item: { entityKey: "items:1", label: "items 1" }, provenance }], gearSetTiers: [{ entityKey: "gearSets:13", tierIndex: 0, equipped: 3, provenance }], gearSetTierStats: [{ entityKey: "gearSets:13", tierIndex: 0, statIndex: 0, stat: { entityKey: "stats:9", label: "stats 9" }, amount: 10, isPercent: true, provenance }],
    artworkAssets: [{ assetId: "asset", sha256: "e".repeat(64), bytes: 12, width: 2, height: 2, sourceName: "shared", provenance }], artworkBindings: [{ entityKey: "items:1", role: "icon", assetId: "asset", provenance }, { entityKey: "items:2", role: "icon", assetId: "asset", provenance }],
    provenance: { plan: reference, profile: reference, sources: [] },
  };
  try {
    populateNormalizedDatabase(db, input, []);
    populateNormalizedDatabase(db, input, []);
    db.query("INSERT INTO catalog_metadata VALUES (?, ?, ?, ?, ?)").run("c".repeat(64), "test", "catalog.v1", "{}", "f".repeat(64));
    const facts = queryCatalogFacts(db).records;
    expect(facts.items[0]).toMatchObject({ randomStats: [{ stat: { entityKey: "stats:9" }, min: 1, max: 4, whole: true, chance: 50 }], sockets: [{ socketType: null, gemType: "RED" }], gem: { gemType: "RED", stats: [{ stat: { entityKey: "stats:9" }, amount: 3, isPercent: true }] } });
    expect(facts.gearSets).toEqual([{ entityKey: "gearSets:13", members: [{ entityKey: "items:1", label: "items 1" }], tiers: [{ equipped: 3, stats: [{ stat: { entityKey: "stats:9", label: "stats 9" }, amount: 10, isPercent: true }] }] }]);
    expect(facts.items[0]!.gearSet).toEqual({ entityKey: "gearSets:13", label: "gearSets 13" });
    for (const table of ["item_facts", "item_stats", "item_random_stats", "item_gem_stats", "item_sockets", "npc_facts", "npc_stats", "npc_ability_phases", "npc_phase_abilities", "npc_faction_rewards", "quest_facts", "quest_objectives", "quest_rewards", "place_facts", "property_facts", "ability_facts", "recipe_facts", "recipe_ranks", "recipe_products", "recipe_materials", "crafting_station_facts", "gear_set_facts", "gear_set_members", "gear_set_tiers", "gear_set_tier_stats"]) expect(db.query(`SELECT count(*) AS count FROM ${table}`).get()).toEqual({ count: 1 });
    expect(db.query("SELECT count(*) AS count FROM artwork_assets").get()).toEqual({ count: 1 });
    expect(db.query("SELECT count(*) AS count FROM artwork_bindings").get()).toEqual({ count: 2 });
  } finally { db.close(); }
});

test("creates a strict catalog schema with enforced coverage references", () => {
  const db = openNormalizedDatabase(":memory:");
  try {
    expect(db.query<{ strict: number }, []>("SELECT strict FROM pragma_table_list WHERE name = 'coverage_issues'").get()).toEqual({ strict: 1 });
    expect(db.query<{ foreign_keys: number }, []>("PRAGMA foreign_keys").get()).toEqual({ foreign_keys: 1 });
    expect(() => db.query("INSERT INTO coverage_occurrences VALUES (?, ?, ?, ?, ?, ?)").run(
      "a".repeat(64), "b".repeat(64), "c".repeat(64), "source", "records/0", "{}",
    )).toThrow();
  } finally { db.close(); }
});

test("deduplicates semantic issues without using diagnostic wording", () => {
  const db = openNormalizedDatabase(":memory:");
  try {
    db.query("INSERT INTO normalized_builds VALUES (?, ?, ?)").run("build", "schema", "{}");
    const base = {
      buildId: "build", kind: "missing-reference", subjectKey: "items:7", semanticDiscriminator: "owner",
      state: "unresolved" as const, runId: "run-1", artifactHash: "a".repeat(64), sourceKey: "items",
    };
    const first = recordCoverageIssue(db, { ...base, recordPath: "records/1", evidence: { detail: "first wording" } });
    const second = recordCoverageIssue(db, { ...base, recordPath: "records/2", evidence: { detail: "different wording" } });
    const duplicate = recordCoverageIssue(db, { ...base, recordPath: "records/1", evidence: { detail: "changed wording" } });
    const distinct = recordCoverageIssue(db, { ...base, subjectKey: "items:8", recordPath: "records/3", evidence: { detail: "first wording" } });

    expect(first.issueId).toBe(second.issueId);
    expect(first.occurrenceId).toBe(duplicate.occurrenceId);
    expect(distinct.issueId).not.toBe(first.issueId);
    expect(coverageIssueId(base)).toBe(first.issueId);
    expect(db.query("SELECT count(*) AS count FROM coverage_issues").get()).toEqual({ count: 2 });
    expect(db.query("SELECT count(*) AS count FROM coverage_occurrences").get()).toEqual({ count: 3 });
  } finally { db.close(); }
});
