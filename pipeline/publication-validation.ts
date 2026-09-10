import { Assert } from "typebox/value";
import { PublicationDataSchema, type PublicationData, type PublicAffine, type PublicDetailSection } from "./public-contracts";

export function affinePoint(frame: PublicAffine, x: number, y: number): [number, number] {
  return [frame.origin.x + frame.xAxis.x * x + frame.yAxis.x * y, frame.origin.y + frame.xAxis.y * x + frame.yAxis.y * y];
}

export function inversePoint(frame: PublicAffine, point: readonly [number, number]): [number, number] {
  const determinant = frame.xAxis.x * frame.yAxis.y - frame.xAxis.y * frame.yAxis.x;
  if (!Number.isFinite(determinant) || Math.abs(determinant) < 1e-15) throw new Error("Publication has a degenerate image transform.");
  const x = point[0] - frame.origin.x, y = point[1] - frame.origin.y;
  return [(frame.yAxis.y * x - frame.yAxis.x * y) / determinant, (frame.xAxis.x * y - frame.xAxis.y * x) / determinant];
}

function unique<T>(rows: readonly T[], key: (row: T) => string, label: string): Map<string, T> {
  const values = new Map<string, T>();
  for (const row of rows) {
    const id = key(row);
    if (values.has(id)) throw new Error(`Publication repeats ${label}: ${id}`);
    values.set(id, row);
  }
  return values;
}

export function validatePublication(value: unknown): asserts value is PublicationData {
  Assert(PublicationDataSchema, value);
  const data = value as PublicationData;
  if (data.mode === "preview" && (data.coverage.complete || data.coverage.messages.length === 0)) throw new Error("A preview must disclose incomplete coverage.");
  if (data.mode === "release" && (!data.coverage.complete || data.coverage.excludedPlacements !== 0)) throw new Error("A release requires complete coverage without omitted placements.");
  const maps = unique(data.maps, row => row.mapSpaceId, "map space");
  const placements = unique(data.placements, row => row.placementId, "placement");
  const entities = unique(data.entities, row => row.entityKey, "entity");
  unique(data.itemSources, row => row.itemKey, "item source index");
  unique(data.tileLayers, row => row.id, "tile layer");
  unique(data.tileLayers, row => row.mapSpaceId, "map pyramid");
  unique(data.illustrations, row => row.id, "illustration");
  const offsets = unique(data.world.offsets, row => row.mapSpaceId, "world offset");
  const unplaced = new Set(data.world.unplacedMapSpaceIds);
  for (const mapSpaceId of unplaced) {
    const offset = offsets.get(mapSpaceId);
    if (!offset || offset.status !== "unplaced") throw new Error(`World layout marks an absent or placed map as unplaced: ${mapSpaceId}`);
  }
  for (const offset of offsets.values()) {
    if (offset.status === "unplaced" && (!offset.reason || offset.source !== "seed")) throw new Error(`World layout has an invalid unplaced offset: ${offset.mapSpaceId}`);
    if (offset.status === "placed" && offset.source === "seed") throw new Error(`World layout marks a seed offset as placed: ${offset.mapSpaceId}`);
    if (offset.source === "native" && (offset.worldX !== 0 || offset.worldY !== 0)) throw new Error(`Native world offset is not zero: ${offset.mapSpaceId}`);
  }
  if (!(data.world.bounds.max.x > data.world.bounds.min.x && data.world.bounds.max.y > data.world.bounds.min.y)) throw new Error("Publication world has empty bounds.");
  const scope = (mapSpaceId: string) => {
    const map = maps.get(mapSpaceId);
    if (!map) throw new Error(`Publication references absent map: ${mapSpaceId}`);
    return map;
  };
  const inside = (mapSpaceId: string, point: readonly [number, number]) => {
    const map = maps.get(mapSpaceId)!;
    if (point[0] < map.bounds.min.x - 1e-7 || point[0] > map.bounds.max.x + 1e-7 || point[1] < map.bounds.min.y - 1e-7 || point[1] > map.bounds.max.y + 1e-7) throw new Error(`Publication coordinate is outside ${mapSpaceId} bounds.`);
  };
  const checkPlacementRefs = (ids: readonly string[]) => {
    for (const id of ids) if (!placements.has(id)) throw new Error(`Publication references absent placement: ${id}`);
  };
  const checkSections = (sections: readonly PublicDetailSection[]) => {
    for (const section of sections) for (const row of section.rows) {
      if (row.entityKey !== undefined && !entities.has(row.entityKey)) throw new Error(`Publication detail references absent entity: ${row.entityKey}`);
      if (row.placementIds !== undefined) checkPlacementRefs(row.placementIds);
    }
  };
  for (const map of maps.values()) {
    if (!offsets.has(map.mapSpaceId)) throw new Error(`Publication map lacks a world offset: ${map.mapSpaceId}`);
    if (!(map.bounds.max.x > map.bounds.min.x && map.bounds.max.y > map.bounds.min.y)) throw new Error(`Publication map has empty bounds: ${map.mapSpaceId}`);
    if (map.levelRange && map.levelRange.max < map.levelRange.min) throw new Error(`Publication map has an inverted level range: ${map.mapSpaceId}`);
    if (!data.tileLayers.some(layer => layer.mapSpaceId === map.mapSpaceId)) throw new Error(`Publication map lacks primary imagery: ${map.mapSpaceId}`);
  }
  for (const layer of data.tileLayers) {
    scope(layer.mapSpaceId);
    inversePoint(layer.mapFromPixelEdge, [0, 0]);
    unique(layer.tiles, tile => `${tile.z}/${tile.x}/${tile.y}`, "tile position");
    for (const tile of layer.tiles) {
      if (tile.z > layer.finestLevel) throw new Error("Publication tile exceeds its finest level.");
      const scale = 2 ** (layer.finestLevel - tile.z);
      const levelWidth = Math.ceil(layer.width / scale), levelHeight = Math.ceil(layer.height / scale);
      if (tile.width !== Math.min(layer.tileSize, levelWidth - tile.x * layer.tileSize) || tile.height !== Math.min(layer.tileSize, levelHeight - tile.y * layer.tileSize)) throw new Error("Publication tile dimensions contradict its grid.");
      for (const [x, y] of [[0, 0], [tile.width, 0], [0, tile.height], [tile.width, tile.height]] as const) {
        const actual = affinePoint(tile.mapFromPixelEdge, x, y);
        const grid = inversePoint(layer.mapFromPixelEdge, actual);
        if (Math.abs(grid[0] - (tile.x * layer.tileSize + x) * scale) > 1e-5 || Math.abs(grid[1] - (tile.y * layer.tileSize + y) * scale) > 1e-5) throw new Error("Publication tile transform contradicts its grid.");
      }
    }
  }
  for (const placement of placements.values()) {
    if (placement.levelRange && placement.levelRange.max < placement.levelRange.min) throw new Error(`Publication placement has an inverted level range: ${placement.placementId}`);
    scope(placement.mapSpaceId);
    inside(placement.mapSpaceId, placement.position);
    const layer = data.tileLayers.find(layer => layer.mapSpaceId === placement.mapSpaceId);
    if (!layer || !layer.tiles.some(tile => {
      if (tile.z !== layer.finestLevel || tile.state === "empty") return false;
      const point = inversePoint(tile.mapFromPixelEdge, placement.position);
      return point[0] >= 0 && point[1] >= 0 && point[0] < tile.width && point[1] < tile.height;
    })) throw new Error(`Publication placement lacks finest primary imagery: ${placement.placementId}`);
    for (const key of placement.entityKeys) if (!entities.has(key)) throw new Error(`Publication placement references absent entity: ${key}`);
    for (const polygon of placement.areas) for (const point of polygon) inside(placement.mapSpaceId, point);
    if (placement.travel) {
      const destination = placement.travel.destination;
      if (destination.status === "resolved") {
        if (destination.reason !== undefined || destination.mapSpaceId === undefined || destination.position === undefined || destination.placementId !== undefined) throw new Error(`Resolved travel destination is incomplete: ${placement.placementId}`);
        scope(destination.mapSpaceId);
        inside(destination.mapSpaceId, destination.position);
      } else if (!destination.reason || destination.mapSpaceId !== undefined || destination.position !== undefined || destination.placementId !== undefined) {
        throw new Error(`Unresolved travel destination has a guessed position: ${placement.placementId}`);
      }
    }
    checkSections(placement.sections);
  }
  for (const entity of entities.values()) { checkPlacementRefs(entity.placementIds); checkSections(entity.sections); }
  for (const item of data.itemSources) {
    if (entities.get(item.itemKey)?.kind !== "items") throw new Error(`Publication source index references absent item: ${item.itemKey}`);
    for (const source of item.sources) { checkPlacementRefs(source.placementIds); checkSections(source.sections); }
  }
  for (const illustration of data.illustrations) {
    scope(illustration.mapSpaceId);
    if ((illustration.registration === "calibrated") !== (illustration.mapFromPixelEdge !== null)) throw new Error("Publication illustration registration contradicts its transform.");
    if (illustration.mapFromPixelEdge) inversePoint(illustration.mapFromPixelEdge, [0, 0]);
  }
}
