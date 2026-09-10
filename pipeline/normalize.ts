import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import * as path from "node:path";
import { beginRun, loadVerifiedRun, type VerifiedRun } from "../tools/runs";
import { toolRevision } from "../tools/build";
import { loadSpatialProfile } from "../tools/spatial-extraction";
import { compileMapSpaces } from "../tools/map-spaces";
import { SceneCatalogSchema } from "../tools/map-contracts";
import { Assert } from "typebox/value";
import { PlacementIdentityResultSchema, PlacementSnapshotSchema, type PlacementIdentityResult } from "../tools/placement-contracts";
import { CanonicalSchema, RelationshipsSchema, LootRulesSchema, SupportSchema, LocalizationSchema } from "../tools/contracts";
import { PlacementRolesSchema } from "../tools/role-contracts";
import { NpcProducersSchema } from "../tools/npc-extraction";
import { WorldSourcesSchema } from "../tools/world-extraction";
import { CoverageLedgerSchema } from "../tools/coverage";
import type { SceneCatalog } from "../tools/map-contracts";
import type { SpatialResolution } from "../tools/spatial-contracts";
import type { NormalizedOutput, NormalizationPlan, ArtifactReference, NormalizedCondition, NormalizedDatabaseInput, NormalizedEntity, NormalizedItemSources, NormalizedMapProjection, NormalizedPlacement, NormalizedSource, NormalizedSpawnCandidate, EntityDetail, CategoryMetadata, NormalizedCoverageSummary, SceneSnapshotReference } from "./normalized-contracts";
import { assertNormalizationPlan, entityKey, publicEntityDetails, stableJson } from "./normalized-contracts";
import { databaseCounts, hashRelation, openNormalizedDatabase, populateNormalizedDatabase } from "./database";

type JsonRecord = Record<string, any>;
type JsonArray = any[];
type ResolvedReference = { reference: ArtifactReference; absolutePath: string; value: any; bytes: Uint8Array };
type SourceRecord = { key: string; kind: string; reference: ArtifactReference; value: any; bytes: Uint8Array };
type Blocker = NormalizedCoverageSummary["blockers"][number];
type SourceIdentityRow = {
  identityIndex: number;
  sourceId: string;
  placementId: string;
  componentInstanceId: number;
  gameObjectInstanceId: number;
  typeName: string;
  assembly: string;
  componentPathId: string;
  sceneSourceSha256: string;
  sourceSha256: string;
  serializedFile: string;
  gameObjectPathId: string;
  origin: "scene" | "streamed-prefab";
  loaderSourceId: string | null;
  position: { x: number; y: number; z: number };
};
type SceneContext = {
  role: JsonRecord | null;
  identities: JsonRecord | null;
  npc: JsonRecord | null;
  world: JsonRecord | null;
  sceneNativeId: number;
  scenePath: string;
  sourceByComponent: Map<number, SourceIdentityRow>;
  sourceById: Map<string, SourceIdentityRow>;
  roleReference: ArtifactReference;
  identityReference: ArtifactReference;
  npcReference: ArtifactReference;
  worldReference: ArtifactReference;
  snapshotReference: ArtifactReference;
  snapshotRunId: string;
  identityResult: PlacementIdentityResult;
  sceneHandle: number;
  character: string;
};

function record(value: unknown): JsonRecord | null {
  return value !== null && typeof value === "object" && !Array.isArray(value) ? value as JsonRecord : null;
}
function array(value: unknown): JsonArray {
  return Array.isArray(value) ? value : [];
}
function requiredText(value: unknown, label: string): string {
  if (typeof value !== "string" || value.length === 0) throw new TypeError(`${label} must be a non-empty string.`);
  return value;
}
function numberOrNull(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}
function integerOrNull(value: unknown): number | null {
  return typeof value === "number" && Number.isSafeInteger(value) ? value : null;
}
function jsonHash(value: unknown): string { return createHash("sha256").update(stableJson(value)).digest("hex"); }
function hashCondition(ownerType: string, ownerKey: string, ordinal: number, payload: unknown): string { return hashRelation("condition", [ownerType, ownerKey, ordinal, payload]); }
function pointer(ref: ArtifactReference, jsonPointer: string): ArtifactReference & { pointer: string } { return { ...ref, pointer: jsonPointer }; }
function sorted<T>(values: Iterable<T>, compare: (a: T, b: T) => number): T[] { return [...values].sort(compare); }
function compareText(a: string, b: string): number { return a.localeCompare(b); }
function compareNumber(a: number, b: number): number { return a - b; }

async function fileHash(absolutePath: string): Promise<string> {
  const digest = createHash("sha256");
  const file = Bun.file(absolutePath);
  if (!(await file.exists())) throw new Error(`Normalization input does not exist: ${absolutePath}`);
  const stream = file.stream();
  for await (const chunk of stream) digest.update(chunk);
  return digest.digest("hex");
}

function planReference(value: unknown, label: string): ArtifactReference {
  const row = record(value);
  if (!row) throw new TypeError(`${label} must be an artifact reference.`);
  const ref: ArtifactReference = { path: requiredText(row.path, `${label}.path`), sha256: requiredText(row.sha256, `${label}.sha256`) };
  if (!/^[a-f0-9]{64}$/.test(ref.sha256)) throw new TypeError(`${label}.sha256 must be a lowercase SHA-256 hash.`);
  if (typeof row.artifact === "string") ref.artifact = row.artifact;
  if (typeof row.kind === "string") ref.kind = row.kind;
  return ref;
}

function parsePlan(value: unknown): NormalizationPlan {
  assertNormalizationPlan(value);
  const row = record(value);
  if (!row) throw new TypeError("Normalization plan must be an object.");
  const sceneSnapshots: SceneSnapshotReference[] = array(row.sceneSnapshots).map((snapshot, index) => {
    const input = record(snapshot);
    if (!input) throw new TypeError(`sceneSnapshots[${index}] must be an object.`);
    const output: SceneSnapshotReference = { manifest: planReference(input.manifest, `sceneSnapshots[${index}].manifest`) };
    if (typeof input.prefix === "string") output.prefix = input.prefix;
    return output;
  });
  return {
    schemaVersion: "compendium.normalization-plan.v1",
    buildId: requiredText(row.buildId, "buildId"),
    canonicalManifest: planReference(row.canonicalManifest, "canonicalManifest"),
    mapSpaceProfile: planReference(row.mapSpaceProfile, "mapSpaceProfile"),
    sceneSnapshots,
  };
}

async function resolveReference(planDirectory: string, reference: ArtifactReference, label: string): Promise<ResolvedReference> {
  if (path.isAbsolute(reference.path)) throw new Error(`${label} path must be relative to the normalization plan.`);
  const absolutePath = path.resolve(planDirectory, reference.path);
  const bytes = await readFile(absolutePath);
  const actualHash = createHash("sha256").update(bytes).digest("hex");
  if (actualHash !== reference.sha256) throw new Error(`${label} hash mismatch: expected ${reference.sha256}, got ${actualHash}.`);
  const value = JSON.parse(bytes.toString("utf8"));
  return { reference, absolutePath, value, bytes };
}

function assertSuccessfulManifest(value: unknown, buildId: string, label: string): JsonRecord {
  const manifest = record(value);
  if (!manifest || manifest.status !== "succeeded") throw new Error(`${label} must reference a successful run manifest.`);
  const input = record(manifest.input);
  if (!input || input.buildId !== buildId) throw new Error(`${label} manifest belongs to build ${String(input?.buildId)}, expected ${buildId}.`);
  return manifest;
}

const VERIFIED_SOURCE_COMMANDS = new Set(["extract", "traverse"]);

async function loadVerifiedManifest(planDirectory: string, reference: ArtifactReference, buildId: string, label: string): Promise<{ resolved: ResolvedReference; run: VerifiedRun }> {
  const resolved = await resolveReference(planDirectory, reference, label);
  const manifest = assertSuccessfulManifest(resolved.value, buildId, label);
  const command = record(manifest.input)?.command;
  if (typeof command !== "string" || !VERIFIED_SOURCE_COMMANDS.has(command)) throw new Error(`${label} must reference an extract or traverse run.`);
  const run = await loadVerifiedRun(resolved.absolutePath, reference.sha256, buildId, command);
  return { resolved, run };
}

async function resolveManifestArtifact(planDirectory: string, run: VerifiedRun, artifactName: string, label: string): Promise<ResolvedReference> {
  const artifact = await run.readArtifact(artifactName);
  const artifactPath = path.resolve(run.directory, artifact.reference.path);
  const artifactReference: ArtifactReference = { path: path.relative(planDirectory, artifactPath).split(path.sep).join("/"), sha256: artifact.reference.sha256, kind: label };
  const value = JSON.parse(new TextDecoder().decode(artifact.bytes));
  return { reference: artifactReference, absolutePath: artifactPath, value, bytes: artifact.bytes };
}

async function resolveSnapshotReference(planDirectory: string, run: VerifiedRun, snapshot: SceneSnapshotReference, field: "placementRoles" | "placementIdentities" | "placementSnapshot" | "npcProducers" | "worldSources" | "coverage", index: number): Promise<ResolvedReference> {
  const rawPrefix = snapshot.prefix ? snapshot.prefix.replaceAll("\\", "/") : "";
  const prefixParts = rawPrefix ? rawPrefix.split("/") : [];
  if (prefixParts.some(part => part === ".." || part === "." || part.length === 0)) throw new Error(`sceneSnapshots[${index}].prefix contains path traversal.`);
  const prefix = prefixParts.join("/");
  const placementSnapshotPath = run.manifest.input.command === "traverse" ? "after.json" : "raw/placement-snapshot.json";
  const suffix = field === "placementRoles" ? "placement-roles.json" : field === "placementIdentities" ? "identities/placement-identities.json" : field === "placementSnapshot" ? placementSnapshotPath : field === "npcProducers" ? "raw/npc-producers.json" : field === "coverage" ? "coverage.json" : "raw/world-sources.json";
  return resolveManifestArtifact(planDirectory, run, prefix ? `${prefix}/${suffix}` : suffix, `sceneSnapshots[${index}].${field}`);
}

function sourceKey(value: string, index: number): string { return `${value}:${index}`; }

function readBuildId(value: JsonRecord): string | null {
  return typeof value.buildId === "string" ? value.buildId : null;
}

function assertBuild(value: unknown, buildId: string, label: string): void {
  const row = record(value);
  const candidate = row ? readBuildId(row) : null;
  if (candidate !== null && candidate !== buildId) throw new Error(`${label} belongs to build ${candidate}, expected ${buildId}.`);
}

function canonicalEntityRows(value: JsonRecord, buildId: string, ref: ArtifactReference): { entities: NormalizedEntity[]; scenes: Array<{ nativeId: number; path: string; name: string | null }> } {
  const entities: NormalizedEntity[] = [];
  const scenes: Array<{ nativeId: number; path: string; name: string | null }> = [];
  for (const kind of ["items", "npcs", "quests", "lootTables", "scenes", "resources"] as const) {
    for (const [index, raw] of array(value[kind]).entries()) {
      const row = record(raw);
      if (!row || !Number.isSafeInteger(row.nativeId)) continue;
      const details = publicEntityDetails(row);
      const entity: NormalizedEntity = { entityKey: entityKey(kind, row.nativeId), buildId, kind, nativeId: row.nativeId, name: details.name, internalName: details.internalName, description: details.description, sourceKey: integerOrNull(row.sourceKey), publicData: { localization: row.localization ?? null, gameplay: row.gameplay ?? null, icon: row.icon ?? null }, provenance: [pointer(ref, `/${kind}/${index}`)] };
      entities.push(entity);
      if (kind === "scenes" && typeof row.name === "string") scenes.push({ nativeId: row.nativeId, path: typeof row.internalName === "string" && row.internalName.length > 0 ? row.internalName : row.name, name: details.name });
    }
  }
  return { entities: sorted(new Map(entities.map((row) => [row.entityKey, row])).values(), (a, b) => compareText(a.entityKey, b.entityKey)), scenes: sorted(new Map(scenes.map((row) => [row.nativeId, row])).values(), (a, b) => compareNumber(a.nativeId, b.nativeId)) };
}

function sourceIdentityRows(value: JsonRecord | null): SourceIdentityRow[] {
  if (!value) return [];
  return array(value.identities).map((raw, identityIndex) => {
    const row = record(raw); const pos = record(row?.position);
    if (!row || !pos || typeof row.sourceId !== "string" || typeof row.placementId !== "string" || !Number.isSafeInteger(row.componentInstanceId) || !Number.isSafeInteger(row.gameObjectInstanceId) || typeof row.typeName !== "string" || typeof row.assembly !== "string" || typeof row.componentPathId !== "string" || typeof row.sceneSourceSha256 !== "string" || typeof row.sourceSha256 !== "string" || typeof row.serializedFile !== "string" || typeof row.gameObjectPathId !== "string" || (row.origin !== "scene" && row.origin !== "streamed-prefab") || (row.loaderSourceId !== null && typeof row.loaderSourceId !== "string") || typeof pos.x !== "number" || typeof pos.y !== "number" || typeof pos.z !== "number") throw new Error(`Verified identity row ${identityIndex} does not match the supported source contract.`);
    return { identityIndex, sourceId: row.sourceId, placementId: row.placementId, componentInstanceId: row.componentInstanceId, gameObjectInstanceId: row.gameObjectInstanceId, typeName: row.typeName, assembly: row.assembly, componentPathId: row.componentPathId, sceneSourceSha256: row.sceneSourceSha256, sourceSha256: row.sourceSha256, serializedFile: row.serializedFile, gameObjectPathId: row.gameObjectPathId, origin: row.origin, loaderSourceId: row.loaderSourceId, position: { x: pos.x, y: pos.y, z: pos.z } } satisfies SourceIdentityRow;
  });
}

function sceneFromSnapshot(identity: JsonRecord | null, roles: JsonRecord | null, snapshot: JsonRecord | null, fallback: JsonRecord | null): { sceneNativeId: number; scenePath: string; sceneHandle: number; character: string } {
  const candidates = [identity, snapshot, roles, fallback];
  for (const candidate of candidates) {
    const context = record(candidate?.context);
    if (candidate && Number.isSafeInteger(candidate.sceneNativeId) && typeof candidate.scenePath === "string") {
      const handle = context && record(context.scene) && Number.isSafeInteger(record(context.scene)?.handle) ? Number(record(context.scene)!.handle) : null;
      const character = context && typeof context.character === "string" ? context.character : null;
      if (handle === null || character === null) continue;
      return { sceneNativeId: candidate.sceneNativeId, scenePath: candidate.scenePath, sceneHandle: handle, character };
    }
    if (context && Number.isSafeInteger(context.gameSceneNativeId) && record(context.scene) && typeof context.scene.path === "string" && Number.isSafeInteger(context.scene.handle) && typeof context.character === "string") return { sceneNativeId: context.gameSceneNativeId, scenePath: context.scene.path, sceneHandle: context.scene.handle, character: context.character };
  }
  throw new Error("Scene snapshot does not identify a native scene, path, handle, and character.");
}

function sceneContexts(planDirectory: string, plan: NormalizationPlan): Promise<{ contexts: SceneContext[]; sourceFiles: SourceRecord[] }> {
  return (async () => {
    const references: SourceRecord[] = [];
    const contexts: SceneContext[] = [];
    const seenInput = new Set<string>();
    for (const [index, snapshot] of plan.sceneSnapshots.entries()) {
      const sceneManifest = await loadVerifiedManifest(planDirectory, snapshot.manifest, plan.buildId, `sceneSnapshots[${index}].manifest`);
      references.push({ key: `sceneManifest:${index}`, kind: "sceneManifest", reference: sceneManifest.resolved.reference, value: sceneManifest.resolved.value, bytes: sceneManifest.resolved.bytes });
      const load = async (field: "placementRoles" | "placementIdentities" | "placementSnapshot" | "npcProducers" | "worldSources" | "coverage"): Promise<ResolvedReference> => {
        const loaded = await resolveSnapshotReference(planDirectory, sceneManifest.run, snapshot, field, index);
        const key = `${field}:${loaded.reference.path}:${loaded.reference.sha256}`;
        if (!seenInput.has(key)) { seenInput.add(key); references.push({ key: sourceKey(field, index), kind: field, reference: loaded.reference, value: loaded.value, bytes: loaded.bytes }); }
        return loaded;
      };
      const roles = await load("placementRoles");
      const identities = await load("placementIdentities");
      const snapshotRows = await load("placementSnapshot");
      const npc = await load("npcProducers");
      const world = await load("worldSources");
      const sourceCoverage = await load("coverage");
      Assert(CoverageLedgerSchema, sourceCoverage.value);
      if (sourceCoverage.value.buildId !== plan.buildId || sourceCoverage.value.runId !== sceneManifest.run.manifest.runId) throw new Error("Scene coverage belongs to another build or source run.");
      const identityValue = record(identities.value);
      const roleValue = record(roles.value);
      Assert(PlacementIdentityResultSchema, identityValue);
      Assert(PlacementRolesSchema, roleValue);
      Assert(PlacementSnapshotSchema, snapshotRows.value);
      Assert(NpcProducersSchema, npc.value);
      Assert(WorldSourcesSchema, world.value);
      const identityResult = identityValue as PlacementIdentityResult;
      const scene = sceneFromSnapshot(identityValue, roleValue, record(snapshotRows.value), record(npc.value));
      assertBuild(identityValue, plan.buildId, `sceneSnapshots[${index}].placementIdentities`);
      assertBuild(roleValue, plan.buildId, `sceneSnapshots[${index}].placementRoles`);
      assertBuild(snapshotRows.value, plan.buildId, `sceneSnapshots[${index}].placementSnapshot`);
      assertBuild(npc.value, plan.buildId, `sceneSnapshots[${index}].npcProducers`);
      assertBuild(world.value, plan.buildId, `sceneSnapshots[${index}].worldSources`);
      const identitiesRows = sourceIdentityRows(identityValue);
      const sourceByComponent = new Map<number, SourceIdentityRow>();
      const sourceById = new Map<string, SourceIdentityRow>();
      for (const row of identitiesRows) { if (sourceByComponent.has(row.componentInstanceId)) throw new Error(`Duplicate source component ${row.componentInstanceId} in scene snapshot ${index}.`); sourceByComponent.set(row.componentInstanceId, row); sourceById.set(row.sourceId, row); }
      contexts.push({ role: roleValue, identities: identityValue, npc: record(npc.value), world: record(world.value), sceneNativeId: scene.sceneNativeId, scenePath: scene.scenePath, sourceByComponent, sourceById, roleReference: roles.reference, identityReference: identities.reference, npcReference: npc.reference, worldReference: world.reference, snapshotReference: snapshotRows.reference, snapshotRunId: sceneManifest.run.manifest.runId, identityResult, sceneHandle: scene.sceneHandle, character: scene.character });
    }
    return { contexts, sourceFiles: references };
  })();
}

function bindingResolution(position: { x: number; y: number; z: number }, profile: NormalizedDatabaseInput["bindings"], resolver: { resolve(sceneNativeId: number, scenePath: string, position: { x: number; y: number; z: number }): SpatialResolution }, sceneNativeId: number, scenePath: string): { binding: NormalizedDatabaseInput["bindings"][number] | null; state: "resolved" | "outside" | "unresolved"; mapPosition: { x: number; y: number } | null } {
  const resolution = resolver.resolve(sceneNativeId, scenePath, position);
  const candidate = resolution.candidates.length === 1 ? resolution.candidates[0] : undefined;
  if (!candidate) {
    const outside = resolution.issues.some((issue) => issue.includes("outside the declared domain"));
    return { binding: null, state: outside ? "outside" : "unresolved", mapPosition: null };
  }
  const binding = profile.find((row) => row.sceneNativeId === sceneNativeId && row.scenePath === scenePath && row.mapSpaceId === candidate.mapSpaceId && candidate.bindingIds.includes(row.id)) ?? null;
  return { binding, state: binding === null ? "unresolved" : "resolved", mapPosition: candidate.mapPosition };
}

function sourceEvidenceRow(context: SceneContext, value: unknown): SourceIdentityRow | null {
  const row = record(value); const component = row?.componentInstanceId;
  return typeof component === "number" ? context.sourceByComponent.get(component) ?? null : null;
}

function collectPlacements(contexts: SceneContext[], profile: NormalizedDatabaseInput["bindings"], resolver: { resolve(sceneNativeId: number, scenePath: string, position: { x: number; y: number; z: number }): SpatialResolution }, profileRef: ArtifactReference, blockers: Blocker[]): { placements: NormalizedPlacement[]; sources: NormalizedSource[]; roles: NormalizedDatabaseInput["roles"]; sourceForComponent: Map<string, string>; sourcePlacement: Map<string, string> } {
  const placementById = new Map<string, NormalizedPlacement>();
  const sourceById = new Map<string, NormalizedSource>();
  const roles: NormalizedDatabaseInput["roles"] = [];
  const sourceForComponent = new Map<string, string>();
  const sourcePlacement = new Map<string, string>();
  const identityByPlacement = new Map<string, SourceIdentityRow>();
  for (const context of contexts) {
    const roleRows = context.role;
    const identityRef = context.identityReference;
    for (const row of sourceIdentityRows(context.identities)) {
      const existing = sourceById.get(row.sourceId);
      if (existing && (existing.placementId !== row.placementId || existing.componentType !== row.typeName || existing.componentInstanceId !== row.componentInstanceId || existing.gameObjectInstanceId !== row.gameObjectInstanceId || existing.sceneSourceSha256 !== row.sceneSourceSha256 || existing.sourceSha256 !== row.sourceSha256 || existing.serializedFile !== row.serializedFile || existing.gameObjectPathId !== row.gameObjectPathId || existing.componentPathId !== row.componentPathId || existing.assembly !== row.assembly || existing.origin !== row.origin || existing.loaderSourceId !== row.loaderSourceId)) throw new Error(`Conflicting repeated source identity ${row.sourceId}.`);
      sourceById.set(row.sourceId, existing ?? { sourceId: row.sourceId, placementId: row.placementId, buildId: "", componentType: row.typeName, componentInstanceId: row.componentInstanceId, gameObjectInstanceId: row.gameObjectInstanceId, sceneSourceSha256: row.sceneSourceSha256, sourceSha256: row.sourceSha256, serializedFile: row.serializedFile, gameObjectPathId: row.gameObjectPathId, componentPathId: row.componentPathId, assembly: row.assembly, origin: row.origin, loaderSourceId: row.loaderSourceId, families: [], provenance: [pointer(identityRef, `/identities/${row.identityIndex}`)] });
      const priorPlacementIdentity = identityByPlacement.get(row.placementId);
      if (priorPlacementIdentity && priorPlacementIdentity.sourceSha256 !== row.sourceSha256) throw new Error(`Conflicting repeated placement identity ${row.placementId}.`);
      if (!priorPlacementIdentity) identityByPlacement.set(row.placementId, row);
      sourceForComponent.set(`${context.sceneNativeId}:${row.componentInstanceId}`, row.sourceId);
      sourcePlacement.set(row.sourceId, row.placementId);
    }
    const sources = new Map<string, JsonRecord>();
    for (const raw of array(roleRows?.sources)) { const row = record(raw); if (row && typeof row.sourceId === "string") sources.set(row.sourceId, row); }
    for (const [sourceId, raw] of sources) {
      const normalized = sourceById.get(sourceId);
      if (!normalized) { blockers.push({ kind: "unresolved-source-identity", key: sourceId, detail: "Placement role source has no matching verified serialized source identity.", provenance: [] }); continue; }
      normalized.families = [...new Set([...normalized.families, ...array(raw.families).filter((value): value is string => typeof value === "string")])].sort(compareText);
      normalized.provenance.push(...array(raw.evidence).flatMap((evidence) => [pointer(context.roleReference, typeof record(evidence)?.pointer === "string" ? record(evidence)!.pointer : "/sources")]));
    }
    for (const raw of array(roleRows?.placements)) {
      const row = record(raw); const position = record(row?.position);
      if (!row || typeof row.placementId !== "string" || !position || typeof position.x !== "number" || typeof position.y !== "number" || typeof position.z !== "number") continue;
      const resolved = bindingResolution({ x: position.x, y: position.y, z: position.z }, profile, resolver, context.sceneNativeId, context.scenePath);
      if (resolved.binding === null || resolved.state === "unresolved") blockers.push({ kind: "unresolved-placement-space", key: row.placementId, detail: `No reviewed map-space binding resolves ${context.scenePath}.`, provenance: [] });
      if (resolved.state === "outside") blockers.push({ kind: "outside-profile-domain", key: row.placementId, detail: "Placement lies outside the reviewed map-space domain.", provenance: [] });
      const requestedSourceIds = array(row.sourceIds).filter((value): value is string => typeof value === "string").sort(compareText);
      for (const sourceId of requestedSourceIds) if (!sourceById.has(sourceId)) blockers.push({ kind: "unresolved-source-identity", key: sourceId, detail: `Placement ${row.placementId} references an unverified source identity.`, provenance: [] });
      const sourceIds = requestedSourceIds.filter((sourceId) => sourceById.has(sourceId));
      const identity = identityByPlacement.get(row.placementId);
      const placement: NormalizedPlacement = { placementId: row.placementId, buildId: "", sceneNativeId: context.sceneNativeId, scenePath: context.scenePath, identity: identity ? { sceneSourceSha256: identity.sceneSourceSha256, sourceSha256: identity.sourceSha256, serializedFile: identity.serializedFile, gameObjectPathId: identity.gameObjectPathId, origin: identity.origin, loaderSourceId: identity.loaderSourceId } : null, mapSpaceId: resolved.binding?.mapSpaceId ?? null, worldPosition: { x: position.x, y: position.y, z: position.z }, mapPosition: resolved.mapPosition, sourceIds, roles: [], shape: null, provenance: [pointer(profileRef, `/bindings/${resolved.binding?.id ?? "unresolved"}`), pointer(context.roleReference, "/placements")] };
      const previous = placementById.get(placement.placementId);
      if (previous) {
        if (stableJson(previous.worldPosition) !== stableJson(placement.worldPosition) || previous.sceneNativeId !== placement.sceneNativeId || previous.scenePath !== placement.scenePath) throw new Error(`Conflicting repeated placement identity ${placement.placementId}.`);
        previous.sourceIds = [...new Set([...previous.sourceIds, ...sourceIds])].sort(compareText);
      } else placementById.set(placement.placementId, placement);
      for (const sourceId of sourceIds) {
        const source = sourceById.get(sourceId);
        if (!source) { blockers.push({ kind: "unresolved-source-identity", key: sourceId, detail: `Placement ${row.placementId} references a source identity not present in the selected snapshot.`, provenance: [] }); continue; }
        source.placementId = row.placementId;
        source.buildId = "";
        sourceById.set(sourceId, source);
      }
      for (const roleRaw of array(row.roles)) {
        const role = record(roleRaw); if (!role || typeof role.role !== "string") continue;
        const npcId = integerOrNull(role.npcId);
        for (const sourceId of array(role.sourceIds).filter((value): value is string => typeof value === "string").sort(compareText)) {
          if (!sourceById.has(sourceId)) { blockers.push({ kind: "unresolved-source-identity", key: sourceId, detail: `Role ${role.role} has no verified source identity.`, provenance: [] }); continue; }
          roles.push({ placementId: row.placementId, sourceId, role: role.role, npcId, scope: role.scope === "player-state" ? "player-state" : "authored", evidence: role.evidence ?? [] });
        }
      }
    }
    for (const identity of sourceIdentityRows(context.identities)) {
      if (placementById.has(identity.placementId)) continue;
      const resolved = bindingResolution(identity.position, profile, resolver, context.sceneNativeId, context.scenePath);
      if (resolved.binding === null || resolved.state === "unresolved") blockers.push({ kind: "unresolved-placement-space", key: identity.placementId, detail: "Identity-only placement has no reviewed map-space binding.", provenance: [] });
      if (resolved.state === "outside") blockers.push({ kind: "outside-profile-domain", key: identity.placementId, detail: "Identity-only placement is outside the reviewed map-space domain.", provenance: [] });
      placementById.set(identity.placementId, { placementId: identity.placementId, buildId: "", sceneNativeId: context.sceneNativeId, scenePath: context.scenePath, identity: { sceneSourceSha256: identity.sceneSourceSha256, sourceSha256: identity.sourceSha256, serializedFile: identity.serializedFile, gameObjectPathId: identity.gameObjectPathId, origin: identity.origin, loaderSourceId: identity.loaderSourceId }, mapSpaceId: resolved.binding?.mapSpaceId ?? null, worldPosition: identity.position, mapPosition: resolved.mapPosition, sourceIds: [identity.sourceId], roles: [], shape: null, provenance: [pointer(profileRef, `/bindings/${resolved.binding?.id ?? "unresolved"}`), pointer(identityRef, "/identities")] });
    }
    for (const raw of array(roleRows?.unplacedSources)) {
      const row = record(raw); blockers.push({ kind: "unplaced-source", key: `${context.sceneNativeId}:${stableJson(row ?? raw)}`, detail: "Role evidence has no verified serialized placement and remains unplaced.", provenance: [] });
    }
    for (const raw of array(roleRows?.unresolved)) {
      const row = record(raw); blockers.push({ kind: "placement-role-issue", key: `${context.sceneNativeId}:${stableJson(row ?? raw)}`, detail: typeof row?.detail === "string" ? row.detail : "Placement role resolution reported an unresolved issue.", provenance: [] });
    }
  }
  for (const placement of placementById.values()) {
    const identity = identityByPlacement.get(placement.placementId);
    if (identity !== undefined && placement.identity === null) placement.identity = { sceneSourceSha256: identity.sceneSourceSha256, sourceSha256: identity.sourceSha256, serializedFile: identity.serializedFile, gameObjectPathId: identity.gameObjectPathId, origin: identity.origin, loaderSourceId: identity.loaderSourceId };
  }
  const uniqueRoles = new Map<string, NormalizedDatabaseInput["roles"][number]>();
  for (const role of roles) uniqueRoles.set(`${role.placementId}:${role.sourceId}:${role.role}:${role.npcId ?? ""}:${role.scope}`, role);
  return { placements: sorted(placementById.values(), (a, b) => compareText(a.placementId, b.placementId)), sources: sorted(sourceById.values(), (a, b) => compareText(a.sourceId, b.sourceId)), roles: sorted(uniqueRoles.values(), (a, b) => a.placementId.localeCompare(b.placementId) || a.sourceId.localeCompare(b.sourceId) || a.role.localeCompare(b.role)), sourceForComponent, sourcePlacement };
}

function attachShapes(contexts: SceneContext[], sourceForComponent: Map<string, string>, placements: NormalizedPlacement[], blockers: Blocker[]): void {
  const bySource = new Map<string, NormalizedPlacement>();
  for (const placement of placements) for (const sourceId of placement.sourceIds) bySource.set(sourceId, placement);
  for (const context of contexts) {
    const candidates: unknown[] = [...array(context.npc?.producers), ...array(context.world?.resourceProducers), ...array(context.world?.interactions), ...array(context.world?.containers), ...array(context.world?.services), ...array(context.world?.conditionSources)];
    for (const raw of candidates) {
      const row = record(raw); const componentId = record(row?.source)?.componentInstanceId ?? row?.componentInstanceId;
      if (typeof componentId !== "number") continue;
      const sourceId = sourceForComponent.get(`${context.sceneNativeId}:${componentId}`); const placement = sourceId ? bySource.get(sourceId) : undefined;
      if (!placement || !row?.shape) continue;
      if (placement.shape !== null && stableJson(placement.shape) !== stableJson(row.shape)) blockers.push({ kind: "conflicting-placement-shape", key: placement.placementId, detail: "Multiple source roles on one placement report different authored shapes.", provenance: [] });
      else placement.shape = row.shape;
    }
  }
}

function conditionFrom(ownerType: string, ownerKey: string, payload: unknown, semantics: string, sourceFieldPath: string | null, provenance: ArtifactReference[]): NormalizedCondition {
  const ordinal = 0;
  return { conditionId: hashCondition(ownerType, ownerKey, ordinal, payload), ownerType, ownerKey, ordinal, semantics, sourceFieldPath, payload, provenance };
}

function conditionRowsFor(ownerType: string, ownerKey: string, raw: JsonRecord, provenance: ArtifactReference): NormalizedCondition[] {
  const values: NormalizedCondition[] = [];
  const candidates: Array<[string, string]> = [["requirementsTemplate", "requirements-template"], ["inlineRequirements", "inline-requirements"], ["activationRequirement", "activation-requirement"], ["activationRequirements", "activation-requirements"], ["deactivationRequirements", "deactivation-requirements"], ["requirements", "requirements"]];
  let ordinal = 0;
  for (const [field, semantics] of candidates) {
    if (raw[field] === undefined || raw[field] === null) continue;
    values.push({ conditionId: hashCondition(ownerType, ownerKey, ordinal, raw[field]), ownerType, ownerKey, ordinal, semantics, sourceFieldPath: typeof record(raw[field])?.sourceFieldPath === "string" ? record(raw[field])!.sourceFieldPath : null, payload: raw[field], provenance: [pointer(provenance, `/${field}`)] }); ordinal++;
  }
  return values;
}

function producerRows(contexts: SceneContext[], sourceForComponent: Map<string, string>, blockers: Blocker[], provenance: ArtifactReference): { conditions: NormalizedCondition[]; candidates: NormalizedSpawnCandidate[] } {
  const conditions: NormalizedCondition[] = []; const candidates: NormalizedSpawnCandidate[] = [];
  for (const context of contexts) {
    for (const [index, raw] of array(context.npc?.producers).entries()) {
      const row = record(raw); if (!row || typeof row.unavailable === "string") continue;
      const sourceId = typeof row.componentInstanceId === "number" ? sourceForComponent.get(`${context.sceneNativeId}:${row.componentInstanceId}`) : undefined;
      if (!sourceId) { blockers.push({ kind: "unresolved-producer-source", key: `${context.sceneNativeId}:npc:${index}`, detail: "NPC producer has no verified serialized source binding.", provenance: [pointer(provenance, `/producers/${index}`)] }); continue; }
      const ownerKey = `source:${sourceId}`;
      conditions.push(...conditionRowsFor("source", ownerKey, record(row.conditions) ?? {}, pointer(provenance, `/producers/${index}/conditions`)));
      for (const [candidateIndex, candidateRaw] of array(row.candidates).entries()) {
        const candidate = record(candidateRaw); if (!candidate) continue;
        candidates.push({ sourceId, candidateIndex, npcId: integerOrNull(candidate.npcId), minCount: null, maxCount: integerOrNull(record(row.count)?.npcCountMax), rawChance: numberOrNull(candidate.rawSpawnChance), chanceSemantics: typeof candidate.spawnChanceSemantics === "string" ? candidate.spawnChanceSemantics : "authored spawn chance; effective selection unresolved", payload: { ...candidate, populationLimits: row.count }, provenance: [pointer(provenance, `/producers/${index}/candidates/${candidateIndex}`)] });
      }
    }
  }
  return { conditions, candidates };
}

function collectWorldConditions(contexts: SceneContext[], sourceForComponent: Map<string, string>, blockers: Blocker[], provenance: ArtifactReference): NormalizedCondition[] {
  const conditions: NormalizedCondition[] = [];
  for (const context of contexts) {
    for (const [collection, rawRows] of [["resourceProducers", context.world?.resourceProducers], ["interactions", context.world?.interactions], ["containers", context.world?.containers], ["questZones", context.world?.questZones], ["transitions", context.world?.transitions], ["services", context.world?.services], ["conditionSources", context.world?.conditionSources]] as const) {
      for (const [index, raw] of array(rawRows).entries()) {
        const row = record(raw); const evidence = record(row?.source); const sourceId = typeof evidence?.componentInstanceId === "number" ? sourceForComponent.get(`${context.sceneNativeId}:${evidence.componentInstanceId}`) : undefined;
        if (evidence && !sourceId) blockers.push({ kind: "unresolved-world-source", key: `${context.sceneNativeId}:${collection}:${index}`, detail: "World source has evidence but no verified serialized source binding.", provenance: [pointer(provenance, `/${collection}/${index}`)] });
        const ownerKey = sourceId ? `source:${sourceId}` : `${collection}:${context.sceneNativeId}:${index}`;
        conditions.push(...conditionRowsFor("world-source", ownerKey, row ?? {}, pointer(provenance, `/${collection}/${index}`)));
      }
    }
  }
  return conditions;
}

function canonicalDefinitions(value: JsonRecord, kind: string): Map<number, JsonRecord> {
  return new Map(array(value[kind]).flatMap((raw) => { const row = record(raw); return row && Number.isSafeInteger(row.nativeId) ? [[row.nativeId, row] as const] : []; }));
}

function addSourceIndex(index: Map<number, Map<string, ItemSourceAccumulator>>, itemId: unknown, sourceKind: NormalizedItemSources["items"][number]["sources"][number]["sourceKind"], sourceKey: string, placementIds: Iterable<string>, conditionIds: Iterable<string>, context: Record<string, unknown>): void {
  if (typeof itemId !== "number" || !Number.isSafeInteger(itemId) || itemId < 0) return;
  let rows = index.get(itemId); if (!rows) { rows = new Map(); index.set(itemId, rows); }
  const key = `${sourceKind}:${sourceKey}`; const previous = rows.get(key);
  if (previous) { previous.placementIds = [...new Set([...previous.placementIds, ...placementIds])].sort(compareText); previous.conditionIds = [...new Set([...previous.conditionIds, ...conditionIds])].sort(compareText); return; }
  rows.set(key, { sourceKind, sourceKey, placementIds: [...new Set(placementIds)].sort(compareText), conditionIds: [...new Set(conditionIds)].sort(compareText), context });
}
type ItemSourceAccumulator = Omit<NormalizedItemSources["items"][number]["sources"][number], "probability">;

function relationRows(value: JsonRecord, canonicalValue: JsonRecord, nativeLootRules: JsonRecord, roles: NormalizedDatabaseInput["roles"], knownEntities: ReadonlySet<string>, blockers: Blocker[]) {
  const merchantBindings: JsonRecord[] = [], merchantStock: JsonRecord[] = [], lootBindings: JsonRecord[] = [], lootEntries: JsonRecord[] = [];
  const resourceYields: JsonRecord[] = [], questAssociations: JsonRecord[] = [], transitions: JsonRecord[] = [];
  const linkedNpcRules = array(value.dynamicLevelBandGearLinks).map(record).filter((row): row is JsonRecord => row !== null);
  const itemIndex = new Map<number, Map<string, ItemSourceAccumulator>>();
  const itemDefs = canonicalDefinitions(canonicalValue, "items");
  const npcDefs = canonicalDefinitions(canonicalValue, "npcs");
  const merchantTables = canonicalDefinitions(value, "merchantTables");
  const validReference = (kind: string, id: unknown, key: string, definitions?: ReadonlyMap<number, unknown>): boolean => {
    if (typeof id === "number" && id < 0) return false;
    if (typeof id === "number" && id >= 0 && (definitions ? definitions.has(id) : knownEntities.has(entityKey(kind, id)))) return true;
    blockers.push({ kind: "missing-reference", key: [key, kind, String(id)].join(":"), detail: "Selected source references missing " + kind + ":" + String(id) + ".", provenance: [] });
    return false;
  };
  const npcPlacements = new Map<number, string[]>();
  for (const role of roles) if (role.npcId !== null) {
    const ids = npcPlacements.get(role.npcId) ?? []; if (!ids.includes(role.placementId)) ids.push(role.placementId); npcPlacements.set(role.npcId, ids);
  }
  const merchantByTable = new Map<number, JsonRecord[]>(), npcLootByTable = new Map<number, JsonRecord[]>(), worldLootByTable = new Map<number, JsonRecord[]>();
  const group = (index: Map<number, JsonRecord[]>, row: JsonRecord, tableId: number) => { const rows = index.get(tableId) ?? []; rows.push(row); index.set(tableId, rows); };
  for (const raw of array(value.merchantBindings)) {
    const row = record(raw); if (!row || !validReference("npcs", row.ownerNativeId, "merchant-owner") || !validReference("merchantTables", row.merchantTableID, "merchant-binding-table", merchantTables)) continue;
    merchantBindings.push(row);
    if (record(npcDefs.get(row.ownerNativeId)?.gameplay)?.isMerchant === true) group(merchantByTable, row, row.merchantTableID);
  }
  for (const raw of array(value.merchantStock)) {
    const row = record(raw); if (!row || !validReference("merchantTables", row.merchantTableID, "merchant-stock-table", merchantTables) || !validReference("items", row.itemID, "merchant-stock") || !validReference("currencies", row.currencyID, "merchant-currency")) continue;
    merchantStock.push(row);
    for (const binding of merchantByTable.get(row.merchantTableID) ?? []) addSourceIndex(itemIndex, row.itemID, "merchant", [binding.ownerNativeId, binding.bindingIndex, row.stockIndex].join(":"), npcPlacements.get(binding.ownerNativeId) ?? [], [], {
      ownerEntityKeys: [entityKey("npcs", binding.ownerNativeId)], ownerNativeId: binding.ownerNativeId, bindingIndex: binding.bindingIndex,
      merchantTableId: row.merchantTableID, stockIndex: row.stockIndex, currencyId: row.currencyID, cost: row.cost, costSemantics: row.costSemantics,
      requirementsTemplate: binding.requirementsTemplate
    });
  }
  for (const raw of array(value.npcLootBindings)) {
    const row = record(raw); if (!row || !validReference("npcs", row.ownerNativeId, "npc-loot-owner") || !validReference("lootTables", row.lootTableID, "npc-loot-table")) continue;
    lootBindings.push({ ...row, context: "npc" }); group(npcLootByTable, row, row.lootTableID);
  }
  for (const raw of array(value.worldLootBindings)) {
    const row = record(raw); if (!row || !validReference("lootTables", row.lootTableID, "world-loot-table")) continue;
    lootBindings.push({ ...row, context: "world" }); group(worldLootByTable, row, row.lootTableID);
  }
  const tables = canonicalDefinitions(value, "lootTables");
  const eligibility = new Map<string, JsonRecord>();
  for (const table of array(nativeLootRules.dynamicTables)) for (const entry of array(table.entries)) eligibility.set([table.tableId, entry.entryIndex].join(":"), {
    requiredLevel: entry.requiredLevel, beforeFirstGear: entry.beforeFirstGear, afterFirstGear: entry.afterFirstGear,
    observedPlayerLevel: nativeLootRules.observation.playerLevel, referenceLevelDomain: nativeLootRules.referenceLevelDomain,
    levelBand: nativeLootRules.levelBand, firstGearRule: nativeLootRules.firstGearRule
  });
  const specializations = new Map<number, JsonRecord>(array(nativeLootRules.linkedNpcs).map((row) => [row.npcId, {
    hasLinkedNpc: row.hasLinkedNpc, authoredLinkedNpcId: row.authoredLinkedNpcId, resolvedLinkedNpcId: row.resolvedLinkedNpcId,
    resolvedLootSpecNpcId: row.resolvedLootSpecNpcId, hasLootSpecialization: row.hasLootSpecialization, specializationSource: row.specializationSource
  }]));
  for (const raw of array(value.lootEntries)) {
    const row = record(raw); if (!row || !validReference("items", row.itemID, "loot-entry") || !validReference("lootTables", row.lootTableID, "loot-entry-table")) continue;
    lootEntries.push(row);
    const table = tables.get(row.lootTableID)!;
    const context = { lootTableId: row.lootTableID, entryIndex: row.entryIndex, min: row.min, max: row.max, rawRate: row.dropRate,
      tableRules: { limitDroppedItems: table.limitDroppedItems, maxDroppedItems: table.maxDroppedItems, hasMinimumDrops: table.hasMinimumDrops,
        minDroppedItems: table.minDroppedItems, levelBandGear: table.levelBandGear, useRequirementsTemplate: table.useRequirementsTemplate,
        inlineRequirements: table.inlineRequirements, requirementsTemplate: table.requirementsTemplate },
      levelEligibility: eligibility.get([row.lootTableID, row.entryIndex].join(":")) ?? null };
    for (const binding of npcLootByTable.get(row.lootTableID) ?? []) addSourceIndex(itemIndex, row.itemID, "npc-loot", [binding.ownerNativeId, binding.bindingIndex, row.entryIndex].join(":"), npcPlacements.get(binding.ownerNativeId) ?? [], [], {
      ...context, ownerEntityKeys: [entityKey("npcs", binding.ownerNativeId)], ownerNativeId: binding.ownerNativeId, bindingIndex: binding.bindingIndex,
      outerRawRate: binding.dropRate, lootSpecialization: specializations.get(binding.ownerNativeId) ?? null
    });
    for (const binding of worldLootByTable.get(row.lootTableID) ?? []) addSourceIndex(itemIndex, row.itemID, "world-loot", [binding.bindingIndex, row.entryIndex].join(":"), [], [], {
      ...context, bindingIndex: binding.bindingIndex, outerRawRate: binding.dropRate, minimumNPCLevel: binding.minimumNPCLevel, maximumNPCLevel: binding.maximumNPCLevel,
      requirementsTemplate: binding.requirementsTemplate, worldLootSettings: value.worldLootSettings
    });
  }
  const cloth = record(value.clothDrops);
  if (cloth) for (const tier of array(cloth.tiers)) if (validReference("items", tier.itemID, "supplemental-cloth")) addSourceIndex(itemIndex, tier.itemID, "world-loot", "cloth:" + tier.tierIndex, [], [], {
    sourceLabel: "Supplemental cloth loot", tier, rawRate: cloth.dropChance, min: cloth.minimumCount, max: cloth.maximumCount,
    semantics: cloth.semantics, locationScope: "NPC eligibility for this supplemental source is not established."
  });
  const questOwners = new Map<number, number[]>();
  for (const raw of array(value.npcQuestBindings)) {
    const row = record(raw); if (!row || !validReference("npcs", row.ownerNativeId, "npc-quest-owner") || !validReference("quests", row.questID, "npc-quest")) continue;
    questAssociations.push({ ...row, associationId: ["npc", row.ownerNativeId, row.association, row.associationIndex].join(":"), associationKind: "npc-quest" });
    if (record(npcDefs.get(row.ownerNativeId)?.gameplay)?.isQuestGiver !== true) continue;
    const owners = questOwners.get(row.questID) ?? []; if (!owners.includes(row.ownerNativeId)) owners.push(row.ownerNativeId); questOwners.set(row.questID, owners);
  }
  for (const raw of array(value.questObjectives)) {
    const row = record(raw); if (!row || !validReference("quests", row.questID, "quest-objective") || !validReference("tasks", row.taskID, "quest-task")) continue;
    questAssociations.push({ ...row, associationId: ["objective", row.questID, row.objectiveIndex].join(":"), associationKind: "quest-objective" });
  }
  for (const [collection, kind] of [["questItemsGiven", "given"], ["questRewards", "reward"]] as const) for (const raw of array(value[collection])) {
    const row = record(raw); if (!row || !validReference("quests", row.questID, "quest-output")) continue;
    const associationId = [kind, row.questID, row.rewardSource ?? "", row.rewardIndex ?? row.itemIndex].join(":");
    questAssociations.push({ ...row, associationId, associationKind: kind === "given" ? "quest-item-given" : "quest-reward" });
    if (typeof row.itemID === "number" && row.itemID >= 0 && validReference("items", row.itemID, "quest-item")) {
      const owners = questOwners.get(row.questID) ?? [];
      addSourceIndex(itemIndex, row.itemID, "quest", associationId, owners.flatMap((owner) => npcPlacements.get(owner) ?? []), [], {
        ownerEntityKeys: [entityKey("quests", row.questID)], questId: row.questID, rewardSource: row.rewardSource ?? "itemsGiven", rewardType: row.rewardType ?? "item", count: row.count,
        association: kind === "given" ? "Item given by the quest" : "Quest reward", locationScope: "Associated quest NPCs; reward delivery at each NPC is not established."
      });
    }
  }
  for (const [index, raw] of array(value.resourceYields).entries()) {
    const row = record(raw); if (!row || !validReference("items", row.itemID, "resource-yield")) continue;
    resourceYields.push({ ...row, yieldId: "relationship:" + index });
    addSourceIndex(itemIndex, row.itemID, "resource", "relationship:" + index, [], [], { resourceId: row.resourceID, rank: row.rank, min: row.min, max: row.max });
  }
  const itemSources = sorted(itemDefs.keys(), compareNumber).map((itemId) => ({ itemKey: entityKey("items", itemId), itemId, sources: sorted(itemIndex.get(itemId)?.values() ?? [], (a, b) => (a.sourceKind + a.sourceKey).localeCompare(b.sourceKind + b.sourceKey)).map((source) => ({ ...source, probability: null })) }));
  return { merchantTables: [...merchantTables.values()], lootTables: [...tables.values()], merchantBindings, merchantStock, lootBindings, lootEntries, linkedNpcRules, resourceYields, questAssociations, transitions, itemSources };
}

function worldRelations(contexts: SceneContext[], sourcePlacement: Map<string, string>, lootEntries: JsonRecord[], conditions: NormalizedCondition[], itemIndex: Map<number, Map<string, ItemSourceAccumulator>>, blockers: Blocker[]): { resourceYields: JsonRecord[]; transitions: JsonRecord[]; questAssociations: JsonRecord[] } {
  const resourceYields: JsonRecord[] = [], transitions: JsonRecord[] = [], questAssociations: JsonRecord[] = [];
  const entriesByTable = new Map<number, JsonRecord[]>();
  for (const entry of lootEntries) {
    const table = integerOrNull(entry.lootTableID);
    if (table === null) continue;
    const rows = entriesByTable.get(table) ?? []; rows.push(entry); entriesByTable.set(table, rows);
  }
  const sourceConditions = new Map<string, string[]>();
  for (const condition of conditions) {
    const ids = sourceConditions.get(condition.ownerKey) ?? []; ids.push(condition.conditionId); sourceConditions.set(condition.ownerKey, ids);
  }
  for (const context of contexts) {
    const identityFor = (row: JsonRecord): SourceIdentityRow | null => {
      const source = record(row.source);
      const component = integerOrNull(source?.componentInstanceId);
      return component === null ? null : context.sourceByComponent.get(component) ?? null;
    };
    for (const [index, raw] of array(context.world?.resourceProducers).entries()) {
      const producer = record(raw); if (!producer) continue;
      const identity = identityFor(producer);
      if (!identity) { blockers.push({ kind: "unplaced-source", key: `resource:${context.sceneNativeId}:${index}`, detail: "Gathering producer has no verified source identity.", provenance: [pointer(context.worldReference, `/resourceProducers/${index}`)] }); continue; }
      const placementId = sourcePlacement.get(identity.sourceId);
      const options = new Map(array(producer.options).map(record).filter((row): row is JsonRecord => row !== null).map(row => [row.optionIndex, row]));
      for (const rawOutput of array(producer.possibleOutputs)) {
        const wrapper = record(rawOutput), output = record(wrapper?.output);
        if (!output || output.outputKind !== "lootTable") throw new Error("Unsupported authored gathering output kind.");
        const tableId = integerOrNull(output.lootTableID);
        if (tableId === null) throw new Error("Gathering output has no loot-table identity.");
        const optionIndex = integerOrNull(wrapper?.optionIndex), option = options.get(optionIndex);
        for (const entry of entriesByTable.get(tableId) ?? []) {
          const itemId = integerOrNull(entry.itemID); if (itemId === null || itemId < 0) continue;
          const yieldId = hashRelation("gathering-output", [identity.sourceId, optionIndex, output.sourceFieldPath, tableId, entry.entryIndex]);
          resourceYields.push({ yieldId, sourceId: identity.sourceId, itemID: itemId, resourceID: null, rank: null, min: integerOrNull(entry.min), max: integerOrNull(entry.max), lootTableID: tableId, optionIndex, rawRate: numberOrNull(entry.dropRate) });
          addSourceIndex(itemIndex, itemId, "resource", yieldId, placementId ? [placementId] : [], sourceConditions.get(`source:${identity.sourceId}`) ?? [], {
            lootTableId: tableId, optionIndex, min: entry.min, max: entry.max, rawRate: entry.dropRate,
            gatheringSkillId: producer.gatheringSkillID ?? null, requiredSkill: option?.requiredSkill ?? null,
            weightAtLowSkill: option?.weightAtLowSkill ?? null, weightAtHighSkill: option?.weightAtHighSkill ?? null,
            teaserWeight: option?.teaserWeight ?? null, skillCap: producer.skillCap ?? null,
            respawnTime: producer.respawnTime ?? null, respawnJitter: producer.respawnJitter ?? null,
            authoredActionChance: output.authoredActionChance ?? null,
          });
        }
      }
    }
    for (const [index, raw] of array(context.world?.containers).entries()) {
      const container = record(raw); if (!container) continue;
      const identity = identityFor(container);
      if (!identity) { blockers.push({ kind: "unplaced-source", key: `container:${context.sceneNativeId}:${index}`, detail: "Container has no verified source identity.", provenance: [pointer(context.worldReference, `/containers/${index}`)] }); continue; }
      const placementId = sourcePlacement.get(identity.sourceId);
      for (const [entryIndex, rawEntry] of array(record(container.projection)?.lootInstances).entries()) {
        const entry = record(rawEntry), itemId = integerOrNull(entry?.itemID);
        if (!entry || itemId === null || itemId < 0) continue;
        const sourceKey = hashRelation("container-output", [identity.sourceId, entryIndex, itemId]);
        addSourceIndex(itemIndex, itemId, "container", sourceKey, placementId ? [placementId] : [], sourceConditions.get(`source:${identity.sourceId}`) ?? [], { min: entry.minCount, max: entry.maxCount, rawRate: entry.dropChance, maxDrops: record(container.projection)?.maxDrops ?? null });
      }
    }
    for (const [index, raw] of array(context.world?.questZones).entries()) {
      const row = record(raw), quest = record(row?.worldQuest);
      if (row && quest && Number.isSafeInteger(quest.nativeId)) {
        const identity = identityFor(row);
        questAssociations.push({ associationId: hashRelation("world-quest-zone", [identity?.sourceId ?? context.sceneNativeId, quest.nativeId, index]), associationKind: "world-quest-zone", questID: integerOrNull(record(quest.quest)?.nativeId), sourceId: identity?.sourceId ?? null, payload: row });
      }
    }
    for (const [index, raw] of array(context.world?.transitions).entries()) {
      const row = record(raw); if (!row) continue;
      const identity = identityFor(row);
      transitions.push({ ...row, transitionId: hashRelation("transition", [identity?.sourceId ?? context.sceneNativeId, index]), sourceId: identity?.sourceId ?? null, sourceSceneNativeId: context.sceneNativeId, destinationSceneNativeId: integerOrNull(record(row.destinationScene)?.nativeId), destinationMapSpaceId: null, transitionKind: requiredText(row.transitionKind, "Transition kind") });
    }
  }
  return { resourceYields, transitions, questAssociations };
}

function categoryData(placements: NormalizedPlacement[], roles: NormalizedDatabaseInput["roles"]): CategoryMetadata[] {
  const byRole = new Map<string, { placements: Set<string>; entities: Set<string>; count: number }>();
  for (const role of roles) { let group = byRole.get(role.role); if (!group) { group = { placements: new Set(), entities: new Set(), count: 0 }; byRole.set(role.role, group); } group.placements.add(role.placementId); if (role.npcId !== null) group.entities.add(entityKey("npcs", role.npcId)); group.count++; }
  for (const placement of placements) for (const role of placement.roles) { if (!byRole.has(role.role)) byRole.set(role.role, { placements: new Set([placement.placementId]), entities: new Set(), count: 1 }); }
  return sorted([...byRole.entries()].map(([category, group]) => ({ category, label: category.replaceAll(/([a-z])([A-Z])/g, "$1 $2"), placementIds: sorted(group.placements, compareText), entityKeys: sorted(group.entities, compareText), roleCount: group.count })), (a, b) => compareText(a.category, b.category));
}

function entityDetails(entities: NormalizedEntity[], roles: NormalizedDatabaseInput["roles"], itemSources: NormalizedItemSources["items"], conditions: NormalizedCondition[], relationData: { merchantBindings: JsonRecord[]; merchantStock: JsonRecord[]; lootBindings: JsonRecord[]; lootEntries: JsonRecord[]; resourceYields: JsonRecord[]; questAssociations: JsonRecord[]; transitions: JsonRecord[] }): EntityDetail[] {
  const merchantOwners = new Map<number, number[]>();
  const enabledMerchants = new Set<number>(), enabledQuestGivers = new Set<number>();
  for (const entity of entities) if (entity.kind === "npcs") {
    const gameplay = record(entity.publicData.gameplay);
    if (gameplay?.isMerchant === true) enabledMerchants.add(entity.nativeId);
    if (gameplay?.isQuestGiver === true) enabledQuestGivers.add(entity.nativeId);
  }
  for (const row of relationData.merchantBindings) { const tableId = integerOrNull(row.merchantTableID); const ownerId = integerOrNull(row.ownerNativeId); if (tableId !== null && ownerId !== null && enabledMerchants.has(ownerId)) merchantOwners.set(tableId, [...(merchantOwners.get(tableId) ?? []), ownerId]); }
  const result = entities.map((entity) => {
    const entityRoles = roles.filter((row) => row.npcId !== null && entity.entityKey === entityKey("npcs", row.npcId));
    const placementIds = [...new Set(entityRoles.map((row) => row.placementId))].sort(compareText);
    const sourceIds = new Set(entityRoles.map((row) => row.sourceId));
    const indexedSources = itemSources.find((row) => row.itemId === entity.nativeId && entity.kind === "items")?.sources.map((source) => ({ sourceKind: source.sourceKind, sourceKey: source.sourceKey, placementIds: source.placementIds, conditionIds: source.conditionIds, context: source.context })) ?? [];
    const roleSources = entityRoles.map((role) => ({ sourceKind: "placement-role", sourceKey: `${role.placementId}:${role.sourceId}:${role.role}`, placementIds: [role.placementId], conditionIds: [], context: { role: role.role, scope: role.scope } }));
    const sources = [...indexedSources, ...roleSources];
    const merchantStock = relationData.merchantStock.flatMap((row) => { const tableId = integerOrNull(row.merchantTableID); const owners = tableId === null ? [] : [...new Set(merchantOwners.get(tableId) ?? [])]; const itemId = integerOrNull(row.itemID); const currencyId = integerOrNull(row.currencyID); if (owners.length === 0 || (entity.kind === "items" && itemId !== entity.nativeId) || (entity.kind === "currencies" && currencyId !== entity.nativeId) || (entity.kind === "npcs" && !owners.includes(entity.nativeId)) || !["items", "currencies", "npcs"].includes(entity.kind)) return []; return [{ merchantTableId: tableId, stockIndex: integerOrNull(row.stockIndex), itemId, currencyId, cost: numberOrNull(row.cost), ownerNativeIds: owners }]; });
    const lootBindings = relationData.lootBindings.flatMap((row) => { const ownerId = integerOrNull(row.ownerNativeId); if (entity.kind !== "npcs" || ownerId !== entity.nativeId) return []; return [{ context: row.context === "world" ? "world" as const : "npc" as const, ownerNativeId: ownerId, lootTableId: integerOrNull(row.lootTableID), bindingIndex: integerOrNull(row.bindingIndex), rawRate: numberOrNull(row.dropRate), conditionId: typeof row.conditionId === "string" ? row.conditionId : null }]; });
    const ownedLootTables = new Set(lootBindings.map((row) => row.lootTableId));
    const lootEntries = relationData.lootEntries.flatMap((row) => { const itemId = integerOrNull(row.itemID); const tableId = integerOrNull(row.lootTableID); if ((entity.kind !== "items" || itemId !== entity.nativeId) && !ownedLootTables.has(tableId)) return []; return [{ lootTableId: tableId, entryIndex: integerOrNull(row.entryIndex), itemId, min: numberOrNull(row.min), max: numberOrNull(row.max), rawRate: numberOrNull(row.dropRate) }]; });
    const resourceYields = relationData.resourceYields.flatMap((row) => { const itemId = integerOrNull(row.itemID); const resourceId = integerOrNull(row.resourceID); if ((entity.kind !== "items" || itemId !== entity.nativeId) && (entity.kind !== "resources" || resourceId !== entity.nativeId)) return []; return [{ yieldId: String(row.yieldId), sourceId: typeof row.sourceId === "string" ? row.sourceId : null, resourceId, itemId, rank: integerOrNull(row.rank), min: integerOrNull(row.min), max: integerOrNull(row.max) }]; });
    const questAssociations = relationData.questAssociations.flatMap((row) => { const ownerId = integerOrNull(row.ownerNativeId); if (row.associationKind === "npc-quest" && (ownerId === null || !enabledQuestGivers.has(ownerId))) return []; const questId = integerOrNull(row.questID); const taskId = integerOrNull(row.taskID); const itemId = integerOrNull(row.itemID); if ((entity.kind !== "npcs" || ownerId !== entity.nativeId) && (entity.kind !== "quests" || questId !== entity.nativeId) && (entity.kind !== "tasks" || taskId !== entity.nativeId) && (entity.kind !== "items" || itemId !== entity.nativeId)) return []; return [{ associationId: String(row.associationId), associationKind: String(row.associationKind), ownerNativeId: ownerId, questId, taskId, itemId, context: row }]; });
    const transitions = relationData.transitions.flatMap((row) => { const sourceScene = integerOrNull(row.sourceSceneNativeId); const destinationScene = integerOrNull(row.destinationSceneNativeId); if (entity.kind !== "scenes" || (sourceScene !== entity.nativeId && destinationScene !== entity.nativeId)) return []; return [{ transitionId: String(row.transitionId), sourceSceneNativeId: sourceScene, destinationSceneNativeId: destinationScene, transitionKind: String(row.transitionKind) }]; });
    const conditionIds = new Set(indexedSources.flatMap((source) => source.conditionIds));
    for (const binding of relationData.merchantBindings) if (entity.kind === "npcs" && binding.ownerNativeId === entity.nativeId && typeof binding.conditionId === "string") conditionIds.add(binding.conditionId);
    for (const row of lootBindings) if (row.conditionId) conditionIds.add(row.conditionId);
    for (const source of sourceIds) for (const condition of conditions) if (condition.ownerKey === `source:${source}`) conditionIds.add(condition.conditionId);
    const projectedConditions = conditions.filter((condition) => conditionIds.has(condition.conditionId) || condition.ownerKey === entity.entityKey);
    return { entityKey: entity.entityKey, kind: entity.kind, nativeId: entity.nativeId, name: entity.name, internalName: entity.internalName, description: entity.description, publicData: entity.publicData, roles: [...new Set(entityRoles.map((row) => row.role))].sort(compareText), placementIds, sources, relationships: { merchantStock, lootBindings, lootEntries, resourceYields, questAssociations, transitions, conditions: projectedConditions }, provenance: entity.provenance };
  });
  return sorted(result, (a, b) => compareText(a.entityKey, b.entityKey));
}

function coverageSummary(buildId: string, planRef: ArtifactReference, profileRef: ArtifactReference, sourceRefs: ArtifactReference[], blockers: Blocker[], inputCoverage: unknown): NormalizedCoverageSummary {
  const unresolved = { unplacedSources: blockers.filter((row) => row.kind === "unplaced-source").length, unresolvedIssues: blockers.filter((row) => row.kind.includes("issue") || row.kind.includes("unresolved")).length, missingReferences: blockers.filter((row) => row.kind === "missing-reference").length, outsideProfile: blockers.filter((row) => row.kind === "outside-profile-domain").length };
  return { schemaVersion: "compendium.normalized-coverage.v2", buildId, complete: false, blockers: sorted(new Map(blockers.map((row) => [`${row.kind}:${row.key}`, row])).values(), (a, b) => a.kind.localeCompare(b.kind) || a.key.localeCompare(b.key)), unresolved, inputCoverage, provenance: { plan: planRef, profile: profileRef, sources: sourceRefs } };
}

function jsonOutput(value: unknown): string { return `${JSON.stringify(value, null, 2)}\n`; }

export async function normalize(planPath: string, outputRoot: string): Promise<NormalizedOutput> {
  const absolutePlan = path.resolve(planPath);
  const planDirectory = path.dirname(absolutePlan);
  const planBytes = await readFile(absolutePlan);
  const planRef: ArtifactReference = { path: path.basename(absolutePlan), sha256: createHash("sha256").update(planBytes).digest("hex"), kind: "normalization-plan" };
  const plan = parsePlan(JSON.parse(planBytes.toString("utf8")));
  const topLevel = new Map<string, ResolvedReference>();
  const sourceFiles: SourceRecord[] = [];
  const canonicalManifest = await loadVerifiedManifest(planDirectory, plan.canonicalManifest, plan.buildId, "canonicalManifest");
  sourceFiles.push({ key: "canonicalManifest", kind: "canonicalManifest", reference: canonicalManifest.resolved.reference, value: canonicalManifest.resolved.value, bytes: canonicalManifest.resolved.bytes });
  const requiredArtifacts = [
    ["canonical", "raw/canonical.json"], ["relationships", "raw/relationships.json"], ["lootRules", "raw/loot-rules.json"],
    ["support", "raw/support.json"], ["localization", "raw/localization.json"], ["sceneCatalog", "scene-catalog.json"],
  ] as const;
  for (const [key, artifactName] of requiredArtifacts) {
    const loaded = await resolveManifestArtifact(planDirectory, canonicalManifest.run, artifactName, `canonicalManifest.${key}`);
    topLevel.set(key, loaded);
    sourceFiles.push({ key, kind: key, reference: loaded.reference, value: loaded.value, bytes: loaded.bytes });
  }
  Assert(CanonicalSchema, topLevel.get("canonical")!.value);
  Assert(RelationshipsSchema, topLevel.get("relationships")!.value);
  Assert(LootRulesSchema, topLevel.get("lootRules")!.value);
  Assert(SupportSchema, topLevel.get("support")!.value);
  Assert(LocalizationSchema, topLevel.get("localization")!.value);
  const profile = await resolveReference(planDirectory, plan.mapSpaceProfile, "mapSpaceProfile");
  const spatial = await loadSpatialProfile(profile.absolutePath);
  if (spatial === null || spatial.sha256 !== profile.reference.sha256) throw new Error("Reviewed map-space profile changed during normalization.");
  sourceFiles.push({ key: "mapSpaceProfile", kind: "mapSpaceProfile", reference: profile.reference, value: spatial.profile, bytes: profile.bytes });
  const catalogValue = topLevel.get("sceneCatalog")?.value;
  Assert(SceneCatalogSchema, catalogValue);
  const sceneCatalog = catalogValue as SceneCatalog;
  const compiledMapSpaces = compileMapSpaces(spatial.profile, sceneCatalog);
  const canonical = record(topLevel.get("canonical")?.value); if (!canonical) throw new Error("Canonical extraction is required.");
  const relationships = record(topLevel.get("relationships")?.value); if (!relationships) throw new Error("Relationships extraction is required.");
  const profileData: Pick<NormalizedDatabaseInput, "mapSpaces" | "bindings"> = {
    mapSpaces: spatial.profile.mapSpaces.map((space) => ({ id: space.id, label: space.label })),
    bindings: spatial.profile.bindings.map((binding) => ({ id: binding.id, mapSpaceId: binding.mapSpaceId, sceneNativeId: binding.sceneNativeId, scenePath: binding.scenePath, frame: binding.frame, domain: binding.domain })),
  };
  const sceneData = await sceneContexts(planDirectory, plan);
  for (const source of sceneData.sourceFiles) sourceFiles.push(source);
  const uniqueSourceFiles = new Map<string, SourceRecord>();
  for (const source of sourceFiles) uniqueSourceFiles.set(`${source.kind}:${source.reference.path}:${source.reference.sha256}`, source);
  sourceFiles.length = 0;
  sourceFiles.push(...uniqueSourceFiles.values());
  const blockers: Blocker[] = [];
  const placementData = collectPlacements(sceneData.contexts, profileData.bindings, compiledMapSpaces, profile.reference, blockers);
  attachShapes(sceneData.contexts, placementData.sourceForComponent, placementData.placements, blockers);
  for (const placement of placementData.placements) placement.buildId = plan.buildId;
  for (const source of placementData.sources) source.buildId = plan.buildId;
  for (const source of placementData.sources) source.families = source.families.length > 0 ? source.families : ["unclassified"];
  const canonicalData = canonicalEntityRows(canonical, plan.buildId, topLevel.get("canonical")!.reference);
  const entityKeys = new Set(canonicalData.entities.map((entity) => entity.entityKey));
  const relationshipsRef = topLevel.get("relationships")!.reference;
  const canonicalRef = topLevel.get("canonical")!.reference;
  for (const kind of ["currencies", "tasks", "skills", "effects", "properties", "classes", "races", "treePoints"] as const) {
    for (const raw of array(relationships[kind])) {
      const row = record(raw); if (!row || !Number.isSafeInteger(row.nativeId)) continue;
      const key = entityKey(kind, row.nativeId); if (entityKeys.has(key)) continue;
      const details = publicEntityDetails(row);
      canonicalData.entities.push({ entityKey: key, buildId: plan.buildId, kind, nativeId: row.nativeId, name: details.name, internalName: details.internalName, description: details.description, sourceKey: integerOrNull(row.sourceKey), publicData: { localization: row.localization ?? null, gameplay: row.gameplay ?? null, icon: row.icon ?? null }, provenance: [pointer(relationshipsRef, `/${kind}/${row.nativeId}`)] }); entityKeys.add(key);
    }
  }
  canonicalData.entities.sort((a, b) => a.entityKey.localeCompare(b.entityKey));
  const knownEntityKeys = new Set(canonicalData.entities.map((entity) => entity.entityKey));
  placementData.roles = placementData.roles.filter((role) => {
    if (role.npcId === null || knownEntityKeys.has(entityKey("npcs", role.npcId))) return true;
    blockers.push({ kind: "missing-reference", key: `role:${role.placementId}:${role.role}:${role.npcId}`, detail: `Placement role references missing NPC ${role.npcId}.`, provenance: [] }); return false;
  });
  const npcReference = sceneData.sourceFiles.find((source) => source.kind === "npcProducers")?.reference ?? canonicalRef;
  const worldReference = sceneData.sourceFiles.find((source) => source.kind === "worldSources")?.reference ?? canonicalRef;
  const npcRows = producerRows(sceneData.contexts, placementData.sourceForComponent, blockers, npcReference);
  for (const candidate of npcRows.candidates) {
    if (candidate.npcId !== null && !knownEntityKeys.has(entityKey("npcs", candidate.npcId))) {
      blockers.push({ kind: "missing-reference", key: `spawn:${candidate.sourceId}:${candidate.candidateIndex}:${candidate.npcId}`, detail: `Spawn candidate references missing NPC ${candidate.npcId}.`, provenance: candidate.provenance });
      candidate.npcId = null;
    }
  }
  const conditions = [...npcRows.conditions, ...collectWorldConditions(sceneData.contexts, placementData.sourceForComponent, blockers, worldReference)];
  for (const kind of ["lootTables", "quests", "tasks", "resources"]) for (const [index, raw] of array(relationships[kind]).entries()) {
    const row = record(raw);
    if (row && Number.isSafeInteger(row.nativeId)) conditions.push(...conditionRowsFor("entity", entityKey(kind, row.nativeId), row, pointer(relationshipsRef, `/${kind}/${index}`)));
  }
  const relationData = relationRows(relationships, canonical, topLevel.get("lootRules")!.value, placementData.roles, knownEntityKeys, blockers);
  for (const row of relationData.merchantBindings) {
    if (row.requirementsTemplate === null || row.requirementsTemplate === undefined) continue;
    const ownerKey = `merchant:${String(row.ownerNativeId)}:${String(row.bindingIndex)}`;
    const condition = conditionFrom("merchant-binding", ownerKey, row.requirementsTemplate, "merchant-requirements-template", typeof row.sourceFieldPath === "string" ? row.sourceFieldPath : null, [pointer(relationshipsRef, `/merchantBindings/${String(row.bindingIndex)}/requirementsTemplate`)]);
    conditions.push(condition); row.conditionId = condition.conditionId;
  }
  for (const row of relationData.lootBindings) {
    if (row.requirementsTemplate === null || row.requirementsTemplate === undefined) continue;
    const ownerKey = `loot:${String(row.context)}:${String(row.ownerNativeId ?? "world")}:${String(row.bindingIndex)}`;
    const condition = conditionFrom("loot-binding", ownerKey, row.requirementsTemplate, "loot-requirements-template", typeof row.sourceFieldPath === "string" ? row.sourceFieldPath : null, [pointer(relationshipsRef, `/lootBindings/${String(row.bindingIndex)}/requirementsTemplate`)]);
    conditions.push(condition); row.conditionId = condition.conditionId;
  }
  const itemIndex = new Map<number, Map<string, ItemSourceAccumulator>>();
  for (const item of relationData.itemSources) { const map = new Map<string, ItemSourceAccumulator>(); for (const source of item.sources) map.set(`${source.sourceKind}:${source.sourceKey}`, source); itemIndex.set(item.itemId, map); }
  const worldData = worldRelations(sceneData.contexts, placementData.sourcePlacement, relationData.lootEntries, conditions, itemIndex, blockers);
  for (const row of [...relationData.resourceYields, ...worldData.resourceYields]) {
    if (typeof row.itemID === "number" && !knownEntityKeys.has(entityKey("items", row.itemID))) blockers.push({ kind: "missing-reference", key: `resource-item:${String(row.yieldId)}`, detail: `Resource yield references missing item ${row.itemID}.`, provenance: [] });
    if (typeof row.resourceID === "number" && !knownEntityKeys.has(entityKey("resources", row.resourceID))) blockers.push({ kind: "missing-reference", key: `resource-resource:${String(row.yieldId)}`, detail: `Resource yield references missing resource ${row.resourceID}.`, provenance: [] });
  }
  for (const row of worldData.transitions) {
    if (typeof row.destinationSceneNativeId === "number" && !knownEntityKeys.has(entityKey("scenes", row.destinationSceneNativeId))) {
      blockers.push({ kind: "missing-reference", key: `transition:${String(row.transitionId)}`, detail: `Transition references missing destination scene ${row.destinationSceneNativeId}.`, provenance: [] });
      row.destinationSceneNativeId = null;
    }
  }
  const conditionsByOwner = new Map<string, string[]>();
  for (const condition of conditions) { const ids = conditionsByOwner.get(condition.ownerKey) ?? []; ids.push(condition.conditionId); conditionsByOwner.set(condition.ownerKey, ids); }
  for (const sources of itemIndex.values()) for (const source of sources.values()) {
    const context = source.context;
    const owners = array(context.ownerEntityKeys).filter((key): key is string => typeof key === "string");
    if (typeof context.lootTableId === "number") owners.push(entityKey("lootTables", context.lootTableId));
    if (typeof context.resourceId === "number") owners.push(entityKey("resources", context.resourceId));
    if (source.sourceKind === "merchant") owners.push(`merchant:${context.ownerNativeId}:${context.bindingIndex}`);
    if (source.sourceKind === "npc-loot") owners.push(`loot:npc:${context.ownerNativeId}:${context.bindingIndex}`);
    if (source.sourceKind === "world-loot") owners.push(`loot:world:world:${context.bindingIndex}`);
    source.conditionIds = [...new Set([...source.conditionIds, ...owners.flatMap((owner) => conditionsByOwner.get(owner) ?? [])])].sort(compareText);
  }
  const itemSources: NormalizedItemSources["items"] = sorted(canonicalDefinitions(canonical, "items").keys(), compareNumber).map((itemId) => ({ itemKey: entityKey("items", itemId), itemId, sources: sorted(itemIndex.get(itemId)?.values() ?? [], (a, b) => `${a.sourceKind}:${a.sourceKey}`.localeCompare(`${b.sourceKind}:${b.sourceKey}`)).map((source) => ({ ...source, probability: null })) }));
  const linkedRules = array(record(topLevel.get("lootRules")?.value)?.linkedNpcs).flatMap((row) => {
    const value = record(row); if (!value) return [];
    const npcId = integerOrNull(value.npcId); if (npcId === null || !knownEntityKeys.has(entityKey("npcs", npcId))) { blockers.push({ kind: "missing-reference", key: `linked-npc:${String(value.npcId)}`, detail: "Linked-NPC loot rule has no canonical NPC entity.", provenance: [] }); return []; }
    for (const field of ["authoredLinkedNpcId", "resolvedLinkedNpcId", "resolvedLootSpecNpcId"] as const) {
      const linked = integerOrNull(value[field]);
      if (linked === null || linked === -1) { value[field] = null; continue; }
      if (!knownEntityKeys.has(entityKey("npcs", linked))) {
        blockers.push({ kind: "missing-reference", key: `linked-npc:${String(linked)}`, detail: `Linked-NPC loot rule references missing NPC ${linked}.`, provenance: [] });
        value[field] = null;
      }
    }
    return [value];
  });
  const allRoles = placementData.roles;
  for (const placement of placementData.placements) placement.roles = allRoles.filter((row) => row.placementId === placement.placementId).map((row) => ({ role: row.role, npcId: row.npcId, scope: row.scope as "authored" | "player-state", sourceIds: [row.sourceId] })).sort((a, b) => a.role.localeCompare(b.role) || (a.npcId ?? -1) - (b.npcId ?? -1) || a.sourceIds[0]!.localeCompare(b.sourceIds[0]!));
  const coverageSources = sourceFiles.filter((source) => source.kind === "coverage");
  for (const source of coverageSources) for (const diagnostic of source.value.diagnostics) {
    if (diagnostic.category === "unset") continue;
    blockers.push({ kind: `source-coverage-${diagnostic.category}`, key: `${source.reference.sha256}:${diagnostic.sourceKey}:${diagnostic.issueType}`, detail: diagnostic.details.map((row: { detail: string }) => row.detail).join("; "), provenance: [source.reference] });
  }
  const inputCoverage = { discoveryClosed: false, ledgers: coverageSources.map((source) => ({ reference: source.reference, runId: source.value.runId, discoveryClosed: source.value.discoveryClosed, summary: source.value.summary })) };
  const coverage = coverageSummary(plan.buildId, planRef, profile.reference, sourceFiles.map((source) => source.reference), blockers, inputCoverage);
  coverage.blockers.push({ kind: "input-coverage-incomplete", key: "coverage", detail: "Source coverage ledgers are bounded observations, not a closed-world coverage review.", provenance: coverageSources.map((source) => source.reference) });
  coverage.blockers = sorted(new Map(coverage.blockers.map((row) => [`${row.kind}:${row.key}`, row])).values(), (a, b) => a.kind.localeCompare(b.kind) || a.key.localeCompare(b.key));
  const mapPlacements = placementData.placements;
  const reviewedScenes = profileData.bindings.map((binding) => ({ nativeId: binding.sceneNativeId, path: binding.scenePath, name: binding.scenePath.split("/").pop()?.replace(/\.unity$/, "") ?? null }));
  const reviewedSceneIds = new Set(reviewedScenes.map((scene) => scene.nativeId));
  const identityResults = [...new Map(sceneData.contexts.map((context) => [`${context.sceneNativeId}:${context.snapshotRunId}`, { runId: context.snapshotRunId, snapshotSha256: context.snapshotReference.sha256, character: context.character, sceneHandle: context.sceneHandle, result: context.identityResult }])).values()];
  const input: NormalizedDatabaseInput = { buildId: plan.buildId, identityResults, entities: canonicalData.entities, scenes: [...reviewedScenes, ...canonicalData.scenes.filter((scene) => !reviewedSceneIds.has(scene.nativeId))], mapSpaces: profileData.mapSpaces, bindings: profileData.bindings, placements: mapPlacements, sources: placementData.sources, roles: placementData.roles, conditions, spawnCandidates: npcRows.candidates, merchantTables: relationData.merchantTables, lootTables: relationData.lootTables, merchantBindings: relationData.merchantBindings, merchantStock: relationData.merchantStock, lootBindings: relationData.lootBindings, lootEntries: relationData.lootEntries, linkedNpcRules: linkedRules, resourceYields: [...relationData.resourceYields, ...worldData.resourceYields], questAssociations: [...relationData.questAssociations, ...worldData.questAssociations], transitions: worldData.transitions, itemSources, blockers: coverage.blockers, inputCoverage, provenance: { plan: planRef, profile: profile.reference, sources: sourceFiles.map((source) => source.reference) } };
  const implementationHashes = {
    "tool:pipeline-normalize": await fileHash(path.resolve(import.meta.dir, "normalize.ts")),
    "tool:pipeline-database": await fileHash(path.resolve(import.meta.dir, "database.ts")),
    "tool:pipeline-contracts": await fileHash(path.resolve(import.meta.dir, "normalized-contracts.ts")),
    "tool:map-spaces": await fileHash(path.resolve(import.meta.dir, "../tools/map-spaces.ts")),
    "tool:spatial-extraction": await fileHash(path.resolve(import.meta.dir, "../tools/spatial-extraction.ts")),
    "tool:map-contracts": await fileHash(path.resolve(import.meta.dir, "../tools/map-contracts.ts")),
    "tool:build": await fileHash(path.resolve(import.meta.dir, "../tools/build.ts")),
    "tool:run-reader": await fileHash(path.resolve(import.meta.dir, "../tools/runs.ts")),
    "tool:cli": await fileHash(path.resolve(import.meta.dir, "../tools/cli.ts")),
    "package": await fileHash(path.resolve(import.meta.dir, "../package.json")),
    "lockfile": await fileHash(path.resolve(import.meta.dir, "../bun.lock")),
  };
  const run = await beginRun(outputRoot, { buildId: plan.buildId, toolRevision: await toolRevision(), command: "normalize", settings: { planPath: path.basename(absolutePlan), planSchemaVersion: plan.schemaVersion }, inputHashes: { ...Object.fromEntries(sourceFiles.map((source) => [source.key, source.reference.sha256])), plan: planRef.sha256, mapSpaceProfile: profile.reference.sha256, sceneCatalog: topLevel.get("sceneCatalog")!.reference.sha256, ...implementationHashes } });
  try {
    const inputsDirectory = path.join(run.directory, "inputs");
    const sourceManifestDirectory = path.join(inputsDirectory, "source-manifests");
    await mkdir(sourceManifestDirectory, { recursive: true });
    await writeFile(path.join(inputsDirectory, "plan.json"), planBytes);
    await writeFile(path.join(inputsDirectory, "map-space-profile.json"), profile.bytes);
    await writeFile(path.join(inputsDirectory, "scene-catalog.json"), topLevel.get("sceneCatalog")!.bytes);
    const archivedManifests = sourceFiles.filter((source) => source.kind === "canonicalManifest" || source.kind === "sceneManifest").map((source) => {
      const fileName = `${source.kind}-${source.reference.sha256}.json`;
      return { ...source, archivePath: `inputs/source-manifests/${fileName}` };
    });
    for (const source of archivedManifests) await writeFile(path.join(run.directory, source.archivePath), source.bytes);
    await writeFile(path.join(inputsDirectory, "source-manifests.json"), jsonOutput(archivedManifests.map((source) => ({ path: source.archivePath, sha256: source.reference.sha256, kind: source.kind, originalPath: source.reference.path }))));
    const databasePath = path.join(run.directory, "normalized.sqlite");
    const db = openNormalizedDatabase(databasePath);
    populateNormalizedDatabase(db, input, sourceFiles.map((source) => ({ key: source.key, kind: source.kind, ref: source.reference })));
    const counts = databaseCounts(db);
    db.close();
    const categories: CategoryMetadata[] = categoryData(mapPlacements, placementData.roles);
    const entityDetailsRows = entityDetails(canonicalData.entities, placementData.roles, itemSources, conditions, { merchantBindings: relationData.merchantBindings, merchantStock: relationData.merchantStock, lootBindings: relationData.lootBindings, lootEntries: relationData.lootEntries, resourceYields: [...relationData.resourceYields, ...worldData.resourceYields], questAssociations: [...relationData.questAssociations, ...worldData.questAssociations], transitions: worldData.transitions });
    const sourceDetails: NormalizedMapProjection["sources"] = [];
    for (const context of sceneData.contexts) {
      const collections = [...["resourceProducers", "interactions", "containers", "services", "questZones", "transitions", "conditionSources"].map((family) => [family, array(context.world?.[family])] as const), ["npcProducer", array(context.npc?.producers)] as const];
      for (const [family, rows] of collections) for (const raw of rows) {
        const row = record(raw); if (!row) continue;
        const componentId = integerOrNull(record(row.source)?.componentInstanceId ?? row.componentInstanceId);
        const identity = componentId === null ? undefined : context.sourceByComponent.get(componentId);
        const placementId = identity ? placementData.sourcePlacement.get(identity.sourceId) : undefined;
        if (identity && placementId) sourceDetails.push({ sourceId: identity.sourceId, placementId, family: row.family ?? row.producerFamily ?? row.transitionKind ?? family, data: row });
      }
    }
    const mapProjection: NormalizedMapProjection = { schemaVersion: "compendium.map-projections.v2" as const, buildId: plan.buildId, mapSpaces: profileData.mapSpaces.map((space) => ({ mapSpaceId: space.id, label: space.label, placementIds: mapPlacements.filter((placement) => placement.mapSpaceId === space.id).map((placement) => placement.placementId).sort(compareText) })), placements: mapPlacements, sources: sourceDetails, provenance: { plan: planRef, profile: profile.reference, sources: sourceFiles.map((source) => source.reference) } };
    const categoryProjection = { schemaVersion: "compendium.category-metadata.v1" as const, buildId: plan.buildId, categories, provenance: { plan: planRef, sources: sourceFiles.map((source) => source.reference) } };
    const entityProjection = { schemaVersion: "compendium.entity-details.v1" as const, buildId: plan.buildId, entities: entityDetailsRows, provenance: { plan: planRef, sources: sourceFiles.map((source) => source.reference) } };
    const itemProjection: NormalizedItemSources = { schemaVersion: "compendium.item-sources.v1", buildId: plan.buildId, items: itemSources, conditions: [...new Map(conditions.map((condition) => [condition.conditionId, condition])).values()], provenance: { plan: planRef, sources: sourceFiles.map((source) => source.reference) } };
    const outputs: Array<[string, unknown]> = [["projections/map-projections.json", mapProjection], ["projections/category-metadata.json", categoryProjection], ["projections/entity-details.json", entityProjection], ["projections/item-sources.json", itemProjection], ["projections/coverage-summary.json", coverage]];
    await mkdir(path.join(run.directory, "projections"), { recursive: true });
    for (const [relativePath, value] of outputs) await writeFile(path.join(run.directory, relativePath), jsonOutput(value), "utf8");
    await run.addArtifact("normalized.sqlite");
    await run.addArtifact("inputs/plan.json");
    await run.addArtifact("inputs/map-space-profile.json");
    await run.addArtifact("inputs/scene-catalog.json");
    await run.addArtifact("inputs/source-manifests.json");
    for (const source of archivedManifests) await run.addArtifact(source.archivePath);
    for (const [relativePath] of outputs) await run.addArtifact(relativePath);
    await run.succeed();
    const output: NormalizedOutput = { schemaVersion: "compendium.normalized-output.v2", buildId: plan.buildId, runId: run.runId, manifest: run.manifestPath, directory: run.directory, database: databasePath, projections: { map: path.join(run.directory, "projections/map-projections.json"), categories: path.join(run.directory, "projections/category-metadata.json"), entities: path.join(run.directory, "projections/entity-details.json"), itemSources: path.join(run.directory, "projections/item-sources.json"), coverage: path.join(run.directory, "projections/coverage-summary.json") }, counts: { ...counts, blockers: coverage.blockers.length }, coverage: { complete: coverage.complete, unresolved: coverage.unresolved }, provenance: input.provenance };
    return output;
  } catch (error) { await run.fail(error); throw error; }
}
