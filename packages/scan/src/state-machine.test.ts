import { expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { SCAN_COLLECTOR_FAMILIES, validateScanTargetEnvelope, type RuntimeScanState, type ScanEvidenceArtifact } from "@afallon/contracts";
import { AttributedScanTargetError, ScanStateMachine, type ScanStateReader } from "./state-machine";

const state: RuntimeScanState = {
  schemaVersion: "compendium.runtime-scan-state.v1",
  frame: 100,
  character: "AtlasSurvey",
  scene: { name: "Coalway woods", path: "Assets/SCENES/Coalway woods.unity", handle: 3, isLoaded: true },
  gameSceneNativeId: 3,
  position: { x: 1, y: 2, z: 3 },
  rotation: { x: 0, y: 0, z: 0, w: 1 },
};

const evidence: ScanEvidenceArtifact[] = SCAN_COLLECTOR_FAMILIES.map(family => ({
  family, name: family, schema: { id: `fixture.${family}.v1`, sha256: "a".repeat(64) },
  content: { sha256: "b".repeat(64), bytes: 1 }, observationContext: { sha256: "c".repeat(64), bytes: 1 }, inputs: [], authoredIdentities: [],
}));
const collectEvidence = async () => evidence;

class SequenceStateReader implements ScanStateReader {
  #index = 0;
  constructor(private readonly states: readonly RuntimeScanState[]) {}
  async read(): Promise<RuntimeScanState> {
    const value = this.states[this.#index++];
    if (value === undefined) throw new Error("State fixture exhausted.");
    return structuredClone(value);
  }
}

test("current-scene scan emits a common envelope without changing runtime state", async () => {
  const root = await mkdtemp(join(tmpdir(), "afallon-current-scan-"));
  try {
    const completed = { ...state, frame: 101 };
    const scanner = new ScanStateMachine({ buildId: "25153357", sourceRunId: "fixture-run", character: "AtlasSurvey", outputDirectory: root, stateReader: new SequenceStateReader([state, completed]) });
    const envelope = await scanner.scanCurrentScene(0, collectEvidence);
    expect(envelope.outcome).toBe("succeeded");
    expect(envelope.target).toEqual({ kind: "current-scene" });
    expect(envelope.observation).toEqual({ started: state, completed });
    expect(await Bun.file(join(root, "target-0", "envelope.json")).json()).toEqual(envelope);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("build-scene targets use the shared envelope after restoration", async () => {
  const root = await mkdtemp(join(tmpdir(), "afallon-build-scan-"));
  try {
    let visited = false;
    const visitor = {
      async visit(sceneNativeId: number, _outputDirectory: string, collect: () => Promise<void>): Promise<void> {
        expect(sceneNativeId).toBe(7);
        visited = true;
        await collect();
      },
    };
    const scanner = new ScanStateMachine({ buildId: "25153357", sourceRunId: "fixture-run", character: "AtlasSurvey", outputDirectory: root, stateReader: new SequenceStateReader([state, { ...state, frame: 120 }]) });
    const envelope = await scanner.scanBuildScene({ kind: "build-scene", sceneNativeId: 7 }, 2, visitor, collectEvidence);
    expect(visited).toBe(true);
    expect(envelope.targetIdentity).toBe("build-scene:7");
    expect(envelope.outcome).toBe("succeeded");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("streamed-source outcomes retain source evidence", async () => {
  const root = await mkdtemp(join(tmpdir(), "afallon-stream-outcomes-"));
  const target = { kind: "streamed-source", sceneNativeId: 3, sourceKey: "forest/encounters" } as const;
  const evidence = { sceneNativeId: 3, sourceKey: target.sourceKey, loaderInstanceId: 42, assetGuid: "abc", runtimeKey: "forest/encounters", disposition: "observed", detail: "fixture discovery evidence" };
  try {
    for (const outcome of ["succeeded", "unsupported", "unreachable"] as const) {
      const scanner = new ScanStateMachine({ buildId: "25153357", sourceRunId: "fixture-run", character: "AtlasSurvey", outputDirectory: root, stateReader: new SequenceStateReader([state, { ...state, frame: state.frame + 1 }]) });
      const envelope = await scanner.scanStreamedSource(target, 0, { async visit(_target, _started, _directory, collect) { if (outcome === "succeeded") await collect(); return { outcome, sourceEvidence: { ...evidence, disposition: outcome } }; } }, collectEvidence);
      expect(envelope.outcome).toBe(outcome);
      expect(envelope.sourceEvidence?.sourceKey).toBe(target.sourceKey);
    }
    const failedScanner = new ScanStateMachine({ buildId: "25153357", sourceRunId: "fixture-run", character: "AtlasSurvey", outputDirectory: root, stateReader: new SequenceStateReader([state, { ...state, frame: state.frame + 1 }]) });
    const failed = await failedScanner.scanStreamedSource(target, 1, { async visit() { throw new AttributedScanTargetError("collector failed", { ...evidence, disposition: "failed" }); } }, collectEvidence);
    expect(failed.outcome).toBe("failed");
    expect(failed.sourceEvidence?.disposition).toBe("failed");
    const skipped = await failedScanner.notAttempted(target, 2, { ...evidence, disposition: "not-attempted" }, "A prior target failed.");
    expect(skipped.outcome).toBe("not-attempted");
    expect(skipped.sourceEvidence?.disposition).toBe("not-attempted");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("envelope admission permits distinct family artifacts and rejects ambiguous references", async () => {
  const root = await mkdtemp(join(tmpdir(), "afallon-envelope-admission-"));
  try {
    const scanner = new ScanStateMachine({ buildId: "25153357", sourceRunId: "fixture-run", character: "AtlasSurvey", outputDirectory: root, stateReader: new SequenceStateReader([state, { ...state, frame: 101 }]) });
    const envelope = await scanner.scanCurrentScene(0, collectEvidence);
    const additional = { ...evidence[0]!, name: "second-canonical-object" };
    expect(validateScanTargetEnvelope({ ...envelope, artifacts: [...envelope.artifacts, additional] }).artifacts.at(-1)).toEqual(additional);
    expect(() => validateScanTargetEnvelope({ ...envelope, artifacts: [...envelope.artifacts, envelope.artifacts[0]!] })).toThrow();
    expect(() => validateScanTargetEnvelope({ ...envelope, collectors: [...envelope.collectors, envelope.collectors[0]!] })).toThrow();
    expect(() => validateScanTargetEnvelope(envelope, { buildId: "another-build" })).toThrow("Scan target current-scene at index 0 belongs to build");
    expect(() => validateScanTargetEnvelope(envelope, { buildId: envelope.buildId, sourceRunId: "another-run" })).toThrow("Scan target current-scene at index 0 belongs to another source run");
    expect(() => validateScanTargetEnvelope({ ...envelope, targetIndex: "wrong" })).toThrow("Scan target current-scene at index wrong has a malformed envelope");
    expect(() => validateScanTargetEnvelope({ ...envelope, artifacts: envelope.artifacts.filter(artifact => artifact.family !== "placements") })).toThrow();
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("directory preparation failure does not strand the next operation", async () => {
  const root = await mkdtemp(join(tmpdir(), "afallon-scan-storage-failure-"));
  const blocked = join(root, "target-0");
  try {
    await Bun.write(blocked, "not a directory");
    const scanner = new ScanStateMachine({ buildId: "25153357", sourceRunId: "fixture-run", character: "AtlasSurvey", outputDirectory: root, stateReader: new SequenceStateReader([state, { ...state, frame: 101 }]) });
    await expect(scanner.scanCurrentScene(0, collectEvidence)).rejects.toThrow();
    await rm(blocked);
    const next = await scanner.scanCurrentScene(0, collectEvidence);
    expect(next.outcome).toBe("succeeded");
    expect(next.observation.started).toEqual(state);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("state mismatch makes the target fail with restoration evidence", async () => {
  const root = await mkdtemp(join(tmpdir(), "afallon-current-scan-failure-"));
  try {
    const moved = { ...state, frame: 101, position: { x: 2, y: 2, z: 3 } };
    const scanner = new ScanStateMachine({ buildId: "25153357", sourceRunId: "fixture-run", character: "AtlasSurvey", outputDirectory: root, stateReader: new SequenceStateReader([state, moved]) });
    const envelope = await scanner.scanCurrentScene(0, collectEvidence);
    expect(envelope.outcome).toBe("failed");
    expect(envelope.observation.completed?.position).toEqual(moved.position);
    expect((await scanner.scanCurrentScene(1, collectEvidence)).outcome).toBe("not-attempted");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
