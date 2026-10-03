import { expect, test } from "bun:test";
import { ArtworkSchema, decodeContract, schemaRegistry, SupportSchema, SupportV4Schema } from "@afallon/contracts";
import { admittedArtifactSchema, requiredTargetArtifact } from "./evidence";

const support = (version: "v1" | "v2" | "v3" | "v4" | "v5") => ({ family: "relationships" as const, name: "support.json", schema: { id: `compendium.support.${version}`, sha256: schemaRegistry.require(`compendium.support.${version}`).sha256 } });

test("canonical targets accept current health-stat evidence and reviewed v4 scans", () => {
  expect(requiredTargetArtifact({ targetIdentity: "build-scene:44", artifacts: [support("v5")] }, "relationships", "compendium.support.v5").schema.id).toBe("compendium.support.v5");
  expect(admittedArtifactSchema("build-scene:44", support("v4")).schema).toBe(schemaRegistry.require("compendium.support.v4").schema);
});

test("scene scans keep earlier support evidence admissible", () => {
  expect(admittedArtifactSchema("build-scene:1", support("v1")).schema).toBe(schemaRegistry.require("compendium.support.v1").schema);
  expect(admittedArtifactSchema("build-scene:44", support("v2")).schema).toBe(schemaRegistry.require("compendium.support.v2").schema);
  expect(admittedArtifactSchema("build-scene:44", support("v3")).schema).toBe(schemaRegistry.require("compendium.support.v3").schema);
  expect(() => admittedArtifactSchema("build-scene:44", { ...support("v4"), schema: { id: "compendium.support.v4", sha256: "0".repeat(64) } })).toThrow("incompatible schema identity");
});

test("v4 support tables keep a null record as an unavailable row", () => {
  const entry = { sourceKey: 3, entry: { nativeId: 3, name: "Stun", internalName: "Stun" } };
  const heroicTierSettings = { unavailable: "HeroicTierSettings.Get() returned null", sourceFieldPath: "HeroicTierSettings.Get()" };
  const document = (row: unknown) => ({ schemaVersion: "compendium.support.v4", language: "en", requirementIssues: [], sourceTotals: { effects: 2 }, tables: { effects: [entry, row] }, heroicTierSettings });
  expect(decodeContract(SupportV4Schema, document({ sourceKey: 4, unavailable: "null record", sourceFieldPath: "GameDatabase.Effects[4]" }), { objectId: "fixture", target: "support" }).tables.effects).toHaveLength(2);
  expect(() => decodeContract(SupportV4Schema, document({ sourceKey: 4 }), { objectId: "fixture", target: "support" })).toThrow();
});

test("new support requires the configured health stat rather than assuming a native id", () => {
  const source = { schemaVersion: "compendium.support.v5", language: "en", requirementIssues: [], sourceTotals: {}, tables: {}, heroicTierSettings: { unavailable: "No settings", sourceFieldPath: "HeroicTierSettings.Get()" }, healthStatId: 0 };
  expect(decodeContract(SupportSchema, source, { objectId: "fixture", target: "support" }).healthStatId).toBe(0);
  expect(() => decodeContract(SupportSchema, { ...source, healthStatId: undefined }, { objectId: "fixture", target: "support" })).toThrow();
});

test("artwork evidence retains absent tree and bonus sprites with their source records", () => {
  const records = [
    { family: "talentTrees", nativeId: 4, role: "icon", sourceName: "Guardian", sourceFieldPath: "talentTrees[4].entryIcon", status: "missing", reason: "The record references no sprite.", image: null },
    { family: "bonuses", nativeId: 7, role: "icon", sourceName: "Talent", sourceFieldPath: "bonuses[7].entryIcon", status: "unsupported", reason: "Texture cannot be read.", image: null },
  ];
  const document = { schemaVersion: "compendium.artwork.v1", frame: 1, totals: { extracted: 0, missing: 1, unsupported: 1, families: { talentTrees: 1, bonuses: 1 } }, records };
  const decoded = decodeContract(ArtworkSchema, document, { objectId: "fixture", target: "artwork" });
  expect(decoded.records.map(({ family, nativeId, status, image }) => ({ family, nativeId, status, image }))).toEqual([
    { family: "talentTrees", nativeId: 4, status: "missing", image: null },
    { family: "bonuses", nativeId: 7, status: "unsupported", image: null },
  ]);
  expect(() => decodeContract(ArtworkSchema, { ...document, records: [{ ...records[0], image: { sha256: "invalid", bytes: 4, width: 2, height: 2, file: "artwork/bad.png" } }] }, { objectId: "fixture", target: "artwork" })).toThrow();
});
