import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { deploymentPaths } from './deployment-paths.mjs';

const production = process.env.SITE_STAGE === 'production';
const stage = deploymentPaths(import.meta.dirname);

export default {
  preprocess: vitePreprocess(),
  kit: {
    // The type check (`.svelte-kit-check`), builds and previews (`.svelte-kit-build`), and tests that start Vite
    // (`.svelte-kit-test`) generate their files in folders of their own. None of them therefore rewrites the generated
    // modules and pages that a running dev server serves from `.svelte-kit`.
    outDir: process.env.SVELTE_KIT_OUT_DIR ?? '.svelte-kit',
    adapter: adapter({
      strict: true,
      ...(production ? { pages: stage.outputDir, assets: stage.outputDir } : {}),
    }),
    ...(production ? { files: { assets: stage.staticDir } } : {}),
    paths: { base: process.env.BASE_PATH ?? '', relative: false },
  },
};
