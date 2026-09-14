import { resolve } from "node:path";
import { Assert } from "typebox/value";
import { PlacementSnapshotSchema, StreamVisitSchema, type RuntimeScanState, type ScanStreamedSourceTarget, type WorldInventory } from "@afallon/contracts";
import type { ProbeBundle, Runtime } from "@afallon/runtime";
import { SceneTargetController } from "./scene-target";
import type { ScanStateReader, ScanTargetExecution, StreamedSourceVisitor } from "./state-machine";
import { StreamTargetController } from "./stream-target";

export class PlannedStreamTargetController implements StreamedSourceVisitor {
  constructor(
    private readonly runtime: Runtime,
    private readonly sceneController: SceneTargetController,
    private readonly streamBundle: ProbeBundle<typeof StreamVisitSchema>,
    private readonly placementBundle: ProbeBundle,
    private readonly stateReader: ScanStateReader,
    private readonly inventory: WorldInventory,
    private readonly character: string,
    private readonly timeoutMs: number,
  ) {}

  async visit(target: ScanStreamedSourceTarget, _started: RuntimeScanState, outputDirectory: string, collect: () => Promise<void>): Promise<ScanTargetExecution> {
    let execution: ScanTargetExecution | null = null;
    await this.sceneController.visit(target.sceneNativeId, outputDirectory, async () => {
      const parentState = await this.stateReader.read(resolve(outputDirectory, "stream-parent-state.json"));
      const snapshot = (await this.runtime.runProbe(this.placementBundle, resolve(outputDirectory, "stream-binding-snapshot.json"), {
        parameters: { researchCharacter: this.character },
        captureContext: true,
      })).value;
      Assert(PlacementSnapshotSchema, snapshot);
      const source = this.inventory.addressableSources.find(candidate => candidate.sourceKey === target.sourceKey && "scene" in candidate.owner && candidate.owner.scene.currentGameSceneNativeId === target.sceneNativeId);
      const assetGuid = source !== undefined && "assetGuid" in source ? source.assetGuid : target.sourceKey;
      const stream = snapshot.streams.find(candidate => candidate.assetGuid === assetGuid);
      const controller = new StreamTargetController(this.runtime, this.streamBundle, this.character, this.timeoutMs, {
        sceneNativeId: target.sceneNativeId,
        sourceKey: target.sourceKey,
        loaderInstanceId: stream?.componentInstanceId ?? null,
        assetGuid,
        runtimeKey: source !== undefined && "runtimeKey" in source ? source.runtimeKey : null,
        discoveryDisposition: source?.disposition ?? "not found in world inventory",
      });
      execution = await controller.visit(target, parentState, outputDirectory, collect);
    });
    if (execution === null) throw new Error(`Stream source ${JSON.stringify(target.sourceKey)} produced no execution result.`);
    return execution;
  }
}
