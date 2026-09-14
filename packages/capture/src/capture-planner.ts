// Writes overworld capture plans from observed terrain coverage. Interior maps publish the game's
// own map and are not captured here. The overworld is partitioned on one shared lattice and each
// tile is assigned to one scene owner.
import { Database } from 'bun:sqlite';
import { Buffer } from 'node:buffer';
import { createHash } from 'node:crypto';
import { readdir, unlink } from 'node:fs/promises';
import { relative, resolve } from 'node:path';
import { Assert } from 'typebox/value';
import { ReviewedCellOwnersSchema, type CompendiumConfig, type ReviewedCellOwners } from '@afallon/contracts';

// A tile costs about 3.4 seconds while entering a scene costs about 80, so detail is cheap.
// A zone tile covers at most 256 world units at 1024 pixels, giving 0.25 units per pixel.
// The world surface keeps a coarser 512-unit tile because it spans thousands of units.
const TILE_LIMIT = 256;
const WORLD_TILE_LIMIT = 512;
const PIXELS = 1024;
// World units beyond a frame within which a loader is still held: an object loader sits on a
// 200-unit grid and its objects reach past the loader's cell, so a building whose loader is
// just outside a frame still draws inside it.
const LOADER_MARGIN_WORLD_UNITS = 256;
const NAVIGATION_NEIGHBOURHOOD = 2;
// The current normalized full snapshot remains the default until a newer snapshot is selected
// explicitly. The build identity still comes from the configured installation.
const DEFAULT_NORMALIZED_RUN_ID = 'ca9be50a-a463-4a9b-a9b2-1fbe1672efd5';
const BASE_WORLD_SCENES: Record<number, true> = { 3: true, 9: true, 11: true };

export interface CapturePlannerOptions {
  config: CompendiumConfig;
  buildId: string;
  surveys?: string[];
  owners?: string;
  database?: string;
}

const DEFAULT_SURVEY_DIRECTORY = 'artifacts/scene-survey';
// These two profile entries are not part of the 19-map atlas plan: tutorial-cave is a survey
// fixture and ice-cave-1-chillwind has no navigation survey. Keep them out of generated output.
const ATLAS_MAPS: Record<string, true> = {
  'world-surface': true,
  'abandoned-mine-swamp': true, 'abandoned-quarry': true, 'ancient-cave-swamp': true,
  'castle-ruins-swamp': true, 'castle-dungeons-swamp': true,
  'cave-coalway-woods-1': true, 'cave-coalway-woods-2': true, 'cellar-cave-coalway-woods': true,
  'coalway-catacombs': true, 'barrowdeep': true, 'duskfall-depths': true, 'nighthorn-sanctum': true,
  'the-emberstone-vault': true, 'sanctum-of-the-veilpiercer': true, 'skittershade-mine': true,
  'felheart-crucible': true, 'tidefallen-grotto': true, 'the-underglow': true,
};

interface Point { x: number; y: number; z: number; }
interface PlacementOutlier extends Point { distance: number; }
interface Bounds { minX: number; maxX: number; minZ: number; maxZ: number; }
interface Terrain extends Bounds { area: number; name: string }
interface TerrainObservation { enabled?: boolean; source?: { position?: Point; activeInHierarchy?: boolean; name?: string }; terrainData?: { size?: Point } }
interface GeometrySurvey { scene: { nativeId: number }; terrains?: TerrainObservation[] }
interface DomainBox { min: Point; max: Point; }
interface Binding { mapSpaceId: string; id: string; scenePath: string; sceneNativeId: number; domain: { kind: 'scene' } | { kind: 'boxes'; boxes: DomainBox[] }; }
interface Report { mapSpaceId: string; path: string; sceneNativeId?: number; oldExtent: string; oldTiles: number; newExtent: string; newTiles: number; placements?: number; insidePlacements?: number; outsidePlacements?: number; maxOutsideDistance?: number; navigationMatches?: number; outliers?: PlacementOutlier[]; }
interface SupportResult { points: Point[]; placementPoints: Point[]; navigationMatches: number; outliers: PlacementOutlier[]; }
interface SurveyNavigation { scene: { nativeId: number }; vertices?: number[] }
interface Tile {
  id: string;
  frame: {
    center: { x: number; z: number };
    worldSize: { x: number; z: number };
    cameraY: number;
    nearClip: number;
    farClip: number;
  };
}
interface OldPlanSummary { extent: string; tiles: number; }

export async function planCapture(options: CapturePlannerOptions): Promise<Record<string, unknown>> {
  const surveys = (options.surveys?.length ? options.surveys : [DEFAULT_SURVEY_DIRECTORY]).map(directory => resolve(directory));
  const databasePath = resolve(options.database ?? resolve(options.config.outputRoot, options.buildId, DEFAULT_NORMALIZED_RUN_ID, 'normalized.sqlite'));
  const profilePath = options.config.mapSpaceProfile ?? resolve('local/reviewed-map-spaces.json');
  const profile = await Bun.file(profilePath).json() as { bindings: Binding[] };
const scenesByMap = new Map<string, Binding[]>();
for (const binding of profile.bindings) {
  const list = scenesByMap.get(binding.mapSpaceId) ?? [];
  list.push(binding);
  scenesByMap.set(binding.mapSpaceId, list);
}

const db = new Database(databasePath, { readonly: true });
const placementsByMap = new Map<string, Point[]>();
for (const mapSpaceId of Object.keys(ATLAS_MAPS)) {
  const rows = db.query(`
    SELECT p.world_x AS x, p.world_y AS y, p.world_z AS z
    FROM placements AS p
    WHERE p.build_id = ? AND p.map_space_id = ?
  `).all(options.buildId, mapSpaceId) as Point[];
  if (rows.length) placementsByMap.set(mapSpaceId, rows);
}
db.close();

const navigationByScene = new Map<number, number[]>();
const navigationSurveyByScene = new Map<number, { path: string; sha256: string }>();
const geometryByScene = new Map<number, GeometrySurvey>();
async function surveyDirectories(roots: string[]): Promise<string[]> {
  const directories: string[] = [];
  for (const root of roots) {
    const entries = await readdir(root, { withFileTypes: true });
    if (entries.some(entry => entry.isFile() && entry.name.endsWith('-navigation.json'))) {
      directories.push(root);
      continue;
    }
    const children = entries.filter(entry => entry.isDirectory()).map(entry => resolve(root, entry.name)).sort();
    directories.push(...(children.length > 0 ? await surveyDirectories(children) : [root]));
  }
  return directories;
}
for (const directory of await surveyDirectories(surveys)) {
  for (const entry of (await readdir(directory)).filter(name => name.endsWith('-navigation.json')).sort()) {
    const navigationPath = resolve(directory, entry);
    const navigation = await Bun.file(navigationPath).json() as SurveyNavigation;
    const geometry = await Bun.file(resolve(directory, entry.replace('-navigation', '-geometry'))).json() as GeometrySurvey;
    const nativeId = geometry.scene.nativeId;
    navigationByScene.set(nativeId, navigation.vertices ?? []);
    navigationSurveyByScene.set(nativeId, { path: '../' + relative(resolve('.'), navigationPath), sha256: createHash('sha256').update(Buffer.from(await Bun.file(navigationPath).arrayBuffer())).digest('hex') });
    geometryByScene.set(nativeId, geometry);
  }
}

// Where a scene places content: the positions of its object loaders, every one the scene holds
// whether loaded or not, from the latest capture inventory of that scene. The base scenes are
// chunks of one world over shared terrain, and only the chunk that places objects somewhere
// shows anything there, so loaders decide which scene captures a cell.
const loaderPositionsByScene = new Map<number, Point[]>();
{
  const runsRoot = resolve(options.config.outputRoot, options.buildId);
  const latest = new Map<number, { completedAt: string; directory: string }>();
  for (const entry of await readdir(runsRoot)) {
    const manifestPath = resolve(runsRoot, entry, 'manifest.json');
    if (!(await Bun.file(manifestPath).exists())) continue;
    const manifest = await Bun.file(manifestPath).json();
    if (manifest.input?.command !== 'capture' || manifest.status !== 'succeeded') continue;
    const sceneNativeId = manifest.input.settings?.sceneNativeId;
    if (!BASE_WORLD_SCENES[sceneNativeId]) continue;
    const completedAt = manifest.timestamps?.completedAt ?? '';
    const current = latest.get(sceneNativeId);
    if (current === undefined || completedAt > current.completedAt) latest.set(sceneNativeId, { completedAt, directory: resolve(runsRoot, entry) });
  }
  for (const [sceneNativeId, run] of latest) {
    const tilesRoot = resolve(run.directory, 'tiles');
    const geometryDirectories = (await readdir(tilesRoot)).filter(name => name.endsWith('.geometry'));
    if (geometryDirectories.length === 0) continue;
    const geometryRoot = resolve(tilesRoot, geometryDirectories[0]!);
    const inventories = (await readdir(geometryRoot)).filter(name => /^inventory-\d+\.json$/.test(name)).sort();
    if (inventories.length === 0) continue;
    const inventory = await Bun.file(resolve(geometryRoot, inventories[inventories.length - 1]!)).json() as { sources: Array<{ enabled: boolean; position: Point }> };
    loaderPositionsByScene.set(sceneNativeId, inventory.sources.filter(source => source.enabled).map(source => source.position));
  }
}

function pointKey(x: number, z: number): string {
  return `${Math.floor(x / NAVIGATION_NEIGHBOURHOOD)},${Math.floor(z / NAVIGATION_NEIGHBOURHOOD)}`;
}

function boundsOf(points: Point[]): Bounds {
  if (!points.length) throw new Error('cannot capture a map without content points');
  return {
    minX: Math.min(...points.map(point => point.x)),
    maxX: Math.max(...points.map(point => point.x)),
    minZ: Math.min(...points.map(point => point.z)),
    maxZ: Math.max(...points.map(point => point.z)),
  };
}

// A tile edge is a power of two world units, and the limits are powers of two, so every
// capture tile sits on the one global lattice that deck.gl indexes directly: a pyramid
// tile of 256 pixels covers edge / 4 world units, which is 256 / 2^z for an integer z.
// Any other edge would need a per-map transform between tile indices and world units.
function grid(bounds: Bounds, edgeLimit = TILE_LIMIT): { originX: number; originZ: number; edge: number; columns: number; rows: number } {
  if (!Number.isInteger(Math.log2(edgeLimit))) throw new Error(`Tile edge limit ${edgeLimit} is not a power of two.`);
  const spanX = Math.max(bounds.maxX - bounds.minX, 1);
  const spanZ = Math.max(bounds.maxZ - bounds.minZ, 1);
  const minimumEdge = Math.ceil(Math.max(spanX / Math.ceil(spanX / edgeLimit), spanZ / Math.ceil(spanZ / edgeLimit)));
  let best: { originX: number; originZ: number; edge: number; columns: number; rows: number } | null = null;
  for (let edge = 2 ** Math.ceil(Math.log2(minimumEdge)); edge <= edgeLimit; edge *= 2) {
    const originX = Math.floor(bounds.minX / edge) * edge;
    const originZ = Math.floor(bounds.minZ / edge) * edge;
    const columns = Math.ceil((bounds.maxX - originX) / edge);
    const rows = Math.ceil((bounds.maxZ - originZ) / edge);
    const candidate = { originX, originZ, edge, columns, rows };
    if (!best || columns * rows < best.columns * best.rows || (columns * rows === best.columns * best.rows && edge < best.edge)) best = candidate;
  }
  return best!;
}

function tileFor(mapSpaceId: string, owner: number | null, column: number, row: number, originX: number, originZ: number, edge: number): Tile {
  return {
    id: owner === null ? `${mapSpaceId}-${column}-${row}` : `${mapSpaceId}-${owner}-${column}-${row}`,
    frame: {
      center: { x: originX + edge * (column + 0.5), z: originZ + edge * (row + 0.5) },
      worldSize: { x: edge, z: edge },
      cameraY: 400,
      nearClip: 0.1,
      farClip: 2000,
    },
  };
}

function extentOfTiles(tiles: Tile[]): Bounds {
  return {
    minX: Math.min(...tiles.map(tile => tile.frame.center.x - tile.frame.worldSize.x / 2)),
    maxX: Math.max(...tiles.map(tile => tile.frame.center.x + tile.frame.worldSize.x / 2)),
    minZ: Math.min(...tiles.map(tile => tile.frame.center.z - tile.frame.worldSize.z / 2)),
    maxZ: Math.max(...tiles.map(tile => tile.frame.center.z + tile.frame.worldSize.z / 2)),
  };
}

function formatExtent(bounds: Bounds): string {
  return `${(bounds.maxX - bounds.minX).toFixed(0)} x ${(bounds.maxZ - bounds.minZ).toFixed(0)}`;
}

async function oldSummary(path: string): Promise<OldPlanSummary | null> {
  const file = Bun.file(path);
  if (!(await file.exists())) return null;
  const plan = await file.json();
  if (!plan.tiles?.length) return { extent: '0 x 0', tiles: 0 };
  return { extent: formatExtent(extentOfTiles(plan.tiles)), tiles: plan.tiles.length };
}

function terrainForScene(sceneNativeId: number): Terrain[] {
  const geometry = geometryByScene.get(sceneNativeId);
  if (!geometry) return [];
  const terrains: Terrain[] = [];
  for (const terrain of geometry.terrains ?? []) {
    // The game activates a terrain when the player stands near it, so a terrain inactive at survey
    // time is still a region to plan: its plan stands the player inside it. A disabled terrain
    // never renders and owns nothing.
    if (terrain.enabled === false) continue;
    const size = terrain.terrainData?.size;
    const position = terrain.source?.position;
    if (!size || !position || size.x <= 0 || size.z <= 0) continue;
    terrains.push({ minX: position.x, maxX: position.x + size.x, minZ: position.z, maxZ: position.z + size.z, area: 0, name: terrain.source?.name ?? 'terrain' });
  }
  return terrains;
}

function intersectionArea(tile: Bounds, terrain: Bounds): number {
  return Math.max(0, Math.min(tile.maxX, terrain.maxX) - Math.max(tile.minX, terrain.minX))
    * Math.max(0, Math.min(tile.maxZ, terrain.maxZ) - Math.max(tile.minZ, terrain.minZ));
}

// Afallon marks foliage with no layer or tag (survey run 28a00887). These shader families are
// the only stable marker of trees, leaves, and their impostor billboards; rock and ground
// materials use other shaders and stay visible.
const lighting = {
  ambient: { r: 0.65, g: 0.65, b: 0.65 },
  directionalIntensity: 1.2,
  directionalEuler: { x: 65, y: -30, z: 0 },
};
// The game switched distant terrain off within about 150 frames of arrival in scene 9.
const readiness = { timeoutMs: 300000, stableFrames: 3, settleFrames: 300, boundaryOverlap: LOADER_MARGIN_WORLD_UNITS };
const reports: Report[] = [];
let totalTiles = 0;

// World surface: the terrains of every bound scene define the capture rectangle and one shared
// lattice of cells; the loop below plans each cell for every base-scene terrain that covers it.
const worldBindings = scenesByMap.get('world-surface') ?? [];
const worldTerrain = new Map<number, Terrain[]>();
for (const binding of worldBindings) worldTerrain.set(binding.sceneNativeId, terrainForScene(binding.sceneNativeId));
const allWorldTerrain = [...worldTerrain.values()].flat();
if (!allWorldTerrain.length) throw new Error('world-surface has no observed terrain');
const terrainBounds: Bounds = {
  minX: Math.min(...allWorldTerrain.map(terrain => terrain.minX)),
  maxX: Math.max(...allWorldTerrain.map(terrain => terrain.maxX)),
  minZ: Math.min(...allWorldTerrain.map(terrain => terrain.minZ)),
  maxZ: Math.max(...allWorldTerrain.map(terrain => terrain.maxZ)),
};
// A reviewed box on the world surface is the reviewer's statement of the playable region, so the
// capture rectangle is the terrain clipped to it rather than every hectare the terrain covers.
const worldReviewedBoxes = worldBindings.flatMap(binding => binding.domain.kind === 'boxes' ? binding.domain.boxes : []);
const worldBounds: Bounds = worldReviewedBoxes.length === 0 ? terrainBounds : {
  minX: Math.max(terrainBounds.minX, Math.min(...worldReviewedBoxes.map(box => box.min.x))),
  maxX: Math.min(terrainBounds.maxX, Math.max(...worldReviewedBoxes.map(box => box.max.x))),
  minZ: Math.max(terrainBounds.minZ, Math.min(...worldReviewedBoxes.map(box => box.min.z))),
  maxZ: Math.min(terrainBounds.maxZ, Math.max(...worldReviewedBoxes.map(box => box.max.z))),
};
const worldGrid = grid(worldBounds, WORLD_TILE_LIMIT);
const worldOriginX = Math.floor(worldBounds.minX / worldGrid.edge) * worldGrid.edge;
const worldOriginZ = Math.floor(worldBounds.minZ / worldGrid.edge) * worldGrid.edge;
const worldColumns = Math.ceil((worldBounds.maxX - worldOriginX) / worldGrid.edge);
const worldRows = Math.ceil((worldBounds.maxZ - worldOriginZ) / worldGrid.edge);
// The base scenes are chunks of one world over shared terrain: each holds the objects of its
// own region and shows bare ground elsewhere. A cell is captured from exactly one scene, the
// one that places the most object loaders in it; a cell where no scene places anything is bare
// ground from every scene and goes to the scene whose terrain covers most of it, the lowest
// native id on a tie. Within the scene the cell goes to the terrain with the largest share, as
// one plan per (scene, terrain). Capture activates every hider root of the scene, so a plan
// renders every object in its cells whichever terrain group owns it, and no cell is captured
// twice. A challenge-stone scene is a variant, not more world.
const slug = (name: string) => name.toLowerCase().replaceAll(/[^a-z0-9]+/g, '-').replaceAll(/^-|-$/g, '');
type WorldPlanKey = { sceneNativeId: number; terrain: Terrain };
const worldTiles = new Map<string, { key: WorldPlanKey; tiles: Tile[] }>();
// One terrain edge offset between scenes, along one cell edge, is not more coverage.
const OWNERSHIP_TOLERANCE_AREA = 4 * worldGrid.edge;
const reviewedOwners: ReviewedCellOwners = options.owners
  ? await Bun.file(resolve(options.owners)).json() as ReviewedCellOwners
  : { schemaVersion: 'compendium.reviewed-cell-owners.v1', mapSpaceId: 'world-surface', cells: [] };
Assert(ReviewedCellOwnersSchema, reviewedOwners);
if (reviewedOwners.mapSpaceId !== 'world-surface') throw new Error(`Reviewed cell owners must target world-surface, not ${reviewedOwners.mapSpaceId}.`);
const ownerOverrides = new Map<string, ReviewedCellOwners['cells'][number]>();
for (const cell of reviewedOwners.cells) {
  const key = `${cell.minX},${cell.minZ}`;
  if (ownerOverrides.has(key)) throw new Error(`Reviewed cell owners contain duplicate cell ${key}.`);
  ownerOverrides.set(key, cell);
}
const overridesApplied: ReviewedCellOwners['cells'] = [];
const matchedOverrideKeys = new Set<string>();
const baseScenesInOrder = [...worldTerrain].filter(([sceneNativeId]) => BASE_WORLD_SCENES[sceneNativeId]).sort((left, right) => left[0] - right[0]);
function loadersInCell(sceneNativeId: number, cell: Bounds): number {
  let count = 0;
  for (const point of loaderPositionsByScene.get(sceneNativeId) ?? []) {
    if (point.x >= cell.minX && point.x < cell.maxX && point.z >= cell.minZ && point.z < cell.maxZ) count++;
  }
  return count;
}
function largestTerrain(terrains: Terrain[], cell: Bounds): { terrain: Terrain; area: number; sceneArea: number } | undefined {
  let sceneArea = 0;
  let best: { terrain: Terrain; area: number } | undefined;
  for (const terrain of terrains) {
    const area = intersectionArea(cell, terrain);
    sceneArea += area;
    if (area > 1e-6 && (best === undefined || area > best.area)) best = { terrain, area };
  }
  return best === undefined ? undefined : { ...best, sceneArea };
}
let worldUncoveredTiles = 0;
const worldOwnership: Array<{ cell: string; sceneNativeId: number; loaders: number; by: 'loaders' | 'terrain' | 'override' }> = [];
for (let column = 0; column < worldColumns; column++) {
  for (let row = 0; row < worldRows; row++) {
    const tileBounds: Bounds = {
      minX: worldOriginX + column * worldGrid.edge,
      maxX: worldOriginX + (column + 1) * worldGrid.edge,
      minZ: worldOriginZ + row * worldGrid.edge,
      maxZ: worldOriginZ + (row + 1) * worldGrid.edge,
    };
    const cellKey = `${tileBounds.minX},${tileBounds.minZ}`;
    let owner: { sceneNativeId: number; terrain: Terrain; loaders: number; sceneArea: number; by: 'loaders' | 'terrain' | 'override' } | undefined;
    const forced = ownerOverrides.get(cellKey);
    if (forced !== undefined) {
      const terrains = worldTerrain.get(forced.sceneNativeId) ?? [];
      const best = largestTerrain(terrains, tileBounds);
      if (best === undefined) throw new Error(`Reviewed cell owner ${forced.sceneNativeId} has no terrain covering cell ${cellKey}.`);
      owner = { sceneNativeId: forced.sceneNativeId, terrain: best.terrain, loaders: loadersInCell(forced.sceneNativeId, tileBounds), sceneArea: best.sceneArea, by: 'override' };
      matchedOverrideKeys.add(cellKey);
      overridesApplied.push(forced);
    } else {
      for (const [sceneNativeId, terrains] of baseScenesInOrder) {
        const best = largestTerrain(terrains, tileBounds);
        if (best === undefined) continue;
        const loaders = loadersInCell(sceneNativeId, tileBounds);
        const candidate = { sceneNativeId, terrain: best.terrain, loaders, sceneArea: best.sceneArea, by: loaders > 0 ? 'loaders' as const : 'terrain' as const };
        if (owner === undefined) { owner = candidate; continue; }
        if (loaders > owner.loaders) { owner = candidate; continue; }
        if (loaders === owner.loaders && loaders === 0 && best.sceneArea > owner.sceneArea + OWNERSHIP_TOLERANCE_AREA) owner = candidate;
      }
    }
    if (owner === undefined) { worldUncoveredTiles++; continue; }
    worldOwnership.push({ cell: `${tileBounds.minX},${tileBounds.minZ}`, sceneNativeId: owner.sceneNativeId, loaders: owner.loaders, by: owner.by });
    const id = `${owner.sceneNativeId}-${slug(owner.terrain.name)}`;
    const entry = worldTiles.get(id) ?? { key: { sceneNativeId: owner.sceneNativeId, terrain: owner.terrain }, tiles: [] };
    entry.tiles.push(tileFor(`world-surface-${slug(owner.terrain.name)}`, owner.sceneNativeId, column, row, worldOriginX, worldOriginZ, worldGrid.edge));
    worldTiles.set(id, entry);
  }
}
const unmatchedOverrides = reviewedOwners.cells.filter(cell => !matchedOverrideKeys.has(`${cell.minX},${cell.minZ}`));
if (unmatchedOverrides.length > 0) {
  throw new Error(`Reviewed cell owner override matched no plan cell: ${unmatchedOverrides.map(cell => `${cell.minX},${cell.minZ}`).join(', ')}.`);
}
const worldPlanPath = (id: string) => `local/capture-world-surface-${id}.json`;
const emittedWorldPlans = new Set<string>();
// A plan stands the player on the walkable surface inside its tiles. A terrain with no walkable
// vertex under it is scenery beyond the playable edge: nothing can stand there, so no plan.
function hasWalkableSurface(sceneNativeId: number, tiles: Tile[]): boolean {
  const vertices = navigationByScene.get(sceneNativeId) ?? [];
  const bounds = extentOfTiles(tiles);
  for (let index = 0; index + 2 < vertices.length; index += 3) {
    const x = vertices[index]!, z = vertices[index + 2]!;
    if (x >= bounds.minX && x <= bounds.maxX && z >= bounds.minZ && z <= bounds.maxZ) return true;
  }
  return false;
}
const unwalkableWorldRegions: string[] = [];
for (const [id, { key, tiles }] of worldTiles) {
  const binding = worldBindings.find(candidate => candidate.sceneNativeId === key.sceneNativeId);
  if (!binding) throw new Error(`world-surface: scene ${key.sceneNativeId} has no binding`);
  if (!hasWalkableSurface(key.sceneNativeId, tiles)) { unwalkableWorldRegions.push(id); continue; }
  const path = worldPlanPath(id);
  emittedWorldPlans.add(path);
  const old = await oldSummary(path);
  const plan = {
    schemaVersion: 'compendium.capture-plan.v9',
    sceneNativeId: key.sceneNativeId,
    scenePath: binding.scenePath,
    mapSpaceId: 'world-surface',
    // The player stands on the walkable surface nearest the terrain's centre. The standing box
    // is the terrain, not the tile set, so re-planning cells keeps every unchanged tile's key.
    ...(navigationSurveyByScene.has(key.sceneNativeId) ? { survey: navigationSurveyByScene.get(key.sceneNativeId) } : {}),
    standing: { minX: key.terrain.minX, maxX: key.terrain.maxX, minZ: key.terrain.minZ, maxZ: key.terrain.maxZ },
    width: PIXELS,
    height: PIXELS,
    cullingMask: -1,
    lighting,
    readiness,
    tiles,
  };
  await Bun.write(path, JSON.stringify(plan, null, 2) + '\n');
  totalTiles += tiles.length;
  reports.push({
    mapSpaceId: 'world-surface', sceneNativeId: key.sceneNativeId, path,
    oldExtent: old?.extent ?? 'none', oldTiles: old?.tiles ?? 0,
    newExtent: formatExtent(extentOfTiles(tiles)), newTiles: tiles.length,
  });
}
// A plan the current rule no longer emits is stale evidence that would claim cells for a scene
// or terrain that no longer owns them.
const removedWorldPlans: string[] = [];
for (const entry of await readdir('local')) {
  if (!entry.startsWith('capture-world-surface') || !entry.endsWith('.json')) continue;
  const path = `local/${entry}`;
  if (!emittedWorldPlans.has(path)) { await unlink(path); removedWorldPlans.push(path); }
}

// Interiors publish the game's own map and are not captured.

reports.sort((left, right) => left.mapSpaceId.localeCompare(right.mapSpaceId) || (left.sceneNativeId ?? 0) - (right.sceneNativeId ?? 0));
  return {
    mapSpaces: Object.keys(ATLAS_MAPS).length,
    totalTiles,
    margin: {
      navigationNeighbourhoodWorldUnits: NAVIGATION_NEIGHBOURHOOD,
      loaderMarginWorldUnits: LOADER_MARGIN_WORLD_UNITS,
    },
    worldSurface: {
      removedPlans: removedWorldPlans,
      unwalkableRegions: unwalkableWorldRegions,
      ownership: worldOwnership,
      overridesApplied,
      edge: worldGrid.edge,
      columns: worldColumns,
      rows: worldRows,
      uncoveredTiles: worldUncoveredTiles,
      plans: [...worldTiles].map(([id, { tiles }]) => ({ id, tiles: tiles.length })),
    },
    reports,
  };
}
