// Builds one tile plan per map space from the newest successful capture run for that space,
// so every captured map becomes a published layer.
import { Buffer } from 'node:buffer';
import { createHash } from 'node:crypto';
import { readdir } from 'node:fs/promises';
import { relative, resolve, sep } from 'node:path';
import type { CompendiumConfig } from './config';

export interface TilePlannerOptions {
  config: CompendiumConfig;
  buildId: string;
}

const sha = async (path: string) => createHash('sha256').update(Buffer.from(await Bun.file(path).arrayBuffer())).digest('hex');

interface Run { directory: string; mapSpaceId: string; completedAt: string; tiles: string[] }

export async function planTiles(options: TilePlannerOptions): Promise<Record<string, unknown>> {
  const root = resolve(options.config.outputRoot, options.buildId);
  const rootDisplay = relative(resolve('.'), root).split(sep).join('/');
// A pyramid must come from captures of the map's current plan. Older runs of the same map
// can carry superseded tile frames, so a run counts only when every tile it recorded is a
// tile of the current local plan, whose frames define the lattice the pyramid is built on.
const planTileIds = new Map<string, Set<string>>();
for (const entry of await readdir('local')) {
  if (!entry.startsWith('capture-') || !entry.endsWith('.json')) continue;
  const plan = await Bun.file(resolve('local', entry)).json();
  if (plan.schemaVersion !== 'compendium.capture-plan.v9' || typeof plan.mapSpaceId !== 'string') continue;
  const ids = planTileIds.get(plan.mapSpaceId) ?? new Set<string>();
  for (const tile of plan.tiles) ids.add(tile.id);
  planTileIds.set(plan.mapSpaceId, ids);
}

const runs: Run[] = [];
for (const entry of await readdir(root)) {
  const manifestPath = resolve(root, entry, 'manifest.json');
  if (!(await Bun.file(manifestPath).exists())) continue;
  const manifest = await Bun.file(manifestPath).json();
  if (manifest.input?.command !== 'capture' || manifest.status !== 'succeeded') continue;
  const mapSpaceId = manifest.input.settings?.mapSpaceId;
  if (typeof mapSpaceId !== 'string') continue;
  const currentIds = planTileIds.get(mapSpaceId);
  if (currentIds === undefined) continue;
  // A tile id names the scene, terrain, and cell. Only tiles the current plans still contain
  // contribute; a cell that moved to another scene leaves its old tiles behind.
  const tiles = (manifest.artifacts ?? [])
    .map((artifact: { path: string }) => artifact.path)
    .filter((path: string) => path.startsWith('tiles/') && path.endsWith('.png'))
    .map((path: string) => path.slice('tiles/'.length, -'.png'.length))
    .filter((id: string) => currentIds.has(id));
  if (tiles.length === 0) continue;
  runs.push({
    directory: entry,
    mapSpaceId,
    completedAt: manifest.timestamps?.completedAt ?? manifest.timestamps?.startedAt ?? '',
    tiles,
  });
}

// A capture run may cover a subset of a map's tiles, so every run for a map contributes.
const byMapSpace = new Map<string, Run[]>();
for (const run of runs) {
  const list = byMapSpace.get(run.mapSpaceId) ?? [];
  list.push(run);
  byMapSpace.set(run.mapSpaceId, list);
}

const profilePath = 'local/reviewed-map-spaces.json';
const profileSha = await sha(profilePath);
const plans: { mapSpaceId: string; path: string; sources: number }[] = [];
for (const [mapSpaceId, list] of byMapSpace) {
  list.sort((left, right) => left.completedAt.localeCompare(right.completedAt));
  // Later runs supersede earlier ones for the same tile, so keep the newest run per tile.
  const owner = new Map<string, Run>();
  for (const run of list) for (const tile of run.tiles) owner.set(tile, run);
  const selected = [...new Set(owner.values())];
  const sources = [] as { path: string; sha256: string }[];
  for (const run of selected) {
      const manifestPath = `${root}/${run.directory}/manifest.json`;
    sources.push({ path: '../' + `${rootDisplay}/${run.directory}/manifest.json`, sha256: await sha(manifestPath) });
  }
  const path = `local/tiles-${mapSpaceId}.json`;
  await Bun.write(path, JSON.stringify({
    schemaVersion: 'compendium.tile-plan.v2',
    buildId: options.buildId,
    mapSpaceId,
    profile: { path: 'reviewed-map-spaces.json', sha256: profileSha },
    sources,
    tileSize: 256,
  }, null, 2) + '\n');
  plans.push({ mapSpaceId, path, sources: sources.length });
}
  plans.sort((left, right) => left.mapSpaceId.localeCompare(right.mapSpaceId));
  return { mapSpaces: plans.length, plans };
}
