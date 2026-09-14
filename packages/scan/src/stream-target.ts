import { resolve } from "node:path";
import { Assert } from "typebox/value";
import {
  StreamCleanupSchema,
  StreamVisitSchema,
  type RuntimeScanState,
  type ScanSourceEvidence,
  type ScanStreamedSourceTarget,
  type StreamVisit,
} from "@afallon/contracts";
import { toRuntimePath, type ProbeBundle, type Runtime } from "@afallon/runtime";
import { AttributedScanTargetError, type ScanTargetExecution, type StreamedSourceVisitor } from "./state-machine";

export interface StreamSourceBinding {
  readonly sceneNativeId: number;
  readonly sourceKey: string;
  readonly loaderInstanceId: number | null;
  readonly assetGuid: string | null;
  readonly runtimeKey: string | null;
  readonly discoveryDisposition: string;
}

export class StreamTargetController implements StreamedSourceVisitor {
  constructor(
    private readonly runtime: Runtime,
    private readonly bundle: ProbeBundle<typeof StreamVisitSchema>,
    private readonly character: string,
    private readonly timeoutMs: number,
    private readonly binding: StreamSourceBinding,
  ) {}

  async visit(target: ScanStreamedSourceTarget, startedState: RuntimeScanState, outputDirectory: string, collect: () => Promise<void>): Promise<ScanTargetExecution> {
    let evidence = this.evidence("discovered", `Source was bound from ${this.binding.discoveryDisposition} inventory evidence.`);
    if (target.sceneNativeId !== this.binding.sceneNativeId || target.sourceKey !== this.binding.sourceKey) {
      throw new AttributedScanTargetError("Stream source binding does not match the requested target.", evidence);
    }
    if (startedState.gameSceneNativeId !== target.sceneNativeId) {
      throw new AttributedScanTargetError(`Stream source parent scene ${target.sceneNativeId} is not active.`, evidence);
    }
    if (this.binding.loaderInstanceId === null) {
      return { outcome: "unsupported", sourceEvidence: this.evidence("unsupported", "Discovery evidence has no live AddressableLoader instance.") };
    }

    let deadline = Date.now() + this.timeoutMs;
    let sequence = 0;
    let start: StreamVisit | null = null;
    let execution: ScanTargetExecution | null = null;
    let operationError: unknown;
    const cleanupPath = resolve(outputDirectory, "stream-cleanup.json");
    const invoke = async (action: "start" | "poll" | "restore", parameters: Record<string, unknown>): Promise<StreamVisit> => {
      this.runtime.signal.throwIfAborted();
      const remaining = deadline - Date.now();
      if (remaining <= 0) throw new Error(`Stream source ${JSON.stringify(target.sourceKey)} exceeded its deadline.`);
      const output = resolve(outputDirectory, `stream-${String(sequence++).padStart(3, "0")}-${action}.json`);
      return (await this.runtime.runProbe(this.bundle, output, {
        parameters: { action, researchCharacter: this.character, sceneHandle: startedState.scene.handle, ...parameters },
        timeoutMs: Math.min(this.timeoutMs, Math.max(1000, remaining)),
      })).value;
    };

    try {
      start = await invoke("start", {
        loaderInstanceIds: [this.binding.loaderInstanceId],
        holdSeconds: Math.min(360, Math.ceil(this.timeoutMs / 1000) + 5),
        cleanupPath: await toRuntimePath(this.runtime.config, cleanupPath),
      });
      const initial = this.row(start);
      if (initial.skippedReason !== null) {
        evidence = this.evidence("unsupported", `AddressableLoader was ${initial.skippedReason} when streaming began.`);
        execution = { outcome: "unsupported", sourceEvidence: evidence };
      } else {
        while (true) {
          if (Date.now() >= deadline) {
            evidence = this.evidence("unreachable", "AddressableLoader did not produce a stable loaded root before the target deadline.");
            execution = { outcome: "unreachable", sourceEvidence: evidence };
            break;
          }
          const polled = await invoke("poll", { key: start.key });
          const row = this.row(polled);
          if (polled.phase === "ready") {
            if (!row.loaded || row.loading || !row.hasHandle || row.rootInstanceId === null) throw new Error("Stream source reported ready without a stable loaded root.");
            await collect();
            evidence = this.evidence("succeeded", `AddressableLoader produced root instance ${row.rootInstanceId}.`);
            execution = { outcome: "succeeded", sourceEvidence: evidence };
            break;
          }
          await Bun.sleep(250);
        }
      }
    } catch (error) {
      operationError = error;
    }

    if (start !== null) {
      deadline = Date.now() + this.timeoutMs;
      try {
        while (true) {
          const restored = await invoke("restore", { key: start.key });
          if (restored.phase === "restored") break;
          await Bun.sleep(250);
        }
        const cleanup: unknown = await Bun.file(cleanupPath).json();
        Assert(StreamCleanupSchema, cleanup);
        if (cleanup.key !== start.key || cleanup.ownerToken !== this.runtime.ownerToken || cleanup.sceneHandle !== startedState.scene.handle || cleanup.remainingOwnedRoots !== 0 || cleanup.errors.length !== 0) {
          throw new Error("Stream cleanup receipt does not confirm restored ownership.");
        }
      } catch (restoreError) {
        throw new AttributedScanTargetError(`Stream source ${JSON.stringify(target.sourceKey)} restoration was not confirmed.`, evidence, { cause: operationError === undefined ? restoreError : new AggregateError([operationError, restoreError]) });
      }
    }
    if (operationError !== undefined) throw new AttributedScanTargetError(`Stream source ${JSON.stringify(target.sourceKey)} failed: ${operationError instanceof Error ? operationError.message : String(operationError)}`, evidence, { cause: operationError });
    if (execution === null) throw new AttributedScanTargetError("Stream controller produced no terminal outcome.", evidence);
    return execution;
  }

  private row(state: StreamVisit): StreamVisit["rows"][number] {
    const row = state.rows.find(candidate => candidate.loaderInstanceId === this.binding.loaderInstanceId);
    if (row === undefined || state.rows.length !== 1) throw new Error("Stream controller response does not match the requested loader.");
    return row;
  }

  private evidence(disposition: string, detail: string): ScanSourceEvidence {
    return {
      sceneNativeId: this.binding.sceneNativeId,
      sourceKey: this.binding.sourceKey,
      loaderInstanceId: this.binding.loaderInstanceId,
      assetGuid: this.binding.assetGuid,
      runtimeKey: this.binding.runtimeKey,
      disposition,
      detail,
    };
  }
}
