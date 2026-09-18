import type { CapturePlan } from "@afallon/contracts";

export function tileBounds(tiles: readonly CapturePlan["tiles"][number][]): { minX: number; maxX: number; minZ: number; maxZ: number } {
  let minX = Number.POSITIVE_INFINITY, maxX = Number.NEGATIVE_INFINITY;
  let minZ = Number.POSITIVE_INFINITY, maxZ = Number.NEGATIVE_INFINITY;
  for (const { frame } of tiles) {
    minX = Math.min(minX, frame.center.x - frame.worldSize.x / 2);
    maxX = Math.max(maxX, frame.center.x + frame.worldSize.x / 2);
    minZ = Math.min(minZ, frame.center.z - frame.worldSize.z / 2);
    maxZ = Math.max(maxZ, frame.center.z + frame.worldSize.z / 2);
  }
  return { minX, maxX, minZ, maxZ };
}
