// Runs on `bun install`. Bun resolves `$lib` and `$app` in tests through `apps/site/tsconfig.json`, which extends the
// `.svelte-kit/tsconfig.json` that SvelteKit generates, and so does every Vite server a test starts. Bun reads that file
// once when a test run starts, so it has to exist before the run. A dev server creates the folder when it starts, so a
// checkout without it has no dev server to disturb, and this script generates it the way `vite dev` would. An existing
// folder stays untouched, because syncing it again could change the route modules under a running dev server.
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const siteRoot = fileURLToPath(new URL('../', import.meta.url));
if (!existsSync(`${siteRoot}.svelte-kit/tsconfig.json`)) {
  const sync = Bun.spawnSync(['bun', 'x', 'svelte-kit', 'sync'], { cwd: siteRoot, stderr: 'pipe' });
  if (sync.exitCode !== 0) throw new Error(`svelte-kit sync failed: ${sync.stderr.toString()}`);
}
