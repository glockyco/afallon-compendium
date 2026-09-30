import type { PlacementRef, PlaceSpots } from "@afallon/contracts/public";

/** One published placement is one spot even if several equivalent or conditional rows mention it. */
export function placeSpots(placements: readonly PlacementRef[]): PlaceSpots[] {
  const places = new Map<string, Map<string, PlacementRef>>();
  for (const placement of placements) {
    const key = JSON.stringify([placement.mapSpaceId, placement.label]);
    const spots = places.get(key) ?? new Map<string, PlacementRef>();
    spots.set(placement.placementId, placement);
    places.set(key, spots);
  }
  return [...places.values()].map((spots) => {
    const rows = [...spots.values()];
    return { label: rows[0]!.label, mapSpaceId: rows[0]!.mapSpaceId, spotCount: rows.length, placementIds: rows.map((spot) => spot.placementId) };
  })
    .sort((left, right) => right.spotCount - left.spotCount || left.label.localeCompare(right.label) || left.mapSpaceId.localeCompare(right.mapSpaceId));
}
