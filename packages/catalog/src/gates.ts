import type { Database } from "bun:sqlite";

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
  requiredSourceKeys: readonly string[];
  spatialBounds: readonly CatalogSpatialBounds[];
}

export interface CatalogGateResult {
  accepted: boolean;
  complete: boolean;
  buildMatches: boolean;
  catalogMatches: boolean;
  missingSourceKeys: string[];
  outOfBoundsPlacementIds: string[];
  unresolvedIssueCount: number;
  occurrenceCount: number;
  exclusionCount: number;
}

export function evaluateCatalogGate(db: Database, input: CatalogGateInput): CatalogGateResult {
  const metadata = db.query<{ build_id: string; catalog_id: string }, []>("SELECT build_id, catalog_id FROM catalog_metadata").get();
  const buildMatches = metadata?.build_id === input.expectedBuildId;
  const catalogMatches = metadata?.catalog_id === input.expectedCatalogId;
  const availableSources = new Set(db.query<{ source_key: string }, []>("SELECT source_key FROM source_manifests").all().map((row) => row.source_key));
  const missingSourceKeys = [...new Set(input.requiredSourceKeys)].filter((key) => !availableSources.has(key)).sort();
  const boundsByMap = new Map(input.spatialBounds.map((bounds) => [bounds.mapSpaceId, bounds]));
  if (boundsByMap.size !== input.spatialBounds.length) throw new Error("Catalog gate spatial bounds contain duplicate map-space identities.");
  const outOfBoundsPlacementIds = db.query<{ placement_id: string; map_space_id: string; map_x: number | null; map_y: number | null }, []>(
    "SELECT placement_id, map_space_id, map_x, map_y FROM placements WHERE map_space_id IS NOT NULL ORDER BY placement_id",
  ).all().filter((placement) => {
    const bounds = boundsByMap.get(placement.map_space_id);
    return bounds === undefined || placement.map_x === null || placement.map_y === null || placement.map_x < bounds.minX || placement.map_x > bounds.maxX || placement.map_y < bounds.minY || placement.map_y > bounds.maxY;
  }).map((placement) => placement.placement_id);
  const unresolvedIssueCount = Number(db.query<{ count: number }, []>("SELECT count(*) AS count FROM coverage_issues WHERE state = 'unresolved'").get()?.count ?? 0);
  const occurrenceCount = Number(db.query<{ count: number }, []>("SELECT count(*) AS count FROM coverage_occurrences").get()?.count ?? 0);
  const exclusionCount = Number(db.query<{ count: number }, []>("SELECT count(*) AS count FROM coverage_exclusions").get()?.count ?? 0);
  const previewReady = buildMatches && catalogMatches && missingSourceKeys.length === 0 && outOfBoundsPlacementIds.length === 0;
  const complete = previewReady && unresolvedIssueCount === 0 && exclusionCount === 0;
  return {
    accepted: input.mode === "preview" ? previewReady : complete,
    complete,
    buildMatches,
    catalogMatches,
    missingSourceKeys,
    outOfBoundsPlacementIds,
    unresolvedIssueCount,
    occurrenceCount,
    exclusionCount,
  };
}
