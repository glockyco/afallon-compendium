import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { Assert } from "typebox/value";
import {
  RuntimeScanStateSchema,
  ScanTargetEnvelopeSchema,
  type RuntimeScanState,
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

export interface ScanStateMachineOptions {
  readonly buildId: string;
  readonly character: string;
  readonly outputDirectory: string;
  readonly stateReader: ScanStateReader;
}

export class ScanStateMachine {
  #active = false;

  constructor(private readonly options: ScanStateMachineOptions) {}

  scanCurrentScene(targetIndex: number): Promise<ScanTargetEnvelope> {
    return this.execute({ kind: "current-scene" }, targetIndex, async () => {});
  }

  protected async execute(target: ScanTarget, targetIndex: number, operation: () => Promise<void>): Promise<ScanTargetEnvelope> {
    if (this.#active) throw new Error("The scan state machine is already processing a target.");
    this.#active = true;
    const directory = resolve(this.options.outputDirectory, `target-${targetIndex}`);
    await mkdir(directory, { recursive: true });
    let started: RuntimeScanState | null = null;
    let completed: RuntimeScanState | null = null;
    const diagnostics: Array<{ code: string; message: string }> = [];
    let outcome: ScanTargetEnvelope["outcome"] = "succeeded";
    try {
      started = await this.options.stateReader.read(resolve(directory, "state-started.json"));
      if (started.character !== this.options.character) throw new Error(`Loaded character ${JSON.stringify(started.character)} does not match ${JSON.stringify(this.options.character)}.`);
      await operation();
      completed = await this.options.stateReader.read(resolve(directory, "state-completed.json"));
      assertRestored(started, completed);
    } catch (error) {
      outcome = "failed";
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
      diagnostics,
    };
    Assert(ScanTargetEnvelopeSchema, envelope);
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
