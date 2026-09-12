import { Type, type Static } from "typebox";
import { Assert } from "typebox/value";
import type { PlacementIdentityResult } from "../tools/placement-contracts";
import type { RoleScope } from "../tools/role-contracts";

export const NORMALIZED_PLAN_SCHEMA_VERSION = "compendium.normalization-plan.v1" as const;
export const NORMALIZED_OUTPUT_SCHEMA_VERSION = "compendium.normalized-output.v5" as const;

const hash = Type.String({ pattern: "^[a-f0-9]{64}$" });
const text = Type.String({ minLength: 1 });
const nullableText = Type.Union([text, Type.Null()]);
const id = Type.Integer();
const coordinate = Type.Object({ x: Type.Number(), y: Type.Number(), z: Type.Number() });

export const ArtifactReferenceSchema = Type.Object({
  path: text,
  sha256: hash,
  artifact: Type.Optional(text),
  kind: Type.Optional(text),
}, { additionalProperties: false });
export type ArtifactReference = Static<typeof ArtifactReferenceSchema>;

export const SceneSnapshotReferenceSchema = Type.Object({
  manifest: ArtifactReferenceSchema,
  prefix: Type.Optional(text),
}, { additionalProperties: false });
export type SceneSnapshotReference = Static<typeof SceneSnapshotReferenceSchema>;

export const NormalizationPlanSchema = Type.Object({
  schemaVersion: Type.Literal(NORMALIZED_PLAN_SCHEMA_VERSION),
  buildId: text,
  canonicalManifest: ArtifactReferenceSchema,
  mapSpaceProfile: ArtifactReferenceSchema,
  sceneSnapshots: Type.Array(SceneSnapshotReferenceSchema, { minItems: 1 }),
}, { additionalProperties: false });
export type NormalizationPlan = Static<typeof NormalizationPlanSchema>;

export type CanonicalKind = "items" | "npcs" | "quests" | "lootTables" | "scenes" | "resources" | string;
export type ProvenanceReference = ArtifactReference & { pointer?: string };

export interface NormalizedEntity {
  entityKey: string;
  buildId: string;
  kind: CanonicalKind;
  nativeId: number;
  name: string | null;
  internalName: string | null;
  description: string | null;
  sourceKey: number | null;
  publicData: { localization: unknown | null; gameplay: unknown | null; icon: unknown | null };
  provenance: ProvenanceReference[];
}

export interface NormalizedPlacementIdentity {
  sceneSourceSha256: string;
  sourceSha256: string;
  serializedFile: string;
  gameObjectPathId: string;
  origin: "scene" | "streamed-prefab";
  loaderSourceId: string | null;
}

export type NormalizedRegionGeometry =
  | { kind: "box"; corners: [[number, number], [number, number], [number, number], [number, number]] }
  | { kind: "sphere"; center: [number, number]; radius: number };

export interface NormalizedRegion {
  regionId: string;
  buildId: string;
  sceneNativeId: number;
  scenePath: string;
  name: string;
  internalName: string | null;
  shape: "box" | "sphere";
  worldGeometry: NormalizedRegionGeometry;
  mapSpaceId: string | null;
  mapGeometry: NormalizedRegionGeometry | null;
  provenance: ProvenanceReference[];
}

export interface NormalizedPlacement {
  placementId: string;
  buildId: string;
  sceneNativeId: number;
  scenePath: string;
  identity: NormalizedPlacementIdentity | null;
  label?: string | null;
  mapSpaceId: string | null;
  worldPosition: { x: number; y: number; z: number };
  mapPosition: { x: number; y: number } | null;
  sourceIds: string[];
  roles: Array<{ role: string; npcId: number | null; scope: RoleScope; sourceIds: string[] }>;
  shape: Record<string, unknown> | null;
  provenance: ProvenanceReference[];
}

export interface NormalizedCondition {
  conditionId: string;
  ownerType: string;
  ownerKey: string;
  ordinal: number;
  semantics: string;
  sourceFieldPath: string | null;
  payload: unknown;
  provenance: ProvenanceReference[];
}

export interface NormalizedSource {
  sourceId: string;
  placementId: string;
  buildId: string;
  componentType: string | null;
  componentInstanceId: number;
  gameObjectInstanceId: number;
  sceneSourceSha256: string;
  sourceSha256: string;
  serializedFile: string;
  gameObjectPathId: string;
  componentPathId: string;
  assembly: string;
  origin: "scene" | "streamed-prefab";
  loaderSourceId: string | null;
  families: string[];
  provenance: ProvenanceReference[];
}

export interface NormalizedSpawnCandidate {
  sourceId: string;
  candidateIndex: number;
  npcId: number | null;
  minCount: number | null;
  maxCount: number | null;
  rawChance: number | null;
  chanceSemantics: string;
  payload: unknown;
  provenance: ProvenanceReference[];
}

export interface NormalizedMapProjection {
  schemaVersion: "compendium.map-projections.v3";
  buildId: string;
  mapSpaces: Array<{ mapSpaceId: string; label: string; placementIds: string[] }>;
  placements: NormalizedPlacement[];
  regions: NormalizedRegion[];
  sources: Array<{ sourceId: string; placementId: string; family: string; data: Record<string, unknown> }>;
  provenance: { plan: ArtifactReference; profile: ArtifactReference; sources: ArtifactReference[] };
}

export interface CategoryMetadata {
  category: string;
  label: string;
  placementIds: string[];
  entityKeys: string[];
  roleCount: number;
}

export interface NormalizedCategoryMetadata {
  schemaVersion: "compendium.category-metadata.v1";
  buildId: string;
  categories: CategoryMetadata[];
  provenance: { plan: ArtifactReference; sources: ArtifactReference[] };
}

export interface EntityRelationshipProjection {
  merchantStock: Array<{ merchantTableId: number | null; stockIndex: number | null; itemId: number | null; currencyId: number | null; cost: number | null; ownerNativeIds: number[] }>;
  lootBindings: Array<{ context: "npc" | "world"; ownerNativeId: number | null; lootTableId: number | null; bindingIndex: number | null; rawRate: number | null; conditionId: string | null }>;
  lootEntries: Array<{ lootTableId: number | null; entryIndex: number | null; itemId: number | null; min: number | null; max: number | null; rawRate: number | null }>;
  resourceYields: Array<{ yieldId: string; sourceId: string | null; resourceId: number | null; itemId: number | null; rank: number | null; min: number | null; max: number | null }>;
  questAssociations: Array<{ associationId: string; associationKind: string; ownerNativeId: number | null; questId: number | null; taskId: number | null; itemId: number | null; context: Record<string, unknown> }>;
  transitions: Array<{ transitionId: string; sourceSceneNativeId: number | null; destinationSceneNativeId: number | null; transitionKind: string }>;
  conditions: NormalizedCondition[];
}

export interface EntityDetail {
  entityKey: string;
  kind: string;
  nativeId: number;
  name: string | null;
  internalName: string | null;
  description: string | null;
  publicData: { localization: unknown | null; gameplay: unknown | null; icon: unknown | null };
  roles: string[];
  placementIds: string[];
  sources: Array<{ sourceKind: string; sourceKey: string; placementIds: string[]; conditionIds: string[]; context: Record<string, unknown> }>;
  relationships: EntityRelationshipProjection;
  provenance: ProvenanceReference[];
}

export interface NormalizedEntityDetails {
  schemaVersion: "compendium.entity-details.v1";
  buildId: string;
  entities: EntityDetail[];
  provenance: { plan: ArtifactReference; sources: ArtifactReference[] };
}

export interface ItemSource {
  itemKey: string;
  itemId: number;
  sources: Array<{
    sourceKind: "merchant" | "npc-loot" | "world-loot" | "container" | "resource" | "quest";
    sourceKey: string;
    placementIds: string[];
    conditionIds: string[];
    context: Record<string, unknown>;
    probability: null;
  }>;
}

export interface NormalizedItemSources {
  schemaVersion: "compendium.item-sources.v1";
  buildId: string;
  items: ItemSource[];
  conditions: NormalizedCondition[];
  provenance: { plan: ArtifactReference; sources: ArtifactReference[] };
}

export interface NormalizedCoverageSummary {
  schemaVersion: "compendium.normalized-coverage.v3";
  buildId: string;
  complete: false;
  blockers: Array<{ kind: string; key: string; detail: string; provenance: ProvenanceReference[] }>;
  // A reviewed domain box decides what a map shows. A placement outside every box of its scene's
  // bindings is a deliberate, evidence-backed exclusion, not an unresolved gap.
  exclusions: Array<{ kind: "outside-reviewed-domain"; key: string; detail: string; mapSpaceIds: string[]; provenance: ProvenanceReference[] }>;
  unresolved: { unplacedSources: number; unresolvedIssues: number; missingReferences: number };
  inputCoverage: unknown | null;
  provenance: { plan: ArtifactReference; profile: ArtifactReference; sources: ArtifactReference[] };
}

export interface NormalizedOutput {
  schemaVersion: typeof NORMALIZED_OUTPUT_SCHEMA_VERSION;
  buildId: string;
  runId: string;
  manifest: string;
  directory: string;
  database: string;
  projections: {
    map: string;
    categories: string;
    entities: string;
    itemSources: string;
    coverage: string;
  };
  counts: {
    entities: number;
    placements: number;
    regions: number;
    sources: number;
    roles: number;
    conditions: number;
    domainRelations: number;
    blockers: number;
  };
  coverage: Pick<NormalizedCoverageSummary, "complete" | "unresolved">;
  provenance: { plan: ArtifactReference; profile: ArtifactReference; sources: ArtifactReference[] };
}

export interface NormalizedDatabaseInput {
  buildId: string;
  identityResults: Array<{ runId: string; snapshotId: string; snapshotPrefix: string; snapshotSha256: string; character: string; sceneHandle: number; result: PlacementIdentityResult }>;
  entities: NormalizedEntity[];
  scenes: Array<{ nativeId: number; path: string; name: string | null }>;
  mapSpaces: Array<{ id: string; label: string }>;
  bindings: Array<{ id: string; mapSpaceId: string; sceneNativeId: number; scenePath: string; frame: unknown; domain: { kind: "scene" } | { kind: "boxes"; boxes: unknown } }>;
  placements: NormalizedPlacement[];
  sources: NormalizedSource[];
  roles: Array<{ placementId: string; sourceId: string; role: string; npcId: number | null; scope: RoleScope; evidence: unknown }>;
  regions: NormalizedRegion[];
  conditions: NormalizedCondition[];
  spawnCandidates: NormalizedSpawnCandidate[];
  merchantTables: Array<Record<string, unknown>>;
  merchantBindings: Array<Record<string, unknown>>;
  merchantStock: Array<Record<string, unknown>>;
  lootTables: Array<Record<string, unknown>>;
  lootBindings: Array<Record<string, unknown>>;
  lootEntries: Array<Record<string, unknown>>;
  linkedNpcRules: Array<Record<string, unknown>>;
  resourceYields: Array<Record<string, unknown>>;
  questAssociations: Array<Record<string, unknown>>;
  transitions: Array<Record<string, unknown>>;
  itemSources: ItemSource[];
  blockers: NormalizedCoverageSummary["blockers"];
  inputCoverage: unknown | null;
  provenance: { plan: ArtifactReference; profile: ArtifactReference; sources: ArtifactReference[] };
}

export function entityKey(kind: string, nativeId: number): string {
  return `${kind}:${nativeId}`;
}

export function assertNormalizationPlan(value: unknown): asserts value is NormalizationPlan {
  Assert(NormalizationPlanSchema, value);
  const plan = value as NormalizationPlan;
  if (plan.schemaVersion !== NORMALIZED_PLAN_SCHEMA_VERSION) throw new TypeError(`Normalization plan schemaVersion must be ${NORMALIZED_PLAN_SCHEMA_VERSION}.`);
  if (plan.buildId.length === 0) throw new TypeError("Normalization plan buildId is required.");
  if (plan.sceneSnapshots?.some((snapshot) => Object.keys(snapshot).length === 0)) throw new TypeError("Every scene snapshot must select at least one source artifact.");
}

export function stableJson(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  const object = value as Record<string, unknown>;
  return `{${Object.keys(object).sort().map((key) => `${JSON.stringify(key)}:${stableJson(object[key])}`).join(",")}}`;
}

export function publicEntityDetails(row: Record<string, unknown>): { name: string | null; internalName: string | null; description: string | null } {
  const textOrNull = (value: unknown): string | null => typeof value === "string" ? value : null;
  return { name: textOrNull(row.name), internalName: textOrNull(row.internalName), description: textOrNull(row.description) };
}

export type NormalizedOutputStatic = Pick<NormalizedOutput, "schemaVersion" | "buildId" | "runId" | "manifest" | "directory" | "database">;
