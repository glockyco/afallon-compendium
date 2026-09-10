import type { MapViewState } from './map-adapter';

export interface MapUrlState {
  mapSpaceId: string | null;
  layerId: string | null;
  selectedId: string | null;
  query: string;
  itemSourceQuery: string;
  detailQuery: string;
  roles: string[];
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
  const roles = params.getAll('roles').flatMap((value) => value.split(',')).map((value) => value.trim()).filter(Boolean);
  return {
    mapSpaceId: params.get('map'),
    layerId: params.get('layer'),
    selectedId: params.get('selected'),
    query: params.get('q') ?? '',
    itemSourceQuery: params.get('source-q') ?? '',
    detailQuery: params.get('detail-q') ?? '',
    roles: [...new Set(roles)],
    itemKey: params.get('item'),
    entityKey: params.get('entity'),
    view
  };
}

export function writeMapUrl(url: URL, state: MapUrlState): URL {
  const params = url.searchParams;
  const optional = new Map<string, string | null>([
    ['map', state.mapSpaceId],
    ['layer', state.layerId],
    ['selected', state.selectedId],
    ['q', state.query.trim() || null],
    ['source-q', state.itemSourceQuery.trim() || null],
    ['detail-q', state.detailQuery.trim() || null],
    ['item', state.itemKey],
    ['entity', state.entityKey]
  ]);
  for (const [key, value] of optional) {
    if (value) params.set(key, value);
    else params.delete(key);
  }
  params.delete('roles');
  if (state.roles.length > 0) params.set('roles', state.roles.join(','));
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
