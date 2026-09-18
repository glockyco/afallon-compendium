<script lang="ts" context="module">
  export type Crumb = { label: string; href?: string };
</script>

<script lang="ts">
  import { base } from '$app/paths';
  import type { PublicKindEntry } from '@afallon/contracts/public';
  import CompendiumSearch from './CompendiumSearch.svelte';
  import './compendium.css';

  export let registry: PublicKindEntry[] = [];
  export let crumbs: Crumb[] = [];
  export let buildId: string | undefined = undefined;
  export let catalogId: string | undefined = undefined;
</script>

<div class="frame">
  <header class="bar">
    <div class="bar-inner">
      <a class="brand" href={`${base}/`}>
        <img src={`${base}/logo.png`} width="32" height="32" alt="" />
        <span class="brand-copy"><strong>Afallon</strong><span>Compendium</span></span>
      </a>
      <nav class="bar-links" aria-label="Site">
        <a class="c-link" href={`${base}/`}>World atlas</a>
        {#each registry.filter((entry) => entry.pages) as entry}<a class="c-link" href={`${base}/${entry.route}/`}>{entry.plural}</a>{/each}
      </nav>
      <div class="bar-search"><CompendiumSearch {registry} /></div>
    </div>
  </header>

  <main class="c-page">
    {#if crumbs.length}
      <nav class="crumbs" aria-label="Breadcrumb">
        {#each crumbs as crumb, index}
          {#if index > 0}<span aria-hidden="true">/</span>{/if}
          {#if crumb.href}<a class="c-link" href={crumb.href}>{crumb.label}</a>{:else}<span aria-current="page">{crumb.label}</span>{/if}
        {/each}
      </nav>
    {/if}
    <slot />
    <footer>
      <slot name="footer-extra" />
      {#if buildId}<span>Game build {buildId}</span>{/if}
      {#if catalogId}<span>Catalog {catalogId}</span>{/if}
      <a class="c-link" href={`${base}/coverage/`}>Coverage</a>
    </footer>
  </main>
</div>

<style>
  :global(*) { box-sizing: border-box; }
  :global(body) { margin: 0; background: var(--c-surface-0); color: var(--c-text); font-family: Inter, ui-sans-serif, system-ui, -apple-system, sans-serif; }
  :global(button, input, select) { font: inherit; }
  :global(button, select) { cursor: pointer; }
  :global(a) { color: var(--c-accent); }

  .frame { min-height: 100vh; }
  .bar { border-bottom: 1px solid var(--c-line); background: var(--c-surface-1); }
  .bar-inner { display: flex; align-items: center; gap: 1.25rem; width: min(72rem, 100%); margin: 0 auto; padding: .7rem 1.5rem; }
  .brand { display: inline-flex; align-items: center; gap: .55rem; color: var(--c-text); text-decoration: none; }
  .brand img { width: 32px; height: 32px; flex: none; object-fit: contain; }
  .brand-copy { display: grid; line-height: 1; }
  .brand-copy strong { font-size: .85rem; letter-spacing: .02em; }
  .brand-copy span { margin-top: .22rem; color: var(--c-accent); font-size: .62rem; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; }
  .brand:hover strong { color: var(--c-accent); }
  .bar-links { display: flex; flex-wrap: wrap; gap: .35rem .9rem; min-width: 0; font-size: .8rem; }
  .bar-links a { white-space: nowrap; text-decoration: none; }
  .bar-links a:hover { text-decoration: underline; }
  .bar-search { min-width: 0; flex: 1; max-width: 22rem; margin-left: auto; }

  .c-page { width: min(72rem, 100%); margin: 0 auto; padding: 1.5rem 1.5rem 3rem; }
  .crumbs { display: flex; flex-wrap: wrap; gap: .4rem; margin-bottom: 1.1rem; color: var(--c-text-mute); font-size: .76rem; }
  .crumbs a { text-decoration: none; }
  .crumbs a:hover { text-decoration: underline; }

  footer { display: flex; flex-wrap: wrap; gap: .3rem 1rem; margin-top: 2.5rem; padding-top: 1rem; border-top: 1px solid var(--c-line); color: var(--c-text-mute); font-size: .7rem; overflow-wrap: anywhere; }

  @media (max-width: 860px) {
    .bar-inner { flex-wrap: wrap; gap: .75rem 1rem; padding: .6rem 1rem; }
    .bar-search { flex-basis: 100%; max-width: none; margin-left: 0; order: 3; }
  }

  @media (max-width: 640px) {
    .bar-links { gap: .7rem; font-size: .76rem; }
    .c-page { padding: 1.1rem 1rem 2.5rem; }
  }
</style>
