import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { Assert } from "typebox/value";
import {
  RuntimeScanStateSchema,
  ScanTargetEnvelopeSchema,
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
  visit(sceneNativeId: number, outputDirectory: string, collect: () => Promise<void>): Promise<void>;
}

export interface ScanTargetExecution {
  readonly outcome: Exclude<ScanTargetEnvelope["outcome"], "not-attempted">;
  readonly sourceEvidence?: ScanSourceEvidence;
  readonly diagnostics?: readonly { code: string; message: string }[];
  readonly artifacts?: readonly ScanEvidenceArtifact[];
}

export type ScanCollectorOperation = (outputDirectory: string) => Promise<readonly ScanEvidenceArtifact[]>;

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
  readonly character: string;
  readonly outputDirectory: string;
  readonly stateReader: ScanStateReader;
}

export class ScanStateMachine {
  #active = false;

  constructor(private readonly options: ScanStateMachineOptions) {}

  scanCurrentScene(targetIndex: number, collect?: ScanCollectorOperation): Promise<ScanTargetEnvelope> {
    return this.execute({ kind: "current-scene" }, targetIndex, async directory => ({ outcome: "succeeded", artifacts: collect === undefined ? [] : await collect(directory) }));
  }

  scanBuildScene(target: ScanBuildSceneTarget, targetIndex: number, visitor: BuildSceneVisitor, collect?: ScanCollectorOperation): Promise<ScanTargetEnvelope> {
    return this.execute(target, targetIndex, async directory => {
      let artifacts: readonly ScanEvidenceArtifact[] = [];
      await visitor.visit(target.sceneNativeId, directory, async () => { artifacts = collect === undefined ? [] : await collect(directory); });
      return { outcome: "succeeded", artifacts };
    });
  }

  scanStreamedSource(target: ScanStreamedSourceTarget, targetIndex: number, visitor: StreamedSourceVisitor, collect?: ScanCollectorOperation): Promise<ScanTargetEnvelope> {
    return this.execute(target, targetIndex, async (directory, started) => {
      let artifacts: readonly ScanEvidenceArtifact[] = [];
      const execution = await visitor.visit(target, started, directory, async () => { artifacts = collect === undefined ? [] : await collect(directory); });
      return { ...execution, artifacts };
    });
  }

  async notAttempted(target: ScanTarget, targetIndex: number, sourceEvidence: ScanSourceEvidence | null, reason: string): Promise<ScanTargetEnvelope> {
    const envelope: ScanTargetEnvelope = {
      schemaVersion: "compendium.scan-target-envelope.v1",
      buildId: this.options.buildId,
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
    this.#active = true;
    const directory = resolve(this.options.outputDirectory, `target-${targetIndex}`);
    await mkdir(directory, { recursive: true });
    let started: RuntimeScanState | null = null;
    let completed: RuntimeScanState | null = null;
    const diagnostics: Array<{ code: string; message: string }> = [];
    let outcome: ScanTargetEnvelope["outcome"] = "succeeded";
    let sourceEvidence: ScanSourceEvidence | null = null;
    let artifacts: readonly ScanEvidenceArtifact[] = [];
    try {
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
      if (error instanceof AttributedScanTargetError) sourceEvidence = error.sourceEvidence;
      diagnostics.push({ code: "target-failed", message: error instanceof Error ? error.message : String(error) });
      if (started !== null && completed === null) {
        try { completed = await this.options.stateReader.read(resolve(directory, "state-completed.json")); }
        catch (stateError) { diagnostics.push({ code: "completion-state-unavailable", message: stateError instanceof Error ? stateError.message : String(stateError) }); }
      }
    } finally {
      this.#active = false;
    }
    const envelope: ScanTargetEnvelope = {
      schemaVersion: "compendium.scan-target-envelope.v1",
      buildId: this.options.buildId,
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
    Assert(ScanTargetEnvelopeSchema, envelope);
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
