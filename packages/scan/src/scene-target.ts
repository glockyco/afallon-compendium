import { resolve } from "node:path";
import { SceneVisitSchema, type SceneVisit } from "@afallon/contracts";
import type { ProbeBundle, Runtime } from "@afallon/runtime";
import type { BuildSceneVisitor } from "./state-machine";

export class SceneTargetController implements BuildSceneVisitor {
  constructor(
    private readonly runtime: Runtime,
    private readonly bundle: ProbeBundle<typeof SceneVisitSchema>,
    private readonly character: string,
    private readonly timeoutMs: number,
  ) {}

  async visit(sceneNativeId: number, outputDirectory: string, collect: () => Promise<void>): Promise<void> {
    let deadline = Date.now() + this.timeoutMs;
    let sequence = 0;
    let started: SceneVisit | null = null;
    let operationError: unknown;
    const invoke = async (action: "start" | "poll" | "restore", parameters: Record<string, unknown>): Promise<SceneVisit> => {
      this.runtime.signal.throwIfAborted();
      if (Date.now() >= deadline) throw new Error(`Build scene ${sceneNativeId} exceeded its ${this.timeoutMs} ms deadline.`);
      const output = resolve(outputDirectory, `scene-${String(sequence++).padStart(3, "0")}-${action}.json`);
      return (await this.runtime.runProbe(this.bundle, output, {
        parameters: { action, researchCharacter: this.character, ...parameters },
        timeoutMs: Math.min(this.timeoutMs, Math.max(1000, deadline - Date.now())),
      })).value;
    };
    const settle = async (action: "poll" | "restore", key: string, expected: "ready" | "restored"): Promise<SceneVisit> => {
      while (true) {
        const state = await invoke(action, { key });
        if (state.key !== key) throw new Error("Scene controller returned another ownership key.");
        if (state.phase === expected || state.phase === "returned") return state;
        await Bun.sleep(250);
      }
    };

    try {
      started = await invoke("start", { targetSceneNativeId: sceneNativeId });
      const ready = await settle("poll", started.key, "ready");
      if (ready.phase === "returned") throw new Error(`Build scene ${sceneNativeId} returned to source scene ${String(ready.sceneNativeId)} before collection.`);
      if (!ready.sceneReady || ready.sceneNativeId !== sceneNativeId) throw new Error(`Build scene ${sceneNativeId} did not become ready.`);
      await collect();
    } catch (error) {
      operationError = error;
    }

    if (started !== null) {
      deadline = Date.now() + this.timeoutMs;
      try {
        const restored = await settle("restore", started.key, "restored");
        if (restored.phase !== "restored" || !restored.sceneReady || restored.sceneNativeId !== started.sourceSceneNativeId) {
          throw new Error(`Build scene ${sceneNativeId} did not restore source scene ${started.sourceSceneNativeId}.`);
        }
      } catch (restoreError) {
        if (operationError !== undefined) throw new AggregateError([operationError, restoreError], `Build scene ${sceneNativeId} failed and restoration was not confirmed.`);
        throw restoreError;
      }
    }
    if (operationError !== undefined) throw operationError;
  }
}
