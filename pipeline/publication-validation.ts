import { Assert } from "typebox/value";
import { EntityDetailsDocumentSchema, ItemSourcesDocumentSchema, PublicationDataSchema, type EntityDetailsDocument, type ItemSourcesDocument, type PublicationData, type PublicDetailSection } from "@afallon/contracts/public"


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
  const entities = unique(data.entityIndex, row => row.entityKey, "entity index");
  const items = unique(data.itemIndex, row => row.itemKey, "item index");
  unique(data.tileLayers, row => row.id, "tile layer");
  unique(data.tileLayers, row => `${row.mapSpaceId}:${row.kind}`, "map pyramid of one kind");
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
  const near = (mapSpaceId: string, point: readonly [number, number], margin: number) => {
    const map = maps.get(mapSpaceId)!;
    if (point[0] < map.bounds.min.x - margin || point[0] > map.bounds.max.x + margin || point[1] < map.bounds.min.y - margin || point[1] > map.bounds.max.y + margin) throw new Error(`Publication travel destination is far outside ${mapSpaceId} bounds.`);
  };
  const checkPlacementRefs = (ids: readonly string[]) => {
    for (const id of ids) if (!placements.has(id)) throw new Error(`Publication references absent placement: ${id}`);
  };
  for (const map of maps.values()) {
    if (!offsets.has(map.mapSpaceId)) throw new Error(`Publication map lacks a world offset: ${map.mapSpaceId}`);
    if (!(map.bounds.max.x > map.bounds.min.x && map.bounds.max.y > map.bounds.min.y)) throw new Error(`Publication map has empty bounds: ${map.mapSpaceId}`);
    if (map.levelRange && map.levelRange.max < map.levelRange.min) throw new Error(`Publication map has an inverted level range: ${map.mapSpaceId}`);
    if (!data.tileLayers.some(layer => layer.mapSpaceId === map.mapSpaceId)) throw new Error(`Publication map lacks imagery: ${map.mapSpaceId}`);
  }
  // Captured pyramids and calibrated illustration pyramids share one lattice contract.
  const validateTileLayer = (layer: PublicationData["tileLayers"][number]): void => {
    scope(layer.mapSpaceId);
    if (layer.minZoom > layer.maxZoom) throw new Error(`Publication tile layer has inverted zoom range: ${layer.mapSpaceId}`);
    if (!(layer.extent[2] > layer.extent[0] && layer.extent[3] > layer.extent[1])) throw new Error(`Publication tile layer has empty extent: ${layer.mapSpaceId}`);
    const byPosition = unique(layer.tiles, tile => `${tile.z}/${tile.x}/${tile.y}`, "tile position");
    const levels = new Set(layer.tiles.map(tile => tile.z));
    for (let z = layer.minZoom; z <= layer.maxZoom; z++) if (!levels.has(z)) throw new Error(`Publication tile zoom levels are not contiguous: ${layer.mapSpaceId}`);
    const finestTiles = layer.tiles.filter(tile => tile.z === layer.maxZoom);
    if (finestTiles.length === 0) throw new Error(`Publication tile layer has no finest tiles: ${layer.mapSpaceId}`);
    const finestSize = layer.tileSize / 2 ** layer.maxZoom;
    const expectedExtent: [number, number, number, number] = [
      Math.min(...finestTiles.map(tile => tile.x * finestSize)),
      Math.min(...finestTiles.map(tile => tile.y * finestSize)),
      Math.max(...finestTiles.map(tile => (tile.x + 1) * finestSize)),
      Math.max(...finestTiles.map(tile => (tile.y + 1) * finestSize)),
    ];
    if (expectedExtent.some((value, index) => Math.abs(value - layer.extent[index]!) > 1e-7 * Math.max(1, Math.abs(value), Math.abs(layer.extent[index]!)))) throw new Error(`Publication tile extent disagrees with finest tile union: ${layer.mapSpaceId}`);
    for (const tile of layer.tiles) {
      if (tile.z < layer.minZoom || tile.z > layer.maxZoom) throw new Error("Publication tile lies outside declared zoom range.");
      if (tile.width !== layer.tileSize || tile.height !== layer.tileSize) throw new Error("Publication tile dimensions must equal tileSize.");
      const tileSize = layer.tileSize / 2 ** tile.z;
      const minX = Math.floor(layer.extent[0] / tileSize);
      const maxX = Math.ceil(layer.extent[2] / tileSize) - 1;
      const minY = Math.floor(layer.extent[1] / tileSize);
      const maxY = Math.ceil(layer.extent[3] / tileSize) - 1;
      if (tile.x < minX || tile.x > maxX || tile.y < minY || tile.y > maxY) throw new Error("Publication tile lies outside its extent at its zoom level.");
      if (tile.z < layer.maxZoom) {
        const childPrefix = `${tile.z + 1}/`;
        const hasChild = [...byPosition.keys()].some(key => {
          if (!key.startsWith(childPrefix)) return false;
          const [, x, y] = key.split("/").map(Number);
          return Math.floor(x! / 2) === tile.x && Math.floor(y! / 2) === tile.y;
        });
        if (!hasChild && tile.state !== "empty") throw new Error("Publication coarse tile is neither a parent of finer tiles nor transparent.");
      }
    }
  };
  for (const layer of data.tileLayers) validateTileLayer(layer);
  for (const placement of placements.values()) {
    if (placement.levelRange && placement.levelRange.max < placement.levelRange.min) throw new Error(`Publication placement has an inverted level range: ${placement.placementId}`);
    scope(placement.mapSpaceId);
    inside(placement.mapSpaceId, placement.position);
    for (const key of placement.entityKeys) if (!entities.has(key)) throw new Error(`Publication placement references absent entity: ${key}`);
    for (const key of placement.itemKeys) if (!items.has(key)) throw new Error(`Publication placement references absent item: ${key}`);
    for (const polygon of placement.areas) for (const point of polygon) inside(placement.mapSpaceId, point);
    if (placement.travel) {
      const destination = placement.travel.destination;
      if (destination.status === "resolved") {
        if (destination.reason !== undefined || destination.mapSpaceId === undefined || destination.position === undefined || destination.placementId !== undefined) throw new Error(`Resolved travel destination is incomplete: ${placement.placementId}`);
        scope(destination.mapSpaceId);
        // An arrival point may lie a few units outside the imagery (a door in a wall), so it is
        // only required to be near its map, not inside it.
        near(destination.mapSpaceId, destination.position, 256);
      } else if (!destination.reason || destination.mapSpaceId !== undefined || destination.position !== undefined || destination.placementId !== undefined) {
        throw new Error(`Unresolved travel destination has a guessed position: ${placement.placementId}`);
      }
    }
  }
}

function validateDetailSections(sections: readonly PublicDetailSection[], publication: PublicationData): void {
  const placements = new Set(publication.placements.map((placement) => placement.placementId));
  const entities = new Set(publication.entityIndex.map((entity) => entity.entityKey));
  for (const section of sections) for (const row of section.rows) {
    if (row.entityKey !== undefined && !entities.has(row.entityKey)) throw new Error(`Publication detail references absent entity: ${row.entityKey}`);
    if (row.placementIds !== undefined) for (const id of row.placementIds) if (!placements.has(id)) throw new Error(`Publication detail references absent placement: ${id}`);
  }
}

export function validateEntityDetails(value: unknown, publication: PublicationData): asserts value is EntityDetailsDocument {
  Assert(EntityDetailsDocumentSchema, value);
  const document = value as EntityDetailsDocument;
  if (document.buildId !== publication.buildId) throw new Error("Entity detail build does not match the map publication.");
  const index = new Map(publication.entityIndex.map((entity) => [entity.entityKey, entity]));
  const entities = unique(document.entities, (entity) => entity.entityKey, "entity detail");
  for (const entity of entities.values()) {
    const summary = index.get(entity.entityKey);
    if (!summary) throw new Error(`Entity detail is absent from the map index: ${entity.entityKey}`);
    if (summary.kind !== entity.kind || summary.nativeId !== entity.nativeId || summary.name !== entity.name || summary.description !== entity.description) throw new Error(`Entity detail contradicts its map index: ${entity.entityKey}`);
    for (const id of entity.placementIds) if (!publication.placements.some((placement) => placement.placementId === id)) throw new Error(`Entity detail references absent placement: ${id}`);
    validateDetailSections(entity.sections, publication);
  }
}

export function validateItemSources(value: unknown, publication: PublicationData): asserts value is ItemSourcesDocument {
  Assert(ItemSourcesDocumentSchema, value);
  const document = value as ItemSourcesDocument;
  if (document.buildId !== publication.buildId) throw new Error("Item-source detail build does not match the map publication.");
  const index = new Map(publication.itemIndex.map((item) => [item.itemKey, item]));
  const items = unique(document.itemSources, (item) => item.itemKey, "item-source detail");
  for (const item of items.values()) {
    const summary = index.get(item.itemKey);
    if (!summary) throw new Error(`Item-source detail is absent from the map index: ${item.itemKey}`);
    validateDetailSections(item.sections, publication);
    for (const source of item.sources) {
      for (const id of source.placementIds) if (!publication.placements.some((placement) => placement.placementId === id)) throw new Error(`Item source references absent placement: ${id}`);
      for (const section of source.sections) validateDetailSections([section], publication);
    }
  }
}
