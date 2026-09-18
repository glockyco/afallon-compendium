import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { AtlasDataLoader, type AtlasFetch } from '../atlas-data';

const siteRoot = fileURLToPath(new URL('../../../', import.meta.url));
const dataRoot = join(siteRoot, '.stage', 'production', 'static', 'data');

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
