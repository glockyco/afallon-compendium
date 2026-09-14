import { Assert } from "typebox/value";
import {
  SCAN_COLLECTOR_FAMILIES,
  ScanPlanSchema,
  type ScanCollectorDisposition,
  type ScanCollectorFamily,
  type ScanPlan,
  type ScanTarget,
  type WorldInventory,
} from "@afallon/contracts";

const APPLICABILITY: Readonly<Record<ScanTarget["kind"], Readonly<Record<ScanCollectorFamily, string | null>>>> = {
  "current-scene": {
    canonical: "Canonical database facts are global to the running build.",
    inventory: "The current scene exposes its loaded-scene and source inventory.",
    producers: "The current scene can contain authored producer components.",
    placements: "The current scene can contain authored placement components.",
    roles: "Roles derive from the current scene's authored sources.",
    relationships: "Canonical relationships are global to the running build.",
    spatial: "The current scene can expose geometry and map registration evidence.",
    coverage: "Coverage dispositions apply to every requested target.",
  },
  "build-scene": {
    canonical: "Canonical database facts are global to the running build.",
    inventory: "A loaded build scene exposes its loaded-scene and source inventory.",
    producers: "A build scene can contain authored producer components.",
    placements: "A build scene can contain authored placement components.",
    roles: "Roles derive from the build scene's authored sources.",
    relationships: "Canonical relationships are global to the running build.",
    spatial: "A build scene can expose geometry and map registration evidence.",
    coverage: "Coverage dispositions apply to every requested target.",
  },
  "streamed-source": {
    canonical: "Canonical database facts are global to the running build.",
    inventory: null,
    producers: "A streamed source can add authored producer components.",
    placements: "A streamed source can add authored placement components.",
    roles: "Roles derive from the streamed source's authored components.",
    relationships: "Canonical relationships are global to the running build.",
    spatial: "A streamed source can add geometry inside its parent scene.",
    coverage: "Coverage dispositions apply to every requested target.",
  },
};

export interface ScanTargetIndex {
  readonly sceneNativeIds: ReadonlySet<number>;
  readonly streamedSourceKeysByScene: ReadonlyMap<number, ReadonlySet<string>>;
}

export function indexScanTargets(inventory: WorldInventory): ScanTargetIndex {
  const sceneNativeIds = new Set(inventory.databaseScenes.flatMap(scene => scene.nativeId === null ? [] : [scene.nativeId]));
  const streamedSourceKeysByScene = new Map<number, Set<string>>();
  for (const source of inventory.addressableSources) {
    if (source.sourceKey === null || !("scene" in source.owner) || source.owner.scene.currentGameSceneNativeId === null) continue;
    const keys = streamedSourceKeysByScene.get(source.owner.scene.currentGameSceneNativeId) ?? new Set<string>();
    keys.add(source.sourceKey);
    streamedSourceKeysByScene.set(source.owner.scene.currentGameSceneNativeId, keys);
  }
  return { sceneNativeIds, streamedSourceKeysByScene };
}

export function validateScanPlan(value: unknown, inventory: ScanTargetIndex): ScanPlan {
  try {
    Assert(ScanPlanSchema, value);
  } catch (error) {
    throw new Error("Scan plan does not match compendium.scan-plan.v1.", { cause: error });
  }
  const identities = new Set<string>();
  for (const [index, target] of value.targets.entries()) {
    const identity = targetIdentity(target);
    if (identities.has(identity)) throw new Error(`Scan plan repeats target ${identity} at index ${index}.`);
    identities.add(identity);
    if (target.kind === "current-scene") continue;
    if (!inventory.sceneNativeIds.has(target.sceneNativeId)) {
      throw new Error(`Scan target ${index} names unknown build scene ${target.sceneNativeId}.`);
    }
    if (target.kind === "streamed-source" && !inventory.streamedSourceKeysByScene.get(target.sceneNativeId)?.has(target.sourceKey)) {
      throw new Error(`Scan target ${index} names unknown streamed source ${JSON.stringify(target.sourceKey)} in scene ${target.sceneNativeId}.`);
    }
  }
  return structuredClone(value);
}

export function collectorApplicability(target: ScanTarget): readonly ScanCollectorDisposition[] {
  const evidence = APPLICABILITY[target.kind];
  return SCAN_COLLECTOR_FAMILIES.map(family => evidence[family] === null
    ? { family, status: "not-applicable", evidence: "Loaded-scene inventory describes the parent scene; the requested streamed source is already bound by its discovery record." }
    : { family, status: "collect", evidence: evidence[family] });
}

export function targetIdentity(target: ScanTarget): string {
  if (target.kind === "current-scene") return target.kind;
  if (target.kind === "build-scene") return `${target.kind}:${target.sceneNativeId}`;
  return `${target.kind}:${target.sceneNativeId}:${target.sourceKey}`;
}
