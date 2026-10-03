import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig, searchForWorkspaceRoot, type Plugin } from 'vite';

// The contract modules register their schemas in one registry when they first run. A hot update would run a changed
// contract module again against the registry that already holds its schema identities. A contract change therefore
// discards every server module, so the registry and its schemas load again together.
function reloadContracts(): Plugin {
  return {
    name: 'afallon-reload-contracts',
    hotUpdate({ file }) {
      if (!file.includes('/packages/contracts/src/')) return;
      this.environment.moduleGraph.invalidateAll();
      if (this.environment.name === 'client') this.environment.hot.send({ type: 'full-reload' });
      return [];
    },
  };
}

export default defineConfig({
  plugins: [reloadContracts(), sveltekit()],
  server: {
    fs: { allow: [searchForWorkspaceRoot(process.cwd())] },
    // The dev server serves only the staged data under `.stage/production/static`. A production build writes thousands
    // of pages to `.stage/production/output` and to its own SvelteKit folder, accepting an update keeps a rollback copy
    // beside the stage, and the type check and tests write their own generated files. Watching those folders only
    // floods the server with page reloads.
    watch: {
      ignored: ['**/.stage/production/output/**', '**/.stage/production.rollback-*/**', '**/.svelte-kit-check/**', '**/.svelte-kit-build/**', '**/.svelte-kit-test/**'],
    },
  },
});
