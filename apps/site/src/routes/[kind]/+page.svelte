<script lang="ts">
  import { base } from '$app/paths';
  import { readerNoun } from '$lib/format';
  import OverviewGallery from '$lib/OverviewGallery.svelte';
  import ListTable from '$lib/ListTable.svelte';
  import PageShell from '$lib/PageShell.svelte';
  import SeoHead from '$lib/SeoHead.svelte';
  import type { PageData } from './$types';
  export let data: PageData;
  const GALLERY_KINDS = new Set(['classes', 'skills', 'races', 'factions', 'properties', 'mechanics']);
  let view: 'gallery' | 'table' = 'gallery';
  let currentKind = data.kind.kind;
  $: if (currentKind !== data.kind.kind) { currentKind = data.kind.kind; view = 'gallery'; }
  $: illustrated = GALLERY_KINDS.has(data.kind.kind);

  $: crumbs = [{ label: 'Compendium', href: `${base}/` }, { label: data.kind.plural }];
</script>

<SeoHead title={`${data.kind.plural} · Afallon Compendium`} description={`Browse ${readerNoun(data.kind.plural)} in Afallon. Find names, game details, and related locations in the compendium.`} />

<PageShell registry={data.registry} {crumbs} release={data.release}>
  <header class="head">
    <h1>{data.kind.plural}</h1>
  </header>
  {#if illustrated}
    <nav class="views" aria-label="Overview View">
      <button type="button" class:active={view === 'gallery'} aria-pressed={view === 'gallery'} on:click={() => (view = 'gallery')}>Gallery</button>
      <button type="button" class:active={view === 'table'} aria-pressed={view === 'table'} on:click={() => (view = 'table')}>Table</button>
    </nav>
  {/if}
  {#if illustrated && view === 'gallery'}
    {#key data.kind.kind}<OverviewGallery list={data.list} kind={data.kind} registry={data.registry} />{/key}
  {:else}
    <!-- Each table remounts on kind change so its filters and sorting read that list's address. -->
    {#key data.kind.kind}<ListTable list={data.list} kind={data.kind} registry={data.registry} />{/key}
  {/if}
</PageShell>

<style>
  .head { margin-bottom: 1.25rem; }
  h1 { margin: 0; color: var(--c-text-strong); font: 600 clamp(1.8rem, 4vw, 2.5rem)/1.15 var(--c-serif); }
  .views { display: inline-flex; gap: .2rem; margin: 0 0 1rem; padding: .2rem; border: 1px solid var(--c-line); border-radius: var(--c-radius-sm); background: var(--c-surface-1); }
  .views button { min-height: 2.15rem; padding: .4rem .85rem; border: 0; border-radius: var(--c-radius-sm); background: transparent; color: var(--c-text-dim); font: inherit; cursor: pointer; }
  .views button.active { background: var(--c-surface-3); color: var(--c-accent-strong); }
  .views button:focus-visible { outline: 2px solid var(--c-accent); outline-offset: 2px; }
</style>
