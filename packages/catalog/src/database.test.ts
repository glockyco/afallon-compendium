import { expect, test } from "bun:test";
import type { Database } from "bun:sqlite";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { coverageIssueId, openNormalizedDatabase, populateNormalizedDatabase, recordCoverageIssue } from "./database";
import { NORMALIZED_OUTPUT_SCHEMA_VERSION } from "@afallon/contracts/catalog";
import { queryCatalogFacts, queryCatalogMap, queryCatalogRelations, queryGatherRows } from "./queries";
import type { NormalizedDatabaseInput } from "@afallon/contracts/catalog"
import type { Blocker, SceneContext, SourceIdentityRow } from "./context";
import { randomChoices } from "./world";

test("rejects unset table identities without partially adding definitions", async () => {
  const root = await mkdtemp(join(tmpdir(), "afallon-normalized-"));
  let db: Database | undefined;
  try {
    db = openNormalizedDatabase(join(root, "normalized.sqlite"));
    const reference = { path: "input.json", sha256: "0".repeat(64) };
    const input: NormalizedDatabaseInput = {
      buildId: "test", identityResults: [], entities: [], scenes: [], mapSpaces: [], bindings: [],
      placements: [], sources: [], roles: [], regions: [], conditions: [], spawnCandidates: [], sourceGates: [], randomChoices: [], placementAreas: [], worldQuestFacts: [],
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
    } }], entities: [], scenes: [], mapSpaces: [], bindings: [], placements: [], sources: [], roles: [], regions: [], conditions: [], spawnCandidates: [], sourceGates: [], randomChoices: [], placementAreas: [], worldQuestFacts: [],
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
      conditions: [], spawnCandidates: [], sourceGates: [], randomChoices: [], placementAreas: [], worldQuestFacts: [], merchantTables: [], merchantBindings: [], merchantStock: [],
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
  const entities = [entity("items", 1), entity("items", 2), entity("npcs", 3), entity("quests", 4), entity("scenes", 5), entity("properties", 6), entity("abilities", 7), entity("recipes", 8), entity("stats", 9), entity("factions", 10), entity("craftingStations", 11), entity("skills", 12), entity("gearSets", 13), entity("classes", 14), entity("races", 15), entity("talentTrees", 16), entity("currencies", 17)];
  const levelCondition = { conditionId: "item-level", ownerType: "entity", ownerKey: "items:1", ordinal: 0, semantics: "inline-requirements", scope: "equipment" as const, sourceFieldPath: "/items/1/requirements", payload: { groups: [{ checkCount: false, requiredCount: 0, requirements: [{ requirementType: "Level", requirementTypeValue: 13, conditionRule: "Mandatory", conditionRuleValue: 0, amount1: 2, amount2: 0 }] }] }, provenance };
  const input: NormalizedDatabaseInput = {
    buildId: "test", identityResults: [], entities, scenes: [], mapSpaces: [], bindings: [], placements: [], sources: [], roles: [], regions: [], conditions: [levelCondition], spawnCandidates: [], sourceGates: [], randomChoices: [], placementAreas: [], merchantTables: [], merchantBindings: [], merchantStock: [], lootTables: [], lootBindings: [], lootEntries: [], linkedNpcRules: [], resourceYields: [], questAssociations: [], transitions: [], itemSources: [], entityDetails: [], sourceDetails: [], patrolPaths: [], sceneSpawns: [], blockers: [], coverageOccurrences: [], exclusions: [], inputCoverage: null,
    itemFacts: [{ entityKey: "items:1", rarity: "RARE", itemType: "WEAPON", armorSlot: null, weaponSlot: "MAIN_HAND", weaponType: "SWORD", armorType: null, attackSpeed: 1.2, minDamage: 3, maxDamage: 5, randomStatsMax: 1, gemType: "RED", enchantment: null, sellPrice: 4, sellCurrency: null, buyPrice: 8, buyCurrency: null, stackLimit: 1, questDropOnly: false, corruptionToken: false, levelRequirement: 2, actionAbilities: [{ sourceIndex: 0, ability: { entityKey: "abilities:7", label: "abilities 7" }, rankIndex: 2 }], useLines: [{ spans: [{ text: "Use", tone: "positive", italic: false }] }, { spans: [] }], conditionIds: ["item-level"], provenance }],
    itemGameActions: [{ entityKey: "items:1", actionIndex: 0, template: { nativeId: 4, name: "Scroll actions" }, type: "Recipe", chance: 100, nodeAction: "RankUp", progressionType: "Unlock", teleportType: "Position", amount: 0, target: { entityKey: "recipes:8", label: "recipes 8" }, provenance }],
    itemStats: [{ entityKey: "items:1", statIndex: 0, stat: { entityKey: "stats:9", label: "stats 9" }, amount: 2, isPercent: false, provenance }], itemRandomStats: [{ entityKey: "items:1", statIndex: 0, stat: { entityKey: "stats:9", label: "stats 9" }, min: 1, max: 4, isPercent: false, whole: true, chance: 50, provenance }], itemGemStats: [{ entityKey: "items:1", statIndex: 0, stat: { entityKey: "stats:9", label: "stats 9" }, amount: 3, isPercent: true, provenance }], itemSockets: [{ entityKey: "items:1", socketIndex: 0, socketType: null, gemType: "RED", provenance }],
    npcFacts: [{ entityKey: "npcs:3", minLevel: 1, maxLevel: 2, scalesWithPlayer: false, npcType: "BOSS", creatureType: "HUMANOID", family: "TEST", faction: { entityKey: "factions:10", label: "factions 10" }, species: null, isMerchant: false, isQuestGiver: true, isCombatEnabled: true, isAuctioneer: true, isBanker: false, isFlightMaster: true, hunterTamable: false, hunterBeastRole: "Guardian", equipmentAppearanceSelections: "helm=2", adventurer: { class: { entityKey: "classes:14", label: "classes 14" }, race: { entityKey: "races:15", label: "races 15" }, preferredTree: { entityKey: "talentTrees:16", label: "talentTrees 16" }, keepPhaseAbilities: true, aiLogicTemplateKey: "Templates/Healer", specialization: { class: { entityKey: "classes:14", label: "classes 14" }, role: "Healer", preferredTree: { entityKey: "talentTrees:16", label: "talentTrees 16" }, behaviorName: "Support", priorityAbilities: [{ entityKey: "abilities:7", label: "abilities 7" }], blockedAbilities: [], blockedBonuses: [], allowedForms: [] } }, flightNetwork: { resourcePath: "FlightPaths/Afallon", stopId: "camp", interactionDistance: 8, networkId: "Afallon", sceneName: "Coalway outdoors", mapWorldBounds: { x: 0, y: 0, width: 100, height: 100 }, minimumFlyoverHeight: 40, currency: { entityKey: "currencies:17", label: "currencies 17" }, stops: [{ id: "camp", name: "Camp", landingPosition: { x: 1, y: 2, z: 3 }, landingYaw: 90, knownInitially: true, resolution: { state: "unresolved", candidates: [], issues: ["fixture"] } }], routes: [] }, minRespawn: 4, maxRespawn: 8, minExperience: 1, maxExperience: 2, lowerLevelExperienceModifier: 20, higherLevelExperienceModifier: -20, immuneToStun: false, immuneToSlow: false, aggroRange: 5, linkedNpc: null, lootSpecialization: null, provenance }],
    npcStats: [{ entityKey: "npcs:3", statIndex: 0, stat: { entityKey: "stats:9", label: "stats 9" }, amount: 20, isPercent: false, provenance }], npcAbilityPhases: [{ entityKey: "npcs:3", phaseIndex: 0, name: "Opening", requirement: null, provenance }], npcPhaseAbilities: [{ entityKey: "npcs:3", phaseIndex: 0, abilityIndex: 0, sourceIndex: 4, ability: { entityKey: "abilities:7", label: "abilities 7" }, rankIndex: 2, provenance }], npcFactionRewards: [{ entityKey: "npcs:3", rewardIndex: 0, faction: { entityKey: "factions:10", label: "factions 10" }, amount: 3, provenance }],
    questFacts: [{ entityKey: "quests:4", chainName: "Chain", chainOrder: 1, repeatable: false, turnInWithoutNpc: false, completedDescription: "Done", objectiveText: "Go", levelRequirement: 2, levelRange: { min: 2, max: 4 }, dungeon: { entityKey: "scenes:5", label: "scenes 5" }, experience: 5, conditionIds: [], provenance }], questObjectives: [{ questEntityKey: "quests:4", objectiveIndex: 0, taskType: "killNPC", task: { entityKey: null, label: "Task" }, target: { entityKey: "npcs:3", label: "npcs 3" }, count: 1, keepItems: null, sceneName: null, provenance }], questRewards: [{ questEntityKey: "quests:4", rewardSet: "given", rewardIndex: 0, rewardType: "item", target: { entityKey: "items:1", label: "items 1" }, count: 1, experience: null, provenance }], worldQuestFacts: [{ entityKey: "quests:4", worldQuestNativeId: 4, availableSeconds: 600, cooldownAfterCompletionSeconds: 900, cooldownAfterExpirySeconds: 300, cooldownJitterSeconds: 60, initialRollSeconds: 30, provenance }],
    placeFacts: [{ entityKey: "scenes:5", placeType: "dungeon", guideIncluded: true, guideDescription: "Place", levelMin: 1, levelMax: 3, mapSpaceIds: [], bosses: [{ entityKey: "npcs:3", label: "npcs 3" }], parentSceneKey: null, provenance }], propertyFacts: [{ entityKey: "properties:6", income: 2, incomeInterval: 300, purchasePrice: 10, sellPrice: 5, currency: null, propertyType: "House", provenance }], abilityFacts: [{ entityKey: "abilities:7", ranks: [{ rankIndex: 2, lines: [{ spans: [{ text: "Rank two", tone: "effect", italic: false }] }, { spans: [] }], provenance }], provenance }],
    recipeFacts: [{ entityKey: "recipes:8", skill: { entityKey: "skills:12", label: "skills 12" }, station: { entityKey: "craftingStations:11", label: "craftingStations 11" }, learnedByDefault: true, provenance }], recipeRanks: [{ entityKey: "recipes:8", rank: 0, unlockCost: 0, experience: 2, craftTime: 1, provenance }], recipeProducts: [{ entityKey: "recipes:8", rank: 0, productIndex: 0, item: { entityKey: "items:1", label: "items 1" }, count: 1, chance: 1, provenance }], recipeMaterials: [{ entityKey: "recipes:8", rank: 0, materialIndex: 0, item: { entityKey: "items:2", label: "items 2" }, count: 2, provenance }], craftingStationFacts: [{ entityKey: "craftingStations:11", maxDistance: 4, skillRefs: [{ entityKey: "skills:12", label: "skills 12" }], provenance }],
    gearSetFacts: [{ entityKey: "gearSets:13", provenance }], gearSetMembers: [{ entityKey: "gearSets:13", memberIndex: 0, item: { entityKey: "items:1", label: "items 1" }, provenance }], gearSetTiers: [{ entityKey: "gearSets:13", tierIndex: 0, equipped: 3, provenance }], gearSetTierStats: [{ entityKey: "gearSets:13", tierIndex: 0, statIndex: 0, stat: { entityKey: "stats:9", label: "stats 9" }, amount: 10, isPercent: true, provenance }],
    artworkAssets: [{ assetId: "asset", sha256: "e".repeat(64), bytes: 12, width: 2, height: 2, sourceName: "shared", provenance }], artworkBindings: [{ entityKey: "items:1", role: "icon", assetId: "asset", provenance }, { entityKey: "items:2", role: "icon", assetId: "asset", provenance }],
    provenance: { plan: reference, profile: reference, sources: [] },
  };
  try {
    populateNormalizedDatabase(db, input, []);
    populateNormalizedDatabase(db, input, []);
    expect(db.query<{ schema_version: string }, []>("SELECT schema_version FROM normalized_builds").get()?.schema_version).toBe(NORMALIZED_OUTPUT_SCHEMA_VERSION);
    db.query("INSERT INTO catalog_metadata VALUES (?, ?, ?, ?, ?)").run("c".repeat(64), "test", "catalog.v1", "{}", "f".repeat(64));
    const facts = queryCatalogFacts(db).records;
    expect(facts.items[0]).toMatchObject({ randomStats: [{ stat: { entityKey: "stats:9" }, min: 1, max: 4, whole: true, chance: 50 }], sockets: [{ socketType: null, gemType: "RED" }], gem: { gemType: "RED", stats: [{ stat: { entityKey: "stats:9" }, amount: 3, isPercent: true }] }, equipmentRequirements: [{ requirements: [{ type: { name: "Level" }, label: "Level 2", amounts: { primary: 2 } }] }], actionAbilities: [{ ability: { entityKey: "abilities:7" }, rankIndex: 2 }], useLines: [{ spans: [{ text: "Use", tone: "positive", italic: false }] }, { spans: [] }] });
    expect(facts.items[0]!.equipmentRequirements.flatMap((group) => group.requirements)).toHaveLength(1);
    expect(facts.items[0]!.gameActions).toEqual([{ template: { nativeId: 4, name: "Scroll actions" }, type: "Recipe", chance: 100, nodeAction: "RankUp", progressionType: "Unlock", teleportType: "Position", amount: 0, target: { entityKey: "recipes:8", label: "recipes 8" } }]);
    expect(facts.abilities[0]).toEqual({ entityKey: "abilities:7", ranks: [{ rankIndex: 2, lines: [{ spans: [{ text: "Rank two", tone: "effect", italic: false }] }, { spans: [] }] }] });
    expect(facts.npcs[0]).toMatchObject({ isAuctioneer: true, isFlightMaster: true, abilityPhases: [{ abilities: [{ ability: { entityKey: "abilities:7" }, rankIndex: 2 }] }], adventurer: { class: { entityKey: "classes:14" }, race: { entityKey: "races:15" }, specialization: { role: "Healer", priorityAbilities: [{ entityKey: "abilities:7" }] } }, flightNetwork: { networkId: "Afallon", stopId: "camp", currency: { entityKey: "currencies:17" }, stops: [{ id: "camp" }] } });
    expect(facts.gearSets).toEqual([{ entityKey: "gearSets:13", members: [{ entityKey: "items:1", label: "items 1" }], tiers: [{ equipped: 3, stats: [{ stat: { entityKey: "stats:9", label: "stats 9" }, amount: 10, isPercent: true }] }] }]);
    expect(facts.items[0]!.gearSet).toEqual({ entityKey: "gearSets:13", label: "gearSets 13" });
    expect(facts.quests[0]).toMatchObject({ levelRequirement: 2, levelRange: { min: 2, max: 4 }, dungeon: { entityKey: "scenes:5" } });
    for (const table of ["item_facts", "item_game_actions", "item_stats", "item_random_stats", "item_gem_stats", "item_sockets", "npc_facts", "npc_stats", "npc_ability_phases", "npc_phase_abilities", "npc_faction_rewards", "quest_facts", "quest_objectives", "quest_rewards", "world_quest_facts", "place_facts", "property_facts", "ability_facts", "recipe_facts", "recipe_ranks", "recipe_products", "recipe_materials", "crafting_station_facts", "gear_set_facts", "gear_set_members", "gear_set_tiers", "gear_set_tier_stats"]) expect(db.query(`SELECT count(*) AS count FROM ${table}`).get()).toEqual({ count: 1 });
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

test("normalizes repeated random targets into persisted placement alternatives", () => {
  const db = openNormalizedDatabase(":memory:");
  try {
    const reference = { path: "world.json", sha256: "a".repeat(64) };
    const position = { x: 0, y: 0, z: 0 };
    const paths = ["Root[0]/Activator[0]", "Root[0]/A[0]/Loot[0]", "Root[0]/B[0]/NPC[0]", "Root[0]/Outside[0]"];
    const identities = paths.map((_path, index) => ({
      sourceId: ["choice", "a", "b", "outside"][index]!, placementId: ["choice-place", "a-place", "b-place", "outside-place"][index]!,
      componentInstanceId: index + 1, gameObjectInstanceId: index + 11, origin: "scene" as const,
      sceneSourceSha256: "b".repeat(64), sourceSha256: String(index).repeat(64),
      serializedFile: "scene", gameObjectPathId: String(index + 101), componentPathId: String(index + 201),
      loaderSourceId: null, typeName: "Source", assembly: "Game", position,
    }));
    const sourceByComponent = new Map<number, SourceIdentityRow>(identities.map((row, identityIndex) => [row.componentInstanceId, { ...row, identityIndex }]));
    const source = (componentInstanceId: number, hierarchyPath: string) => ({ componentInstanceId, source: { hierarchyPath } });
    const target = (hierarchyPath: string) => ({ sourceFieldPath: "gameObjects", name: hierarchyPath, source: { source: { hierarchyPath } }, activeSelf: true, activeInHierarchy: true });
    const context = {
      snapshotId: "run:scene", worldReference: reference, sourceByComponent,
      world: {
        interactions: [{ source: source(2, paths[1]!) }], services: [{ source: source(4, paths[3]!) }],
        randomActivators: [{ source: source(1, paths[0]!), targetCount: 4, numberToEnable: 1, targets: [
          target("Root[0]/A[0]"), target("Root[0]/A[0]"), target("Root[0]/B[0]"), target("Root[0]/Empty[0]"),
        ] }],
        resourceProducers: [], containers: [], questZones: [], transitions: [], mapZones: [], regions: [], mapIcons: [], conditionSources: [], unsupportedSources: [],
      },
      npc: { producers: [{ componentInstanceId: 3, source: { hierarchyPath: paths[2]! } }], adventurerProducers: [], adventurerPopulationManagers: [] },
    } as unknown as SceneContext;
    const blockers: Blocker[] = [];
    const choices = randomChoices([context, { ...context, snapshotId: "run:repeat" }], blockers);
    expect(blockers).toEqual([]);
    expect(choices.map((choice) => [choice.choiceId, choice.entries.map((entry) => entry.sourceIds)])).toEqual([
      ["choice", [["a"], ["a"], ["b"], []]],
    ]);
    const input: NormalizedDatabaseInput = {
      buildId: "build", identityResults: [{
        runId: "run", snapshotId: "run:scene", snapshotPrefix: "scene", snapshotSha256: reference.sha256, character: "Research", sceneHandle: 1,
        result: { schemaVersion: "compendium.placement-identities.v1", buildId: "build", sceneNativeId: 1, scenePath: "scene", snapshotFrame: 1, identities, unresolved: [] },
      }], entities: [], scenes: [], mapSpaces: [{ id: "map", label: "Map" }], bindings: [],
      placements: identities.map((row) => ({ placementId: row.placementId, buildId: "build", sceneNativeId: 1, scenePath: "scene", identity: null, mapSpaceId: "map", worldPosition: position, mapPosition: { x: 1, y: 2 }, sourceIds: [row.sourceId], roles: [], shape: null, provenance: [reference] })),
      sources: identities.map((row) => ({ ...row, placementId: row.placementId, buildId: "build", componentType: row.typeName, families: [], provenance: [reference] })),
      roles: [], regions: [], conditions: [], spawnCandidates: [], sourceGates: [], randomChoices: choices, placementAreas: [],
      merchantTables: [], merchantBindings: [], merchantStock: [], lootTables: [], lootBindings: [], lootEntries: [], linkedNpcRules: [], resourceYields: [], questAssociations: [], transitions: [],
      itemSources: [], entityDetails: [], sourceDetails: [], patrolPaths: [], sceneSpawns: [], blockers: [], coverageOccurrences: [], exclusions: [], inputCoverage: null,
      provenance: { plan: reference, profile: reference, sources: [reference] },
    };
    populateNormalizedDatabase(db, input, []);
    db.query("INSERT INTO catalog_metadata VALUES (?, ?, ?, ?, ?)").run("c".repeat(64), "build", "catalog.v1", "{}", "e".repeat(64));
    expect(db.query<{ entry_index: number; target_path: string | null }, []>("SELECT entry_index, target_path FROM random_choice_entries ORDER BY entry_index").all()).toEqual([
      { entry_index: 0, target_path: "Root[0]/A[0]" }, { entry_index: 1, target_path: "Root[0]/A[0]" },
      { entry_index: 2, target_path: "Root[0]/B[0]" }, { entry_index: 3, target_path: "Root[0]/Empty[0]" },
    ]);
    const expected = [
      ["a-place", [{ choiceId: "choice", entries: 4, options: 3, enabled: 1, entryIndexes: [0, 1] }]],
      ["b-place", [{ choiceId: "choice", entries: 4, options: 3, enabled: 1, entryIndexes: [2] }]],
      ["choice-place", []],
      ["outside-place", []],
    ];
    expect(queryCatalogMap(db, "map").records!.placements.map((placement) => [placement.placementId, placement.randomChoices])).toEqual(expected);
    expect(queryCatalogRelations(db).records.placements.map((placement) => [placement.placementId, placement.randomChoices])).toEqual(expected);
  } finally { db.close(); }
});

test("stores gathering nodes with their sources and yields, and keeps a node without a placement", () => {
  const db = openNormalizedDatabase(":memory:");
  try {
    const reference = { path: "world.json", sha256: "a".repeat(64) }, provenance = [reference], position = { x: 0, y: 0, z: 0 };
    const identities = ["spawner", "pumpkin"].map((sourceId, index) => ({
      sourceId, placementId: `${sourceId}-place`, componentInstanceId: index + 1, gameObjectInstanceId: index + 11, origin: "scene" as const,
      sceneSourceSha256: "b".repeat(64), sourceSha256: String(index).repeat(64), serializedFile: "scene", gameObjectPathId: String(index + 101), componentPathId: String(index + 201),
      loaderSourceId: null, typeName: "Source", assembly: "Game", position,
    }));
    const spawner = { skill: { entityKey: "skills:7", label: "Mining" }, respawnTime: 120, respawnJitter: 30, despawnDelay: 60, playerRange: 40, skillCap: 150, weightAtLowSkill: 70, weightAtHighSkill: 24, teaserWeight: 0 };
    const node = (entityKey: string, name: string) => ({ entityKey, name, levelHint: null, variant: false, skill: { entityKey: "skills:7", label: "Mining" }, skillExperience: 15, characterExperience: 4, lootTable: null, conditionId: null, provenance });
    const input: NormalizedDatabaseInput = {
      buildId: "build", identityResults: [{
        runId: "run", snapshotId: "run:scene", snapshotPrefix: "scene", snapshotSha256: reference.sha256, character: "Research", sceneHandle: 1,
        result: { schemaVersion: "compendium.placement-identities.v1", buildId: "build", sceneNativeId: 1, scenePath: "scene", snapshotFrame: 1, identities, unresolved: [] },
      }], entities: [{ entityKey: "items:1", buildId: "build", kind: "items", nativeId: 1, name: "Iron ore", internalName: null, description: null, sourceKey: 1, publicData: { localization: null, gameplay: null, icon: null }, provenance }],
      scenes: [], mapSpaces: [{ id: "map", label: "Map" }], bindings: [],
      // Only the spawner has a placement. The pumpkin source has an identity but no placement.
      placements: [{ placementId: "spawner-place", buildId: "build", sceneNativeId: 1, scenePath: "scene", identity: null, mapSpaceId: "map", worldPosition: position, mapPosition: { x: 1, y: 2 }, sourceIds: ["spawner"], roles: [], shape: null, provenance }],
      sources: identities.map((row) => ({ ...row, buildId: "build", componentType: row.typeName, families: [], provenance })),
      roles: [], regions: [], conditions: [], spawnCandidates: [], sourceGates: [], randomChoices: [], placementAreas: [],
      merchantTables: [], merchantBindings: [], merchantStock: [], lootTables: [], lootBindings: [], lootEntries: [], linkedNpcRules: [], questAssociations: [], transitions: [],
      gatheringNodes: [node("gatheringNodes:iron-vein", "Iron vein"), node("gatheringNodes:pumpkin", "Pumpkin")],
      gatheringNodeSources: [
        { nodeKey: "gatheringNodes:iron-vein", sourceId: "spawner", sourceKind: "spawner-option", optionIndex: 0, cooldown: null, spawner, provenance },
        { nodeKey: "gatheringNodes:pumpkin", sourceId: "pumpkin", sourceKind: "placed-object", optionIndex: null, cooldown: 60, spawner: null, provenance },
      ],
      resourceYields: [
        { yieldId: "linked", sourceId: "spawner", itemID: 1, min: 1, max: 2, gatheringNodeKey: "gatheringNodes:iron-vein", provenance },
        { yieldId: "unlinked", sourceId: "spawner", itemID: 1, min: 1, max: 1, gatheringNodeKey: null, provenance },
      ],
      itemSources: [], entityDetails: [], sourceDetails: [], patrolPaths: [], sceneSpawns: [], blockers: [], coverageOccurrences: [], exclusions: [], inputCoverage: null,
      provenance: { plan: reference, profile: reference, sources: [reference] },
    };
    populateNormalizedDatabase(db, input, []);
    db.query("INSERT INTO catalog_metadata VALUES (?, ?, ?, ?, ?)").run("c".repeat(64), "build", "catalog.v1", "{}", "e".repeat(64));
    expect(queryCatalogFacts(db).records.gatheringNodes.map((row) => [row.entityKey, row.sources.map((source) => [source.sourceId, source.sourceKind, source.optionIndex, source.placementId, source.spawner?.skillCap ?? null, source.cooldown])])).toEqual([
      ["gatheringNodes:iron-vein", [["spawner", "spawner-option", 0, "spawner-place", 150, null]]],
      ["gatheringNodes:pumpkin", [["pumpkin", "placed-object", null, null, null, 60]]],
    ]);
    expect(queryGatherRows(db).records.map((row) => [row.sourceId, row.gatheringNode])).toEqual([
      ["spawner", { entityKey: "gatheringNodes:iron-vein", label: "Iron vein" }], ["spawner", null],
    ]);
  } finally { db.close(); }
});
