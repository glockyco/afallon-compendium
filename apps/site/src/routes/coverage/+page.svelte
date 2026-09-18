<script lang="ts">
  import { base } from '$app/paths';
  import CompendiumSearch from '$lib/CompendiumSearch.svelte';
  import type { PageData } from './$types';
  export let data: PageData;
</script>

<svelte:head><title>Publication coverage · Afallon Compendium</title><meta name="description" content="Coverage and unresolved evidence totals for the current Afallon publication." /></svelte:head>

<main>
  <header><a href={`${base}/`}>World atlas</a><CompendiumSearch registry={data.registry} /></header>
  <nav aria-label="Breadcrumb"><a href={`${base}/`}>Compendium</a><span>›</span><span>Coverage</span></nav>
  <h1>Publication coverage</h1>
  <p class="mode">Mode: <strong>{data.mode}</strong></p>
  <dl>
    <div><dt>Build</dt><dd>{data.coverage.buildId}</dd></div>
    <div><dt>Catalog</dt><dd>{data.coverage.catalogId}</dd></div>
    <div><dt>Coverage state</dt><dd>{data.coverage.complete ? 'Complete' : 'Incomplete'}</dd></div>
    <div><dt>Unresolved issues</dt><dd>{data.coverage.unresolvedIssueCount}</dd></div>
    <div><dt>Occurrences</dt><dd>{data.coverage.occurrenceCount}</dd></div>
    <div><dt>Exclusions</dt><dd>{data.coverage.exclusionCount}</dd></div>
  </dl>
  {#if data.coverage.messages.length}<section><h2>Messages</h2><ul>{#each data.coverage.messages as message}<li>{message}</li>{/each}</ul></section>{/if}
  <footer>Game build {data.coverage.buildId} · Catalog {data.coverage.catalogId}</footer>
</main>

<style>
  :global(body) { margin: 0; background: #171818; color: #e9e4d9; font-family: Inter, ui-sans-serif, system-ui, -apple-system, sans-serif; }
  main { width: min(56rem, calc(100% - 2rem)); margin: 0 auto; padding: 1rem 0 2rem; }
  header { display: flex; align-items: end; justify-content: space-between; gap: 1rem; padding-bottom: 1rem; border-bottom: 1px solid #3d3e3a; }
  nav { display: flex; gap: .45rem; margin-top: 1.4rem; color: #aaa69d; font-size: .78rem; } a { color: #d9bd79; text-underline-offset: .18em; }
  h1 { margin: .55rem 0; font: 600 clamp(1.8rem, 5vw, 3rem)/1.15 Georgia, serif; } .mode { color: #c9b378; text-transform: capitalize; }
  dl { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); margin-top: 1.4rem; border: 1px solid #3d3e3a; background: #202120; }
  dl div { padding: .8rem; border-bottom: 1px solid #393a37; } dt { color: #aaa69d; font-size: .7rem; text-transform: uppercase; } dd { margin: .3rem 0 0; overflow-wrap: anywhere; }
  section { margin-top: 1.5rem; } li { margin: .4rem 0; color: #c7c2b8; } footer { margin-top: 2rem; padding-top: 1rem; border-top: 1px solid #3d3e3a; color: #8e8b83; font-size: .7rem; }
  @media (max-width: 640px) { header { align-items: stretch; flex-direction: column; } dl { grid-template-columns: 1fr; } }
</style>
