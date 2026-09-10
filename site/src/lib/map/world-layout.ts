import type { PublicWorldOffset, PublicationData } from '../../../../pipeline/public-contracts';

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
