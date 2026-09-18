<script lang="ts">
  import { base } from '$app/paths';
  import Card from '$lib/Card.svelte';
  import Fact from '$lib/Fact.svelte';
  import FactGrid from '$lib/FactGrid.svelte';
  import PageShell from '$lib/PageShell.svelte';
  import { formatNumber, labelOf } from '$lib/format';
  import type { PageData } from './$types';
  export let data: PageData;

  $: crumbs = [{ label: 'Compendium', href: `${base}/` }, { label: 'Coverage' }];
</script>

<svelte:head><title>Publication coverage · Afallon Compendium</title><meta name="description" content="Coverage and unresolved evidence totals for the current Afallon publication." /></svelte:head>

<PageShell registry={data.registry} {crumbs} buildId={data.coverage.buildId} catalogId={data.coverage.catalogId}>
  <header class="head">
    <h1>Publication coverage</h1>
    <p class="lede">What this publication established for the supported game build, and what it could not.</p>
  </header>

  <div class="c-stack">
    <div class="c-card-grid">
      <Card title="Publication">
        <FactGrid>
          <Fact label="Mode">{labelOf(data.mode)}</Fact>
          <Fact label="Coverage state">{data.coverage.complete ? 'Complete' : 'Incomplete'}</Fact>
          <Fact label="Build">{data.coverage.buildId}</Fact>
          <Fact label="Catalog" full>{data.coverage.catalogId}</Fact>
        </FactGrid>
      </Card>
      <Card title="Totals">
        <FactGrid>
          <Fact label="Unresolved issues">{formatNumber(data.coverage.unresolvedIssueCount)}</Fact>
          <Fact label="Occurrences">{formatNumber(data.coverage.occurrenceCount)}</Fact>
          <Fact label="Exclusions">{formatNumber(data.coverage.exclusionCount)}</Fact>
        </FactGrid>
      </Card>
    </div>
    {#if data.coverage.messages.length}
      <Card title="Messages" count={data.coverage.messages.length}>
        <ul>{#each data.coverage.messages as message}<li>{message}</li>{/each}</ul>
      </Card>
    {/if}
  </div>
</PageShell>

<style>
  .head { margin-bottom: 1.25rem; }
  h1 { margin: 0; color: #f6f2e7; font: 600 clamp(1.8rem, 4vw, 2.5rem)/1.15 var(--c-serif); }
  .lede { margin: .45rem 0 0; color: var(--c-text-dim); font-size: .9rem; }
  ul { display: grid; gap: .45rem; margin: 0; padding-left: 1.1rem; }
  li { color: #c7c2b8; font-size: .85rem; line-height: 1.5; overflow-wrap: anywhere; }
</style>
