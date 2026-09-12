import type { MapViewState } from './map-adapter';

export interface MapUrlState {
  layerIds: string[];
  selectedId: string | null;
  query: string;
  itemSourceQuery: string;
  detailQuery: string;
  categories: string[];
  levelMinimum: number | null;
  levelMaximum: number | null;
  itemKey: string | null;
  entityKey: string | null;
  view: MapViewState | null;
}

function finiteNumber(value: string | null): number | null {
  if (value === null || value.trim() === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function readMapUrl(search: string): MapUrlState {
  const params = new URLSearchParams(search);
  const x = finiteNumber(params.get('x'));
  const y = finiteNumber(params.get('y'));
  const z = finiteNumber(params.get('z'));
  const zoom = finiteNumber(params.get('zoom'));
  const view = x !== null && y !== null && z === 0 && zoom !== null && zoom >= -12 && zoom <= 12 ? { target: [x, y, z] as [number, number, number], zoom } : null;
  const categories = params.getAll('categories').flatMap((value) => value.split(',')).map((value) => value.trim()).filter(Boolean);
  // A single `layer` is the older one-of-N form; a shared link keeps working as a one-entry list.
  const layerIds = [...params.getAll('layers'), ...params.getAll('layer')].flatMap((value) => value.split(',')).map((value) => value.trim()).filter(Boolean);
  const minimum = finiteNumber(params.get('level-min'));
  const maximum = finiteNumber(params.get('level-max'));
  return {
    layerIds: [...new Set(layerIds)],
    selectedId: params.get('selected'),
    query: params.get('q') ?? '',
    itemSourceQuery: params.get('source-q') ?? '',
    detailQuery: params.get('detail-q') ?? '',
    categories: [...new Set(categories)],
    levelMinimum: minimum !== null && Number.isInteger(minimum) && minimum >= 0 ? minimum : null,
    levelMaximum: maximum !== null && Number.isInteger(maximum) && maximum >= 0 ? maximum : null,
    itemKey: params.get('item'),
    entityKey: params.get('entity'),
    view
  };
}

export function writeMapUrl(url: URL, state: MapUrlState): URL {
  const params = url.searchParams;
  const optional = new Map<string, string | null>([
    ['layers', state.layerIds.join(',') || null],
    ['selected', state.selectedId],
    ['q', state.query.trim() || null],
    ['source-q', state.itemSourceQuery.trim() || null],
    ['detail-q', state.detailQuery.trim() || null],
    ['level-min', state.levelMinimum === null ? null : String(state.levelMinimum)],
    ['level-max', state.levelMaximum === null ? null : String(state.levelMaximum)],
    ['item', state.itemKey],
    ['entity', state.entityKey]
  ]);
  params.delete('map');
  params.delete('layer');
  for (const [key, value] of optional) {
    if (value) params.set(key, value);
    else params.delete(key);
  }
  params.delete('roles');
  params.delete('categories');
  if (state.categories.length > 0) params.set('categories', state.categories.join(','));
  if (state.view) {
    params.set('x', String(state.view.target[0]));
    params.set('y', String(state.view.target[1]));
    params.set('z', String(state.view.target[2]));
    params.set('zoom', String(state.view.zoom));
  } else {
    params.delete('x');
    params.delete('y');
    params.delete('z');
    params.delete('zoom');
  }
  return url;
}
