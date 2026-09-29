import { expect, test } from "bun:test";
import type { Support } from "@afallon/contracts";
import type { NormalizedDatabaseInput } from "@afallon/contracts/catalog";
import { openNormalizedDatabase, populateNormalizedDatabase } from "./database";
import { normalizeProgression } from "./progression";
import { queryCatalogFacts } from "./queries";
import type { Blocker } from "./context";

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
  return { schemaVersion: "compendium.support.v3", language: "English", requirementIssues: [], sourceTotals: {}, tables, heroicTierSettings: heroic };
}

const fixture = support({
  classes: table([{ id: 0, name: "Shieldmaster", gameplay: classGameplay([0], [1]) }]),
  treePoints: table([{ id: 2, name: "Heroic Essence", gameplay: { startAmount: 0, maxPoints: 0, gainRules: [] } }]),
  skills: table([{ id: 5, name: "Cooking", gameplay: { automaticallyAdded: true, maxLevel: 300, levelTemplateId: -1, talentTreeIds: [{ sourceIndex: 0, talentTreeId: 9 }], stats: [], customStats: [], useStatListTemplate: false, statListTemplate: null, startItems: [], actionAbilities: [] } }]),
  talentTrees: table([
    { id: 0, name: "Bastion Breaker", gameplay: { tiers: 9, treePointId: -1, nodes: [node(0, [0, "ability"], { abilityId: 1 }, 1, 4, levelRequirement), node(1, [0, "ability"], { abilityId: 404 }, 2, 1), node(2, [3, "bonus"], { bonusId: 7 }, 3, 2)] } },
    { id: 9, name: "Cooking Mastery", gameplay: { tiers: 3, treePointId: -1, nodes: [node(0, [1, "recipe"], { recipeId: 12 }, 2, 3)] } },
  ]),
  spellbooks: table([{ id: 1, name: "Warrior", gameplay: { sourceType: named(0, "_class"), nodes: [{ sourceIndex: 0, nodeType: named(0, "ability"), abilityId: 2, bonusId: -1, unlockLevel: 10 }] } }]),
  bonuses: table([{ id: 7, name: "Thick Skin", gameplay: { learnedByDefault: false, ranks: [{ rankIndex: 0, unlockCost: 1, isEmpty: false, emptyTooltip: null, requirements: noRequirements, statEffects: [{ sourceIndex: 0, statId: 3, amount: 5, isPercent: true }], petStatEffects: [] }] } }]),
  effects: table([{ id: 30, name: "Stun", gameplay: {
    effectType: named(5, "Stun"), effectTag: null, isState: true, isBuffOnSelf: false, stackLimit: 1, allowMultiple: false, allowMixedCaster: false, pulses: 0, duration: 3, endless: false, canBeManuallyRemoved: false, isPersistent: false,
    ranks: [{ rankIndex: 0, mainDamageType: named(99, "99"), customDamageType: null, customHealingType: null, damage: 0, alteredStatId: -1, flatCalculation: false, cannotCrit: false, skillModifier: 0, skillModifierId: -1, weaponDamageModifier: 0, useWeapon1Damage: false, useWeapon2Damage: false, lifesteal: 0, maxHealthModifier: 0, missingHealthModifier: 0, delay: 0, requiredEffectId: -1, requiredEffectDamageModifier: 0, damageStatId: -1, damageStatModifier: 0, teleportType: named(0, "gameScene"), gameSceneId: -1, lootTableId: -1, petNpcId: -1, petDuration: 0, petSpawnCount: 0, knockbackDistance: 0, motionDistance: 0, dispelType: named(0, "Effect"), dispelEffectType: named(0, "Stat"), dispelEffectTag: null, dispelEffectId: -1, tauntFlatThreat: 0, resurrectHealthPercent: 0, statEffects: [], nestedEffects: [] }],
  } }]),
});
const entityNames = new Map<string, string | null>([["abilities:1", "Shield Slam"], ["abilities:2", "Strike"], ["recipes:12", "Stew"], ["stats:3", "Armor"], ["classes:0", "Shieldmaster"], ["skills:5", "Cooking"], ["talentTrees:0", "Bastion Breaker"], ["talentTrees:9", "Cooking Mastery"], ["effects:30", "Stun"]]);

test("decodes effects, bonus ranks, and node requirements", () => {
  const blockers: Blocker[] = [];
  const rows = normalizeProgression(fixture, reference, entityNames, blockers);
  const effect = rows.progressionFacts.find((row) => row.entityKey === "effects:30");
  expect(effect?.kind === "effects" ? [effect.details.effectType.name, effect.details.duration] : null).toEqual(["Stun", 3]);
  const bonus = rows.progressionFacts.find((row) => row.entityKey === "bonuses:7");
  expect(bonus?.kind === "bonuses" ? bonus.details.ranks[0]?.statEffects : null).toEqual([{ stat: { entityKey: "stats:3", label: "Armor" }, amount: 5, isPercent: true }]);
  const guarded = rows.talentNodes.find((row) => row.treeKey === "talentTrees:0" && row.nodeIndex === 0);
  expect(rows.conditions.map((row) => [row.ownerType, row.ownerKey, row.conditionId])).toEqual([["talentTreeNode", "talentTrees:0:0", guarded?.conditionId ?? ""]]);
  // A native enum value without a name keeps its number and becomes a coverage issue.
  expect(blockers.filter((row) => row.kind === "unsupported-enum").map((row) => row.detail)).toEqual(["Unsupported enum value 99 (99)."]);
});

test("reports a missing ability and derives no learner from it", () => {
  const blockers: Blocker[] = [];
  const rows = normalizeProgression(fixture, reference, entityNames, blockers);
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
  } finally { db.close(); }
});

test("an unavailable record adds no fact", () => {
  const withNull = support({ ...fixture.tables, bonuses: [...(fixture.tables.bonuses ?? []), { sourceKey: 8, unavailable: "null record", sourceFieldPath: "GameDatabase.Bonuses[8]" }] });
  const rows = normalizeProgression(withNull, reference, entityNames, []);
  expect(rows.progressionFacts.filter((row) => row.kind === "bonuses").map((row) => row.entityKey)).toEqual(["bonuses:7"]);
});

test("a class counts as offered only when a race names its record", () => {
  const withRace = support({ ...fixture.tables, races: table([{ id: 1, name: "Dwarf", gameplay: { availableClasses: [{ sourceIndex: 0, classId: 0 }, { sourceIndex: 1, classId: 99 }] } }]) });
  const blockers: Blocker[] = [];
  const rows = normalizeProgression(withRace, reference, new Map([...entityNames, ["races:1", "Dwarf"]]), blockers);
  expect(blockers.filter((row) => row.kind === "missing-reference" && row.key.includes("classes:99"))).toHaveLength(1);
  const db = openNormalizedDatabase(":memory:");
  try {
    populateNormalizedDatabase(db, { ...emptyInput, progressionFacts: rows.progressionFacts }, []);
    db.query("INSERT INTO catalog_metadata VALUES (?, ?, ?, ?, ?)").run("c".repeat(64), "build", "catalog.v1", "{}", "f".repeat(64));
    expect(queryCatalogFacts(db).records.progression.offeredClasses).toEqual(["classes:0"]);
  } finally { db.close(); }
});

test("Heroic settings keep their values, and a missing asset is a coverage issue instead of defaults", () => {
  const rows = normalizeProgression(fixture, reference, entityNames, []);
  const heroic = rows.progressionFacts.find((row) => row.kind === "heroicTier");
  expect(heroic?.kind === "heroicTier" ? [heroic.details.killExperienceMultiplier, heroic.details.essenceTreePoint, heroic.details.gearScoreCoefficient] : null).toEqual([5, { entityKey: "treePoints:2", label: "Heroic Essence" }, 0.0008]);
  const blockers: Blocker[] = [];
  const missing = normalizeProgression(support(fixture.tables, { unavailable: "HeroicTierSettings.Get() returned null", sourceFieldPath: "HeroicTierSettings.Get()" }), reference, entityNames, blockers);
  expect(missing.progressionFacts.some((row) => row.kind === "heroicTier")).toBe(false);
  expect(blockers.filter((row) => row.kind === "unavailable-progression-data").map((row) => row.key)).toEqual(["support:/heroicTierSettings"]);
});
