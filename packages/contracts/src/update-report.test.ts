import { expect, test } from "bun:test";
import {
  UPDATE_CHECK_AREAS,
  validateUpdateReport,
  type UpdateEvidencePointer,
  type UpdateReport,
} from "./update-report";

const currentBuild = "25419293";

function pointer(buildId = currentBuild, seed = "a"): UpdateEvidencePointer {
  return { buildId, content: { sha256: seed.repeat(64), bytes: 1 }, runId: `run-${seed}`, artifact: `${seed}.json` };
}

function report(): UpdateReport {
  return {
    schemaVersion: "compendium.update-report.v2",
    releaseVersion: "0.16.2",
    recordedAt: "2026-09-20T12:00:00.000Z",
    previous: { buildId: "25153357", inputHashes: { metadata: "1".repeat(64) } },
    current: { buildId: currentBuild, inputHashes: { metadata: "2".repeat(64) } },
    artifacts: {
      updateReceipt: pointer(),
      releaseNotes: pointer(),
      schemaSnapshot: pointer(),
      buildComparison: pointer(),
      scans: [pointer()],
      reviewedInputs: [pointer()],
      catalog: pointer(),
      publication: pointer(),
    },
    checks: UPDATE_CHECK_AREAS.map(area => ({ area, passed: true, detail: `${area} passed.`, evidence: [pointer()] })),
    risks: ["teleport-loading", "quest-hand-ins"].map(area => ({ area, disposition: "supported-unchanged", detail: `${area} reviewed.`, evidence: [pointer()] })),
  };
}

test("accepts a complete current-build update report", () => {
  const value = report();
  expect(validateUpdateReport(value)).toBe(value);
});

test("rejects duplicate risk dispositions", () => {
  const value = report();
  value.risks[value.risks.length - 1] = { ...value.risks[0]! };
  expect(() => validateUpdateReport(value)).toThrow("Update report repeats a risk disposition.");
});

test("rejects prior-build evidence in a current-build section", () => {
  const value = report();
  value.artifacts.reviewedInputs = [pointer("25153357", "b")];
  expect(() => validateUpdateReport(value)).toThrow("Update report mixes build 25153357 evidence into current build 25419293.");
});

test("rejects a risk area that is not a kebab-case name", () => {
  const value = report();
  value.risks[0] = { ...value.risks[0]!, area: "Teleport loading" };
  expect(() => validateUpdateReport(value)).toThrow();
});

test("rejects release notes from another build", () => {
  const value = report();
  value.artifacts.releaseNotes = pointer("25153357", "c");
  expect(() => validateUpdateReport(value)).toThrow("Update report mixes build 25153357 evidence into current build 25419293.");
});
