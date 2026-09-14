import { expect, test } from "bun:test";
import { collectorApplicability, validateScanPlan, type ScanTargetIndex } from "./plan";

const inventory: ScanTargetIndex = {
  sceneNativeIds: new Set([3, 7]),
  streamedSourceKeysByScene: new Map([[7, new Set(["forest/encounters"])]]),
};

test("scan validation preserves target order and rejects unresolved targets", () => {
  const plan = validateScanPlan({
    schemaVersion: "compendium.scan-plan.v1",
    targetTimeoutMs: 30_000,
    targets: [
      { kind: "current-scene" },
      { kind: "build-scene", sceneNativeId: 7 },
      { kind: "streamed-source", sceneNativeId: 7, sourceKey: "forest/encounters" },
    ],
  }, inventory);
  expect(plan.targets.map(target => target.kind)).toEqual(["current-scene", "build-scene", "streamed-source"]);

  expect(() => validateScanPlan({ ...plan, targets: [{ kind: "future-target" }] }, inventory)).toThrow("compendium.scan-plan.v1");
  expect(() => validateScanPlan({ ...plan, targets: [{ kind: "build-scene", sceneNativeId: 99 }] }, inventory)).toThrow("unknown build scene 99");
  expect(() => validateScanPlan({ ...plan, targets: [{ kind: "streamed-source", sceneNativeId: 7, sourceKey: "missing" }] }, inventory)).toThrow("unknown streamed source");
  expect(() => validateScanPlan({ ...plan, targets: [{ kind: "current-scene" }, { kind: "current-scene" }] }, inventory)).toThrow("repeats target current-scene");
});

test("streamed-source applicability records evidence-backed omissions", () => {
  const dispositions = collectorApplicability({ kind: "streamed-source", sceneNativeId: 7, sourceKey: "forest/encounters" });
  expect(dispositions.find(row => row.family === "inventory")).toEqual({
    family: "inventory",
    status: "not-applicable",
    evidence: "Loaded-scene inventory describes the parent scene; the requested streamed source is already bound by its discovery record.",
  });
  expect(dispositions.every(row => row.evidence.length > 0)).toBe(true);
});
