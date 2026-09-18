import { browser } from '$app/environment';
import { base } from '$app/paths';
import { AtlasDataLoader } from './atlas-data';

let loader: AtlasDataLoader | undefined;

export function clientAtlasLoader(): AtlasDataLoader | null {
  if (!browser) return null;
  loader ??= new AtlasDataLoader(fetch, new URL(`${base}/data/`, window.location.href));
  return loader;
}
