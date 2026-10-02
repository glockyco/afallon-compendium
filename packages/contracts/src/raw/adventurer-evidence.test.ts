import { expect, test } from "bun:test";
import { Assert } from "typebox/value";
import { schemaRegistry } from "../schema-registry";
import { CorruptionCaptureSchema, CorruptionCaptureV2Schema } from "./corruption";
import { AdventurerWorldSettingsSchema, CanonicalSchema, CanonicalV6Schema, RelationshipsV2Schema } from "./database";
import "./index";

const world = {
  asset: "AdventurerWorld", instanceCount: 1,
  roster: [101], arrivals: [{ npcId: 101, startingLevel: 5, joinAfterHours: 2 }],
  equipmentBands: [{ itemId: 20, minimumContentLevel: 3 }],
  equipmentRewardChance: 0.4, equipmentRewards: [20], kitUpgrades: [],
  jobRegionNames: [
    { name: "Coalway", sourceFieldPath: "Resources.LoadAll<AdventurerWorldSettings>(\"\")[0].JobRegionNames[0]" },
    { name: "Blackmire", sourceFieldPath: "Resources.LoadAll<AdventurerWorldSettings>(\"\")[0].JobRegionNames[1]" },
  ],
  maximumPresent: 10, minimumJobSeconds: 120, maximumJobSeconds: 360,
  experienceBarPerJob: 0.2, goldPerLevelPerJob: 4,
  sourceFieldPaths: {
    maximumPresent: "AdventurerWorldSettings.MaximumPresent",
    minimumJobSeconds: "AdventurerWorldSettings.MinimumJobSeconds",
    maximumJobSeconds: "AdventurerWorldSettings.MaximumJobSeconds",
    experienceBarPerJob: "AdventurerWorldSettings.ExperienceBarPerJob",
    goldPerLevelPerJob: "AdventurerWorldSettings.GoldPerLevelPerJob",
    equipmentRewardChance: "AdventurerWorldSettings.EquipmentRewardChance",
  },
};

const pet = {
  nativeId: 48, sourceFieldPath: "GameDatabase.GetEffects()[48]",
  effectType: { value: 14, name: "Pet", sourceFieldPath: "GameDatabase.GetEffects()[48].effectType" },
  duration: 20, endless: false,
  sourceFieldPaths: { duration: "GameDatabase.GetEffects()[48].duration", endless: "GameDatabase.GetEffects()[48].endless" },
  firstRank: { petNpcId: 101, petDuration: 120, petSpawnCount: 1,
    sourceFieldPath: "GameDatabase.GetEffects()[48].ranks[0]",
    sourceFieldPaths: {
      petNpcId: "GameDatabase.GetEffects()[48].ranks[0].petNPCDataID",
      petDuration: "GameDatabase.GetEffects()[48].ranks[0].petDuration",
      petSpawnCount: "GameDatabase.GetEffects()[48].ranks[0].petSPawnCount",
    },
  },
};

const finder = {
  supplyPackId: 5, enabledSceneIds: [10], sourceFieldPath: "DungeonFinderService.Instance.Settings.SupplyPack; GameDatabase.GetGameScenes().DungeonFinderEnabled",
  tankItemPowerShare: 0.6, tankGearPieces: 5,
  tankSourceFieldPaths: {
    tankItemPowerShare: "DungeonFinderService.Instance.Settings.TankItemPowerShare",
    tankGearPieces: "DungeonFinderService.Instance.Settings.TankGearPieces",
  },
};

test("world settings preserve ordered regions and authored numeric sources without inventing missing settings", () => {
  expect(() => Assert(AdventurerWorldSettingsSchema, world)).not.toThrow();
  expect(() => Assert(AdventurerWorldSettingsSchema, { unavailable: "No settings asset", sourceFieldPath: "Resources.LoadAll<AdventurerWorldSettings>(\"\")[0]", assetCount: 0 })).not.toThrow();
  expect(() => Assert(AdventurerWorldSettingsSchema, { ...world, jobRegionNames: { unavailable: "No regions", sourceFieldPath: "AdventurerWorldSettings.JobRegionNames" } })).not.toThrow();
  expect(() => Assert(AdventurerWorldSettingsSchema, { ...world, jobRegionNames: [world.jobRegionNames[0], { name: "Blackmire" }] })).toThrow();
  expect(() => Assert(AdventurerWorldSettingsSchema, { ...world, sourceFieldPaths: { ...world.sourceFieldPaths, maximumPresent: undefined } })).toThrow();
  expect(() => Assert(AdventurerWorldSettingsSchema, { unavailable: "No settings asset", sourceFieldPath: "Asset" })).toThrow();
});

test("invite pet facts require source paths and preserve unavailable ranks and records", () => {
  const schema = CanonicalSchema.properties.petEffects;
  expect(() => Assert(schema, [pet, { nativeId: 49, sourceFieldPath: "GameDatabase.GetEffects()[49]", unavailable: "Missing effect" },
    { ...pet, nativeId: 50, firstRank: { unavailable: "No rank", sourceFieldPath: "GameDatabase.GetEffects()[50].ranks[0]" } }])).not.toThrow();
  expect(() => Assert(schema, [{ ...pet, firstRank: { ...pet.firstRank, sourceFieldPaths: { petDuration: "Rank.petDuration" } } }])).toThrow();
  expect(() => Assert(schema, [{ ...pet, effectType: { value: 14, name: "Pet" } }])).toThrow();
});

test("finder settings require both tank values and provenance, or an explicit unavailable issue", () => {
  const schema = CorruptionCaptureSchema.properties.dungeonFinder;
  expect(() => Assert(schema, finder)).not.toThrow();
  expect(() => Assert(schema, { unavailable: "No finder settings", sourceFieldPath: "DungeonFinderService.Instance.Settings", assetCount: 0 })).not.toThrow();
  expect(() => Assert(schema, { ...finder, tankSourceFieldPaths: { tankGearPieces: "Finder.TankGearPieces" } })).toThrow();
  expect(() => Assert(schema, { ...finder, tankGearPieces: null })).toThrow();
});

test("historical schema versions retain their original shapes", () => {
  for (const id of ["compendium.canonical.v6", "compendium.canonical.v7", "compendium.relationships.v2", "compendium.relationships.v3", "compendium.corruption-capture.v2", "compendium.corruption-capture.v3"]) {
    expect(schemaRegistry.require(id).id).toBe(id);
  }
  expect(() => Assert(RelationshipsV2Schema.properties.adventurerWorldSettings, (({ jobRegionNames, maximumPresent, minimumJobSeconds, maximumJobSeconds, experienceBarPerJob, goldPerLevelPerJob, sourceFieldPaths, ...old }) => old)(world))).not.toThrow();
  expect(() => Assert(CorruptionCaptureV2Schema.properties.dungeonFinder, (({ tankItemPowerShare, tankGearPieces, tankSourceFieldPaths, ...old }) => old)(finder))).not.toThrow();
  expect("petEffects" in CanonicalV6Schema.properties).toBe(false);
});
