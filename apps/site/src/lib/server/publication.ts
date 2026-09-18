import { readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { AtlasDataLoader, type AtlasFetch } from '../atlas-data';

const dataRoot = resolve(process.cwd(), '.stage', 'production', 'static', 'data');

const fileFetch: AtlasFetch = async (input) => {
  const url = new URL(input instanceof Request ? input.url : input);
  const relativePath = url.pathname.replace(/^\/data\//, '');
  try {
    const bytes = await readFile(join(dataRoot, relativePath));
    return new Response(bytes);
  } catch {
    return new Response('missing', { status: 404 });
  }
};

let loader: AtlasDataLoader | undefined;

export function serverAtlasLoader(): AtlasDataLoader {
  if (process.env.SITE_STAGE !== 'production') {
    throw new Error(`Static publication reads require SITE_STAGE=production and ${dataRoot}`);
  }
  loader ??= new AtlasDataLoader(fileFetch, 'https://atlas.invalid/data/');
  return loader;
}
