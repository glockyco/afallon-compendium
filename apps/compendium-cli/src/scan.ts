import { randomUUID } from "node:crypto";
import { mkdir, readdir, rm } from "node:fs/promises";
import { dirname, relative, resolve } from "node:path";
import { Assert } from "typebox/value";
import {
  ObservationContextSchema, RuntimeScanStateSchema, ScanPlanSchema, ScanPlanningEvidenceSchema, ScanTargetEnvelopeSchema, WorldInventorySchema,
  canonicalJson, schemaRegistry,
  type ArtifactRunManifest, type CompendiumConfig, type ContentIdentity, type RuntimeScanState, type ScanPlanningEvidence, type ScanTargetEnvelope, type SchemaIdentityReference,
} from "@afallon/contracts";
import { ArtifactStore, beginArtifactRun, createArtifactLease, fingerprintStep, selectLatestSuccess, type ArtifactRun } from "@afallon/artifacts";
import type { Runtime } from "@afallon/runtime";
import {
  DERIVED_SCAN_SCHEMAS, PlannedStreamTargetController, RuntimeProbeStateReader, ScanCollectorSuite, ScanStateMachine, SceneTargetController,
  createRuntimeStateProbeBundle, createScanCollectorBundles, createTraversalProbeBundles, indexScanTargets, targetIdentity,
  validateInventoryContext, validateObservationContext, validateScanPlan, validateScanPlanStructure, type ScanCollectorBundle,
} from "@afallon/scan";

export interface ScanCommandInput {
  readonly config: CompendiumConfig;
  readonly buildId: string;
  readonly diagnosticRevision: string;
  readonly plan: unknown;
  readonly select?: boolean;
}

export interface ScanCommandResult {
  readonly manifestPath: string;
  readonly manifest: ArtifactRunManifest;
  readonly targets: readonly ScanTargetEnvelope[];
}

export async function runScanCommand(runtime: Runtime, input: ScanCommandInput): Promise<ScanCommandResult> {
  const requestedPlan = validateScanPlanStructure(input.plan);
  const store = new ArtifactStore(input.config.outputRoot);
  const workingDirectory = resolve(store.root, `.scan-${randomUUID()}`);
  const preparation = await createArtifactLease(store, { runId: `scan-preparation-${randomUUID()}`, buildId: input.buildId, operation: "scan", objects: [] });
  let run: ArtifactRun | undefined;
  let result: ScanCommandResult;
  const registered = new Map<string, ContentIdentity>();
  const targets: ScanTargetEnvelope[] = [];
  const register = async (file: string, name: string, schemaId: string | null, inputs: readonly ContentIdentity[] = [], mediaType = "application/json"): Promise<ContentIdentity> => {
    const previous = registered.get(name);
    if (previous !== undefined) return previous;
    if (run === undefined) throw new Error("Scan evidence cannot be registered before run admission.");
    const object = await run.putFile(file);
    await run.addArtifact(name, object, { mediaType, schemaId, references: inputs.map(content => ({ kind: "object", content })) });
    const identity = { sha256: object.sha256, bytes: object.bytes };
    registered.set(name, identity);
    return identity;
  };
  try {
    const planObject = await store.putBytes(new TextEncoder().encode(`${canonicalJson(requestedPlan)}\n`), preparation);
    const planIdentity = { sha256: planObject.sha256, bytes: planObject.bytes };
    const collectorBundles = await createScanCollectorBundles();
    const stateBundle = await createRuntimeStateProbeBundle();
    const traversalBundles = await createTraversalProbeBundles();
    const schemas = scanSchemaIdentities(collectorBundles);
    const fingerprint = await fingerprintStep({ entrypoint: import.meta.path, buildId: input.buildId, settings: { character: input.config.character, targetTimeoutMs: requestedPlan.targetTimeoutMs }, schemas, inputs: { plan: planIdentity } });
    run = await beginArtifactRun(store, {
      buildId: input.buildId, operation: "scan", settings: { character: input.config.character, targetTimeoutMs: requestedPlan.targetTimeoutMs }, schemas,
      implementationFingerprint: fingerprint.implementation, cacheKey: fingerprint.cacheKey, probeHashes: fingerprint.probeHashes,
      diagnosticRevision: input.diagnosticRevision, inputs: { plan: planIdentity },
    });
    await run.addArtifact("plan.json", planObject, { mediaType: "application/json", schemaId: schemaRegistry.identify(ScanPlanSchema).id });
    await mkdir(workingDirectory, { recursive: true });
    await mkdir(resolve(workingDirectory, "planning"));

    const steamManifest = resolve(dirname(dirname(input.config.gamePath)), "appmanifest_2597810.acf");
    const installed = await register(steamManifest, "planning/steam-manifest.acf", null, [], "text/plain");
    await store.verify(installed);
    const installedText = await Bun.file(store.objectPath(installed.sha256)).text();
    const buildIds = [...installedText.matchAll(/"buildid"\s+"(\d+)"/g)];
    if (!/"appid"\s+"2597810"/.test(installedText) || buildIds.length !== 1 || buildIds[0]![1] !== input.buildId) throw new Error("Installed Steam build evidence does not match the requested scan build.");

    const stateReader = new RuntimeProbeStateReader(runtime, stateBundle);
    const statePath = resolve(workingDirectory, "planning/state.json");
    const state = await stateReader.read(statePath);
    await register(statePath, "planning/state.json", schemaRegistry.identify(RuntimeScanStateSchema).id);
    if (state.character !== input.config.character) throw new Error("Planning state observed another character.");
    const inventoryPath = resolve(workingDirectory, "planning/inventory.json");
    const inventoryReply = await runtime.runProbe(requireCollector(collectorBundles, "world-inventory").bundle, inventoryPath, { parameters: { researchCharacter: input.config.character }, captureContext: true });
    const inventoryIdentity = await register(inventoryPath, "planning/inventory.json", schemaRegistry.identify(WorldInventorySchema).id);
    if (inventoryIdentity.sha256 !== inventoryReply.reference.sha256 || inventoryIdentity.bytes !== inventoryReply.reference.byteSize) throw new Error("Planning inventory changed before registration.");
    const contextPath = resolve(workingDirectory, "planning/context.json");
    await Bun.write(contextPath, `${canonicalJson(inventoryReply.observationContext)}\n`);
    const contextIdentity = await register(contextPath, "planning/context.json", schemaRegistry.identify(ObservationContextSchema).id);
    const context = validateObservationContext(inventoryReply.observationContext, input.config.character, "Planning inventory", { researchCharacter: state.character, frame: state.frame, scene: state.scene, gameSceneNativeId: state.gameSceneNativeId });
    const inventory = inventoryReply.value;
    Assert(WorldInventorySchema, inventory);
    validateInventoryContext(inventory, context);
    const plan = validateScanPlan(requestedPlan, indexScanTargets(inventory));
    const planning: ScanPlanningEvidence = { schemaVersion: "compendium.scan-planning-evidence.v1", buildId: input.buildId, sourceRunId: run.runId, plan: planIdentity, inventory: inventoryIdentity, observationContext: contextIdentity, targets: plan.targets.map(target => ({ target, targetIdentity: targetIdentity(target) })) };
    Assert(ScanPlanningEvidenceSchema, planning);
    const planningPath = resolve(workingDirectory, "planning/resolved-targets.json");
    await Bun.write(planningPath, `${canonicalJson(planning)}\n`);
    await register(planningPath, "planning/resolved-targets.json", schemaRegistry.identify(ScanPlanningEvidenceSchema).id, [planIdentity, inventoryIdentity, contextIdentity, installed]);
    await run.setPhase("execution");
    const scanner = new ScanStateMachine({ buildId: input.buildId, sourceRunId: run.runId, character: input.config.character, outputDirectory: workingDirectory, stateReader });
    const suite = new ScanCollectorSuite(runtime, input.config, input.buildId, collectorBundles);
    const sceneController = new SceneTargetController(runtime, traversalBundles.sceneVisit, input.config.character, plan.targetTimeoutMs);
    const placementBundle = requireCollector(collectorBundles, "placement-snapshot").bundle;
    let stopped = false;
    for (const [targetIndex, target] of plan.targets.entries()) {
      const prefix = `targets/${String(targetIndex).padStart(3, "0")}`;
      const collect = async (directory: string, started: RuntimeScanState) => (await suite.collect(target, directory,
        (file, name, schemaId, inputs) => register(file, `${prefix}/${name}`, schemaId, inputs, schemaId === null ? "application/octet-stream" : "application/json"),
        target.kind === "current-scene" ? { researchCharacter: started.character, frame: started.frame, scene: started.scene, gameSceneNativeId: started.gameSceneNativeId } : undefined,
      )).map(item => item.artifact);
      const envelope: ScanTargetEnvelope = stopped
        ? await scanner.notAttempted(target, targetIndex, null, "A prior target did not succeed. No further traversal was attempted.")
        : target.kind === "current-scene" ? await scanner.scanCurrentScene(targetIndex, collect)
        : target.kind === "build-scene" ? await scanner.scanBuildScene(target, targetIndex, sceneController, collect)
        : await scanner.scanStreamedSource(target, targetIndex, new PlannedStreamTargetController(runtime, sceneController, traversalBundles.streamVisit, placementBundle, stateReader, inventory, input.config.character, plan.targetTimeoutMs), collect);
      targets.push(envelope);
      const references = envelope.artifacts.flatMap(artifact => [artifact.content, ...artifact.inputs, ...(artifact.observationContext === null ? [] : [artifact.observationContext])]);
      await register(resolve(workingDirectory, `target-${targetIndex}/envelope.json`), `${prefix}/envelope.json`, schemaRegistry.identify(ScanTargetEnvelopeSchema).id, references);
      stopped ||= envelope.outcome !== "succeeded";
    }
    await retainScratch(workingDirectory, registered, register);
    await run.setPhase("finalization");
    await runtime.complete();
    await register(runtime.cleanupReceiptPath, "runtime-cleanup.json", "compendium.runtime-owner.v1");
    const incomplete = targets.filter(target => target.outcome !== "succeeded");
    const manifest = incomplete.length === 0 ? await run.succeed() : await run.fail(new Error(`Scan did not complete ${incomplete.length} of ${targets.length} targets: ${incomplete.map(target => `${target.targetIdentity}=${target.outcome}`).join(", ")}.`));
    result = { manifestPath: run.manifestPath, manifest, targets };
  } catch (error) {
    if (run !== undefined && run.status === "running") {
      const errors = [error];
      try { await runtime.close(); } catch (cleanupError) { errors.push(cleanupError); }
      try { if (await Bun.file(runtime.cleanupReceiptPath).exists()) await register(runtime.cleanupReceiptPath, "runtime-cleanup.json", null); } catch (receiptError) { errors.push(receiptError); }
      try { await retainScratch(workingDirectory, registered, register); } catch (storageError) { errors.push(storageError); }
      await run.fail(errors.length === 1 ? error : new AggregateError(errors, "Scan failed with preparation or cleanup errors."));
      throw new Error(`Scan failed; evidence is preserved in ${run.manifestPath}.`, { cause: error });
    }
    throw error;
  } finally {
    try {
      await preparation.release();
      if (run !== undefined && run.status !== "running") await rm(workingDirectory, { recursive: true, force: true });
      if (run?.status === "succeeded" && input.select === true) await selectLatestSuccess(store, run.manifestPath);
    } finally { await run?.release(); }
  }
  return result;
}

function requireCollector(bundles: readonly ScanCollectorBundle[], name: string): ScanCollectorBundle {
  const bundle = bundles.find(candidate => candidate.name === name);
  if (bundle === undefined) throw new Error(`Scan collector is not registered: ${name}.`);
  return bundle;
}

function scanSchemaIdentities(bundles: readonly ScanCollectorBundle[]): SchemaIdentityReference[] {
  const identities: SchemaIdentityReference[] = [ObservationContextSchema, ScanPlanSchema, ScanPlanningEvidenceSchema, ScanTargetEnvelopeSchema, RuntimeScanStateSchema, ...DERIVED_SCAN_SCHEMAS].map(schema => schemaRegistry.identify(schema));
  identities.push(...bundles.map(bundle => bundle.bundle.schemaIdentity));
  return [...new Map(identities.map(identity => [identity.id, { id: identity.id, sha256: identity.sha256 }])).values()].sort((left, right) => left.id.localeCompare(right.id));
}

async function retainScratch(directory: string, registered: ReadonlyMap<string, ContentIdentity>, register: (file: string, name: string, schemaId: string | null) => Promise<ContentIdentity>): Promise<void> {
  const visit = async (path: string): Promise<void> => {
    let entries;
    try { entries = await readdir(path, { withFileTypes: true }); }
    catch (error) { if (error !== null && typeof error === "object" && "code" in error && error.code === "ENOENT") return; throw error; }
    for (const entry of entries) {
      const file = resolve(path, entry.name);
      if (entry.isDirectory()) await visit(file);
      else if (entry.isFile()) {
        const name = relative(directory, file).split("\\").join("/").replace(/^target-(\d+)\//, (_, index: string) => `targets/${index.padStart(3, "0")}/`);
        if (!registered.has(name)) await register(file, name, null);
      }
    }
  };
  await visit(directory);
}
