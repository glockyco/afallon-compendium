import type { PublicPlacement, PublicWorldOffset, PublicationData } from '@afallon/contracts/public';

export type WorldOffsetOverride = { worldX: number; worldY: number };
export type WorldOffsetOverrides = Record<string, WorldOffsetOverride>;
export type WorldOffsetExport = {
  schemaVersion: 'compendium.world-offsets.v1';
  buildId: string;
  offsets: Array<{ mapSpaceId: string; worldX: number; worldY: number }>;
};

const STORAGE_KEY = 'afallon-compendium-world-offset-overrides';

export function loadWorldOffsetOverrides(): WorldOffsetOverrides {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return {};
    const value: unknown = JSON.parse(stored);
    if (value === null || typeof value !== 'object' || Array.isArray(value)) return {};
    const overrides: WorldOffsetOverrides = {};
    for (const [mapSpaceId, entry] of Object.entries(value)) {
      if (entry && typeof entry === 'object' && !Array.isArray(entry) && typeof entry.worldX === 'number' && Number.isFinite(entry.worldX) && typeof entry.worldY === 'number' && Number.isFinite(entry.worldY)) {
        overrides[mapSpaceId] = { worldX: entry.worldX, worldY: entry.worldY };
      }
    }
    return overrides;
  } catch {
    return {};
  }
}

export function saveWorldOffsetOverrides(overrides: WorldOffsetOverrides): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
  } catch {
    // Local authoring remains usable when browser storage is unavailable.
  }
}

export function clearWorldOffsetOverrides(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Local authoring remains usable when browser storage is unavailable.
  }
}

export function effectiveWorldOffset(
  offset: PublicWorldOffset,
  overrides: WorldOffsetOverrides,
): WorldOffsetOverride {
  return overrides[offset.mapSpaceId] ?? { worldX: offset.worldX, worldY: offset.worldY };
}

export function worldOffsetDelta(
  offset: PublicWorldOffset,
  overrides: WorldOffsetOverrides,
): WorldOffsetOverride {
  const effective = effectiveWorldOffset(offset, overrides);
  return { worldX: effective.worldX - offset.worldX, worldY: effective.worldY - offset.worldY };
}

const offsetIndexes = new WeakMap<PublicationData['world'], ReadonlyMap<string, PublicWorldOffset>>();
export const NO_WORLD_OVERRIDES: WorldOffsetOverrides = Object.freeze({});

export function effectiveMapDelta(data: PublicationData, mapSpaceId: string, overrides: WorldOffsetOverrides): WorldOffsetOverride {
  let index = offsetIndexes.get(data.world);
  if (!index) {
    index = new Map(data.world.offsets.map((offset) => [offset.mapSpaceId, offset]));
    offsetIndexes.set(data.world, index);
  }
  const base = index.get(mapSpaceId);
  return base ? worldOffsetDelta(base, overrides) : { worldX: 0, worldY: 0 };
}

export function effectivePlacementPosition(data: PublicationData, placement: PublicPlacement, overrides: WorldOffsetOverrides): readonly [number, number] {
  const delta = effectiveMapDelta(data, placement.mapSpaceId, overrides);
  return [placement.position[0] + delta.worldX, placement.position[1] + delta.worldY];
}

export function placementInViewport(data: PublicationData, placement: PublicPlacement, overrides: WorldOffsetOverrides, bounds: readonly [number, number, number, number] | null): boolean {
  if (!bounds) return true;
  const [x, y] = effectivePlacementPosition(data, placement, overrides);
  return x >= bounds[0] && x <= bounds[2] && y >= bounds[1] && y <= bounds[3];
}

export function exportWorldOffsets(
  publication: PublicationData,
  overrides: WorldOffsetOverrides,
): WorldOffsetExport {
  return {
    schemaVersion: 'compendium.world-offsets.v1',
    buildId: publication.buildId,
    offsets: publication.world.offsets.map((offset) => {
      const effective = effectiveWorldOffset(offset, overrides);
      return { mapSpaceId: offset.mapSpaceId, worldX: effective.worldX, worldY: effective.worldY };
    }),
  };
}

export async function copyWorldOffsets(overrides: WorldOffsetOverrides, publication: PublicationData): Promise<void> {
  await navigator.clipboard.writeText(JSON.stringify(exportWorldOffsets(publication, overrides), null, 2));
}

export function downloadWorldOffsets(overrides: WorldOffsetOverrides, publication: PublicationData): void {
  const json = JSON.stringify(exportWorldOffsets(publication, overrides), null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'reviewed-world-offsets.json';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export type WorldDragInfo = {
  layerId?: string;
  mapSpaceId?: string;
  coordinate: [number, number];
};

export class WorldDragController {
  private mapSpaceId: string | null = null;
  private start: [number, number] | null = null;
  private origin: WorldOffsetOverride | null = null;

  constructor(
    private readonly onUpdate: (mapSpaceId: string, offset: WorldOffsetOverride) => void,
    private readonly onEnd: () => void,
  ) {}

  tryStart(info: WorldDragInfo, authoring: boolean, offsets: ReadonlyMap<string, WorldOffsetOverride>): boolean {
    if (!authoring || info.layerId !== 'world-map-bounds' || !info.mapSpaceId) return false;
    const origin = offsets.get(info.mapSpaceId);
    if (!origin) return false;
    this.mapSpaceId = info.mapSpaceId;
    this.start = info.coordinate;
    this.origin = { ...origin };
    return true;
  }

  get active(): boolean {
    return this.mapSpaceId !== null;
  }

  move(coordinate: [number, number]): boolean {
    if (!this.mapSpaceId || !this.start || !this.origin) return false;
    this.onUpdate(this.mapSpaceId, { worldX: this.origin.worldX + coordinate[0] - this.start[0], worldY: this.origin.worldY + coordinate[1] - this.start[1] });
    return true;
  }

  end(): void {
    if (this.mapSpaceId) this.onEnd();
    this.cancel();
  }

  cancel(): void {
    this.mapSpaceId = null;
    this.start = null;
    this.origin = null;
  }

  get draggingMapSpaceId(): string | null {
    return this.mapSpaceId;
  }
}
