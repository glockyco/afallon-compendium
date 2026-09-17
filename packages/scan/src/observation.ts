import { Assert } from "typebox/value";
import { ObservationContextSchema, type ObservationContext, type ScanEvidenceArtifact, type ScanTarget, type WorldInventory } from "@afallon/contracts";

export function validateObservationContext(value: unknown, character: string, label: string, expected?: ObservationContext["started"]): ObservationContext {
  Assert(ObservationContextSchema, value);
  const { started, completed } = value;
  if (started.researchCharacter !== character || completed.researchCharacter !== character) throw new Error(`${label} observed another character.`);
  const sameScene = (left: ObservationContext["started"], right: ObservationContext["started"]) => left.scene.handle === right.scene.handle
    && left.scene.path === right.scene.path && left.scene.name === right.scene.name && left.gameSceneNativeId === right.gameSceneNativeId;
  if (!sameScene(started, completed) || completed.frame < started.frame) throw new Error(`${label} crossed its observation boundary.`);
  if (expected !== undefined && !sameScene(expected, started)) throw new Error(`${label} observed another scene instance.`);
  return value;
}

export function validateInventoryContext(inventory: WorldInventory, context: ObservationContext): void {
  const scene = inventory.coverage.activeScene;
  if (scene.path !== context.started.scene.path || scene.handle !== context.started.scene.handle
    || scene.name !== context.started.scene.name || scene.currentGameSceneNativeId !== context.started.gameSceneNativeId
    || inventory.runtime.activeScenePath !== scene.path || inventory.runtime.activeScene !== scene.name
    || inventory.coverage.currentGameScene?.nativeId !== context.started.gameSceneNativeId) {
    throw new Error("Planning inventory does not match its observation context.");
  }
  const counts: WorldInventory["sourceTotals"] = {
    buildScenes: inventory.buildScenes.length, databaseScenes: inventory.databaseScenes.length,
    worldPositions: inventory.referencedDestinations.filter(row => row.destinationType === "worldPosition").length,
    gameSceneStartPositionReferences: inventory.referencedDestinations.filter(row => row.destinationType === "gameScene.startPositionID").length,
    taskSceneReferences: inventory.referencedDestinations.filter(row => row.destinationType === "task.sceneName").length,
    loadedScenes: inventory.loadedScenes.length, addressableSources: inventory.addressableSources.length,
    loadedTransitions: inventory.transitions.length, referencedDestinations: inventory.referencedDestinations.length,
    componentFamilies: inventory.componentFamilies.length, behaviourTypes: inventory.behaviourTypes.length,
    behaviourComponents: inventory.behaviourTypes.reduce((total, row) => total + row.includeInactiveCount, 0),
  };
  for (const key of Object.keys(counts) as Array<keyof typeof counts>) {
    if (counts[key] !== inventory.sourceTotals[key] || counts[key] !== inventory.exportedTotals[key]) throw new Error(`Planning inventory ${key} counts do not reconcile.`);
  }
  for (const [collection, rows] of Object.entries({ buildScenes: inventory.buildScenes, databaseScenes: inventory.databaseScenes, loadedScenes: inventory.loadedScenes, addressableSources: inventory.addressableSources, referencedDestinations: inventory.referencedDestinations, transitions: inventory.transitions })) {
    const paths = new Set<string>();
    for (const [index, row] of rows.entries()) {
      if (paths.has(row.sourceFieldPath)) throw new Error(`Planning inventory repeats ${collection}/${index} source identity.`);
      paths.add(row.sourceFieldPath);
    }
  }
  const nativeIds = new Set<number>();
  for (const [index, row] of inventory.databaseScenes.entries()) {
    if (row.nativeId === null) continue;
    if (row.nativeId < 0 || nativeIds.has(row.nativeId)) throw new Error(`Planning inventory has an invalid or duplicate databaseScenes/${index} native identity.`);
    nativeIds.add(row.nativeId);
  }
  for (const row of [...inventory.componentFamilies, ...inventory.behaviourTypes]) {
    if (row.activeCount < 0 || row.includeInactiveCount < row.activeCount) throw new Error("Planning inventory has unavailable or inconsistent component counts.");
  }
}

export function validateTargetContext(target: ScanTarget, context: ObservationContext): void {
  if (target.kind !== "current-scene" && context.started.gameSceneNativeId !== target.sceneNativeId) throw new Error(`Target ${target.kind}:${target.sceneNativeId} observed another native scene.`);
}

export class ScanCollectionError extends Error {
  constructor(readonly artifacts: readonly ScanEvidenceArtifact[], cause: unknown) {
    super(cause instanceof Error ? cause.message : String(cause), { cause });
    this.name = "ScanCollectionError";
  }
}
