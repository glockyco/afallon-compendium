import type { WorldOffsets } from "@afallon/contracts";
import type { PublicWorldOffset } from "@afallon/contracts/public";

export type LayoutBounds = { min: { x: number; y: number }; max: { x: number; y: number } };
export type LayoutMap = { mapSpaceId: string; bounds: LayoutBounds | null; coarsestTileSize?: number };

export type WorldLayout = {
  offsets: PublicWorldOffset[];
  unplacedMapSpaceIds: string[];
  boundsByMapSpaceId: ReadonlyMap<string, LayoutBounds>;
};

const SEED_GAP = 1;

function translatedBounds(bounds: LayoutBounds, worldX: number, worldY: number): LayoutBounds {
  return {
    min: { x: bounds.min.x + worldX, y: bounds.min.y + worldY },
    max: { x: bounds.max.x + worldX, y: bounds.max.y + worldY },
  };
}

function overlaps(left: LayoutBounds, right: LayoutBounds): boolean {
  return left.min.x < right.max.x && right.min.x < left.max.x && left.min.y < right.max.y && right.min.y < left.max.y;
}

function offsetBounds(map: LayoutMap, worldX: number, worldY: number): LayoutBounds | null {
  return map.bounds ? translatedBounds(map.bounds, worldX, worldY) : null;
}

/**
 * Build the common world plane from reviewed translations. A shared native map
 * has no offset. Maps without a review are placed in a deterministic strip so
 * authoring can display and move them, but remain explicitly unplaced.
 */
export function buildWorldLayout(
  maps: readonly LayoutMap[],
  reviewed: WorldOffsets,
  nativeMapSpaceIds: ReadonlySet<string> = new Set(),
): WorldLayout {
  if (new Set(maps.map((map) => map.mapSpaceId)).size !== maps.length) throw new Error("World layout repeats a map space.");
  const mapById = new Map(maps.map((map) => [map.mapSpaceId, map]));
  const reviewedById = new Map<string, WorldOffsets["offsets"][number]>();
  for (const entry of reviewed.offsets) {
    if (!mapById.has(entry.mapSpaceId)) throw new Error(`World offsets reference unknown map space: ${entry.mapSpaceId}`);
    if (reviewedById.has(entry.mapSpaceId)) throw new Error(`World offsets repeat map space: ${entry.mapSpaceId}`);
    reviewedById.set(entry.mapSpaceId, entry);
  }

  const offsets = new Map<string, PublicWorldOffset>();
  const boundsByMapSpaceId = new Map<string, LayoutBounds>();
  const occupied: LayoutBounds[] = [];
  const unplacedMapSpaceIds: string[] = [];
  for (const map of maps) {
    const reviewedEntry = reviewedById.get(map.mapSpaceId);
    if (nativeMapSpaceIds.has(map.mapSpaceId)) {
      if (reviewedEntry && (reviewedEntry.worldX !== 0 || reviewedEntry.worldY !== 0)) throw new Error(`Native map space ${map.mapSpaceId} cannot have a reviewed offset.`);
      const translated = offsetBounds(map, 0, 0);
      offsets.set(map.mapSpaceId, { mapSpaceId: map.mapSpaceId, worldX: 0, worldY: 0, source: "native", status: "placed" });
      if (translated) { boundsByMapSpaceId.set(map.mapSpaceId, translated); occupied.push(translated); }
      continue;
    }
    if (!reviewedEntry) continue;
    const translated = offsetBounds(map, reviewedEntry.worldX, reviewedEntry.worldY);
    offsets.set(map.mapSpaceId, { mapSpaceId: map.mapSpaceId, worldX: reviewedEntry.worldX, worldY: reviewedEntry.worldY, source: "reviewed", status: "placed" });
    if (translated) { boundsByMapSpaceId.set(map.mapSpaceId, translated); occupied.push(translated); }
  }

  let cursorX = occupied.reduce((maximum, bounds) => Math.max(maximum, bounds.max.x), 0) + SEED_GAP;
  const baselineY = occupied.reduce((minimum, bounds) => Math.min(minimum, bounds.min.y), 0);
  const pending = maps.filter((map) => !offsets.has(map.mapSpaceId)).sort((left, right) => left.mapSpaceId.localeCompare(right.mapSpaceId));
  for (const map of pending) {
    let worldX = 0;
    let worldY = 0;
    const bounds = map.bounds;
    if (bounds) {
      const width = bounds.max.x - bounds.min.x;
      const height = bounds.max.y - bounds.min.y;
      if (!(width > 0 && height > 0)) throw new Error(`World layout map has empty bounds: ${map.mapSpaceId}`);
      const quantum = map.coarsestTileSize ?? 1;
      if (!(Number.isFinite(quantum) && quantum > 0)) throw new Error(`World layout map has an invalid coarsest tile size: ${map.mapSpaceId}`);
      const snap = (value: number): number => Math.ceil(value / quantum) * quantum;
      let candidateWorldX = snap(cursorX - bounds.min.x);
      let candidateWorldY = snap(baselineY - bounds.min.y);
      let candidate = translatedBounds(bounds, candidateWorldX, candidateWorldY);
      while (occupied.some((other) => overlaps(candidate, other))) {
        cursorX = Math.max(cursorX, ...occupied.map((other) => other.max.x + SEED_GAP));
        candidateWorldX = snap(cursorX - bounds.min.x);
        candidate = translatedBounds(bounds, candidateWorldX, candidateWorldY);
      }
      worldX = candidateWorldX;
      worldY = candidateWorldY;
      cursorX = bounds.min.x + worldX + width + SEED_GAP;
      occupied.push(candidate);
      boundsByMapSpaceId.set(map.mapSpaceId, candidate);
    }
    offsets.set(map.mapSpaceId, {
      mapSpaceId: map.mapSpaceId,
      worldX,
      worldY,
      source: "seed",
      status: "unplaced",
      reason: "No reviewed world offset exists; deterministic seed shown for authoring only.",
    });
    unplacedMapSpaceIds.push(map.mapSpaceId);
  }

  return {
    offsets: maps.map((map) => offsets.get(map.mapSpaceId)!).filter((value): value is PublicWorldOffset => value !== undefined),
    unplacedMapSpaceIds,
    boundsByMapSpaceId,
  };
}
