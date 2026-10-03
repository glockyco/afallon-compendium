<script lang="ts">
  import { browser } from '$app/environment';
  import { base } from '$app/paths';
  import { page } from '$app/stores';
  import { listDescription } from '$lib/seo';
  import OverviewGallery from '$lib/OverviewGallery.svelte';
  import ListTable from '$lib/ListTable.svelte';
  import ProgressionOverview from '$lib/ProgressionOverview.svelte';
  import PageShell from '$lib/PageShell.svelte';
  import SeoHead from '$lib/SeoHead.svelte';
  import type { PageData } from './$types';
  export let data: PageData;
  const GALLERY_KINDS = new Set(['classes', 'skills', 'races', 'factions', 'properties', 'mechanics']);
  const PLACE_GROUP_TITLES = { Zone: 'Zones', Dungeon: 'Dungeons' };
  let view: 'gallery' | 'table' = 'gallery';
  let currentKind = data.kind.kind;
  $: if (currentKind !== data.kind.kind) { currentKind = data.kind.kind; view = 'gallery'; }
  $: illustrated = GALLERY_KINDS.has(data.kind.kind);

  $: crumbs = [{ label: 'Compendium', href: `${base}/` }, { label: data.kind.plural }];
  // Prerendering has no query string, so the levels view is the static default and the table view is chosen in the browser.
  $: placesView = data.kind.kind === 'places' && !(browser && $page.url.searchParams.get('view') === 'table');
  $: placesPath = `${base}/${data.kind.kind}/`;
</script>

<SeoHead title={`${data.kind.plural} | Afallon Wiki`} description={listDescription(data.kind)} />

<PageShell registry={data.registry} {crumbs} release={data.release}>
  <header class="head">
    <h1>{data.kind.plural}</h1>
  </header>
  {#if illustrated}
    <nav class="views" aria-label="Overview View">
      <button type="button" class:active={view === 'gallery'} aria-pressed={view === 'gallery'} on:click={() => (view = 'gallery')}>Gallery</button>
      <button type="button" class:active={view === 'table'} aria-pressed={view === 'table'} on:click={() => (view = 'table')}>Table</button>
    </nav>
  {:else if data.kind.kind === 'places'}
    <nav class="views" aria-label="Places Views">
      <a href={placesPath} class:active={placesView} aria-current={placesView ? 'page' : undefined}>By Level</a>
      <a href={`${placesPath}?view=table`} class:active={!placesView} aria-current={!placesView ? 'page' : undefined}>Full Table</a>
    </nav>
  {/if}
  {#if illustrated && view === 'gallery'}
    {#key data.kind.kind}<OverviewGallery list={data.list} kind={data.kind} registry={data.registry} />{/key}
  {:else if placesView}
    <ProgressionOverview entries={data.places} registry={data.registry} groupTitles={PLACE_GROUP_TITLES} />
  {:else}
    <!-- Each table remounts on kind change so its filters and sorting read that list's address. -->
    {#key data.kind.kind}<ListTable list={data.list} kind={data.kind} registry={data.registry} />{/key}
  {/if}
</PageShell>

<style>
  .head { margin-bottom: 1.25rem; }
  h1 { margin: 0; color: var(--c-text-strong); font: 600 clamp(1.8rem, 4vw, 2.5rem)/1.15 var(--c-serif); }
  .views { display: inline-flex; gap: .2rem; margin: 0 0 1rem; padding: .2rem; border: 1px solid var(--c-line); border-radius: var(--c-radius-sm); background: var(--c-surface-1); }
  .views button, .views a { display: inline-flex; align-items: center; min-height: 2.15rem; padding: .4rem .85rem; border: 0; border-radius: var(--c-radius-sm); background: transparent; color: var(--c-text-dim); font: inherit; text-decoration: none; }
  .views button { cursor: pointer; }
  .views button.active, .views a.active { background: var(--c-surface-3); color: var(--c-accent-strong); }
  .views button:focus-visible, .views a:focus-visible { outline: 2px solid var(--c-accent); outline-offset: 2px; }
</style>
