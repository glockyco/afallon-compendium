<script lang="ts">
  import { base } from '$app/paths';
  import { readerNoun } from '$lib/format';
  import ListTable from '$lib/ListTable.svelte';
  import PageShell from '$lib/PageShell.svelte';
  import type { PageData } from './$types';
  export let data: PageData;

  $: crumbs = [{ label: 'Compendium', href: `${base}/` }, { label: data.kind.plural }];
</script>

<svelte:head><title>{data.kind.plural} · Afallon Compendium</title><meta name="description" content={`Browse published ${readerNoun(data.kind.plural)} in the Afallon Compendium.`} /></svelte:head>

<PageShell registry={data.registry} {crumbs} release={data.release}>
  <header class="head">
    <h1>{data.kind.plural}</h1>
  </header>
  <!-- The route reuses this page between lists, and each list keeps its own filters, sort, and column widths, so the
       table mounts again for another kind and reads that list's address. -->
  {#key data.kind.kind}<ListTable list={data.list} kind={data.kind} registry={data.registry} />{/key}
</PageShell>

<style>
  .head { margin-bottom: 1.25rem; }
  h1 { margin: 0; color: var(--c-text-strong); font: 600 clamp(1.8rem, 4vw, 2.5rem)/1.15 var(--c-serif); }
</style>
