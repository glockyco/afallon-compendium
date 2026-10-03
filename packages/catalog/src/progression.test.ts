import { expect, test } from "bun:test";
import type { Support } from "@afallon/contracts";
import type { NormalizedDatabaseInput } from "@afallon/contracts/catalog";
import { openNormalizedDatabase, populateNormalizedDatabase } from "./database";
import { collectTypedFacts } from "./normalize";
import { normalizeProgression } from "./progression";
import { queryCatalogEntities, queryCatalogFacts } from "./queries";
import type { Blocker } from "./context";
import type { AdmittedCatalog } from "./evidence";

const reference = { path: "objects/support.json", sha256: "a".repeat(64) };
const named = (value: number, name: string) => ({ value, name });
const noRequirements = { useRequirementsTemplate: false, groups: [], template: null };
const levelRequirement = { useRequirementsTemplate: false, template: null, groups: [{ groupIndex: 0, checkCount: false, requiredCount: 0, requirements: [{ requirementType: "Level", requirementTypeValue: 13, conditionRule: "Mandatory", conditionRuleValue: 0, amount1: 10 }] }] };
const entry = (nativeId: number, name: string) => ({ nativeId, name, internalName: name });
const table = (rows: Array<{ id: number; name: string; gameplay: Record<string, unknown> }>) => rows.map((row) => ({ sourceKey: row.id, entry: entry(row.id, row.name), gameplay: row.gameplay }));
const classGameplay = (talentTreeIds: number[], spellbookIds: number[]) => ({
  autoAttackAbilityId: -1, levelTemplateId: -1, stats: [], customStats: [], useStatListTemplate: false, statListTemplate: null, skillBonuses: [],
  talentTreeIds: talentTreeIds.map((talentTreeId, sourceIndex) => ({ sourceIndex, talentTreeId })), spellbookIds: spellbookIds.map((spellbookId, sourceIndex) => ({ sourceIndex, spellbookId })),
  startItems: [], actionAbilities: [], allocationStatPoints: 0, allocatedStatsEntries: [], allocatedStatsEntriesGame: [],
});
const node = (sourceIndex: number, type: [number, string], ids: { abilityId?: number; recipeId?: number; bonusId?: number }, tier: number, row: number, requirements: unknown = noRequirements) => ({ sourceIndex, nodeType: named(...type), abilityId: ids.abilityId ?? -1, recipeId: ids.recipeId ?? -1, resourceNodeId: -1, bonusId: ids.bonusId ?? -1, tier, row, requirements });

const emptyInput: NormalizedDatabaseInput = {
  buildId: "build", identityResults: [], entities: [], scenes: [], mapSpaces: [], bindings: [], placements: [], sources: [], roles: [], regions: [], conditions: [], spawnCandidates: [], sourceGates: [], randomChoices: [], placementAreas: [], merchantTables: [], merchantBindings: [], merchantStock: [], lootTables: [], lootBindings: [], lootEntries: [], linkedNpcRules: [], resourceYields: [], questAssociations: [], transitions: [], itemSources: [], entityDetails: [], sourceDetails: [], patrolPaths: [], sceneSpawns: [], blockers: [], coverageOccurrences: [], exclusions: [], inputCoverage: null, provenance: { plan: reference, profile: reference, sources: [] },
};

const heroicTierSettings = {
  asset: "HeroicTierSettings", killExperienceMultiplier: 5, essenceTreePointId: 2, essenceBaseAmount: 3, essencePerAffix: 3,
  essenceEliteMultiplier: 1.5, essenceRareMultiplier: 2, essenceBossMultiplier: 3, essenceHealthBaseline: 1, essenceHealthFactorMin: 0.25, essenceHealthFactorMax: 4,
  baseHealthMultiplier: 3, baseDamageMultiplier: 2, gearScoreCoefficient: 0.0008, maxGearBonus: 1,
  affixChance: 0.25, extraAffixChance: 0.08, maxAffixes: 4, rareGuaranteedAffixes: 1, affixLootDropMultiplier: 1.5, heroicGearStatBonusPercent: 50,
};

function support(tables: Support["tables"], heroic: Support["heroicTierSettings"] = heroicTierSettings): Support {
  return { schemaVersion: "compendium.support.v5", language: "English", requirementIssues: [], sourceTotals: {}, tables, heroicTierSettings: heroic, healthStatId: 0 };
}

const fixture = support({
  classes: table([{ id: 0, name: "Shieldmaster", gameplay: classGameplay([0], [1]) }]),
  treePoints: table([{ id: 2, name: "Heroic Essence", gameplay: { startAmount: 0, maxPoints: 0, gainRules: [] } }]),
  skills: table([{ id: 5, name: "Cooking", gameplay: { automaticallyAdded: true, maxLevel: 300, levelTemplateId: -1, talentTreeIds: [{ sourceIndex: 0, talentTreeId: 9 }], stats: [], customStats: [], useStatListTemplate: false, statListTemplate: null, startItems: [], actionAbilities: [] } }]),
  talentTrees: table([
    { id: 0, name: "Bastion Breaker", gameplay: { tiers: 9, slotsPerTier: 4, treePointId: -1, nodes: [node(0, [0, "ability"], { abilityId: 1 }, 1, 4, levelRequirement), node(1, [0, "ability"], { abilityId: 404 }, 2, 1), node(2, [3, "bonus"], { bonusId: 7 }, 3, 2)] } },
    { id: 9, name: "Cooking Mastery", gameplay: { tiers: 3, slotsPerTier: 4, treePointId: -1, nodes: [node(0, [1, "recipe"], { recipeId: 12 }, 2, 3)] } },
  ]),
  spellbooks: table([{ id: 1, name: "Warrior", gameplay: { sourceType: named(0, "_class"), nodes: [{ sourceIndex: 0, nodeType: named(0, "ability"), abilityId: 2, bonusId: -1, unlockLevel: 10 }] } }]),
  bonuses: table([{ id: 7, name: "Thick Skin", gameplay: { learnedByDefault: false, ranks: [{ rankIndex: 0, unlockCost: 1, isEmpty: false, emptyTooltip: null, requirements: noRequirements, statEffects: [{ sourceIndex: 0, statId: 3, amount: 5, isPercent: true }], petStatEffects: [{ sourceIndex: 0, targetType: named(3, "HunterBeast"), npcId: -1, speciesId: -1, statId: 3, amount: 4, isPercent: false }] }] } }]),
  effects: table([{ id: 30, name: "Stun", gameplay: {
    effectType: named(5, "Stun"), effectTag: null, isState: true, isBuffOnSelf: false, stackLimit: 1, allowMultiple: false, allowMixedCaster: false, pulses: 0, duration: 3, endless: false, canBeManuallyRemoved: false, isPersistent: false,
    ranks: [{ rankIndex: 0, mainDamageType: named(99, "99"), customDamageType: null, customHealingType: null, damage: 0, alteredStatId: -1, flatCalculation: false, cannotCrit: false, skillModifier: 0, skillModifierId: -1, weaponDamageModifier: 0, useWeapon1Damage: false, useWeapon2Damage: false, useRangedWeaponDamage: true, lifesteal: 0, maxHealthModifier: 0, missingHealthModifier: 0, delay: 0, requiredEffectId: -1, requiredEffectDamageModifier: 0, damageStatId: -1, damageStatModifier: 0, teleportType: named(0, "gameScene"), gameSceneId: -1, lootTableId: -1, petNpcId: -1, petDuration: 0, petSpawnCount: 0, knockbackDistance: 0, motionDistance: 0, dispelType: named(0, "Effect"), dispelEffectType: named(0, "Stat"), dispelEffectTag: null, dispelEffectId: -1, tauntFlatThreat: 0, resurrectHealthPercent: 0, statEffects: [], nestedEffects: [] }],
  } }]),
});
const noPercentStats = new Map<number, boolean>();
const entityNames = new Map<string, string | null>([["abilities:1", "Shield Slam"], ["abilities:2", "Strike"], ["recipes:12", "Stew"], ["stats:3", "Armor"], ["classes:0", "Shieldmaster"], ["skills:5", "Cooking"], ["talentTrees:0", "Bastion Breaker"], ["talentTrees:9", "Cooking Mastery"], ["effects:30", "Stun"]]);

test("decodes effects, bonus ranks, and node requirements", () => {
  const blockers: Blocker[] = [];
  const rows = normalizeProgression(fixture, reference, entityNames, noPercentStats, blockers);
  const effect = rows.progressionFacts.find((row) => row.entityKey === "effects:30");
  expect(effect?.kind === "effects" ? [effect.details.effectType.name, effect.details.duration] : null).toEqual(["Stun", 3]);
  expect(effect?.kind === "effects" ? effect.details.ranks[0]?.useRangedWeaponDamage : null).toBe(true);
  const bonus = rows.progressionFacts.find((row) => row.entityKey === "bonuses:7");
  expect(bonus?.kind === "bonuses" ? bonus.details.ranks[0]?.statEffects : null).toEqual([{ stat: { entityKey: "stats:3", label: "Armor" }, amount: 5, isPercent: true }]);
  expect(bonus?.kind === "bonuses" ? bonus.details.ranks[0]?.petStatEffects : null).toEqual([{ targetType: named(3, "HunterBeast"), npc: null, speciesId: null, stat: { entityKey: "stats:3", label: "Armor" }, amount: 4, isPercent: false }]);
  const guarded = rows.talentNodes.find((row) => row.treeKey === "talentTrees:0" && row.nodeIndex === 0);
  expect(rows.conditions.map((row) => [row.ownerType, row.ownerKey, row.conditionId])).toEqual([["talentTreeNode", "talentTrees:0:0", guarded?.conditionId ?? ""]]);
  // A native enum value without a name keeps its number and becomes a coverage issue.
  expect(blockers.filter((row) => row.kind === "unsupported-enum").map((row) => row.detail)).toEqual(["Unsupported enum value 99 (99)."]);
});

test("main damage type, explicit stat, and health healing keep separate contributions", () => {
  const source = fixture.tables.effects?.[0];
  if (!source || !("gameplay" in source) || !source.gameplay || !Array.isArray(source.gameplay.ranks)) throw new Error("Missing effect rank fixture.");
  const baseRank = source.gameplay.ranks[0] as Record<string, unknown>;
  const damage = { ...baseRank, mainDamageType: named(2, "Magical"), alteredStatId: 0, damage: 25,
    hitValueType: named(0, "FLAT"), damageStatId: 135, damageStatModifier: 30, weaponDamageModifier: 200, skillModifierId: 5, skillModifier: 2 };
  const healing = { ...damage, mainDamageType: named(0, "Neutral"), damageStatId: -1, damageStatModifier: 0, weaponDamageModifier: 0 };
  const statBonus = (statType: [number, string], mainDamageType: [number, string]) => ({
    sourceIndex: 0, statType: named(...statType), modifyValue: 1, mainDamageType: named(...mainDamageType),
    customDamageType: null, customHealingType: null, resistanceStatId: -1, penetrationStatId: -1,
    statId: -1, creatureType: named(0, "NONE"),
  });
  const statGameplay = (statBonuses: unknown[]) => ({
    minCheck: false, minValue: 0, maxCheck: false, maxValue: 0, baseValue: 0, isPercentStat: false, isVitalityStat: false, isPersistent: false, startPercentage: 100,
    shiftsInSprint: false, shiftsInBlock: false, shiftsOutsideCombat: false, shiftsInCombat: false,
    shiftAmountOutsideCombat: 0, shiftIntervalOutsideCombat: 0, shiftAmountInCombat: 0, shiftIntervalInCombat: 0,
    uiCategory: null, statCategory: null, procCooldown: 0, statBonuses, onHitEffects: [],
  });
  const tables = { ...fixture.tables,
    stats: table([
      { id: 0, name: "Health", gameplay: statGameplay([]) },
      { id: 27, name: "Strength", gameplay: statGameplay([statBonus([14, "BASE_DAMAGE_TYPE"], [1, "Physical"])]) },
      { id: 28, name: "Intellect", gameplay: statGameplay([statBonus([14, "BASE_DAMAGE_TYPE"], [2, "Magical"]), statBonus([4, "HEALING"], [0, "Neutral"])]) },
      { id: 41, name: "Healing Power", gameplay: statGameplay([statBonus([18, "GLOBAL_HEALING"], [0, "Neutral"])]) },
      { id: 135, name: "Agility", gameplay: statGameplay([]) },
    ]),
    effects: table([
      { id: 394, name: "Brutal Slice", gameplay: { ...source.gameplay, effectType: named(0, "InstantDamage"), ranks: [damage] } },
      { id: 395, name: "Flat Slice", gameplay: { ...source.gameplay, effectType: named(0, "InstantDamage"), ranks: [{ ...damage, flatCalculation: true }] } },
      { id: 396, name: "Double Intellect", gameplay: { ...source.gameplay, effectType: named(0, "InstantDamage"), ranks: [{ ...damage, damageStatId: 28 }] } },
      { id: 499, name: "Bloom", gameplay: { ...source.gameplay, effectType: named(1, "InstantHeal"), ranks: [healing] } },
    ]),
  };
  const labels = new Map<string, string | null>([...entityNames, ["stats:0", "Health"], ["stats:27", "Strength"], ["stats:28", "Intellect"], ["stats:41", "Healing Power"], ["stats:135", "Agility"], ["effects:394", "Brutal Slice"], ["effects:395", "Flat Slice"], ["effects:396", "Double Intellect"], ["effects:499", "Bloom"]]);
  const facts = normalizeProgression(support(tables), reference, labels, noPercentStats, []).progressionFacts;
  const scaling = (key: string) => {
    const effect = facts.find((fact) => fact.entityKey === key);
    return effect?.kind === "effects" ? effect.details.ranks[0]?.scaling?.map((row) => [row.stat.entityKey, row.coefficientPercent, row.source]) : undefined;
  };
  expect(scaling("effects:394")).toEqual([["stats:28", 100, "damageType"], ["stats:135", 30, "explicit"]]);
  expect(scaling("effects:395")).toEqual([["stats:135", 30, "explicit"]]);
  expect(scaling("effects:396")).toEqual([["stats:28", 100, "damageType"], ["stats:28", 30, "explicit"]]);
  const slice = facts.find((fact) => fact.entityKey === "effects:394");
  expect(slice?.kind === "effects" ? slice.details.ranks[0]?.skillModifierSkill?.entityKey : null).toBe("skills:5");
  expect(scaling("effects:499")).toEqual([["stats:28", 100, "healing"], ["stats:41", 100, "globalHealing"]]);
});

test("a talent change is a percentage when the change or its stat is a percentage", () => {
  const change = (statId: number, isPercent: boolean) => ({ sourceIndex: 0, statId, amount: 2, isPercent });
  const rank = { rankIndex: 0, unlockCost: 1, isEmpty: false, emptyTooltip: null, requirements: noRequirements, statEffects: [change(3, false), change(4, false), change(4, true)],
    petStatEffects: [{ ...change(3, false), targetType: named(3, "HunterBeast"), npcId: -1, speciesId: -1 }, { ...change(4, false), targetType: named(3, "HunterBeast"), npcId: -1, speciesId: -1 }] };
  const tables = { ...fixture.tables, bonuses: table([{ id: 7, name: "Bonded Fury", gameplay: { learnedByDefault: false, ranks: [rank] } }]) };
  const rows = normalizeProgression(support(tables), reference, new Map([...entityNames, ["stats:4", "Strength"]]), new Map([[3, true], [4, false]]), []);
  const bonus = rows.progressionFacts.find((row) => row.entityKey === "bonuses:7");
  const ranks = bonus?.kind === "bonuses" ? bonus.details.ranks : [];
  expect(ranks[0]?.statEffects.map((row) => row.isPercent)).toEqual([true, false, true]);
  expect(ranks[0]?.petStatEffects.map((row) => row.isPercent)).toEqual([true, false]);
});

test("reports a missing ability and derives no learner from it", () => {
  const blockers: Blocker[] = [];
  const rows = normalizeProgression(fixture, reference, entityNames, noPercentStats, blockers);
  expect(blockers.filter((row) => row.kind === "missing-reference").map((row) => row.key)).toEqual(["/tables/talentTrees/0/gameplay/nodes/1/abilityId:abilities:404"]);
  const db = openNormalizedDatabase(":memory:");
  try {
    const input: NormalizedDatabaseInput = { ...emptyInput, progressionFacts: rows.progressionFacts, progressionLinks: rows.progressionLinks, talentNodes: rows.talentNodes, spellbookNodes: rows.spellbookNodes };
    populateNormalizedDatabase(db, input, []);
    db.query("INSERT INTO catalog_metadata VALUES (?, ?, ?, ?, ?)").run("c".repeat(64), "build", "catalog.v1", "{}", "f".repeat(64));
    const progression = queryCatalogFacts(db).records.progression;
    expect(progression.learners.map((row) => [row.ability, row.owner.label, row.via, row.source?.label ?? null, row.level, row.tier, row.row])).toEqual([
      ["abilities:1", "Shieldmaster", "talentTree", "Bastion Breaker", null, 1, 4],
      ["abilities:2", "Shieldmaster", "spellbook", "Warrior", 10, null, null],
    ]);
    expect(progression.unlocks).toEqual([{ target: "recipes:12", owner: { entityKey: "skills:5", label: "Cooking" }, tree: { entityKey: "talentTrees:9", label: "Cooking Mastery" }, tier: 2, row: 3 }]);
    const beastBonus = progression.facts.find((row) => row.entityKey === "bonuses:7");
    expect(beastBonus?.kind === "bonuses" ? beastBonus.details.ranks[0]?.petStatEffects[0]?.targetType : null).toEqual(named(3, "HunterBeast"));
    const rangedEffect = progression.facts.find((row) => row.entityKey === "effects:30");
    expect(rangedEffect?.kind === "effects" ? rangedEffect.details.ranks[0]?.useRangedWeaponDamage : null).toBe(true);
  } finally { db.close(); }
});

test("an unavailable record adds no fact", () => {
  const withNull = support({ ...fixture.tables, bonuses: [...(fixture.tables.bonuses ?? []), { sourceKey: 8, unavailable: "null record", sourceFieldPath: "GameDatabase.Bonuses[8]" }] });
  const rows = normalizeProgression(withNull, reference, entityNames, noPercentStats, []);
  expect(rows.progressionFacts.filter((row) => row.kind === "bonuses").map((row) => row.entityKey)).toEqual(["bonuses:7"]);
});

test("a class counts as offered only when a race names its record", () => {
  const withRace = support({ ...fixture.tables, races: table([{ id: 1, name: "Dwarf", gameplay: { startingSceneId: 22, startingPositionId: 18, availableClasses: [{ sourceIndex: 0, classId: 0 }, { sourceIndex: 1, classId: 99 }] } }]) });
  const blockers: Blocker[] = [];
  const rows = normalizeProgression(withRace, reference, new Map([...entityNames, ["races:1", "Dwarf"]]), noPercentStats, blockers);
  expect(blockers.filter((row) => row.kind === "missing-reference" && row.key.includes("classes:99"))).toHaveLength(1);
  const db = openNormalizedDatabase(":memory:");
  try {
    populateNormalizedDatabase(db, { ...emptyInput, progressionFacts: rows.progressionFacts }, []);
    db.query("INSERT INTO catalog_metadata VALUES (?, ?, ?, ?, ?)").run("c".repeat(64), "build", "catalog.v1", "{}", "f".repeat(64));
    expect(queryCatalogFacts(db).records.progression.offeredClasses).toEqual(["classes:0"]);
  } finally { db.close(); }
});

test("race start evidence requires numeric scene and world-position IDs", () => {
  const races = table([{ id: 1, name: "Human", gameplay: { startingSceneId: "unknown", startingPositionId: 18, availableClasses: [] } }]);
  expect(() => normalizeProgression(support({ ...fixture.tables, races }), reference, entityNames, noPercentStats, [])).toThrow();
});

test("Heroic settings keep their values, and a missing asset is a coverage issue instead of defaults", () => {
  const rows = normalizeProgression(fixture, reference, entityNames, noPercentStats, []);
  const heroic = rows.progressionFacts.find((row) => row.kind === "heroicTier");
  expect(heroic?.kind === "heroicTier" ? [heroic.details.killExperienceMultiplier, heroic.details.essenceTreePoint, heroic.details.gearScoreCoefficient] : null).toEqual([5, { entityKey: "treePoints:2", label: "Heroic Essence" }, 0.0008]);
  const blockers: Blocker[] = [];
  const missing = normalizeProgression(support(fixture.tables, { unavailable: "HeroicTierSettings.Get() returned null", sourceFieldPath: "HeroicTierSettings.Get()" }), reference, entityNames, noPercentStats, blockers);
  expect(missing.progressionFacts.some((row) => row.kind === "heroicTier")).toBe(false);
  expect(blockers.filter((row) => row.kind === "unavailable-progression-data").map((row) => row.key)).toEqual(["support:/heroicTierSettings"]);
});

test("bonus artwork resolves through progression facts while tree artwork binds its canonical entity", () => {
  const trees = table([{ id: 0, name: "Bastion Breaker", gameplay: { tiers: 3, slotsPerTier: 4, treePointId: -1, nodes: [
    node(0, [3, "bonus"], { bonusId: 7 }, 2, 1),
    node(1, [3, "bonus"], { bonusId: 8 }, 3, 2),
  ] } }]);
  const tables = { ...fixture.tables, talentTrees: trees, bonuses: [
    ...(fixture.tables.bonuses ?? []),
    ...table([{ id: 8, name: "No Sprite", gameplay: { learnedByDefault: false, ranks: [] } }]),
  ] };
  const normalized = normalizeProgression(support(tables), reference, entityNames, noPercentStats, []);
  const treeEntity = { entityKey: "talentTrees:0", buildId: "build", kind: "talentTrees", nativeId: 0, name: "Bastion Breaker", internalName: null, description: null, sourceKey: 0, publicData: { localization: null, gameplay: null, icon: null }, provenance: [reference] };
  const image = { sha256: "b".repeat(64), bytes: 24, width: 2, height: 2 };
  const admitted = {
    canonical: { value: { items: [], npcs: [], quests: [], scenes: [], regions: [], properties: [], stats: [] }, reference },
    relationships: { value: { tasks: [], adventurerWorldSettings: { unavailable: "No settings asset in this fixture.", sourceFieldPath: "Resources.LoadAll<AdventurerWorldSettings>(\"\")[0]", assetCount: 0 } }, reference },
    lootRules: { value: { itemLevels: [] }, reference },
    support: { value: { tables: {} }, reference },
    artwork: { value: { records: [
      { family: "talentTrees", nativeId: 0, role: "icon", sourceName: "Tree", status: "extracted", image },
      { family: "bonuses", nativeId: 7, role: "icon", sourceName: "Talent icon", status: "extracted", image },
      { family: "bonuses", nativeId: 8, role: "icon", sourceName: "No Sprite", status: "missing", image: null, reason: "Sprite absent" },
    ] }, reference },
  } as unknown as AdmittedCatalog;
  const blockers: Blocker[] = [];
  const artwork = collectTypedFacts(admitted, [treeEntity], [], [], blockers, new Map(normalized.progressionFacts.map((fact) => [fact.entityKey, fact.name ?? fact.entityKey])));
  expect(blockers.filter((issue) => issue.kind === "artwork-unavailable").map((issue) => issue.key)).toEqual(["bonuses:8:icon"]);
  const db = openNormalizedDatabase(":memory:");
  try {
    populateNormalizedDatabase(db, { ...emptyInput, entities: [treeEntity], progressionFacts: normalized.progressionFacts, talentNodes: normalized.talentNodes,
      artworkAssets: artwork.artworkAssets, artworkBindings: artwork.artworkBindings, bonusArtworkBindings: artwork.bonusArtworkBindings }, []);
    db.query("INSERT INTO catalog_metadata VALUES (?, ?, ?, ?, ?)").run("c".repeat(64), "build", "catalog.v1", "{}", "f".repeat(64));
    const progression = queryCatalogFacts(db).records.progression;
    expect(progression.facts.find((fact) => fact.entityKey === "bonuses:7")?.artwork).toMatchObject([{ role: "icon", assetId: image.sha256, sha256: image.sha256 }]);
    expect(progression.facts.find((fact) => fact.entityKey === "bonuses:8")?.artwork).toEqual([]);
    const tree = progression.facts.find((fact) => fact.entityKey === treeEntity.entityKey);
    expect(tree?.kind === "talentTrees" ? [tree.details.tiers, tree.details.slotsPerTier] : null).toEqual([3, 4]);
    expect(progression.talentNodes.map((talent) => [talent.target?.entityKey, talent.tier, talent.row])).toEqual([
      ["bonuses:7", 2, 1], ["bonuses:8", 3, 2],
    ]);
    expect(queryCatalogEntities(db).records.find((entity) => entity.entityKey === treeEntity.entityKey)?.artwork).toMatchObject([{ role: "icon", assetId: image.sha256 }]);
    expect(queryCatalogEntities(db).records.some((entity) => entity.entityKey.startsWith("bonuses:"))).toBe(false);
    expect(db.query("SELECT fact_key, role, asset_id, provenance_json FROM bonus_artwork_bindings").get()).toEqual({
      fact_key: "bonuses:7", role: "icon", asset_id: image.sha256, provenance_json: JSON.stringify([{ ...reference, pointer: "/records/1" }]),
    });
    expect(() => db.query("INSERT INTO bonus_artwork_bindings VALUES (?, ?, ?, ?)").run("bonuses:404", "icon", image.sha256, "[]")).toThrow();
    expect(() => db.query("INSERT INTO bonus_artwork_bindings VALUES (?, ?, ?, ?)").run("bonuses:8", "icon", "missing-asset", "[]")).toThrow();
    expect(() => db.query("INSERT INTO bonus_artwork_bindings VALUES (?, ?, ?, ?)").run("bonuses:8", "banner", image.sha256, "[]")).toThrow();
  } finally { db.close(); }
});
