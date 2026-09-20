import { expect, test } from "bun:test";
import {
  UPDATE_CHECK_AREAS,
  UPDATE_RISK_AREAS,
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
    schemaVersion: "compendium.update-report.v1",
    releaseVersion: "0.16.2",
    recordedAt: "2026-09-20T12:00:00.000Z",
    previous: { buildId: "25153357", inputHashes: { metadata: "1".repeat(64) } },
    current: { buildId: currentBuild, inputHashes: { metadata: "2".repeat(64) } },
    artifacts: {
      updateReceipt: pointer(),
      schemaSnapshot: pointer(),
      buildComparison: pointer(),
      scans: [pointer()],
      reviewedInputs: [pointer()],
      catalog: pointer(),
      publication: pointer(),
    },
    checks: UPDATE_CHECK_AREAS.map(area => ({ area, passed: true, detail: `${area} passed.`, evidence: [pointer()] })),
    risks: UPDATE_RISK_AREAS.map(area => ({ area, disposition: "supported-unchanged", detail: `${area} reviewed.`, evidence: [pointer()] })),
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
