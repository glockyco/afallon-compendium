<script lang="ts">
  import { base } from '$app/paths';
  import type { CoverageGap } from '@afallon/contracts/public';
  import Card from '$lib/Card.svelte';
  import EntityHeader from '$lib/EntityHeader.svelte';
  import EntityLink from '$lib/EntityLink.svelte';
  import PageShell from '$lib/PageShell.svelte';
  import { formatNumber } from '$lib/format';
  import type { PageData } from './$types';
  export let data: PageData;

  // What each gap means for a reader, and why the site cannot fill it.
  const GAPS: Record<CoverageGap, { title: string; text: string }> = {
    itemWithoutSource: {
      title: 'Items without a known source',
      text: 'The scanned game data names no creature, vendor, container, object, resource, quest, or recipe that gives these items. Class and race starting gear is one such case, because the scans do not record it.',
    },
    npcWithoutLocation: {
      title: 'Creatures without a map location',
      text: 'No scanned spawner places these creatures in a scanned scene, so their pages show no location.',
    },
    npcWithoutLevel: {
      title: 'Creatures without a level',
      text: 'These creatures have a map location but no published level. Adventurers and companions take their level from the saved progress of the player. The level rule of the others is not confirmed.',
    },
    placeWithoutMap: {
      title: 'Places without a map',
      text: 'No reviewed game map shows these places, so their creatures and objects have no map markers.',
    },
    unresolvedReference: {
      title: 'Pages with an unknown reference',
      text: 'These pages name something that has no record in the game data of this build. The name shows as plain text.',
    },
  };

  $: coverage = data.coverage;
  $: kinds = new Map(data.registry.map((entry) => [entry.kind, entry]));
  $: crumbs = [{ label: 'Compendium', href: `${base}/` }, { label: 'Coverage' }];
</script>

<svelte:head><title>Data coverage · Afallon Compendium</title><meta name="description" content="What the Afallon Compendium publishes for the current game build, and what it does not know yet." /></svelte:head>

<PageShell registry={data.registry} {crumbs} buildId={coverage.buildId} catalogId={coverage.catalogId}>
  <EntityHeader name="Data coverage" description={`What this site publishes for game build ${coverage.buildId}, and what it does not know yet.`} />

  <div class="c-stack">
    <Card title="Published">
      <ul class="published">
        {#each coverage.pages as page}
          {@const kind = kinds.get(page.kind)}
          <li>{#if kind}<a class="c-link" href={`${base}/${kind.route}/`}>{formatNumber(page.count)} {page.count === 1 ? kind.label.toLocaleLowerCase() : kind.plural.toLocaleLowerCase()}</a>{:else}{formatNumber(page.count)} {page.kind}{/if}</li>
        {/each}
        <li><a class="c-link" href={`${base}/`}>{formatNumber(coverage.placementCount)} map locations on {formatNumber(coverage.mapCount)} maps</a></li>
      </ul>
    </Card>

    {#each coverage.gaps as gap}
      <Card title={GAPS[gap.gap].title} count={gap.pages.length}>
        <p class="text">{GAPS[gap.gap].text}</p>
        <ul class="pages">{#each gap.pages as page}<li><EntityLink ref={page} registry={data.registry} tooltip={false} /></li>{/each}</ul>
      </Card>
    {/each}
  </div>
</PageShell>

<style>
  .published { display: grid; grid-template-columns: repeat(auto-fill, minmax(12rem, 1fr)); gap: .45rem 1rem; margin: 0; padding: 0; list-style: none; font-size: .9rem; }
  .text { margin: 0 0 .9rem; color: var(--c-text-dim); font-size: .88rem; line-height: 1.55; }
  .pages { columns: 16rem; column-gap: 1.5rem; margin: 0; padding: 0; list-style: none; font-size: .84rem; }
  .pages li { break-inside: avoid; padding: .15rem 0; }
</style>
