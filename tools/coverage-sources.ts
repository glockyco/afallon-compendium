import type { CoverageEntry } from "@afallon/contracts";
import type { CoverageInput } from "./coverage";

type ArtifactKey = keyof CoverageInput["observations"];
type ObservationContext = CoverageInput["observations"][ArtifactKey]["completed"];
type RecordValue = Record<string, unknown>;

type Relevance = CoverageEntry["relevance"];
type Reachability = CoverageEntry["reachability"];
type RuntimeAvailability = CoverageEntry["runtimeAvailability"];
type Extraction = CoverageEntry["extraction"];
type Imagery = CoverageEntry["imagery"];

type WorldCollection =
  | "resourceProducers"
  | "interactions"
  | "containers"
  | "questZones"
  | "transitions"
  | "mapZones"
  | "regions"
  | "mapIcons"
  | "services"
  | "conditionSources"
  | "unsupportedSources";

type InventoryCollection =
  | "buildScenes"
  | "databaseScenes"
  | "referencedDestinations"
  | "transitions"
  | "loadedScenes"
  | "addressableSources"
  | "componentFamilies"
  | "behaviourTypes";

const WORLD_COLLECTIONS: readonly WorldCollection[] = [
  "resourceProducers",
  "interactions",
  "containers",
  "questZones",
  "transitions",
  "mapZones",
  "regions",
  "mapIcons",
  "services",
  "conditionSources",
  "unsupportedSources",
];

const INVENTORY_COLLECTIONS: readonly InventoryCollection[] = [
  "buildScenes",
  "databaseScenes",
  "referencedDestinations",
  "transitions",
  "loadedScenes",
  "addressableSources",
  "componentFamilies",
  "behaviourTypes",
];

function record(value: unknown): RecordValue | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as RecordValue
    : null;
}

function textAt(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function integerAt(value: unknown): number | null {
  return typeof value === "number" && Number.isInteger(value) ? value : null;
}

function nonNegativeIntegerAt(value: unknown): number | null {
  const integer = integerAt(value);
  return integer !== null && integer >= 0 ? integer : null;
}

function relevance(state: Relevance["state"], reason: string): Relevance {
  return { state, reason };
}

function reachability(state: Reachability["state"], reason: string): Reachability {
  return { state, reason };
}

function extraction(state: Extraction["state"], reason: string): Extraction {
  return { state, reason };
}

function imagery(state: Imagery["state"], reason: string): Imagery {
  return { state, reason };
}

function runtime(
  loadState: RuntimeAvailability["loadState"],
  reason: string,
  activeSelf: boolean | null = null,
  activeInHierarchy: boolean | null = null,
  enabled: boolean | null = null,
  loadedOrLoading: boolean | null = null,
): RuntimeAvailability {
  return {
    loadState,
    activeSelf,
    activeInHierarchy,
    enabled,
    loadedOrLoading,
    geometryReadiness: "unverified",
    reason,
  };
}

function scopedKey(artifact: ArtifactKey, identity: string | null, fallback: string): string {
  return `${artifact}:${textAt(identity) ?? fallback}`;
}

function makeEntry(
  artifact: ArtifactKey,
  path: string,
  sourceKey: string,
  kind: CoverageEntry["kind"],
  sourceFieldPath: string,
  sceneNativeId: number | null,
  relevanceState: Relevance,
  reachabilityState: Reachability,
  runtimeState: RuntimeAvailability,
  extractionState: Extraction,
  imageryState: Imagery,
): CoverageEntry {
  return {
    id: `${artifact}:${path}`,
    sourceKey,
    kind,
    evidence: { artifact, path },
    sourceFieldPath: textAt(sourceFieldPath) ?? path,
    sceneNativeId,
    relevance: relevanceState,
    reachability: reachabilityState,
    runtimeAvailability: runtimeState,
    extraction: extractionState,
    imagery: imageryState,
  };
}

function observationContext(input: CoverageInput, artifact: ArtifactKey, path: string): ObservationContext | null {
  const { started, completed } = input.observations[artifact];
  return started.scene.isLoaded && completed.scene.isLoaded && started.scene.path === path && completed.scene.path === path && started.scene.handle === completed.scene.handle
    ? completed
    : null;
}

function contextSceneId(input: CoverageInput, artifact: ArtifactKey, path: string): number | null {
  return nonNegativeIntegerAt(observationContext(input, artifact, path)?.gameSceneNativeId);
}

function sceneId(input: CoverageInput, artifact: ArtifactKey, sceneValue: unknown): number | null {
  const scene = record(sceneValue);
  if (scene === null) return null;
  const direct = nonNegativeIntegerAt(scene.nativeId);
  if (direct !== null) return direct;
  const path = textAt(scene.path);
  return path === null ? null : contextSceneId(input, artifact, path);
}

function contextLoaded(input: CoverageInput, artifact: ArtifactKey, scene: RecordValue | null): boolean {
  const path = scene === null ? null : textAt(scene.path);
  return path !== null && observationContext(input, artifact, path) !== null;
}

function sourcePathFromField(value: string): string | null {
  const separator = value.indexOf("::");
  return separator < 0 ? null : value.slice(0, separator);
}

function observedReachability(evidenceReachable: boolean): Reachability {
  return evidenceReachable
    ? reachability("reachable", "The source has explicit loaded-scene evidence from this probe.")
    : reachability("unknown", "Discovery alone does not establish reachability; traversal evidence is not available.");
}

function dispositionExtraction(value: unknown, unavailable: string | null, discoveredOnly: boolean): Extraction {
  if (unavailable !== null) return extraction("failed", `The probe marked this record unavailable: ${unavailable}`);
  if (value === "failed") return extraction("failed", "The probe reports failed extraction for this source.");
  if (value === "unsupported") return extraction("unsupported", "The probe marked this source family or payload unsupported.");
  if (discoveredOnly) return extraction("pending", "The record is discovered, but whole-scene traversal and extraction were not performed.");
  return extraction("extracted", "The probe exported this source record and retained its raw evidence.");
}

function pendingImagery(): Imagery {
  return imagery("pending", "No project capture is recorded; source discovery or extraction does not provide imagery.");
}

function notApplicableImagery(reason: string): Imagery {
  return imagery("not-applicable", reason);
}

function unavailableAt(value: unknown): string | null {
  const row = record(value);
  return row === null ? null : textAt(row.unavailable);
}

function sourceDetails(value: unknown): RecordValue | null {
  const source = record(value);
  return source === null ? null : record(source.source);
}

function sourceScene(value: unknown): RecordValue | null {
  const source = record(value);
  return source === null ? null : record(source.sourceScene);
}

function worldSourceFieldPath(row: RecordValue, path: string): string {
  const details = sourceDetails(row.source);
  const componentType = details === null ? null : textAt(details.componentType);
  const observationIndex = details === null ? null : nonNegativeIntegerAt(details.observationIndex);
  if (componentType !== null && observationIndex !== null) return `${componentType}[${observationIndex}]`;
  return textAt(row.sourceFieldPath) ?? path;
}

function worldSourceKey(artifact: ArtifactKey, row: RecordValue, path: string): string {
  const details = sourceDetails(row.source);
  const componentType = details === null ? null : textAt(details.componentType);
  const observationIndex = details === null ? null : nonNegativeIntegerAt(details.observationIndex);
  if (componentType !== null && observationIndex !== null) return scopedKey(artifact, `${componentType}[${observationIndex}]`, path);
  return scopedKey(artifact, null, path);
}

function worldRuntime(input: CoverageInput, artifact: ArtifactKey, row: RecordValue): RuntimeAvailability {
  const source = record(row.source);
  const scene = source === null ? null : record(source.sourceScene);
  const details = source === null ? null : record(source.source);
  const activeSelf = source === null || typeof source.activeSelf !== "boolean" ? null : source.activeSelf;
  const activeInHierarchy = source === null || typeof source.activeInHierarchy !== "boolean" ? null : source.activeInHierarchy;
  const enabled = source === null || typeof source.enabled !== "boolean" ? null : source.enabled;
  if (scene !== null && contextLoaded(input, artifact, scene)) {
    return runtime("loaded", "The source scene path exactly matches this probe's loaded-scene context; world-source records do not expose isLoaded.", activeSelf, activeInHierarchy, enabled);
  }
  const identity = details === null ? null : textAt(details.componentType);
  const index = details === null ? null : nonNegativeIntegerAt(details.observationIndex);
  const key = identity !== null && index !== null ? `${identity}[${index}]` : "this world source";
  return runtime("unknown", `No exact loaded-scene context matches ${key}; world-source load state remains unknown.`, activeSelf, activeInHierarchy, enabled);
}

function npcRuntime(row: RecordValue): RuntimeAvailability {
  const scene = record(row.sourceScene);
  const activeSelf = typeof row.activeSelf === "boolean" ? row.activeSelf : null;
  const activeInHierarchy = typeof row.activeInHierarchy === "boolean" ? row.activeInHierarchy : null;
  const enabled = typeof row.enabled === "boolean" ? row.enabled : null;
  if (scene === null || typeof scene.isLoaded !== "boolean") {
    return runtime("unknown", "The NPC record has no usable source-scene load state.", activeSelf, activeInHierarchy, enabled);
  }
  return scene.isLoaded
    ? runtime("loaded", "The native NPC source scene reports isLoaded=true.", activeSelf, activeInHierarchy, enabled)
    : runtime("unloaded", "The native NPC source scene reports isLoaded=false.", activeSelf, activeInHierarchy, enabled);
}

function observationRuntime(row: RecordValue): RuntimeAvailability {
  const scene = record(row.sourceScene);
  const activeSelf = typeof row.activeSelf === "boolean" ? row.activeSelf : null;
  const activeInHierarchy = typeof row.activeInHierarchy === "boolean" ? row.activeInHierarchy : null;
  const enabled = typeof row.enabled === "boolean" ? row.enabled : null;
  if (scene === null || typeof scene.isLoaded !== "boolean") {
    return runtime("unknown", "The runtime observation has no usable source-scene load state.", activeSelf, activeInHierarchy, enabled);
  }
  return scene.isLoaded
    ? runtime("loaded", "The observed native source scene reports isLoaded=true.", activeSelf, activeInHierarchy, enabled)
    : runtime("unloaded", "The observed native source scene reports isLoaded=false.", activeSelf, activeInHierarchy, enabled);
}

function inventoryEntry(
  input: CoverageInput,
  collection: InventoryCollection,
  index: number,
): CoverageEntry {
  const artifact = "world-inventory" as const;
  const path = `${collection}[${index}]`;
  const row = input.inventory[collection][index] as unknown;
  const value = record(row) ?? {};
  const unavailable = unavailableAt(value);
  const disposition = value.disposition;
  const sourceFieldPath = textAt(value.sourceFieldPath) ?? path;
  let sourceKey = scopedKey(artifact, sourceFieldPath, path);
  let kind: CoverageEntry["kind"];
  let sceneNativeId: number | null = null;
  let evidenceReachable = false;
  let unusedReference = false;
  let runtimeState = runtime("unknown", "This record has no explicit runtime load evidence.");
  let extractionState: Extraction;
  let relevanceState = relevance("relevant", "This record is part of the requested world inventory.");
  let imageryState: Imagery;

  if (collection === "buildScenes") {
    kind = "build-scene";
    const manager = record(value.sceneManager);
    const managerPath = manager === null ? null : textAt(manager.path);
    const loaded = manager !== null && manager.isLoaded === true;
    evidenceReachable = loaded;
    sceneNativeId = managerPath === null ? null : contextSceneId(input, artifact, managerPath);
    runtimeState = manager === null
      ? runtime("unknown", "SceneManager did not provide a scene load record.")
      : manager.isLoaded === true
        ? runtime("loaded", "SceneManager reports this build scene is loaded.")
        : runtime("unloaded", "SceneManager reports this build scene is not loaded.");
    sourceKey = scopedKey(artifact, sourceFieldPath, path);
    extractionState = dispositionExtraction(disposition, unavailable, true);
    imageryState = pendingImagery();
  } else if (collection === "databaseScenes") {
    kind = "database-scene";
    sceneNativeId = nonNegativeIntegerAt(value.nativeId);
    const currentId = nonNegativeIntegerAt(input.inventory.coverage.activeScene.currentGameSceneNativeId);
    evidenceReachable = sceneNativeId !== null && currentId !== null && sceneNativeId === currentId && contextSceneId(input, artifact, input.inventory.coverage.activeScene.path) === currentId;
    sourceKey = scopedKey(artifact, `GameDatabase.GameScenes[${nonNegativeIntegerAt(value.sourceKey) ?? index}]`, path);
    runtimeState = evidenceReachable
      ? runtime("loaded", "The database scene ID equals the current game scene ID from this probe.")
      : runtime("unknown", "The database scene has no explicit loaded-scene evidence in this probe.");
    extractionState = dispositionExtraction(disposition, unavailable, true);
    imageryState = pendingImagery();
  } else if (collection === "referencedDestinations" && !("transitionType" in value)) {
    kind = "destination-reference";
    const owner = record(value.owner);
    const ownerNativeId = nonNegativeIntegerAt(value.ownerNativeId);
    const ownerDictionary = owner === null ? null : textAt(owner.dictionary);
    const ownerSourceKey = owner === null ? null : nonNegativeIntegerAt(owner.sourceKey);
    const destinationType = textAt(value.destinationType);
    unusedReference = (destinationType === "task.sceneName" && value.referenceStatus === "null-or-empty" && (value.rawSceneName === null || value.rawSceneName === ""))
      || (destinationType === "gameScene.startPositionID" && typeof value.targetNativeId === "number" && value.targetNativeId < 0);
    sourceKey = ownerDictionary !== null && ownerSourceKey !== null
      ? scopedKey(artifact, `${ownerDictionary}[${ownerSourceKey}]`, path)
      : scopedKey(artifact, sourceFieldPath, path);
    if (destinationType === "gameScene.startPositionID") sceneNativeId = ownerNativeId;
    const currentId = nonNegativeIntegerAt(input.inventory.coverage.activeScene.currentGameSceneNativeId);
    evidenceReachable = sceneNativeId !== null && currentId !== null && sceneNativeId === currentId && contextSceneId(input, artifact, input.inventory.coverage.activeScene.path) === currentId;
    runtimeState = evidenceReachable
      ? runtime("loaded", "The reference owner is the current game scene in this probe.")
      : runtime("unknown", "A reference record does not establish a runtime load state by itself.");
    extractionState = dispositionExtraction(disposition, unavailable, false);
    imageryState = notApplicableImagery("A destination reference is not a basemap or a captured scene.");
  } else if (collection === "transitions" || collection === "referencedDestinations") {
    kind = "destination-reference";
    const owner = record(value.owner);
    const ownerScene = owner === null ? null : record(owner.scene);
    const ownerRuntimeType = owner === null ? null : textAt(owner.runtimeType);
    const ownerObservationIndex = owner === null ? null : nonNegativeIntegerAt(owner.observationIndex);
    sourceKey = ownerRuntimeType !== null && ownerObservationIndex !== null
      ? scopedKey(artifact, `${ownerRuntimeType}[${ownerObservationIndex}]`, path)
      : scopedKey(artifact, sourceFieldPath, path);
    sceneNativeId = ownerScene === null ? null : contextSceneId(input, artifact, textAt(ownerScene.path) ?? "");
    evidenceReachable = ownerScene !== null && ownerScene.isLoaded === true;
    runtimeState = ownerScene === null
      ? runtime("unknown", "The transition owner has no scene evidence.")
      : ownerScene.isLoaded === true
        ? runtime("loaded", "The transition owner scene reports isLoaded=true.")
        : runtime("unloaded", "The transition owner scene reports isLoaded=false.");
    extractionState = dispositionExtraction(disposition, unavailable, false);
    imageryState = notApplicableImagery("A transition reference is not a basemap or a captured scene.");
  } else if (collection === "loadedScenes") {
    kind = "loaded-scene";
    const scene = record(value.scene);
    const loaded = scene !== null && scene.isLoaded === true;
    const scenePath = scene === null ? null : textAt(scene.path);
    sceneNativeId = scenePath === null ? null : contextSceneId(input, artifact, scenePath);
    evidenceReachable = loaded;
    runtimeState = loaded
      ? runtime("loaded", "The loaded-scene record reports isLoaded=true.")
      : runtime("unloaded", "The loaded-scene record reports isLoaded=false.");
    extractionState = dispositionExtraction(disposition, unavailable, true);
    imageryState = pendingImagery();
  } else if (collection === "addressableSources") {
    kind = "streamed-source";
    const owner = record(value.owner);
    const ownerScene = owner === null ? null : record(owner.scene);
    const ownerRuntimeType = owner === null ? null : textAt(owner.runtimeType);
    const ownerObservationIndex = owner === null ? null : nonNegativeIntegerAt(owner.observationIndex);
    sourceKey = ownerRuntimeType !== null && ownerObservationIndex !== null
      ? scopedKey(artifact, `${ownerRuntimeType}[${ownerObservationIndex}]`, path)
      : scopedKey(artifact, textAt(value.sourceKey), path);
    sceneNativeId = ownerScene === null ? null : sceneId(input, artifact, ownerScene);
    evidenceReachable = false;
    const evidence = record(value.evidence);
    const loadedOrLoading = evidence === null || typeof evidence.loadedOrLoading !== "boolean" ? null : evidence.loadedOrLoading;
    const activeSelf = typeof value.activeSelf === "boolean" ? value.activeSelf : null;
    const activeInHierarchy = typeof value.activeInHierarchy === "boolean" ? value.activeInHierarchy : null;
    const enabled = typeof value.componentEnabled === "boolean" ? value.componentEnabled : null;
    runtimeState = runtime("unknown", loadedOrLoading === null
      ? "The loader owner is observed, but no loaded-or-loading value is available; asset geometry load state is unknown."
      : `The loader reports loadedOrLoading=${String(loadedOrLoading)}; this does not prove loaded asset geometry or readiness.`, activeSelf, activeInHierarchy, enabled, loadedOrLoading);
    extractionState = dispositionExtraction(disposition, unavailable, true);
    imageryState = pendingImagery();
  } else if (collection === "componentFamilies") {
    kind = "component-family";
    sourceKey = scopedKey(artifact, sourceFieldPath, path);
    relevanceState = relevance("unknown", "This family count is metadata and does not establish map traversal or player relevance.");
    runtimeState = runtime("unknown", "A family query provides counts, but no source-scene load state for this family record.");
    extractionState = dispositionExtraction(disposition, unavailable, false);
    imageryState = notApplicableImagery("A component-family count is metadata, not a basemap.");
  } else {
    kind = "behaviour-type";
    sourceKey = scopedKey(artifact, textAt(value.nativeType), path);
    relevanceState = relevance("unknown", "This behaviour-type inventory is metadata; its map relevance is not established by the type name.");
    runtimeState = runtime("unknown", "A behaviour-type count does not identify a loaded scene or a traversed source.");
    extractionState = extraction("extracted", "The runtime exported this behaviour-type count as metadata.");
    imageryState = notApplicableImagery("A behaviour-type count is metadata, not a basemap.");
  }

  const reach = unusedReference
    ? reachability("unused", "This optional scene-reference field is null, empty, or a negative sentinel; this does not classify its owner as unused.")
    : observedReachability(evidenceReachable);
  if (unusedReference) relevanceState = relevance("not-relevant", "This optional reference field is unset; the owning record remains independently inventoried.");
  return makeEntry(artifact, path, sourceKey, kind, sourceFieldPath, sceneNativeId, relevanceState, reach, runtimeState, extractionState, imageryState);
}

function addInventoryEntries(input: CoverageInput, entries: CoverageEntry[]): void {
  for (const collection of INVENTORY_COLLECTIONS) {
    const rows = input.inventory[collection];
    for (let index = 0; index < rows.length; index++) entries.push(inventoryEntry(input, collection, index));
  }
}

function npcSourceEntry(
  input: CoverageInput,
  entries: CoverageEntry[],
  collection: "producers" | "adventurerProducers" | "adventurerPopulationManagers",
  kind: "npc-producer" | "adventurer-zone" | "adventurer-manager",
): void {
  const artifact = "npc-producers" as const;
  const rows = input.npcProducers[collection] as readonly unknown[];
  for (let index = 0; index < rows.length; index++) {
    const path = `${collection}[${index}]`;
    const row = record(rows[index]) ?? {};
    const unavailable = unavailableAt(row);
    const sourcePath = textAt(row.sourcePath);
    const sourceFieldPath = sourcePath ?? path;
    const sourceKey = scopedKey(artifact, sourcePath, path);
    const sourceSceneValue = row.sourceScene;
    const sourceSceneRecord = record(sourceSceneValue);
    const sourceSceneLoaded = sourceSceneRecord !== null && sourceSceneRecord.isLoaded === true;
    const sceneNativeId = sceneId(input, artifact, sourceSceneValue);
    const reach = unavailable === null
      ? observedReachability(sourceSceneLoaded)
      : reachability("unknown", `The probe marked this source unavailable: ${unavailable}`);
    let extractionState = unavailable === null
      ? extraction("extracted", "The probe exported the NPC source and its producer-rule fields.")
      : extraction("failed", `The probe marked this source unavailable: ${unavailable}`);
    if (kind === "adventurer-zone" && unavailable === null) {
      const rules = record(row.candidateRules);
      if (rules !== null && rules.available === false) {
        extractionState = extraction("unsupported", "The adventurer zone is retained, but its candidate source is not resolved; candidateRules.available=false does not establish complete extraction.");
      }
    }
    entries.push(makeEntry(
      artifact,
      path,
      sourceKey,
      kind,
      sourceFieldPath,
      sceneNativeId,
      relevance("relevant", "This observed NPC source is part of the requested world coverage."),
      reach,
      unavailable === null ? npcRuntime(row) : runtime("unknown", `The probe marked this source unavailable: ${unavailable}`),
      extractionState,
      pendingImagery(),
    ));
  }
}

function npcObservationEntries(input: CoverageInput, entries: CoverageEntry[]): void {
  const artifact = "npc-producers" as const;
  const lists = ["currentNPCs", "currentPersistentNPCs", "currentAdventurers"] as const;
  for (const list of lists) {
    const rows = input.npcProducers.observations[list] as readonly unknown[];
    for (let index = 0; index < rows.length; index++) {
      const path = `observations.${list}[${index}]`;
      const row = record(rows[index]) ?? {};
      const unavailable = unavailableAt(row);
      const sourceFieldPath = path;
      const sourceKey = scopedKey(artifact, null, path);
      const sceneNativeId = sceneId(input, artifact, row.sourceScene);
      const nativeScene = record(row.sourceScene);
      const reachable = nativeScene !== null && nativeScene.isLoaded === true;
      entries.push(makeEntry(
        artifact,
        path,
        sourceKey,
        "runtime-observation",
        sourceFieldPath,
        sceneNativeId,
        relevance("relevant", "This transient observation is evidence for a runtime source and does not replace its authored source."),
        unavailable === null
          ? observedReachability(reachable)
          : reachability("unknown", `The probe marked this observation unavailable: ${unavailable}`),
        unavailable === null ? observationRuntime(row) : runtime("unknown", `The probe marked this observation unavailable: ${unavailable}`),
        unavailable === null
          ? extraction("extracted", "The probe exported this transient runtime observation.")
          : extraction("failed", `The probe marked this observation unavailable: ${unavailable}`),
        notApplicableImagery("A transient runtime observation is not a basemap."),
      ));
    }
  }
}

function npcTemplateEntries(input: CoverageInput, entries: CoverageEntry[]): void {
  const artifact = "npc-producers" as const;
  const rows = input.npcProducers.requirementTemplates;
  for (let index = 0; index < rows.length; index++) {
    const path = `requirementTemplates[${index}]`;
    const row = rows[index]!;
    const sourceFieldPath = textAt(row.sourceFieldPath) ?? path;
    const sourcePath = sourcePathFromField(sourceFieldPath);
    const sceneNativeId = sourcePath === null ? null : contextSceneId(input, artifact, sourcePath);
    const reachable = sourcePath !== null && observationContext(input, artifact, sourcePath) !== null;
    entries.push(makeEntry(
      artifact,
      path,
      scopedKey(artifact, sourceFieldPath, path),
      "requirement-template",
      sourceFieldPath,
      sceneNativeId,
      relevance("relevant", "This requirement template supplies conditions for an authored source."),
      reachable
        ? reachability("reachable", "The template source path exactly matches this probe's loaded-scene context.")
        : reachability("unknown", "The template has no explicit loaded-scene association in this probe."),
      runtime("unknown", "A requirement template record does not expose a runtime scene load state."),
      extraction("extracted", "The probe exported this requirement template and retained its requirement groups."),
      notApplicableImagery("A requirement template is not a basemap."),
    ));
  }
}

function addNpcEntries(input: CoverageInput, entries: CoverageEntry[]): void {
  npcSourceEntry(input, entries, "producers", "npc-producer");
  npcSourceEntry(input, entries, "adventurerProducers", "adventurer-zone");
  npcSourceEntry(input, entries, "adventurerPopulationManagers", "adventurer-manager");
  npcTemplateEntries(input, entries);
  npcObservationEntries(input, entries);
}

function addWorldEntries(input: CoverageInput, entries: CoverageEntry[]): void {
  const artifact = "world-sources" as const;
  for (const collection of WORLD_COLLECTIONS) {
    const rows = input.worldSources[collection] as readonly unknown[];
    for (let index = 0; index < rows.length; index++) {
      const path = `${collection}[${index}]`;
      const row = record(rows[index]) ?? {};
      const unavailable = unavailableAt(row);
      const sourceFieldPath = worldSourceFieldPath(row, path);
      const sourceSceneValue = sourceScene(row.source);
      const sourceSceneRecord = record(sourceSceneValue);
      const sourceSceneLoaded = sourceSceneRecord !== null && contextLoaded(input, artifact, sourceSceneRecord);
      const sceneNativeId = sceneId(input, artifact, sourceSceneValue);
      const reach = unavailable === null
        ? observedReachability(sourceSceneLoaded)
        : reachability("unknown", `The probe marked this source unavailable: ${unavailable}`);
      const extractionState = dispositionExtraction(row.disposition, unavailable, false);
      entries.push(makeEntry(
        artifact,
        path,
        worldSourceKey(artifact, row, path),
        "world-source",
        sourceFieldPath,
        sceneNativeId,
        relevance("relevant", "This observed world source belongs to an inventoried content family."),
        reach,
        unavailable === null
          ? worldRuntime(input, artifact, row)
          : runtime("unknown", `The probe marked this source unavailable: ${unavailable}`),
        extractionState,
        pendingImagery(),
      ));
    }
  }
}

export function buildCoverageEntries(input: CoverageInput): CoverageEntry[] {
  const entries: CoverageEntry[] = [];
  addInventoryEntries(input, entries);
  addNpcEntries(input, entries);
  addWorldEntries(input, entries);
  return entries;
}
