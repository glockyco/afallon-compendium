<script lang="ts">
  import { base } from '$app/paths';
  import ListTable from '$lib/ListTable.svelte';
  import PageShell from '$lib/PageShell.svelte';
  import type { PageData } from './$types';
  export let data: PageData;

  $: crumbs = [{ label: 'Compendium', href: `${base}/` }, { label: data.kind.plural }];
</script>

<svelte:head><title>{data.kind.plural} · Afallon Compendium</title><meta name="description" content={`Browse published ${data.kind.plural.toLocaleLowerCase()} in the Afallon Compendium.`} /></svelte:head>

<PageShell registry={data.registry} {crumbs} buildId={data.list.buildId} catalogId={data.list.catalogId}>
  <header class="head">
    <h1>{data.kind.plural}</h1>
    <p class="lede">Browse, sort, and filter every published {data.kind.label.toLocaleLowerCase()}.</p>
  </header>
  <ListTable list={data.list} kind={data.kind} registry={data.registry} />
</PageShell>

<style>
  .head { margin-bottom: 1.25rem; }
  h1 { margin: 0; color: #f6f2e7; font: 600 clamp(1.8rem, 4vw, 2.5rem)/1.15 var(--c-serif); }
  .lede { margin: .45rem 0 0; color: var(--c-text-dim); font-size: .9rem; }
</style>
