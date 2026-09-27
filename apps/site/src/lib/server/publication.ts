import { existsSync, statSync } from 'node:fs';
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
let loadedRoot = 0;

// Pages read the staged publication in every mode. Staging also links the dev server's static data to it.
// A restage replaces the publication, so a running dev server starts a new loader when its root changes.
export function serverAtlasLoader(): AtlasDataLoader {
  const rootPath = join(dataRoot, 'publication.json');
  if (!existsSync(rootPath)) {
    throw new Error(`No staged publication at ${dataRoot}. Run bun run stage:production first.`);
  }
  const modified = statSync(rootPath).mtimeMs;
  if (!loader || modified !== loadedRoot) {
    loader = new AtlasDataLoader(fileFetch, 'https://atlas.invalid/data/');
    loadedRoot = modified;
  }
  return loader;
}
