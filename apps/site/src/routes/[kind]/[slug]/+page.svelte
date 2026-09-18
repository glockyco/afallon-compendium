<script lang="ts">
  import { base } from '$app/paths';
  import CompendiumSearch from '$lib/CompendiumSearch.svelte';
  import FactCard from '$lib/FactCard.svelte';
  import type { PageData } from './$types';
  export let data: PageData;

  $: summary = (data.document.description ?? `${data.document.ref.name} in Afallon.`).replace(/\s+/g, ' ').trim().slice(0, 220);
  $: socialArt = data.document.ref.icon ?? data.document.art.icon ?? data.document.art.portrait ?? data.document.art.artwork;
  $: socialImage = socialArt ? `https://afallon.compendiums.org${base}/data/${socialArt.url}` : `https://afallon.compendiums.org${base}/og-default.png`;
</script>

<svelte:head>
  <title>{data.document.ref.name} · Afallon Compendium</title>
  <meta name="description" content={summary} />
  <meta property="og:type" content="article" />
  <meta property="og:site_name" content="Afallon Compendium" />
  <meta property="og:title" content={data.document.ref.name} />
  <meta property="og:description" content={summary} />
  <meta property="og:image" content={socialImage} />
  <meta property="og:image:alt" content={data.document.ref.name} />
</svelte:head>

<main>
  <header class="site-header"><a href={`${base}/`}>World atlas</a><CompendiumSearch registry={data.registry} /></header>
  <nav aria-label="Breadcrumb"><a href={`${base}/`}>Compendium</a><span>›</span><a href={`${base}/${data.kind.route}/`}>{data.kind.plural}</a><span>›</span><span>{data.document.ref.name}</span></nav>
  <article class="document"><FactCard document={data.document} registry={data.registry} showRelations /></article>
  <aside class="machine-data"><a href={`${base}/data/${data.documentPath}`}>JSON</a></aside>
  <footer>Game build {data.buildId} · Catalog {data.catalogId}</footer>
</main>

<style>
  :global(body) { margin: 0; background: #171818; color: #e9e4d9; font-family: Inter, ui-sans-serif, system-ui, -apple-system, sans-serif; }
  main { width: min(78rem, calc(100% - 2rem)); margin: 0 auto; padding: 1rem 0 2rem; }
  .site-header { display: flex; align-items: end; justify-content: space-between; gap: 1rem; padding-bottom: 1rem; border-bottom: 1px solid #3d3e3a; }
  nav { display: flex; flex-wrap: wrap; gap: .45rem; margin: 1.4rem 0; color: #aaa69d; font-size: .78rem; }
  a { color: #d9bd79; text-underline-offset: .18em; } .document { padding: 1.2rem; border: 1px solid #3d3e3a; background: #202120; }
  .machine-data { margin-top: 1rem; font-size: .78rem; text-align: right; } footer { margin-top: 2rem; padding-top: 1rem; border-top: 1px solid #3d3e3a; color: #8e8b83; font-size: .7rem; overflow-wrap: anywhere; }
  @media (max-width: 640px) { .site-header { align-items: stretch; flex-direction: column; } main { width: min(100% - 1rem, 78rem); } .document { padding: .8rem; } }
</style>
