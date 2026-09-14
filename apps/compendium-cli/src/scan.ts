import { randomUUID } from "node:crypto";
import { mkdir, readdir, rm } from "node:fs/promises";
import { relative, resolve } from "node:path";
import { Assert } from "typebox/value";
import {
  ObservationContextSchema,
  RuntimeScanStateSchema,
  ScanPlanSchema,
  ScanTargetEnvelopeSchema,
  WorldInventorySchema,
  canonicalJson,
  schemaRegistry,
  type ArtifactRunManifest,
  type CompendiumConfig,
  type ScanTargetEnvelope,
  type SchemaIdentityReference,
  type WorldInventory,
} from "@afallon/contracts";
import { ArtifactStore, beginArtifactRun, fingerprintStep, type ArtifactRun } from "@afallon/artifacts";
import type { Runtime } from "@afallon/runtime";
import {
  PlannedStreamTargetController,
  RuntimeProbeStateReader,
  ScanCollectorSuite,
  ScanStateMachine,
  SceneTargetController,
  createRuntimeStateProbeBundle,
  createScanCollectorBundles,
  createTraversalProbeBundles,
  indexScanTargets,
  validateScanPlan,
  type ScanCollectorBundle,
} from "@afallon/scan";

export interface ScanCommandInput {
  readonly config: CompendiumConfig;
  readonly buildId: string;
  readonly diagnosticRevision: string;
  readonly plan: unknown;
}

export interface ScanCommandResult {
  readonly manifestPath: string;
  readonly manifest: ArtifactRunManifest;
  readonly targets: readonly ScanTargetEnvelope[];
}

export async function runScanCommand(runtime: Runtime, input: ScanCommandInput): Promise<ScanCommandResult> {
  Assert(ScanPlanSchema, input.plan);
  const requestedPlan = structuredClone(input.plan);
  const store = new ArtifactStore(input.config.outputRoot);
  const workingDirectory = resolve(store.root, `.scan-${randomUUID()}`);
  await mkdir(workingDirectory, { recursive: true });
  const planBytes = new TextEncoder().encode(`${canonicalJson(requestedPlan)}\n`);
  const planObject = await store.putBytes(planBytes);
  const planIdentity = { sha256: planObject.sha256, bytes: planObject.bytes };
  const collectorBundles = await createScanCollectorBundles();
  let run: ArtifactRun | null = null;
  try {
    const inventory = await collectPlanningInventory(runtime, input.config.character, collectorBundles, workingDirectory);
    const plan = validateScanPlan(requestedPlan, indexScanTargets(inventory));
    const schemas = scanSchemaIdentities(collectorBundles);
    const fingerprint = await fingerprintStep({
      entrypoint: import.meta.path,
      buildId: input.buildId,
      settings: { character: input.config.character, targetTimeoutMs: plan.targetTimeoutMs },
      schemas,
      inputs: { plan: planIdentity },
    });
    run = await beginArtifactRun(store, {
      buildId: input.buildId,
      operation: "scan",
      settings: { character: input.config.character, targetTimeoutMs: plan.targetTimeoutMs },
      schemas,
      implementationFingerprint: fingerprint.implementation,
      cacheKey: fingerprint.cacheKey,
      probeHashes: fingerprint.probeHashes,
      diagnosticRevision: input.diagnosticRevision,
      inputs: { plan: planIdentity },
    });
    await run.addArtifact("plan.json", planObject, { mediaType: "application/json", schemaId: schemaRegistry.identify(ScanPlanSchema).id });

    const stateBundle = await createRuntimeStateProbeBundle();
    const traversalBundles = await createTraversalProbeBundles();
    const stateReader = new RuntimeProbeStateReader(runtime, stateBundle);
    const scanner = new ScanStateMachine({ buildId: input.buildId, character: input.config.character, outputDirectory: workingDirectory, stateReader });
    const suite = new ScanCollectorSuite(runtime, input.config.character, collectorBundles);
    const sceneController = new SceneTargetController(runtime, traversalBundles.sceneVisit, input.config.character, plan.targetTimeoutMs);
    const placementBundle = requireCollector(collectorBundles, "placement-snapshot").bundle;
    const targets: ScanTargetEnvelope[] = [];

    for (const [targetIndex, target] of plan.targets.entries()) {
      const collect = async (directory: string) => (await suite.collect(target, directory)).map(item => item.artifact);
      const envelope = target.kind === "current-scene"
        ? await scanner.scanCurrentScene(targetIndex, collect)
        : target.kind === "build-scene"
          ? await scanner.scanBuildScene(target, targetIndex, sceneController, collect)
          : await scanner.scanStreamedSource(target, targetIndex, new PlannedStreamTargetController(
              runtime,
              sceneController,
              traversalBundles.streamVisit,
              placementBundle,
              stateReader,
              inventory,
              input.config.character,
              plan.targetTimeoutMs,
            ), collect);
      targets.push(envelope);
      await registerTargetDirectory(store, run, workingDirectory, envelope);
    }

    await runtime.complete();
    const cleanup = await store.putFile(runtime.cleanupReceiptPath);
    await run.addArtifact("runtime-cleanup.json", cleanup, { mediaType: "application/json" });
    const incomplete = targets.filter(target => target.outcome !== "succeeded");
    const manifest = incomplete.length === 0
      ? await run.succeed()
      : await run.fail(new Error(`Scan did not complete ${incomplete.length} of ${targets.length} targets: ${incomplete.map(target => `${target.targetIdentity}=${target.outcome}`).join(", ")}.`));
    return { manifestPath: run.manifestPath, manifest, targets };
  } catch (error) {
    if (run !== null) {
      const failed = await run.fail(error).then(() => true, () => false);
      if (failed) throw new Error(`Scan failed; evidence is preserved in ${run.manifestPath}.`, { cause: error });
    }
    throw error;
  } finally {
    await rm(workingDirectory, { recursive: true, force: true });
  }
}

async function collectPlanningInventory(runtime: Runtime, character: string, bundles: readonly ScanCollectorBundle[], outputDirectory: string): Promise<WorldInventory> {
  const bundle = requireCollector(bundles, "world-inventory").bundle;
  const result = await runtime.runProbe(bundle, resolve(outputDirectory, "planning-world-inventory.json"), {
    parameters: { researchCharacter: character },
    captureContext: true,
  });
  Assert(WorldInventorySchema, result.value);
  return result.value;
}

function requireCollector(bundles: readonly ScanCollectorBundle[], name: string): ScanCollectorBundle {
  const bundle = bundles.find(candidate => candidate.name === name);
  if (bundle === undefined) throw new Error(`Scan collector is not registered: ${name}.`);
  return bundle;
}

function scanSchemaIdentities(bundles: readonly ScanCollectorBundle[]): SchemaIdentityReference[] {
  const identities = [
    schemaRegistry.identify(ObservationContextSchema),
    schemaRegistry.identify(ScanPlanSchema),
    schemaRegistry.identify(ScanTargetEnvelopeSchema),
    schemaRegistry.identify(RuntimeScanStateSchema),
    ...bundles.map(bundle => bundle.bundle.schemaIdentity),
  ];
  return [...new Map(identities.map(identity => [identity.id, { id: identity.id, sha256: identity.sha256 }])).values()].sort((left, right) => left.id.localeCompare(right.id));
}

async function registerTargetDirectory(store: ArtifactStore, run: ArtifactRun, workingDirectory: string, envelope: ScanTargetEnvelope): Promise<void> {
  const directory = resolve(workingDirectory, `target-${envelope.targetIndex}`);
  const schemaByFile = new Map(envelope.artifacts.map(artifact => [`${artifact.name}.json`, artifact.schema.id]));
  for (const artifact of envelope.artifacts.filter(artifact => artifact.family !== "coverage")) schemaByFile.set(`${artifact.name}.context.json`, schemaRegistry.identify(ObservationContextSchema).id);
  schemaByFile.set("envelope.json", schemaRegistry.identify(ScanTargetEnvelopeSchema).id);
  schemaByFile.set("state-started.json", schemaRegistry.identify(RuntimeScanStateSchema).id);
  schemaByFile.set("state-completed.json", schemaRegistry.identify(RuntimeScanStateSchema).id);
  for (const file of await filesBelow(directory)) {
    const relativePath = relative(directory, file).split("\\").join("/");
    const object = await store.putFile(file);
    const declared = envelope.artifacts.find(artifact => `${artifact.name}.json` === relativePath);
    if (declared !== undefined && (declared.content.sha256 !== object.sha256 || declared.content.bytes !== object.bytes)) {
      throw new Error(`Scan artifact changed before registration: target-${envelope.targetIndex}/${relativePath}.`);
    }
    await run.addArtifact(`targets/${String(envelope.targetIndex).padStart(3, "0")}/${relativePath}`, object, {
      mediaType: "application/json",
      schemaId: schemaByFile.get(relativePath) ?? null,
    });
  }
}

async function filesBelow(directory: string): Promise<string[]> {
  const files: string[] = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) files.push(...await filesBelow(path));
    else if (entry.isFile()) files.push(path);
  }
  return files.sort((left, right) => left.localeCompare(right));
}
