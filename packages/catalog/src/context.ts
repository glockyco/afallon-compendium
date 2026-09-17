import { createHash } from "node:crypto";
import type { Canonical, LootRules, NpcProducersInput, PlacementIdentityResult, PlacementSnapshot, Relationships, WorldSources, MapGeometry, SpatialResolution } from "@afallon/contracts";
import type { ArtifactReference, NormalizedCondition, NormalizedDatabaseInput, NormalizedEntity, ItemSource, NormalizedPlacement, NormalizedRegion, NormalizedRegionGeometry, NormalizedPatrolPath, NormalizedSource, NormalizedSourceDetail, NormalizedSceneSpawn, NormalizedSpawnCandidate, EntityDetail, CategoryMetadata, CatalogCoverageState, PlacementRoles } from "@afallon/contracts/catalog";
import { entityKey, publicEntityDetails, stableJson } from "@afallon/contracts/catalog";
import { hashRelation } from "./database";
export type JsonRecord = Record<string, unknown>;
export type JsonArray = unknown[];
export type ResolvedReference = { reference: ArtifactReference; value: unknown; bytes: number; runId: string; targetIdentity: string };
export type SourceRecord = { key: string; kind: string; reference: ArtifactReference; value: unknown; bytes: number; runId: string; targetIdentity: string; origins: Array<{ runId: string; targetIdentity: string }> };
export type Blocker = CatalogCoverageState["blockers"][number];
export type Exclusion = CatalogCoverageState["exclusions"][number];
export type SourceIdentityRow = {
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
export type SceneContext = {
  role: PlacementRoles;
  identities: PlacementIdentityResult;
  npc: NpcProducersInput;
  world: WorldSources;
  mapGeometry: MapGeometry;
  mapGeometryReference: ArtifactReference;
  sceneNativeId: number;
  scenePath: string;
  sourceByComponent: Map<number, SourceIdentityRow>;
  sourceById: Map<string, SourceIdentityRow>;
  roleReference: ArtifactReference;
  roleEvidenceReferences: Record<"canonical" | "relationships" | "npc-producers" | "world-sources" | "faction-roles", ArtifactReference>;
  identityReference: ArtifactReference;
  npcReference: ArtifactReference;
  worldReference: ArtifactReference;
  snapshotReference: ArtifactReference;
  snapshotRunId: string;
  snapshotPrefix: string;
  snapshotId: string;
  identityResult: PlacementIdentityResult;
  sceneHandle: number;
  character: string;
};

export function record(value: unknown): JsonRecord | null {
  return value !== null && typeof value === "object" && !Array.isArray(value) ? value as JsonRecord : null;
}
export function array(value: unknown): JsonArray {
  return Array.isArray(value) ? value : [];
}
export function requiredText(value: unknown, label: string): string {
  if (typeof value !== "string" || value.length === 0) throw new TypeError(`${label} must be a non-empty string.`);
  return value;
}
export function numberOrNull(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}
export function isSafeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value);
}
export function integerOrNull(value: unknown): number | null {
  return isSafeInteger(value) ? value : null;
}
export function jsonHash(value: unknown): string { return createHash("sha256").update(stableJson(value)).digest("hex"); }
export function hashCondition(ownerType: string, ownerKey: string, ordinal: number, payload: unknown): string { return hashRelation("condition", [ownerType, ownerKey, ordinal, payload]); }
export function pointer(ref: ArtifactReference, jsonPointer: string): ArtifactReference & { pointer: string } { return { ...ref, pointer: `${"pointer" in ref && typeof ref.pointer === "string" ? ref.pointer : ""}${jsonPointer}` }; }
export function sorted<T>(values: Iterable<T>, compare: (a: T, b: T) => number): T[] { return [...values].sort(compare); }
export function compareText(a: string, b: string): number { return a.localeCompare(b); }
export function compareNumber(a: number, b: number): number { return a - b; }

