import { expect, test } from "bun:test";
import { blockingIssues } from "./capture-readiness";
import type { CaptureGeometry } from "@afallon/contracts"

test("an authored content defect never blocks readiness, an inventory integrity failure does", () => {
  const geometry = {
    issues: [
      { kind: "missing-material", sourceId: -2305742, detail: "Selected mesh renderer has a missing shared material at slot 3." },
      { kind: "missing-terrain", sourceId: 17, detail: "Terrain.terrainData is missing." },
      { kind: "source-integrity", sourceId: 9, detail: "Renderer.bounds could not be read." },
    ],
  } as unknown as CaptureGeometry;
  expect(blockingIssues(geometry).map(issue => issue.kind)).toEqual(["source-integrity"]);
});
