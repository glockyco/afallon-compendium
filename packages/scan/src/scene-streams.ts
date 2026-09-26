import { resolve } from "node:path";
import { Assert } from "typebox/value";
import { StreamCleanupSchema, type StreamVisitSchema } from "@afallon/contracts";
import { toRuntimePath, type ProbeBundle, type Runtime } from "@afallon/runtime";
import type { SceneTargetController } from "./scene-target";
import type { BuildSceneVisitor, ScanStateReader, ScanTargetExecution } from "./state-machine";

// Visits a build scene and loads every streamed source of it before collection, so that what the collectors see does
// not depend on which sources load near the arrival. Restoration releases every load and hold that the visit made.
export class SceneStreamsVisitor implements BuildSceneVisitor {
  constructor(
    private readonly runtime: Runtime,
    private readonly sceneController: SceneTargetController,
    private readonly streamBundle: ProbeBundle<typeof StreamVisitSchema>,
    private readonly stateReader: ScanStateReader,
    private readonly character: string,
    private readonly timeoutMs: number,
  ) {}

  visit(sceneNativeId: number, outputDirectory: string, collect: () => Promise<void>): Promise<void | ScanTargetExecution> {
    return this.sceneController.visit(sceneNativeId, outputDirectory, async () => {
      const state = await this.stateReader.read(resolve(outputDirectory, "scene-streams-state.json"));
      const cleanupPath = resolve(outputDirectory, "scene-streams-cleanup.json");
      let sequence = 0;
      let deadline = Date.now() + this.timeoutMs;
      const invoke = async (action: "start" | "poll" | "restore", parameters: Record<string, unknown>) => {
        this.runtime.signal.throwIfAborted();
        const remaining = deadline - Date.now();
        if (remaining <= 0) throw new Error(`The streamed sources of scene ${sceneNativeId} exceeded their deadline.`);
        return (await this.runtime.runProbe(this.streamBundle, resolve(outputDirectory, `scene-streams-${String(sequence++).padStart(3, "0")}-${action}.json`), {
          parameters: { action, researchCharacter: this.character, sceneHandle: state.scene.handle, ...parameters },
          timeoutMs: Math.min(this.timeoutMs, Math.max(1000, remaining)),
        })).value;
      };
      const start = await invoke("start", { sceneLoaders: true, holdSeconds: Math.ceil(this.timeoutMs / 1000) + 5, cleanupPath: await toRuntimePath(this.runtime.config, cleanupPath) });
      let operationError: unknown;
      try {
        while ((await invoke("poll", { key: start.key })).phase !== "ready") await Bun.sleep(250);
        await collect();
      } catch (error) {
        operationError = error;
      }
      deadline = Date.now() + this.timeoutMs;
      try {
        while ((await invoke("restore", { key: start.key })).phase !== "restored") await Bun.sleep(250);
        const cleanup: unknown = await Bun.file(cleanupPath).json();
        Assert(StreamCleanupSchema, cleanup);
        if (cleanup.key !== start.key || cleanup.ownerToken !== this.runtime.ownerToken || cleanup.sceneHandle !== state.scene.handle) throw new Error("The scene stream cleanup receipt does not confirm restored ownership.");
      } catch (restoreError) {
        throw operationError === undefined ? restoreError : new AggregateError([operationError, restoreError], `Scene ${sceneNativeId} streaming failed and restoration was not confirmed.`);
      }
      if (operationError !== undefined) throw operationError;
    });
  }
}
