import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import {
  RuntimeScanStateSchema,
  validateScanTargetEnvelope,
  type RuntimeScanState,
  type ScanBuildSceneTarget,
  type ScanEvidenceArtifact,
  type ScanSourceEvidence,
  type ScanStreamedSourceTarget,
  type ScanTarget,
  type ScanTargetEnvelope,
} from "@afallon/contracts";
import type { ProbeBundle, Runtime } from "@afallon/runtime";
import { collectorApplicability, targetIdentity } from "./plan";
import { ScanCollectionError } from "./observation";

export interface ScanStateReader {
  read(outputFile: string): Promise<RuntimeScanState>;
}

export class RuntimeProbeStateReader implements ScanStateReader {
  constructor(
    private readonly runtime: Runtime,
    private readonly bundle: ProbeBundle<typeof RuntimeScanStateSchema>,
  ) {}

  async read(outputFile: string): Promise<RuntimeScanState> {
    return (await this.runtime.runProbe(this.bundle, outputFile)).value;
  }
}

export interface BuildSceneVisitor {
  visit(sceneNativeId: number, outputDirectory: string, collect: () => Promise<void>): Promise<void | ScanTargetExecution>;
}

export interface ScanTargetExecution {
  readonly outcome: Exclude<ScanTargetEnvelope["outcome"], "not-attempted">;
  readonly sourceEvidence?: ScanSourceEvidence;
  readonly diagnostics?: readonly { code: string; message: string }[];
  readonly artifacts?: readonly ScanEvidenceArtifact[];
}

export type ScanCollectorOperation = (outputDirectory: string, started: RuntimeScanState) => Promise<readonly ScanEvidenceArtifact[]>;

export interface StreamedSourceVisitor {
  visit(target: ScanStreamedSourceTarget, started: RuntimeScanState, outputDirectory: string, collect: () => Promise<void>): Promise<ScanTargetExecution>;
}

export class AttributedScanTargetError extends Error {
  override name = "AttributedScanTargetError";
  constructor(message: string, readonly sourceEvidence: ScanSourceEvidence, options?: ErrorOptions) {
    super(message, options);
  }
}

export interface ScanStateMachineOptions {
  readonly buildId: string;
  readonly sourceRunId: string;
  readonly character: string;
  readonly outputDirectory: string;
  readonly stateReader: ScanStateReader;
}

export class ScanStateMachine {
  #active = false;
  #restorationUnconfirmed = false;

  constructor(private readonly options: ScanStateMachineOptions) {}

  scanCurrentScene(targetIndex: number, collect: ScanCollectorOperation): Promise<ScanTargetEnvelope> {
    return this.execute({ kind: "current-scene" }, targetIndex, async (directory, started) => ({ outcome: "succeeded", artifacts: await collect(directory, started) }));
  }

  scanBuildScene(target: ScanBuildSceneTarget, targetIndex: number, visitor: BuildSceneVisitor, collect: ScanCollectorOperation): Promise<ScanTargetEnvelope> {
    return this.execute(target, targetIndex, async (directory, started) => {
      let artifacts: readonly ScanEvidenceArtifact[] = [];
      try {
        const execution = await visitor.visit(target.sceneNativeId, directory, async () => { artifacts = await collect(directory, started); });
        return { outcome: "succeeded", ...(execution ?? {}), artifacts };
      } catch (error) { throw new ScanCollectionError(artifacts, error); }
    });
  }

  scanStreamedSource(target: ScanStreamedSourceTarget, targetIndex: number, visitor: StreamedSourceVisitor, collect: ScanCollectorOperation): Promise<ScanTargetEnvelope> {
    return this.execute(target, targetIndex, async (directory, started) => {
      let artifacts: readonly ScanEvidenceArtifact[] = [];
      try {
        const execution = await visitor.visit(target, started, directory, async () => { artifacts = await collect(directory, started); });
        return { ...execution, artifacts };
      } catch (error) { throw new ScanCollectionError(artifacts, error); }
    });
  }

  async notAttempted(target: ScanTarget, targetIndex: number, sourceEvidence: ScanSourceEvidence | null, reason: string): Promise<ScanTargetEnvelope> {
    const envelope: ScanTargetEnvelope = {
      schemaVersion: "compendium.scan-target-envelope.v2",
      buildId: this.options.buildId,
      sourceRunId: this.options.sourceRunId,
      targetIndex,
      target,
      targetIdentity: targetIdentity(target),
      outcome: "not-attempted",
      observation: { started: null, completed: null },
      collectors: [...collectorApplicability(target)],
      artifacts: [],
      sourceEvidence,
      diagnostics: [{ code: "not-attempted", message: reason }],
    };
    return this.writeEnvelope(envelope);
  }

  protected async execute(target: ScanTarget, targetIndex: number, operation: (directory: string, started: RuntimeScanState) => Promise<void | ScanTargetExecution>): Promise<ScanTargetEnvelope> {
    if (this.#active) throw new Error("The scan state machine is already processing a target.");
    if (this.#restorationUnconfirmed) return this.notAttempted(target, targetIndex, null, "A prior target did not confirm restoration.");
    this.#active = true;
    try { return await this.executeTarget(target, targetIndex, operation); }
    finally { this.#active = false; }
  }

  private async executeTarget(target: ScanTarget, targetIndex: number, operation: (directory: string, started: RuntimeScanState) => Promise<void | ScanTargetExecution>): Promise<ScanTargetEnvelope> {
    const directory = resolve(this.options.outputDirectory, `target-${targetIndex}`);
    let started: RuntimeScanState | null = null;
    let completed: RuntimeScanState | null = null;
    const diagnostics: Array<{ code: string; message: string }> = [];
    let outcome: ScanTargetEnvelope["outcome"] = "succeeded";
    let sourceEvidence: ScanSourceEvidence | null = null;
    let artifacts: readonly ScanEvidenceArtifact[] = [];
    try {
      await mkdir(directory, { recursive: true });
      started = await this.options.stateReader.read(resolve(directory, "state-started.json"));
      if (started.character !== this.options.character) throw new Error(`Loaded character ${JSON.stringify(started.character)} does not match ${JSON.stringify(this.options.character)}.`);
      const execution = await operation(directory, started);
      if (execution !== undefined) {
        outcome = execution.outcome;
        sourceEvidence = execution.sourceEvidence ?? null;
        diagnostics.push(...(execution.diagnostics ?? []));
        artifacts = execution.artifacts ?? [];
      }
      completed = await this.options.stateReader.read(resolve(directory, "state-completed.json"));
      assertRestored(started, completed);
    } catch (error) {
      outcome = "failed";
      const pending: unknown[] = [error];
      const seen = new Set<unknown>();
      while (pending.length > 0) {
        const cause = pending.pop();
        if (seen.has(cause)) continue;
        seen.add(cause);
        if (cause instanceof AttributedScanTargetError) sourceEvidence = cause.sourceEvidence;
        if (cause instanceof ScanCollectionError && cause.artifacts.length > artifacts.length) artifacts = cause.artifacts;
        if (cause instanceof AggregateError) pending.push(...cause.errors);
        if (cause instanceof Error && cause.cause !== undefined) pending.push(cause.cause);
      }
      diagnostics.push({ code: "target-failed", message: error instanceof Error ? error.message : String(error) });
      if (started !== null && completed === null) {
        try { completed = await this.options.stateReader.read(resolve(directory, "state-completed.json")); }
        catch (stateError) { diagnostics.push({ code: "completion-state-unavailable", message: stateError instanceof Error ? stateError.message : String(stateError) }); }
      }
      if (started !== null) {
        try {
          if (completed === null) throw new Error("No completion state was recorded.");
          assertRestored(started, completed);
        } catch (restorationError) {
          this.#restorationUnconfirmed = true;
          diagnostics.push({ code: "restoration-unconfirmed", message: restorationError instanceof Error ? restorationError.message : String(restorationError) });
        }
      }
    }
    const envelope: ScanTargetEnvelope = {
      schemaVersion: "compendium.scan-target-envelope.v2",
      buildId: this.options.buildId,
      sourceRunId: this.options.sourceRunId,
      targetIndex,
      target,
      targetIdentity: targetIdentity(target),
      outcome,
      observation: { started, completed },
      collectors: [...collectorApplicability(target)],
      artifacts: [...artifacts],
      sourceEvidence,
      diagnostics,
    };
    return this.writeEnvelope(envelope);
  }

  private async writeEnvelope(envelope: ScanTargetEnvelope): Promise<ScanTargetEnvelope> {
    validateScanTargetEnvelope(envelope, { buildId: this.options.buildId, sourceRunId: this.options.sourceRunId });
    const directory = resolve(this.options.outputDirectory, `target-${envelope.targetIndex}`);
    await mkdir(directory, { recursive: true });
    await Bun.write(resolve(directory, "envelope.json"), `${JSON.stringify(envelope, null, 2)}\n`);
    return structuredClone(envelope);
  }
}

function assertRestored(started: RuntimeScanState, completed: RuntimeScanState): void {
  const sameScene = started.character === completed.character
    && started.scene.name === completed.scene.name
    && started.scene.path === completed.scene.path
    && started.gameSceneNativeId === completed.gameSceneNativeId;
  const samePosition = squaredDistance(started.position, completed.position) <= 0.000001;
  const rotationDot = Math.abs(started.rotation.x * completed.rotation.x + started.rotation.y * completed.rotation.y + started.rotation.z * completed.rotation.z + started.rotation.w * completed.rotation.w);
  if (!sameScene || !samePosition || 1 - rotationDot > 0.000001) throw new Error("Scan target did not restore the original scene, character, position, and rotation.");
}

function squaredDistance(left: RuntimeScanState["position"], right: RuntimeScanState["position"]): number {
  const x = left.x - right.x;
  const y = left.y - right.y;
  const z = left.z - right.z;
  return x * x + y * y + z * z;
}
