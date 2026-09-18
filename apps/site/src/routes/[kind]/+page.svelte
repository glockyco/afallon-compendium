<script lang="ts">
  import { base } from '$app/paths';
  import CompendiumSearch from '$lib/CompendiumSearch.svelte';
  import ListTable from '$lib/ListTable.svelte';
  import type { PageData } from './$types';
  export let data: PageData;
</script>

<svelte:head><title>{data.kind.plural} · Afallon Compendium</title><meta name="description" content={`Browse published ${data.kind.plural.toLocaleLowerCase()} in the Afallon Compendium.`} /></svelte:head>

<main>
  <header class="site-header"><a href={`${base}/`}>World atlas</a><CompendiumSearch registry={data.registry} /></header>
  <nav aria-label="Breadcrumb"><a href={`${base}/`}>Compendium</a><span>›</span><span>{data.kind.plural}</span></nav>
  <h1>{data.kind.plural}</h1>
  <p class="lede">Browse, sort, and filter every published {data.kind.label.toLocaleLowerCase()}.</p>
  <ListTable list={data.list} kind={data.kind} registry={data.registry} />
  <footer>Game build {data.list.buildId} · Catalog {data.list.catalogId}</footer>
</main>

<style>
  :global(body) { margin: 0; background: #171818; color: #e9e4d9; font-family: Inter, ui-sans-serif, system-ui, -apple-system, sans-serif; }
  main { width: min(92rem, calc(100% - 2rem)); margin: 0 auto; padding: 1rem 0 2rem; }
  .site-header { display: flex; align-items: end; justify-content: space-between; gap: 1rem; padding-bottom: 1rem; border-bottom: 1px solid #3d3e3a; }
  nav { display: flex; flex-wrap: wrap; gap: .45rem; margin-top: 1.4rem; color: #aaa69d; font-size: .78rem; }
  a { color: #d9bd79; text-underline-offset: .18em; } h1 { margin: .55rem 0 0; font: 600 clamp(1.8rem, 5vw, 3rem)/1.15 Georgia, serif; }
  .lede { color: #bcb8ae; } footer { margin-top: 2rem; padding-top: 1rem; border-top: 1px solid #3d3e3a; color: #8e8b83; font-size: .7rem; overflow-wrap: anywhere; }
  @media (max-width: 640px) { .site-header { align-items: stretch; flex-direction: column; } main { width: min(100% - 1rem, 92rem); } }
</style>
