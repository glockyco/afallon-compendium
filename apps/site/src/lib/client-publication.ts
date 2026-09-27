import { browser } from '$app/environment';
import { base } from '$app/paths';
import { MapDataLoader } from './map-data';

let loader: MapDataLoader | undefined;

export function clientMapLoader(): MapDataLoader | null {
  if (!browser) return null;
  loader ??= new MapDataLoader(fetch, new URL(`${base}/data/`, window.location.href));
  return loader;
}
