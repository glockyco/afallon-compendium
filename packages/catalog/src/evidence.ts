import { readFile, stat } from "node:fs/promises";
import type { Static, TSchema } from "typebox";
import { Assert } from "typebox/value";
import { ArtifactStore, resolveArtifactRun } from "@afallon/artifacts";
import { ArtifactRunManifestSchema, ArtworkSchema, CaptureSetSchema, canonicalJson, CanonicalSchema, RelationshipsSchema, LootRulesSchema, SupportSchema, LocalizationSchema, PlacementIdentityResultSchema, PlacementSnapshotSchema, NpcProducersSchema, WorldSourcesSchema, MapGeometrySchema, MapSpaceProfileSchema, SceneCatalogSchema, ScanTargetEnvelopeSchema, ObservationContextSchema, WorldInventorySchema, CoverageLedgerSchema, ScanCoverageSchema, ScanPlanningEvidenceSchema, validateScanTargetEnvelope, decodeContract, schemaRegistry, type ContentIdentity, type ScanTargetEnvelope, type ScanCollectorFamily, type ArtifactRunManifest, type WorldInventory } from "@afallon/contracts";
import { PlacementRolesSchema, type ArtifactReference, type NormalizedDatabaseInput } from "@afallon/contracts/catalog";
import { CatalogPlanSchema, CatalogImagerySchema, CoverageReviewSchema, CoveragePolicySchema, type CatalogPlan, type CatalogImagery, type CoverageAccountingInput, type VerifiedCoverageEvidence, type RoleEvidence } from "@afallon/contracts/catalog";
import { sourceIdentityRows } from "./placements";
import { identitySnapshotId } from "./identity-store";
import { coverageInventorySubjects, coverageTargetSubjects } from "./coverage-accounting";
import type { SceneContext, SourceRecord } from "./context";

const FAMILY_BY_SCHEMA: Readonly<Record<string, ScanCollectorFamily>> = {
  "compendium.canonical.v4": "canonical", "compendium.localization.v1": "canonical", "compendium.artwork.v1": "canonical",
  "compendium.world-inventory.v2": "inventory", "compendium.addressable-locations.v1": "inventory",
  "compendium.npc-producers.v3": "producers", "compendium.world-sources.v7": "producers",
  "compendium.placement-snapshot.v1": "placements", "compendium.placement-identities.v1": "placements", "compendium.serialized-assets.v1": "placements", "compendium.scene-source-issues.v2": "placements",
  "compendium.faction-roles.v1": "roles", "compendium.placement-roles.v1": "roles",
  "compendium.relationships.v1": "relationships", "compendium.loot-rules.v1": "relationships", "compendium.support.v1": "relationships",
  "compendium.scene-catalog.v1": "spatial", "compendium.map-geometry.v3": "spatial", "compendium.navigation-geometry.v2": "spatial",
  "compendium.scan-coverage.v1": "coverage", "compendium.coverage.v2": "coverage",
};

export function evidenceReference(identity: ContentIdentity): ArtifactReference {
  return { path: `objects/sha256/${identity.sha256.slice(0, 2)}/${identity.sha256.slice(2)}`, sha256: identity.sha256, bytes: identity.bytes };
}

export async function readObject<T extends TSchema>(store: ArtifactStore, identity: ContentIdentity, schema: T, target: string): Promise<Static<T>> {
  await store.verify(identity);
  return decodeContract(schema, JSON.parse(await readFile(store.objectPath(identity.sha256), "utf8")), { objectId: identity.sha256, target });
}

export function assertEvidencePointer(document: unknown, pointer: string, label: string): void {
  if (pointer === "") return;
  if (!pointer.startsWith("/") || /~(?![01])/.test(pointer)) throw new Error(`${label} has an invalid JSON pointer ${pointer}.`);
  let value = document;
  for (const encoded of pointer.slice(1).split("/")) {
    const key = encoded.replaceAll("~1", "/").replaceAll("~0", "~");
    if (value === null || typeof value !== "object" || !Object.hasOwn(value, key)) throw new Error(`${label} has an unresolved JSON pointer ${pointer}.`);
    value = Reflect.get(value, key);
  }
}

export interface AdmittedTarget { manifest: ContentIdentity; run: ArtifactRunManifest; envelope: ScanTargetEnvelope; reference: ContentIdentity }
export interface AdmittedObject<T> { value: T; reference: ArtifactReference; content: ContentIdentity }
export interface AdmittedCatalog {
  plan: CatalogPlan;
  canonical: AdmittedObject<Static<typeof CanonicalSchema>>;
  relationships: AdmittedObject<Static<typeof RelationshipsSchema>>;
  lootRules: AdmittedObject<Static<typeof LootRulesSchema>>;
  support: AdmittedObject<Static<typeof SupportSchema>>;
  artwork: AdmittedObject<Static<typeof ArtworkSchema>> | null;
  localization: AdmittedObject<Static<typeof LocalizationSchema>>;
  sceneCatalog: AdmittedObject<Static<typeof SceneCatalogSchema>>;
  profile: Static<typeof MapSpaceProfileSchema>;
  contexts: SceneContext[];
  sources: SourceRecord[];
  imagery: Array<{ reference: ContentIdentity; document: CatalogImagery }>;
  inventories: CoverageAccountingInput["inventories"];
  evidence: VerifiedCoverageEvidence[];
  review: CoverageAccountingInput["review"];
  policy: CoverageAccountingInput["policy"];
}

export function coverageExclusionSubjects(admitted: AdmittedCatalog, normalized: NormalizedDatabaseInput): NonNullable<CoverageAccountingInput["discoveredSubjects"]> {
  return normalized.exclusions.flatMap((exclusion) => {
    const placement = normalized.placements.find((row) => row.placementId === exclusion.key);
    if (!placement) throw new Error(`Exclusion ${exclusion.key} has no discovered placement.`);
    const inventoryReferences = admitted.inventories.filter(({ inventory }) => coverageTargetSubjects(inventory, placement.sceneNativeId, placement.scenePath, null).length > 0).map((inventory) => inventory.reference);
    if (inventoryReferences.length === 0) return [];
    const origins = admitted.contexts.flatMap((context) => context.identities.identities.flatMap((row, index) => row.placementId === placement.placementId ? [{ artifact: { sha256: context.identityReference.sha256, bytes: context.identityReference.bytes! }, runId: context.snapshotRunId, targetIdentity: context.snapshotPrefix, recordPath: `/identities/${index}` }] : []));
    return [{ subjectKey: placement.placementId, family: "spatial" as const, gameplay: normalized.roles.some((role) => role.placementId === placement.placementId), reachable: true, inventoryReferences: [...new Map(inventoryReferences.map((reference) => [reference.sha256, reference])).values()], origins }];
  });
}

export async function admitCatalogPlan(store: ArtifactStore, input: CatalogPlan): Promise<AdmittedCatalog> {
  Assert(CatalogPlanSchema, input);
  const plan: CatalogPlan = { ...input, scans: [...input.scans].sort((a, b) => a.sha256.localeCompare(b.sha256)), imagery: [...input.imagery].sort((a, b) => a.sha256.localeCompare(b.sha256)) };
  if (!plan.scans.some((value) => value.sha256 === plan.canonicalTarget.manifest.sha256 && value.bytes === plan.canonicalTarget.manifest.bytes)) throw new Error("The canonical target manifest is not an admitted scan.");
  const sources: SourceRecord[] = [];
  const evidence: VerifiedCoverageEvidence[] = [];
  const inventories: Array<{ reference: ContentIdentity; manifest: ContentIdentity; runId: string; targetIdentity: string; inventory: WorldInventory }> = [];
  const targets: AdmittedTarget[] = [];
  const sourceIndex = new Map<string, SourceRecord>();
  const register = (kind: string, identity: ContentIdentity, value: unknown, runId: string, targetIdentity: string) => {
    const key = `${kind}:${identity.sha256}`;
    const previous = sourceIndex.get(key);
    if (previous) {
      if (!previous.origins.some((origin) => origin.runId === runId && origin.targetIdentity === targetIdentity)) previous.origins.push({ runId, targetIdentity });
    } else {
      const source = { key, kind, reference: evidenceReference(identity), value, bytes: identity.bytes, runId, targetIdentity, origins: [{ runId, targetIdentity }] };
      sourceIndex.set(key, source); sources.push(source);
    }
  };
  for (const manifestIdentity of plan.scans) {
    const header = await readObject(store, manifestIdentity, ArtifactRunManifestSchema, "catalog scan manifest");
    if (header.input.operation !== "scan") throw new Error(`Catalog input ${manifestIdentity.sha256} is not scan evidence.`);
    const run = await resolveArtifactRun(store, manifestIdentity, { buildId: plan.buildId, operation: header.input.operation });
    register("scan-manifest", manifestIdentity, run, run.runId, "manifest");
    const planningOutputs = run.outputs.filter((output) => output.schemaId === "compendium.scan-planning-evidence.v1");
    if (run.input.operation === "scan" && planningOutputs.length !== 1) throw new Error(`Scan ${run.runId} requires exactly one planning record.`);
    const plannedTargets = new Set<string>();
    for (const output of planningOutputs) {
      const planning = await readObject(store, output.content, ScanPlanningEvidenceSchema, `${run.runId}/planning`);
      if (planning.buildId !== plan.buildId || planning.sourceRunId !== run.runId) throw new Error(`Scan ${run.runId} planning identity does not match.`);
      const context = await readObject(store, planning.observationContext, ObservationContextSchema, `${run.runId}/planning/context`);
      if (context.started.researchCharacter !== context.completed.researchCharacter || context.started.scene.handle !== context.completed.scene.handle) throw new Error(`Scan ${run.runId} planning context changed.`);
      const inventory = await readObject(store, planning.inventory, WorldInventorySchema, `${run.runId}/planning/inventory`);
      inventories.push({ reference: planning.inventory, manifest: manifestIdentity, runId: run.runId, targetIdentity: "planning", inventory });
      evidence.push({ family: "inventory", subjectKeys: coverageInventorySubjects(inventory).map((subject) => subject.subjectKey), reference: planning.inventory, manifest: manifestIdentity, runId: run.runId, targetIdentity: "planning", document: inventory });
      register("inventory", planning.inventory, inventory, run.runId, "planning");
      register("planning", output.content, planning, run.runId, "planning");
      for (const target of planning.targets) { if (plannedTargets.has(target.targetIdentity)) throw new Error(`Scan ${run.runId} repeats a planned target.`); plannedTargets.add(target.targetIdentity); }
    }
    const observedTargets = new Set<string>();
    for (const output of run.outputs) {
      if (output.schemaId !== "compendium.scan-target-envelope.v2") continue;
      const envelope = await readObject(store, output.content, ScanTargetEnvelopeSchema, `${run.runId}/${output.name}`);
      if (envelope.buildId !== plan.buildId) throw new Error(`Envelope ${output.content.sha256} belongs to build ${envelope.buildId}, not ${plan.buildId}.`);
      if (run.input.operation === "scan" && envelope.outcome !== "succeeded") throw new Error(`Target ${envelope.targetIdentity} did not succeed.`);
      validateScanTargetEnvelope(envelope, { buildId: plan.buildId });
      const sourceRunId = envelope.sourceRunId;
      if (sourceRunId !== (run.input.operation === "scan" ? run.runId : run.input.settings.originalRunId)) throw new Error(`Target ${envelope.targetIdentity} has invalid source-run lineage.`);
      const families = new Set<ScanCollectorFamily>();
      for (const disposition of envelope.collectors) {
        if (families.has(disposition.family)) throw new Error(`Target ${envelope.targetIdentity} repeats collector ${disposition.family}.`);
        families.add(disposition.family);
        if (disposition.status === "collect" && !envelope.artifacts.some((artifact) => artifact.family === disposition.family)) throw new Error(`Target ${envelope.targetIdentity} is missing family ${disposition.family}.`);
      }
      const names = new Set<string>();
      for (const artifact of envelope.artifacts) {
        const key = `${artifact.family}/${artifact.name}`;
        if (names.has(key)) throw new Error(`Target ${envelope.targetIdentity} repeats artifact ${key}.`);
        names.add(key);
        if (!families.has(artifact.family)) throw new Error(`Target ${envelope.targetIdentity} has undeclared family ${artifact.family}.`);
        if (FAMILY_BY_SCHEMA[artifact.schema.id] !== artifact.family) throw new Error(`Target ${envelope.targetIdentity}/${key} declares a schema from another family.`);
        const schema = schemaRegistry.require(artifact.schema.id);
        if (schema.sha256 !== artifact.schema.sha256 && artifact.schema.id !== "compendium.relationships.v1" && artifact.schema.id !== "compendium.support.v1") throw new Error(`Target ${envelope.targetIdentity}/${key} has an incompatible schema identity.`);
        const document = await readObject(store, artifact.content, schema.schema, `${envelope.targetIdentity}/${key}`);
        for (const dependency of artifact.inputs) {
          await store.verify(dependency);
          register("evidence-input", dependency, null, sourceRunId, envelope.targetIdentity);
        }
        if (artifact.observationContext) {
          const context = await readObject(store, artifact.observationContext, ObservationContextSchema, `${envelope.targetIdentity}/${key}/context`);
          if (context.started.researchCharacter !== context.completed.researchCharacter || context.started.scene.handle !== context.completed.scene.handle || context.started.gameSceneNativeId !== context.completed.gameSceneNativeId || context.started.scene.path !== context.completed.scene.path || context.completed.frame < context.started.frame) throw new Error(`Target ${envelope.targetIdentity}/${key} crosses its observation context.`);
          const started = envelope.observation.started, completed = envelope.observation.completed;
          if (started && (context.started.researchCharacter !== started.character || context.started.frame < started.frame)) throw new Error(`Target ${envelope.targetIdentity}/${key} belongs to another target observation.`);
          if (completed && context.completed.frame > completed.frame) throw new Error(`Target ${envelope.targetIdentity}/${key} follows its completed observation.`);
          if (envelope.target.kind === "current-scene" ? started !== null && (context.started.scene.handle !== started.scene.handle || context.started.scene.path !== started.scene.path || context.started.gameSceneNativeId !== started.gameSceneNativeId) : context.started.gameSceneNativeId !== envelope.target.sceneNativeId) throw new Error(`Target ${envelope.targetIdentity}/${key} observes another scene.`);
          register("observation-context", artifact.observationContext, context, sourceRunId, envelope.targetIdentity);
        }
        register(artifact.schema.id, artifact.content, document, sourceRunId, envelope.targetIdentity);
        evidence.push({ family: artifact.family, subjectKeys: [], reference: artifact.content, manifest: manifestIdentity, runId: sourceRunId, targetIdentity: envelope.targetIdentity, document });
        if (artifact.schema.id === "compendium.world-inventory.v2") {
          Assert(WorldInventorySchema, document);
          inventories.push({ reference: artifact.content, manifest: manifestIdentity, runId: sourceRunId, targetIdentity: envelope.targetIdentity, inventory: document });
        }
      }
      register("target-envelope", output.content, envelope, sourceRunId, envelope.targetIdentity);
      if (targets.some((target) => target.manifest.sha256 === manifestIdentity.sha256 && target.envelope.targetIdentity === envelope.targetIdentity)) throw new Error(`Duplicate target ${envelope.targetIdentity} in ${manifestIdentity.sha256}.`);
      targets.push({ manifest: manifestIdentity, run, envelope, reference: output.content });
      observedTargets.add(envelope.targetIdentity);
    }
    if (run.input.operation === "scan" && (observedTargets.size !== plannedTargets.size || [...plannedTargets].some((target) => !observedTargets.has(target)))) throw new Error(`Scan ${run.runId} does not account for its resolved target set.`);
  }
  targets.sort((a, b) => a.manifest.sha256.localeCompare(b.manifest.sha256) || a.envelope.targetIdentity.localeCompare(b.envelope.targetIdentity));
  const canonicalTarget = targets.find((target) => target.manifest.sha256 === plan.canonicalTarget.manifest.sha256 && target.envelope.targetIdentity === plan.canonicalTarget.targetIdentity);
  if (!canonicalTarget) throw new Error("The explicit canonical target is absent from its manifest.");
  const load = async <T extends TSchema>(target: AdmittedTarget, family: ScanCollectorFamily, schema: T) => {
    const registered = schemaRegistry.identify(schema);
    const matches = target.envelope.artifacts.filter((artifact) => artifact.family === family && artifact.schema.id === registered.id);
    if (matches.length !== 1) throw new Error(`Target ${target.envelope.targetIdentity}/${family} requires exactly one ${registered.id}; found ${matches.length}.`);
    const artifact = matches[0]!;
    const value = await readObject(store, artifact.content, schema, `${target.envelope.targetIdentity}/${family}`);
    return { value, reference: evidenceReference(artifact.content), content: artifact.content };
  };
  const loadOptional = async <T extends TSchema>(target: AdmittedTarget, family: ScanCollectorFamily, schema: T) => {
    const registered = schemaRegistry.identify(schema);
    const matches = target.envelope.artifacts.filter((artifact) => artifact.family === family && artifact.schema.id === registered.id);
    if (matches.length > 1) throw new Error(`Target ${target.envelope.targetIdentity}/${family} has multiple ${registered.id} artifacts.`);
    if (matches.length === 0) return null;
    const artifact = matches[0]!;
    const value = await readObject(store, artifact.content, schema, `${target.envelope.targetIdentity}/${family}`);
    return { value, reference: evidenceReference(artifact.content), content: artifact.content };
  };
  const canonical = await load(canonicalTarget, "canonical", CanonicalSchema);
  const artwork = await loadOptional(canonicalTarget, "canonical", ArtworkSchema);
  if (artwork) {
    const outputs = new Map(canonicalTarget.run.outputs.map((row) => [`${row.content.sha256}:${row.content.bytes}`, row]));
    const verified = new Set<string>();
    for (const record of artwork.value.records) if (record.image) {
      const key = `${record.image.sha256}:${record.image.bytes}`, output = outputs.get(key);
      if (!output || !output.name.endsWith(`/${record.image.file}`)) throw new Error(`Artwork ${record.family}:${record.nativeId}:${record.role} references image bytes not admitted by its scan run.`);
      if (verified.has(key)) continue;
      await store.verify(output.content);
      register("artwork-asset", output.content, null, canonicalTarget.envelope.sourceRunId, canonicalTarget.envelope.targetIdentity);
      verified.add(key);
    }
  }
  const relationships = await load(canonicalTarget, "relationships", RelationshipsSchema);
  const lootRules = await load(canonicalTarget, "relationships", LootRulesSchema);
  const support = await load(canonicalTarget, "relationships", SupportSchema);
  const localization = await load(canonicalTarget, "canonical", LocalizationSchema);
  const sceneCatalog = await load(canonicalTarget, "spatial", SceneCatalogSchema);
  const profile = await readObject(store, plan.spatialProfile, MapSpaceProfileSchema, "reviewed spatial profile");
  if (profile.buildId !== plan.buildId) throw new Error(`Spatial profile belongs to build ${profile.buildId}, not ${plan.buildId}.`);
  register("spatial-profile", plan.spatialProfile, profile, canonicalTarget.envelope.sourceRunId, "review");
  for (const binding of profile.bindings) for (const reference of binding.evidence) {
    const metadata = await stat(store.objectPath(reference.sha256));
    const identity = { sha256: reference.sha256, bytes: metadata.size };
    await store.verify(identity);
    const document: unknown = JSON.parse(await readFile(store.objectPath(reference.sha256), "utf8"));
    assertEvidencePointer(document, reference.pointer, `spatial binding ${binding.id}`);
    register("spatial-evidence", identity, document, canonicalTarget.envelope.sourceRunId, "review");
  }
  const contexts: SceneContext[] = [];
  for (const target of targets) {
    const identities = await load(target, "placements", PlacementIdentityResultSchema);
    const roles = await load(target, "roles", PlacementRolesSchema);
    const snapshot = await load(target, "placements", PlacementSnapshotSchema);
    const npc = await load(target, "producers", NpcProducersSchema);
    const world = await load(target, "producers", WorldSourcesSchema);
    const geometry = await load(target, "spatial", MapGeometrySchema);
    const scene = snapshot.value.context;
    const snapshotArtifact = target.envelope.artifacts.find((artifact) => artifact.schema.id === "compendium.placement-snapshot.v1")!;
    if (snapshotArtifact.observationContext !== null) {
      const observation = await readObject(store, snapshotArtifact.observationContext, ObservationContextSchema, `${target.envelope.targetIdentity}/snapshot/context`);
      if (scene.character !== observation.started.researchCharacter || scene.gameSceneNativeId !== observation.started.gameSceneNativeId || scene.scene.handle !== observation.started.scene.handle || scene.scene.path !== observation.started.scene.path || snapshot.value.frame < observation.started.frame || snapshot.value.frame > observation.completed.frame) throw new Error(`Target ${target.envelope.targetIdentity} snapshot differs from its observation context.`);
    }
    if (target.envelope.target.kind !== "current-scene" && scene.gameSceneNativeId !== target.envelope.target.sceneNativeId) throw new Error(`Target ${target.envelope.targetIdentity} snapshot observes another target scene.`);
    const started = target.envelope.observation.started, completed = target.envelope.observation.completed;
    if (started && (scene.character !== started.character || snapshot.value.frame < started.frame || (target.envelope.target.kind === "current-scene" && (scene.gameSceneNativeId !== started.gameSceneNativeId || scene.scene.handle !== started.scene.handle || scene.scene.path !== started.scene.path)))) throw new Error(`Target ${target.envelope.targetIdentity} snapshot differs from its target observation.`);
    if (completed && snapshot.value.frame > completed.frame) throw new Error(`Target ${target.envelope.targetIdentity} snapshot follows its completed observation.`);
    if (identities.value.buildId !== plan.buildId || roles.value.buildId !== plan.buildId || identities.value.sceneNativeId !== scene.gameSceneNativeId || roles.value.sceneNativeId !== scene.gameSceneNativeId || identities.value.scenePath !== scene.scene.path || identities.value.snapshotFrame !== snapshot.value.frame || roles.value.snapshotFrame !== snapshot.value.frame || geometry.value.scene.nativeId !== scene.gameSceneNativeId || geometry.value.scene.path !== scene.scene.path || geometry.value.scene.handle !== scene.scene.handle) throw new Error(`Target ${target.envelope.targetIdentity} contains mismatched identity, role, snapshot, or spatial evidence.`);
    const sourceByComponent = new Map(sourceIdentityRows(identities.value).map((row) => [row.componentInstanceId, row]));
    const sourceById = new Map(sourceIdentityRows(identities.value).map((row) => [row.sourceId, row]));
    if (sourceByComponent.size !== identities.value.identities.length || sourceById.size !== identities.value.identities.length) throw new Error(`Target ${target.envelope.targetIdentity} contains duplicate source identities.`);
    const roleArtifact = (schemaId: string): ArtifactReference => {
      const artifacts = target.envelope.artifacts.filter((artifact) => artifact.schema.id === schemaId);
      if (artifacts.length !== 1) throw new Error(`Target ${target.envelope.targetIdentity} requires one role input ${schemaId}.`);
      return evidenceReference(artifacts[0]!.content);
    };
    const roleEvidenceReferences: SceneContext["roleEvidenceReferences"] = { canonical: roleArtifact("compendium.canonical.v4"), relationships: roleArtifact("compendium.relationships.v1"), "npc-producers": npc.reference, "world-sources": world.reference, "faction-roles": roleArtifact("compendium.faction-roles.v1") };
    contexts.push({ roleEvidenceReferences, role: roles.value, identities: identities.value, npc: npc.value, world: world.value, mapGeometry: geometry.value, mapGeometryReference: geometry.reference, sceneNativeId: scene.gameSceneNativeId, scenePath: scene.scene.path, sourceByComponent, sourceById, roleReference: roles.reference, identityReference: identities.reference, npcReference: npc.reference, worldReference: world.reference, snapshotReference: snapshot.reference, snapshotRunId: target.envelope.sourceRunId, snapshotPrefix: target.envelope.targetIdentity, snapshotId: identitySnapshotId(target.envelope.sourceRunId, target.envelope.targetIdentity), identityResult: identities.value, sceneHandle: scene.scene.handle, character: scene.character });
  }
  for (const item of evidence) {
    if (item.family === "inventory") continue;
    const target = targets.find((target) => target.manifest.sha256 === item.manifest.sha256 && target.envelope.sourceRunId === item.runId && target.envelope.targetIdentity === item.targetIdentity);
    const context = contexts.find((context) => context.snapshotRunId === item.runId && context.snapshotPrefix === item.targetIdentity);
    if (!target || !context || target.envelope.outcome !== "succeeded") continue;
    const sourceKey = target.envelope.target.kind === "streamed-source" ? target.envelope.target.sourceKey : null;
    item.subjectKeys = [...new Set(inventories.flatMap(({ inventory }) => coverageTargetSubjects(inventory, context.sceneNativeId, context.scenePath, sourceKey)))];
  }
  const imagery = [];
  for (const reference of plan.imagery) {
    const document = await readObject(store, reference, CatalogImagerySchema, "catalog imagery");
    if (document.buildId !== plan.buildId) throw new Error(`Imagery ${reference.sha256} belongs to build ${document.buildId}, not ${plan.buildId}.`);
    if (!profile.mapSpaces.some((space) => space.id === document.layer.mapSpaceId)) throw new Error(`Imagery ${reference.sha256} references an unknown map space.`);
    for (const dependency of [...document.inputs, ...document.layer.tiles]) {
      const identity = { sha256: dependency.sha256, bytes: dependency.bytes };
      await store.verify(identity);
      register("imagery-input", identity, null, canonicalTarget.envelope.sourceRunId, "imagery");
    }
    if (document.layer.kind === "captured" && !document.manifests?.length) throw new Error(`Captured imagery ${reference.sha256} has no successful source manifest.`);
    for (const manifest of document.manifests ?? []) {
      const header = await readObject(store, manifest, ArtifactRunManifestSchema, "imagery source manifest");
      const resolved = await resolveArtifactRun(store, manifest, { buildId: plan.buildId, operation: header.input.operation });
      register("run-manifest", manifest, resolved, resolved.runId, "imagery");
      let verifiedBindings: typeof profile.bindings = [];
      if (document.layer.kind === "captured" && resolved.input.operation === "capture") {
        const captureOutputs = resolved.outputs.filter((output) => output.schemaId === "compendium.capture-set.v4");
        const sourceProfile = resolved.input.inputs.profile;
        if (captureOutputs.length === 1 && sourceProfile?.sha256 === plan.spatialProfile.sha256 && sourceProfile.bytes === plan.spatialProfile.bytes) {
          const capture = await readObject(store, captureOutputs[0]!.content, CaptureSetSchema, `${resolved.runId}/imagery coverage`);
          if (capture.completeImagery && capture.buildId === plan.buildId && capture.mapSpaceId === document.layer.mapSpaceId) verifiedBindings = profile.bindings.filter((binding) => binding.mapSpaceId === capture.mapSpaceId && binding.sceneNativeId === capture.sceneNativeId && binding.scenePath === capture.scenePath);
        }
      } else if (document.layer.kind === "game-map" && resolved.input.operation === "game-map") {
        for (const output of resolved.outputs.filter((output) => output.schemaId === "compendium.catalog-imagery.v1" && document.inputs.some((input) => input.sha256 === output.content.sha256 && input.bytes === output.content.bytes))) {
          const source = await readObject(store, output.content, CatalogImagerySchema, `${resolved.runId}/game-map coverage`);
          if (source.buildId === plan.buildId && source.layer.kind === "game-map" && canonicalJson(source.layer) === canonicalJson(document.layer)) verifiedBindings = profile.bindings.filter((binding) => binding.mapSpaceId === document.layer.mapSpaceId);
        }
      }
      evidence.push({ family: document.layer.kind === "game-map" ? "game-map" : "capture", subjectKeys: [...new Set(verifiedBindings.flatMap((binding) => inventories.flatMap(({ inventory }) => coverageTargetSubjects(inventory, binding.sceneNativeId, binding.scenePath, null))))], reference, manifest, runId: resolved.runId, targetIdentity: "imagery", document });
    }
    register("imagery", reference, document, canonicalTarget.envelope.sourceRunId, "imagery");
    imagery.push({ reference, document });
  }
  const review = { reference: plan.coverageReview, document: await readObject(store, plan.coverageReview, CoverageReviewSchema, "coverage review") };
  const policy = { reference: review.document.policy, document: await readObject(store, review.document.policy, CoveragePolicySchema, "coverage policy") };
  register("coverage-review", review.reference, review.document, canonicalTarget.envelope.sourceRunId, "review");
  register("coverage-policy", policy.reference, policy.document, canonicalTarget.envelope.sourceRunId, "review");
  return { plan, canonical, relationships, lootRules, support, artwork, localization, sceneCatalog, profile, contexts, sources, imagery, inventories, evidence, review, policy };
}

