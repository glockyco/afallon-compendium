import { createHash } from "node:crypto";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { Assert } from "typebox/value";
import type { Static, TSchema } from "typebox";
import { buildIdentity, hashFile, toolRevision } from "./build";
import type { CompendiumConfig } from "./config";
import { CanonicalSchema, SupportSchema, RelationshipsSchema, ObservationContextSchema, canonicalKinds } from "./contracts";
import { createCoverageLedger, type CoverageInput } from "./coverage";
import { NpcProducersSchema, validateNpcProducers } from "./npc-extraction";
import { PlacementSnapshotSchema, type PlacementSnapshot } from "./placement-contracts";
import { beginRun } from "./runs";
import type { Runtime } from "./runtime";
import { SceneVisitSchema, StreamVisitSchema, TraversalPlanSchema, type TraversalPlan } from "./traversal-contracts";
import { WorldInventorySchema, validateWorldInventory } from "./world-inventory";
import { WorldSourcesSchema, validateWorldSources } from "./world-extraction";

export async function traverse(runtime: Runtime, config: CompendiumConfig, identity: Awaited<ReturnType<typeof buildIdentity>>, plan: TraversalPlan) {
  Assert(TraversalPlanSchema, plan);
  const planText = JSON.stringify(plan, null, 2) + "\n";
  const inputHashes: Record<string, string> = { ...identity.inputHashes, "runtime-owner": runtime.ownerSourceHash, plan: createHash("sha256").update(planText).digest("hex") };
  const probeNames = ["scene-visit", "stream-visit", "placement-snapshot", "canonical", "support", "relationships", "conditions", "npc-producers", "world-sources", "world-inventory"];
  for (const name of probeNames) inputHashes[`probe:${name}`] = await hashFile(resolve(import.meta.dir, `probes/${name}.csx`));
  for (const name of ["runtime", "traversal", "traversal-contracts", "contracts", "placement-contracts", "npc-extraction", "world-extraction", "world-inventory", "coverage", "coverage-sources", "coverage-diagnostics", "runs"]) inputHashes[`tool:${name}`] = await hashFile(resolve(import.meta.dir, `${name}.ts`));
  const run = await beginRun(config.outputRoot, {
    ...identity, inputHashes, toolRevision: await toolRevision(), command: "traverse",
    settings: { character: config.character, runtimeOwnerToken: runtime.ownerToken, plan, scope: "bounded research traversal; inactive streams and unresolved sources are not complete coverage" },
  });
  const conditions = resolve(import.meta.dir, "probes/conditions.csx");
  const parameters = { researchCharacter: config.character };
  const steps: object[] = [];
  async function artifact<T extends TSchema>(name: string, path: string, schema: T, contextual = false) {
    const result = await runtime.probe(resolve(import.meta.dir, `probes/${name}.csx`), resolve(run.directory, path), {
      parameters, captureContext: contextual,
      preludeFile: ["relationships", "npc-producers", "world-sources"].includes(name) ? conditions : undefined,
    });
    Assert(schema, result.value);
    const record = await run.addArtifact(path);
    if (record.sha256 !== result.reference.sha256) throw new Error(`The ${name} artifact changed before registration.`);
    let observation: CoverageInput["observations"]["world-sources"] | undefined;
    if (contextual) {
      Assert(ObservationContextSchema, result.observationContext);
      const context = result.observationContext;
      if (context.started.researchCharacter !== config.character || context.completed.researchCharacter !== config.character || context.started.scene.handle !== context.completed.scene.handle || context.started.gameSceneNativeId !== context.completed.gameSceneNativeId || context.completed.frame < context.started.frame) throw new Error(`The ${name} probe crossed an observation boundary.`);
      observation = { ...context, artifactSha256: record.sha256 };
      const contextPath = path.replace(/\.json$/, ".context.json");
      await Bun.write(resolve(run.directory, contextPath), JSON.stringify(observation, null, 2) + "\n");
      await run.addArtifact(contextPath);
    }
    return { value: result.value as Static<T>, observation };
  }
  try {
    await Bun.write(resolve(run.directory, "plan.json"), planText);
    await run.addArtifact("plan.json");
    await mkdir(resolve(run.directory, "reference"));
    const canonical = (await artifact("canonical", "reference/canonical.json", CanonicalSchema)).value;
    const support = (await artifact("support", "reference/support.json", SupportSchema)).value;
    const relationships = (await artifact("relationships", "reference/relationships.json", RelationshipsSchema)).value;
    const ids: Record<string, Set<number>> = {};
    for (const kind of canonicalKinds) {
      const rows = canonical[kind];
      ids[kind] = new Set(rows.map(row => row.nativeId));
      if (rows.length !== canonical.sourceTotals[kind] || rows.length !== canonical.exportedTotals[kind] || ids[kind]!.size !== rows.length || rows.some(row => row.nativeId < 0 || row.nativeId !== row.sourceKey)) throw new Error(`Canonical ${kind} identities or counts do not reconcile.`);
    }
    for (const [kind, rows] of Object.entries(support.tables)) {
      ids[kind] = new Set(rows.map(row => row.entry.nativeId));
      if (rows.length !== support.sourceTotals[kind] || ids[kind]!.size !== rows.length || rows.some(row => row.entry.nativeId !== row.sourceKey)) throw new Error(`Supporting ${kind} identities or counts do not reconcile.`);
    }
    ids.merchantTables = new Set(relationships.merchantTables.map(row => row.nativeId));
    for (const [index, step] of plan.steps.entries()) {
      if (!ids.scenes?.has(step.sceneNativeId)) throw new Error(`Unknown requested scene ${step.sceneNativeId}.`);
      const prefix = `steps/${index}`;
      await mkdir(resolve(run.directory, prefix, "raw"), { recursive: true });
      const deadline = Date.now() + plan.stepTimeoutMs;
      const timer = setTimeout(() => runtime.cancel(new Error(`Traversal step ${index} exceeded its deadline.`)), plan.stepTimeoutMs);
      const checkDeadline = () => {
        runtime.signal.throwIfAborted();
        if (Date.now() >= deadline) throw new Error(`Traversal step ${index} exceeded its deadline.`);
      };
      async function control<T extends typeof SceneVisitSchema | typeof StreamVisitSchema>(name: string, schema: T, args: Record<string, unknown>, file: string): Promise<Static<T>> {
        checkDeadline();
        const reply = await runtime.probe(resolve(import.meta.dir, `probes/${name}.csx`), resolve(run.directory, prefix, file), { parameters: { ...parameters, ...args } });
        Assert(schema, reply.value);
        const state = reply.value as Static<T>;
        if (args.action === "start" || state.phase === "ready" || state.phase === "restored") {
          const record = await run.addArtifact(`${prefix}/${file}`);
          if (record.sha256 !== reply.reference.sha256) throw new Error(`The ${name} control artifact changed before registration.`);
        }
        checkDeadline();
        return state;
      }
      async function settle<T extends typeof SceneVisitSchema | typeof StreamVisitSchema>(name: string, schema: T, key: string, action: "poll" | "restore", phase: "ready" | "restored", file: string, sceneHandle?: number): Promise<Static<T>> {
        while (true) {
          const state = await control(name, schema, { action, key, sceneHandle }, file);
          if (state.key !== key) throw new Error("Traversal returned another controller key.");
          if (state.phase === phase) return state;
          await Bun.sleep(100);
        }
      }
      try {
        const started = await control("scene-visit", SceneVisitSchema, { action: "start", targetSceneNativeId: step.sceneNativeId }, "scene-start.json");
        const scene = await settle("scene-visit", SceneVisitSchema, started.key, "poll", "ready", "scene-ready.json");
        const before = (await artifact("placement-snapshot", `${prefix}/before.json`, PlacementSnapshotSchema)).value;
        if (before.context.scene.handle !== scene.sceneHandle || before.context.gameSceneNativeId !== step.sceneNativeId) throw new Error("Scene changed before stream selection.");
        const requested = new Set(step.streamAssetGuids);
        const selected = before.streams.filter(row => row.assetGuid !== null && requested.has(row.assetGuid));
        for (const guid of requested) if (!selected.some(row => row.assetGuid === guid)) throw new Error(`Requested stream ${guid} was not found in scene ${step.sceneNativeId}.`);
        if (selected.length > 32) throw new Error("The stream selection exceeds the 32-loader bound.");
        let stream: Static<typeof StreamVisitSchema> | undefined;
        if (selected.length > 0) {
          stream = await control("stream-visit", StreamVisitSchema, { action: "start", sceneHandle: scene.sceneHandle, loaderInstanceIds: selected.map(row => row.componentInstanceId), holdSeconds: Math.ceil(plan.stepTimeoutMs / 1000) + 5 }, "stream-start.json");
          stream = await settle("stream-visit", StreamVisitSchema, stream.key, "poll", "ready", "stream-ready.json", scene.sceneHandle);
        }
        checkDeadline();
        const observations = {} as CoverageInput["observations"];
        const inventoryResult = await artifact("world-inventory", `${prefix}/raw/world-inventory.json`, WorldInventorySchema, true);
        observations["world-inventory"] = inventoryResult.observation!;
        const npcResult = await artifact("npc-producers", `${prefix}/raw/npc-producers.json`, NpcProducersSchema, true);
        observations["npc-producers"] = npcResult.observation!;
        const worldResult = await artifact("world-sources", `${prefix}/raw/world-sources.json`, WorldSourcesSchema, true);
        observations["world-sources"] = worldResult.observation!;
        const after = (await artifact("placement-snapshot", `${prefix}/after.json`, PlacementSnapshotSchema)).value;
        checkDeadline();
        for (const observation of Object.values(observations)) if (observation.completed.scene.handle !== scene.sceneHandle || observation.completed.gameSceneNativeId !== step.sceneNativeId) throw new Error("A traversal extraction observed another scene.");
        if (after.context.scene.handle !== scene.sceneHandle || after.context.gameSceneNativeId !== step.sceneNativeId) throw new Error("Scene changed during traversal extraction.");
        const unresolved: CoverageInput["validation"]["unresolved"] = [];
        const unset: CoverageInput["validation"]["unset"] = [];
        const reference = (source: string, targetKind: string, nativeId: number) => {
          if (nativeId < 0) unset.push({ source, targetKind, nativeId });
          else if (!ids[targetKind]?.has(nativeId)) unresolved.push({ source, targetKind, nativeId });
        };
        const inventoryValidation = validateWorldInventory(inventoryResult.value, canonical);
        validateNpcProducers(npcResult.value, reference);
        validateWorldSources(worldResult.value, reference);
        const validation = { inventoryDiagnostics: inventoryValidation.diagnostics, unresolved, unset };
        await Bun.write(resolve(run.directory, prefix, "validation.json"), JSON.stringify(validation, null, 2) + "\n");
        const validationArtifact = await run.addArtifact(`${prefix}/validation.json`);
        const coverage = createCoverageLedger({ buildId: identity.buildId, runId: run.runId, inventory: inventoryResult.value, npcProducers: npcResult.value, worldSources: worldResult.value, observations, validation: { ...validation, artifactSha256: validationArtifact.sha256 } });
        for (const item of Object.values(coverage.artifacts)) item.path = `${prefix}/${item.path}`;
        await Bun.write(resolve(run.directory, prefix, "coverage.json"), JSON.stringify(coverage, null, 2) + "\n");
        await run.addArtifact(`${prefix}/coverage.json`);
        const parentIds = new Map(after.nodes.map(node => [node.instanceId, node.parentInstanceId]));
        if (parentIds.size !== after.nodes.length || after.nodes.some(node => node.parentInstanceId !== null && !parentIds.has(node.parentInstanceId)) || after.components.some(component => !parentIds.has(component.gameObjectInstanceId))) throw new Error("Traversal snapshot has duplicate or missing hierarchy nodes.");
        const streamSources = stream?.rows.map(row => {
          if (row.skippedReason !== null) return { ...row, extraction: "pending", sourceComponentInstanceIds: [] };
          const observed = after.streams.find(item => item.componentInstanceId === row.loaderInstanceId);
          if (!observed || !observed.isLoaded || observed.isLoading || !observed.hasInstanceHandle || observed.loadedRootInstanceId !== row.rootInstanceId) throw new Error(`Stream ${row.assetGuid} changed during extraction.`);
          return { ...row, extraction: "observed", sourceComponentInstanceIds: componentsUnderRoot(after, parentIds, row.rootInstanceId!) };
        }) ?? [];
        if (stream) await settle("stream-visit", StreamVisitSchema, stream.key, "restore", "restored", "stream-restored.json", scene.sceneHandle);
        const restored = await settle("scene-visit", SceneVisitSchema, started.key, "restore", "restored", "scene-restored.json");
        if (!restored.sceneReady || restored.sceneNativeId !== started.sourceSceneNativeId) throw new Error("Traversal did not restore the source scene.");
        const report = { index, sceneNativeId: step.sceneNativeId, sceneHandle: scene.sceneHandle, streamSources, coverage: coverage.summary, restoration: restored };
        await Bun.write(resolve(run.directory, prefix, "step.json"), JSON.stringify(report, null, 2) + "\n");
        await run.addArtifact(`${prefix}/step.json`);
        steps.push({ index, sceneNativeId: step.sceneNativeId, selectedStreams: streamSources.length, skippedStreams: streamSources.filter(row => row.skippedReason !== null).length, report: `${prefix}/step.json`, coverage: coverage.summary });
      } finally { clearTimeout(timer); }
    }
    await runtime.complete();
    await Bun.write(resolve(run.directory, "runtime-cleanup.json"), Bun.file(runtime.cleanupReceiptPath));
    await run.addArtifact("runtime-cleanup.json");
    await run.succeed();
    return { manifest: run.manifestPath, steps, completeWorldCoverage: false };
  } catch (error) {
    await run.fail(error);
    console.error(`Failed traversal: ${run.manifestPath}`);
    throw error;
  }
}

function componentsUnderRoot(snapshot: PlacementSnapshot, parents: ReadonlyMap<number, number | null>, rootId: number): number[] {
  const belongs = new Map<number, boolean>([[rootId, true]]);
  function under(id: number): boolean {
    const cached = belongs.get(id);
    if (cached !== undefined) return cached;
    const visited: number[] = [];
    let current: number | null | undefined = id;
    while (current !== null && current !== undefined && !belongs.has(current)) {
      if (visited.length >= parents.size) throw new Error("Traversal snapshot has a hierarchy cycle.");
      visited.push(current); current = parents.get(current);
    }
    const result = current !== null && current !== undefined && belongs.get(current) === true;
    for (const node of visited) belongs.set(node, result);
    return result;
  }
  return snapshot.components.filter(component => under(component.gameObjectInstanceId)).map(component => component.instanceId);
}
