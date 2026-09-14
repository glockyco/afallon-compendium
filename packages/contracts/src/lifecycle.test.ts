import { expect, test } from "bun:test";
import { Assert } from "typebox/value";
import {
  CompendiumConfigInputSchema,
  LatestSuccessPointerSchema,
  RunManifestSchema,
} from "./lifecycle";

const input = {
  buildId: "25153357",
  toolRevision: "test",
  command: "capture",
  settings: {},
  inputHashes: {},
};

test("configuration contract rejects unknown fields", () => {
  expect(() => Assert(CompendiumConfigInputSchema, {
    gamePath: "game",
    outputRoot: "output",
    runtimeOutputRoot: "Z:/output",
    hotreplUrl: "ws://127.0.0.1:8000",
    character: "Tester",
    finalSceneNativeId: 1,
    finalScenePath: "Scene",
    unsupported: true,
  })).toThrow();
});

test("run manifest contract rejects invalid artifact hashes", () => {
  expect(() => Assert(RunManifestSchema, {
    schemaVersion: 1,
    runId: "run",
    input,
    timestamps: {
      createdAt: "2026-01-01T00:00:00.000Z",
      startedAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
      completedAt: null,
    },
    status: "running",
    artifacts: [{ path: "artifact.json", bytes: 1, sha256: "invalid" }],
    failure: null,
  })).toThrow();
});

test("latest-success contract requires selection provenance", () => {
  expect(() => Assert(LatestSuccessPointerSchema, {
    schemaVersion: 1,
    buildId: input.buildId,
    command: input.command,
    runId: "run",
    status: "succeeded",
    manifestPath: "manifest.json",
    directory: "run",
  })).toThrow();
});
