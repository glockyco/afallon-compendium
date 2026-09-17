import type { Database } from "bun:sqlite";
import { readCoverageAccountingSummary, type CoverageAccountingSummary } from "./coverage-accounting";

export interface CatalogSpatialBounds {
  mapSpaceId: string;
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export interface CatalogGateInput {
  mode: "preview" | "release";
  expectedBuildId: string;
  expectedCatalogId: string;
  referenceIntegrity: { verified: boolean; failures: readonly string[] };
  spatialBounds: readonly CatalogSpatialBounds[];
}

export interface CatalogGateResult extends CoverageAccountingSummary {
  accepted: boolean;
  complete: boolean;
  buildMatches: boolean;
  catalogMatches: boolean;
  nonempty: boolean;
  referenceIntegrity: boolean;
  databaseIntegrity: boolean;
  outOfBoundsPlacementIds: string[];
  unresolvedIssueCount: number;
  occurrenceCount: number;
  exclusionCount: number;
  unreviewedExclusionCount: number;
}

export function evaluateCatalogGate(db: Database, input: CatalogGateInput): CatalogGateResult {
  const metadata = db.query<{ build_id: string; catalog_id: string }, []>("SELECT build_id, catalog_id FROM catalog_metadata").all();
  const buildMatches = metadata.length === 1 && metadata[0]?.build_id === input.expectedBuildId;
  const catalogMatches = metadata.length === 1 && metadata[0]?.catalog_id === input.expectedCatalogId;
  const boundsByMap = new Map(input.spatialBounds.map((bounds) => [bounds.mapSpaceId, bounds]));
  if (boundsByMap.size !== input.spatialBounds.length) throw new Error("Catalog gate spatial bounds contain duplicate map-space identities.");
  for (const bounds of input.spatialBounds) {
    if (![bounds.minX, bounds.minY, bounds.maxX, bounds.maxY].every(Number.isFinite) || bounds.minX > bounds.maxX || bounds.minY > bounds.maxY) throw new Error(`Catalog gate has invalid bounds for ${bounds.mapSpaceId}.`);
  }
  const placements = db.query<{ placement_id: string; map_space_id: string | null; map_x: number | null; map_y: number | null }, []>(
    "SELECT placement_id, map_space_id, map_x, map_y FROM placements ORDER BY placement_id",
  ).all();
  const spatialExclusions = new Set(db.query<{ subject_key: string }, []>("SELECT subject_key FROM coverage_exclusions WHERE kind = 'outside-reviewed-domain'").all().map((row) => row.subject_key));
  const outOfBoundsPlacementIds = placements.filter((placement) => {
    if (placement.map_space_id === null && placement.map_x === null && placement.map_y === null && spatialExclusions.has(placement.placement_id)) return false;
    const bounds = placement.map_space_id === null ? undefined : boundsByMap.get(placement.map_space_id);
    return bounds === undefined || placement.map_x === null || placement.map_y === null || !Number.isFinite(placement.map_x) || !Number.isFinite(placement.map_y) || placement.map_x < bounds.minX || placement.map_x > bounds.maxX || placement.map_y < bounds.minY || placement.map_y > bounds.maxY;
  }).map((placement) => placement.placement_id);
  const coverage = readCoverageAccountingSummary(db, input.expectedBuildId);
  const integrityFailures = [...coverage.integrityFailures, ...input.referenceIntegrity.failures];
  const sqliteIntegrity = db.query<Record<string, string>, []>("PRAGMA integrity_check").all();
  if (sqliteIntegrity.length !== 1 || Object.values(sqliteIntegrity[0] ?? {})[0] !== "ok") integrityFailures.push("Catalog SQLite integrity check failed.");
  if (db.query("PRAGMA foreign_key_check").all().length > 0) integrityFailures.push("Catalog contains broken foreign-key references.");
  for (const table of ["normalized_builds", "source_manifests", "canonical_entities", "map_spaces", "placements", "imagery_assets"]) {
    const mismatches = Number(db.query<{ count: number }, [string]>(`SELECT count(*) AS count FROM ${table} WHERE build_id <> ?`).get(input.expectedBuildId)?.count ?? 0);
    if (mismatches > 0) integrityFailures.push(`Catalog table ${table} contains ${mismatches} cross-build rows.`);
  }
  const unregisteredMaps = db.query<{ map_space_id: string }, []>("SELECT map_space_id FROM map_spaces ORDER BY map_space_id").all().filter((row) => !boundsByMap.has(row.map_space_id));
  if (unregisteredMaps.length > 0) integrityFailures.push(`Catalog has ${unregisteredMaps.length} maps without reviewed spatial bounds.`);
  const nonempty = placements.length > 0 && Number(db.query<{ count: number }, []>("SELECT count(*) AS count FROM canonical_entities").get()?.count ?? 0) > 0;
  const unresolvedIssueCount = Number(db.query<{ count: number }, []>("SELECT count(*) AS count FROM coverage_issues WHERE state = 'unresolved'").get()?.count ?? 0);
  const occurrenceCount = Number(db.query<{ count: number }, []>("SELECT count(*) AS count FROM coverage_occurrences").get()?.count ?? 0);
  const exclusions = db.query<{ subject_key: string }, []>("SELECT subject_key FROM coverage_exclusions ORDER BY exclusion_id").all();
  const acceptedExclusions = coverage.hasCoverageBasis ? new Set(db.query<{ subject_key: string }, []>(`
    SELECT DISTINCT o.subject_key FROM coverage_obligations o
    JOIN coverage_dispositions d ON d.obligation_id = o.obligation_id AND d.effective = 1
    WHERE d.state = 'reviewed-excluded' AND d.accepted = 1 AND d.outside_required_universe = 1
      AND NOT (o.gameplay = 1 AND o.reachable = 1)
      AND EXISTS (SELECT 1 FROM coverage_disposition_evidence e WHERE e.disposition_id = d.disposition_id)
  `).all().map((row) => row.subject_key)) : new Set<string>();
  const unreviewedExclusionCount = exclusions.filter((row) => !acceptedExclusions.has(row.subject_key)).length;
  const referenceIntegrity = input.referenceIntegrity.verified && input.referenceIntegrity.failures.length === 0;
  const databaseIntegrity = integrityFailures.length === 0;
  const previewReady = buildMatches && catalogMatches && nonempty && referenceIntegrity && databaseIntegrity && outOfBoundsPlacementIds.length === 0;
  const complete = previewReady && coverage.closureValid && coverage.unsatisfiedObligationCount === 0 && unresolvedIssueCount === 0 && unreviewedExclusionCount === 0;
  return {
    ...coverage,
    integrityFailures,
    accepted: input.mode === "preview" ? previewReady : complete,
    complete,
    buildMatches,
    catalogMatches,
    nonempty,
    referenceIntegrity,
    databaseIntegrity,
    outOfBoundsPlacementIds,
    unresolvedIssueCount,
    occurrenceCount,
    exclusionCount: exclusions.length,
    unreviewedExclusionCount,
  };
}
