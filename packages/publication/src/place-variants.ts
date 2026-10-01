import type { Database } from "bun:sqlite";
import { queryCatalogMap, queryCatalogMaps, type CatalogMapPlacement } from "@afallon/catalog";

const POSITION_TOLERANCE = 0.05;
// The audited catalog has 119+ matches for the three shared-world variants, and at most 19 for any
// other scene with a host at least three times larger. Keep isolated copied objects out of host attribution.
const MIN_MATCHES = 50;
const MIN_HOST_RATIO = 3;

type ScenePlacement = Pick<CatalogMapPlacement, "placementId" | "sceneNativeId" | "position" | "roles"> & { sourceTypes: readonly string[] };
export interface PlaceVariant { hostKey: string; copiedPlacementIds: ReadonlySet<string> }
export interface PlaceVariants { byScene: ReadonlyMap<string, PlaceVariant>; copiedPlacementIds: ReadonlySet<string>; copyHostByPlacement: ReadonlyMap<string, string> }

function signature(placement: ScenePlacement): string {
  return JSON.stringify([
    [...new Set(placement.roles.map(({ role, npcEntityKey }) => JSON.stringify([role, npcEntityKey])))].sort(),
    [...new Set(placement.sourceTypes)].sort(),
  ]);
}

/** Compare object evidence, not authored scene or component IDs (both change between copied scenes). */
export function derivePlaceVariants(spaces: ReadonlyMap<string, readonly ScenePlacement[]>): PlaceVariants {
  const byScene = new Map<string, PlaceVariant>();
  const copyHostByPlacement = new Map<string, string>();
  const copiedPlacementIds = new Set<string>();
  for (const placements of spaces.values()) {
    const scenes = new Map<number, ScenePlacement[]>();
    for (const placement of placements) {
      const rows = scenes.get(placement.sceneNativeId) ?? [];
      rows.push(placement);
      scenes.set(placement.sceneNativeId, rows);
    }
    const indexed = new Map<number, Map<string, ScenePlacement[]>>();
    for (const [scene, rows] of scenes) {
      const cells = new Map<string, ScenePlacement[]>();
      for (const row of rows) {
        const key = `${Math.floor(row.position[0] / POSITION_TOLERANCE)},${Math.floor(row.position[1] / POSITION_TOLERANCE)}:${signature(row)}`;
        const group = cells.get(key) ?? [];
        group.push(row);
        cells.set(key, group);
      }
      indexed.set(scene, cells);
    }
    for (const [scene, rows] of scenes) {
      let best: { host: number; copies: Map<string, string>; hostSize: number } | null = null;
      for (const [host, hostRows] of scenes) {
        if (host === scene || hostRows.length < rows.length * MIN_HOST_RATIO) continue;
        const cells = indexed.get(host)!;
        const copies = new Map<string, string>();
        for (const row of rows) {
          const x = Math.floor(row.position[0] / POSITION_TOLERANCE), y = Math.floor(row.position[1] / POSITION_TOLERANCE), identity = signature(row);
          let match: ScenePlacement | undefined;
          for (let dx = -1; dx <= 1 && !match; dx++) for (let dy = -1; dy <= 1 && !match; dy++) {
            match = (cells.get(`${x + dx},${y + dy}:${identity}`) ?? []).find((candidate) =>
              Math.abs(row.position[0] - candidate.position[0]) < POSITION_TOLERANCE && Math.abs(row.position[1] - candidate.position[1]) < POSITION_TOLERANCE);
          }
          if (match) copies.set(row.placementId, match.placementId);
        }
        if (copies.size < MIN_MATCHES) continue;
        if (!best || hostRows.length > best.hostSize) best = { host, copies, hostSize: hostRows.length };
      }
      if (!best) continue;
      byScene.set(`scenes:${scene}`, { hostKey: `scenes:${best.host}`, copiedPlacementIds: new Set(best.copies.keys()) });
      for (const [id, hostId] of best.copies) {
        copiedPlacementIds.add(id);
        copyHostByPlacement.set(id, hostId);
      }
    }
  }
  return { byScene, copiedPlacementIds, copyHostByPlacement };
}

/** The catalog stores observations; variant attribution belongs to the publication's view of those observations. */
export function catalogPlaceVariants(db: Database, publishedMapSpaceIds: ReadonlySet<string>): PlaceVariants {
  const sources = new Map<string, string[]>();
  for (const row of db.query<{ placement_id: string; type_name: string }, []>(`
    SELECT ps.placement_id, si.type_name FROM placement_sources ps
    JOIN source_identities si ON si.source_id = ps.source_id ORDER BY ps.placement_id, si.type_name
  `).all()) {
    const types = sources.get(row.placement_id) ?? [];
    types.push(row.type_name);
    sources.set(row.placement_id, types);
  }
  const spaces = new Map<string, ScenePlacement[]>();
  for (const map of queryCatalogMaps(db).records) {
    if (!publishedMapSpaceIds.has(map.mapSpaceId)) continue;
    const rows = queryCatalogMap(db, map.mapSpaceId).records?.placements ?? [];
    spaces.set(map.mapSpaceId, rows.map((row) => ({ placementId: row.placementId, sceneNativeId: row.sceneNativeId, position: row.position, roles: row.roles, sourceTypes: sources.get(row.placementId) ?? [] })));
  }
  return derivePlaceVariants(spaces);
}
