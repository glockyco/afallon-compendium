import { describe, expect, test } from "bun:test";
import { Database } from "bun:sqlite";
import type { Canonical, CorruptionCapture } from "@afallon/contracts";
import type { NormalizedEntity } from "@afallon/contracts/catalog";
import { normalizeCorruption } from "./corruption";
import { queryChallengeStoneRoutes } from "./queries";
import type { SceneContext, SourceRecord } from "./context";

const hash = "a".repeat(64);
const entities = [
  ["stats", 0, "Health"], ["stats", 27, "Strength"], ["stats", 53, "Item power"],
  ["items", 162, "Heart of corruption"], ["items", 564, "Corruption Token"],
  ["scenes", 25, "Duskfall Depths"], ["npcs", 286, "Kraath"], ["lootTables", 114, "Kraath loot"],
].map(([kind, nativeId, name]) => ({ entityKey: `${kind}:${nativeId}`, kind, nativeId, name })) as NormalizedEntity[];
const canonical = { items: [
  { nativeId: 162, name: "Heart of corruption", internalName: "Heart of corruption", gameplay: { isCorruptionToken: false } },
  { nativeId: 564, name: "Corruption Token", internalName: "Corruption Token", gameplay: { isCorruptionToken: true } },
] } as unknown as Canonical;
const capture: CorruptionCapture = {
  schemaVersion: "compendium.corruption-capture.v3",
  combat: { maxLevel: 30, gearAllStatsPercentPerLevel: 5, sourceFieldPath: "GameDatabase.CombatSettings",
    gearStatBonuses: [
      { statId: 0, amountPerLevel: 15, isPercent: true, sourceFieldPath: "Combat.GearBonuses[0]" },
      { statId: 53, amountPerLevel: 5, isPercent: false, sourceFieldPath: "Combat.GearBonuses[1]" },
    ], mobStatBonuses: [{ statId: 27, amountPerLevel: 10, isPercent: true, sourceFieldPath: "Combat.MobBonuses[0]" }] },
  affixSettings: { affixesPerToken: 3, disabledAffixes: [], npcRequirements: [{ id: 6, npcId: -1, sourceFieldPath: "Affix.SpitefulNpcID" }], sourceFieldPath: "Affix.Settings" },
  affixes: [{ id: 6, name: "Spiteful", description: "A vengeful ghost.", sourceFieldPath: "Affix[6]" }, { id: 14, name: "Skittish", description: "Enemies switch targets.", sourceFieldPath: "Affix[14]" }],
  timer: { scenePath: "Duskfall.unity", sourceFieldPath: "Duskfall.unity/DungeonTimerManager", totalSeconds: 800, firstRemainingSeconds: 500,
    secondRemainingSeconds: 300, maxLootItems: 3, bosses: [{ id: 286, sourceFieldPath: "Timer.BossNPCs[0]" }],
    lootTables: [{ id: 114, sourceFieldPath: "Timer.LootTables[0]" }], token: { id: 564, sourceFieldPath: "Timer.CorruptionTokenItem" } },
  dungeonFinder: { supplyPackId: 418, enabledSceneIds: [25], sourceFieldPath: "DungeonFinderService.Instance.Settings.SupplyPack",
    tankItemPowerShare: 0.6, tankGearPieces: 4, tankSourceFieldPaths: { tankItemPowerShare: "DungeonFinderService.Instance.Settings.TankItemPowerShare", tankGearPieces: "DungeonFinderService.Instance.Settings.TankGearPieces" } },
};
const source = (value: CorruptionCapture): SourceRecord => ({ kind: "compendium.corruption-capture.v3", value,
  reference: { path: "objects/sha256/aa/" + hash.slice(2), sha256: hash }, key: "corruption", bytes: 1, runId: "run", targetIdentity: "build-scene:25", origins: [] });
const context = { scenePath: "Duskfall.unity", sceneNativeId: 25, world: { interactions: [] } } as unknown as SceneContext;
const copy = (): CorruptionCapture => structuredClone(capture);

const normalize = (value: CorruptionCapture, others: SourceRecord[] = []) => normalizeCorruption([source(value), ...others], [context], canonical, entities);

describe("build-specific corruption facts", () => {
  test("retains distinct matching percent and flat stat bonuses with stat names and remaining-time semantics", () => {
    const facts = normalize(copy())!;
    expect(facts.maxLevel).toBe(30);
    expect(facts.gearStatBonuses).toEqual([
      { stat: { entityKey: "stats:0", label: "Health" }, amountPerLevel: 15, isPercent: true, sourceFieldPath: "Combat.GearBonuses[0]" },
      { stat: { entityKey: "stats:53", label: "Item power" }, amountPerLevel: 5, isPercent: false, sourceFieldPath: "Combat.GearBonuses[1]" },
    ]);
    expect(facts.mobStatBonuses?.[0]?.stat.label).toBe("Strength");
    expect(facts.affixes?.map(affix => [affix.name, affix.available])).toEqual([["Spiteful", false], ["Skittish", true]]);
    expect(facts.dungeons[0]).toMatchObject({ scene: { entityKey: "scenes:25" }, totalSeconds: 800, firstRemainingSeconds: 500,
      secondRemainingSeconds: 300, maxLootItems: 3, bosses: [{ entityKey: "npcs:286" }], lootTables: [{ entityKey: "lootTables:114" }], token: { entityKey: "items:564" } });
    expect(facts.dungeons[0]?.provenance[0]?.pointer).toBe("/timer");
    expect(facts.provenance.map(proof => proof.pointer)).toEqual(["/combat", "/affixSettings", "/affixes"]);
    expect(facts.heart?.entityKey).toBe("items:162");
    expect(facts.token?.entityKey).toBe("items:564");
    expect(facts.heartRequirements).toBeNull();
  });
  test("keeps unavailable settings and bonus lists null rather than implying zero", () => {
    const absent = copy();
    absent.combat = { maxLevel: null, gearAllStatsPercentPerLevel: null, gearStatBonuses: null, mobStatBonuses: null, sourceFieldPath: "GameDatabase.CombatSettings" };
    absent.affixSettings = { affixesPerToken: null, disabledAffixes: null, npcRequirements: null, sourceFieldPath: "Affix.Settings" };
    absent.timer = null;
    expect(normalize(absent)).toMatchObject({ maxLevel: null, gearAllStatsPercentPerLevel: null, gearStatBonuses: null, mobStatBonuses: null, affixesPerToken: null, affixes: null, dungeons: [] });
    expect(normalizeCorruption([], [context], canonical, entities)).toBeNull();
  });
  test("rejects invalid thresholds, unknown stats, non-token rewards and contradictory captures", () => {
    const invalid = copy(); invalid.timer!.firstRemainingSeconds = 900;
    expect(() => normalize(invalid)).toThrow("invalid remaining-time thresholds");
    invalid.timer!.firstRemainingSeconds = 500; invalid.combat.gearStatBonuses![0]!.statId = 404;
    expect(() => normalize(invalid)).toThrow("missing stats:404");
    invalid.combat.gearStatBonuses![0]!.statId = 0; invalid.timer!.token = { id: 162, sourceFieldPath: "Timer.CorruptionTokenItem" };
    expect(() => normalize(invalid)).toThrow("non-token reward item");
    const differing = copy(); differing.combat.gearAllStatsPercentPerLevel = 7;
    expect(() => normalize(copy(), [source(differing)])).toThrow("Conflicting corruption combat settings");
  });
  test("links only mandatory consumed Heart requirements at challenge stones to their source", () => {
    const requirement = { requirementType: "Item", itemID: 162, conditionRule: "Mandatory", amount1: 1, consume: true, sourceFieldPath: "InteractableObject[0].RequirementsTemplate.groups[0].requirements[0]" };
    const sourceEvidence = { family: "interactableObject", source: { componentInstanceId: 928, source: { hierarchyPath: "Challenge stone poison sellect/Interactable" } },
      requirementsTemplate: { groups: [{ requirements: [requirement] }] } };
    const world = { interactions: [sourceEvidence] };
    const challenge = { ...context, world, sourceByComponent: new Map([[928, { sourceId: "source:challenge:poison" }]]),
      worldReference: { path: "objects/sha256/bb", sha256: "b".repeat(64) } } as unknown as SceneContext;
    const result = normalizeCorruption([source(copy())], [context, challenge], canonical, entities)!;
    expect(result.heartRequirements).toEqual([{
      sourceId: "source:challenge:poison", place: { entityKey: "scenes:25", label: "Duskfall Depths" }, count: 1, consume: true,
      sourceFieldPath: requirement.sourceFieldPath, provenance: [{ path: "objects/sha256/bb", sha256: "b".repeat(64), pointer: "/interactions/0/requirementsTemplate" }],
    }]);
    const changedRequirement = { ...requirement, sourceFieldPath: "InteractableObject[7].RequirementsTemplate.groups[0].requirements[0]" };
    const rescanned = { ...challenge, world: { interactions: [{
      ...sourceEvidence, requirementsTemplate: { groups: [{ requirements: [changedRequirement] }] },
    }] }, worldReference: { path: "objects/sha256/cc", sha256: "c".repeat(64) } } as unknown as SceneContext;
    const repeated = normalizeCorruption([source(copy())], [context, challenge, rescanned], canonical, entities)!;
    expect(repeated.heartRequirements).toHaveLength(1);
    expect(repeated.heartRequirements?.[0]?.provenance).toHaveLength(2);
    changedRequirement.amount1 = 2;
    expect(() => normalizeCorruption([source(copy())], [context, challenge, rescanned], canonical, entities)).toThrow("Conflicting Heart requirement");
    requirement.consume = false;
    expect(() => normalizeCorruption([source(copy())], [context, challenge], canonical, entities)).toThrow("Malformed Heart challenge-stone requirement");
  });
});

test("Heart-gated stone includes its matched action teleports but excludes copied prefab and sibling routes", () => {
  const db = new Database(":memory:");
  try {
    db.exec("CREATE TABLE source_identities (source_id TEXT, placement_id TEXT); CREATE TABLE source_details (source_id TEXT, family TEXT, data_json TEXT); CREATE TABLE transitions (source_id TEXT, transition_id TEXT, transition_kind TEXT, destination_scene_entity_key TEXT); CREATE TABLE canonical_entities (entity_key TEXT, name TEXT)");
    const source = db.query("INSERT INTO source_details (source_id, family, data_json) VALUES (?, 'interactableObject', ?)");
    const path = (hierarchyPath: string) => JSON.stringify({ source: { source: { hierarchyPath } } });
    const root = "World/Coalway woods[1]/Challenge stone pyromancer[0]";
    db.query("INSERT INTO source_identities (source_id, placement_id) VALUES (?, ?)").run("parent", "stone-placement");
    source.run("parent", path(root));
    for (const [sourceId, hierarchyPath, destination, kind] of [
      ["normal", `${root}/AltarBowl inactive[0]/Entrance`, "Challenge stone Pyromancer", "effect-teleport"],
      ["corrupted", `${root}/AltarBowl active[1]/Entrance`, "Challenge stone Pyromancer corrupted", "effect-teleport"],
      ["copied", `${root}/AltarBowl active[1]/Copied action`, "Challenge stone poison corrupted", "effect-teleport"],
      ["generic", `${root}/AltarBowl inactive[0]/Copied action`, "Challenge stone poison", "game-action-teleport"],
      ["prefix", "World/Coalway woods[1]/Challenge stone pyromancer extra[0]/AltarBowl inactive[0]/Entrance", "Challenge stone poison", "effect-teleport"],
      ["sibling", "World/Coalway woods[1]/Challenge stone poison[0]/AltarBowl inactive[0]/Entrance", "Challenge stone poison", "effect-teleport"],
    ] as const) {
      source.run(sourceId, path(hierarchyPath));
      db.query("INSERT INTO canonical_entities (entity_key, name) VALUES (?, ?)").run(`scenes:${sourceId}`, destination);
      db.query("INSERT INTO transitions (source_id, transition_id, transition_kind, destination_scene_entity_key) VALUES (?, ?, ?, ?)").run(sourceId, sourceId, kind, `scenes:${sourceId}`);
    }
    const [route] = queryChallengeStoneRoutes(db, ["parent"]);
    expect(route).toEqual({ sourceId: "parent", placementId: "stone-placement",
      stoneName: "Challenge Stone Pyromancer", regionName: "Coalway Woods", transitionIds: ["normal", "corrupted"] });
  } finally {
    db.close();
  }
});
