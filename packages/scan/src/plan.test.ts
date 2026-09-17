import { expect, test } from "bun:test";
import type { ScanPlan } from "@afallon/contracts";
import { validateScanPlan, validateScanPlanStructure, type ScanTargetIndex } from "./plan";

const inventory: ScanTargetIndex = {
  sceneNativeIds: new Set([3, 7]),
  streamedSourceKeysByScene: new Map([[7, new Set(["forest/encounters"])]]),
};

const requested: ScanPlan = {
  schemaVersion: "compendium.scan-plan.v1",
  targetTimeoutMs: 30_000,
  targets: [
    { kind: "current-scene" },
    { kind: "build-scene", sceneNativeId: 7 },
    { kind: "streamed-source", sceneNativeId: 7, sourceKey: "forest/encounters" },
  ],
};

test("discovery admission preserves order and rejects unresolved targets", () => {
  const plan = validateScanPlan(requested, inventory);
  expect(plan.targets.map(target => target.kind)).toEqual(["current-scene", "build-scene", "streamed-source"]);
  expect(() => validateScanPlan({ ...plan, targets: [{ kind: "build-scene", sceneNativeId: 99 }] }, inventory)).toThrow();
  expect(() => validateScanPlan({ ...plan, targets: [{ kind: "streamed-source", sceneNativeId: 7, sourceKey: "missing" }] }, inventory)).toThrow();
});

test("structural rejection requires no runtime inventory", () => {
  expect(() => validateScanPlanStructure({ ...requested, targets: [{ kind: "future-target" }] })).toThrow();
  expect(() => validateScanPlanStructure({ ...requested, targets: [{ kind: "current-scene" }, { kind: "current-scene" }] })).toThrow();
  expect(validateScanPlanStructure(requested).targets).toEqual(requested.targets);
});
