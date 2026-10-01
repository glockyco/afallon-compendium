import { expect, test } from "bun:test";
import { decodeContract, schemaRegistry, SupportSchema } from "@afallon/contracts";
import { admittedArtifactSchema, requiredTargetArtifact } from "./evidence";

const support = (version: "v1" | "v2" | "v3" | "v4") => ({ family: "relationships" as const, name: "support.json", schema: { id: `compendium.support.${version}`, sha256: schemaRegistry.require(`compendium.support.${version}`).sha256 } });

test("the canonical target must supply v4 support evidence", () => {
  expect(() => requiredTargetArtifact({ targetIdentity: "build-scene:44", artifacts: [support("v3")] }, "relationships", "compendium.support.v4"))
    .toThrow("Target build-scene:44/relationships requires exactly one compendium.support.v4; found 0.");
  expect(requiredTargetArtifact({ targetIdentity: "build-scene:44", artifacts: [support("v4")] }, "relationships", "compendium.support.v4").schema.id).toBe("compendium.support.v4");
});

test("scene scans keep their v1-v3 support evidence admissible", () => {
  expect(admittedArtifactSchema("build-scene:1", support("v1")).schema).toBe(schemaRegistry.require("compendium.support.v1").schema);
  expect(admittedArtifactSchema("build-scene:44", support("v2")).schema).toBe(schemaRegistry.require("compendium.support.v2").schema);
  expect(admittedArtifactSchema("build-scene:44", support("v3")).schema).toBe(schemaRegistry.require("compendium.support.v3").schema);
  expect(() => admittedArtifactSchema("build-scene:44", { ...support("v4"), schema: { id: "compendium.support.v4", sha256: "0".repeat(64) } })).toThrow("incompatible schema identity");
});

test("v4 support tables keep a null record as an unavailable row", () => {
  const entry = { sourceKey: 3, entry: { nativeId: 3, name: "Stun", internalName: "Stun" } };
  const heroicTierSettings = { unavailable: "HeroicTierSettings.Get() returned null", sourceFieldPath: "HeroicTierSettings.Get()" };
  const document = (row: unknown) => ({ schemaVersion: "compendium.support.v4", language: "en", requirementIssues: [], sourceTotals: { effects: 2 }, tables: { effects: [entry, row] }, heroicTierSettings });
  expect(decodeContract(SupportSchema, document({ sourceKey: 4, unavailable: "null record", sourceFieldPath: "GameDatabase.Effects[4]" }), { objectId: "fixture", target: "support" }).tables.effects).toHaveLength(2);
  expect(() => decodeContract(SupportSchema, document({ sourceKey: 4 }), { objectId: "fixture", target: "support" })).toThrow();
});
