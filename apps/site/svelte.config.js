import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { deploymentPaths } from './deployment-paths.mjs';

const production = process.env.SITE_STAGE === 'production';
const stage = deploymentPaths(import.meta.dirname);

export default {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter({
      strict: true,
      ...(production ? { pages: stage.outputDir, assets: stage.outputDir } : {}),
    }),
    ...(production ? { files: { assets: stage.staticDir } } : {}),
    paths: { base: process.env.BASE_PATH ?? '', relative: false },
  },
};
