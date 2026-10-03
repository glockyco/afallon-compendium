<script lang="ts">
  import { base } from '$app/paths';
  import type { CoverageGap } from '@afallon/contracts/public';
  import Card from '$lib/Card.svelte';
  import EntityHeader from '$lib/EntityHeader.svelte';
  import EntityLink from '$lib/EntityLink.svelte';
  import PageShell from '$lib/PageShell.svelte';
  import SeoHead from '$lib/SeoHead.svelte';
  import { formatNumber, readerNoun } from '$lib/format';
  import type { PageData } from './$types';
  export let data: PageData;

  const INITIAL_ROWS = 8;
  let expanded: Partial<Record<CoverageGap, boolean>> = {};
  // Gaps explain what readers can and cannot find on the site, not how its data was built.
  const GAPS: Record<CoverageGap, { title: string; text: string }> = {
    itemWithoutSource: {
      title: 'Items without a known source',
      text: 'We do not know how players can get these items. Their pages do not list a creature, merchant, quest, recipe, or other source.',
    },
    itemAdventurerOnly: {
      title: 'Items only adventurers can get',
      text: 'Adventurers can take these items as gear, but no known player source gives them.',
    },
    npcWithoutLocation: {
      title: 'NPCs without a map location',
      text: 'These NPCs have no known map location yet.',
    },
    npcWithoutLevel: {
      title: 'NPCs without a level',
      text: 'These NPCs have a map location but no known fixed level. Adventurers and companions match their player’s level.',
    },
    placeWithoutMap: {
      title: 'Places without a map',
      text: 'These places have no map here yet, so their NPCs and objects cannot appear as map markers.',
    },
    unresolvedReference: {
      title: 'Pages with an unknown reference',
      text: 'Some names on these pages cannot be linked to another page yet.',
    },
    recipeWithoutTeacher: {
      title: 'Recipes without a known teaching item',
      text: 'These recipes are not learned by default, and we do not know which item teaches them. Other game actions may still teach them.',
    },
    recipeWithoutProduct: {
      title: 'Recipes without a product',
      text: 'These recipes do not make a known item, but you can still find them on their skill pages.',
    },
  };

  $: coverage = data.coverage;
  $: kinds = new Map(data.registry.map((entry) => [entry.kind, entry]));
  $: crumbs = [{ label: 'Compendium', href: `${base}/` }, { label: 'Coverage' }];
  // Each entry is one short count, in alphabetical order of what it counts, so the grid reads as one list.
  $: published = [
    ...coverage.pages.flatMap((page) => {
      const kind = kinds.get(page.kind);
      return kind ? [{ noun: page.count === 1 ? readerNoun(kind.label) : readerNoun(kind.plural), count: page.count, href: `${base}/${kind.route}/` }] : [];
    }),
    { noun: coverage.placementCount === 1 ? 'map location' : 'map locations', count: coverage.placementCount, href: `${base}/map/` },
    { noun: coverage.mapCount === 1 ? 'map' : 'maps', count: coverage.mapCount, href: `${base}/map/` },
  ].sort((left, right) => left.noun.localeCompare(right.noun, 'en')).map((entry) => ({ label: `${formatNumber(entry.count)} ${entry.noun}`, href: entry.href }));
</script>

<SeoHead title="Data Coverage · Afallon Compendium" description="See what the Afallon Compendium publishes for this game release, including known gaps in items, NPCs, places, and recipes." />

<PageShell registry={data.registry} {crumbs} release={data.release}>
  <EntityHeader name="Data coverage" />
  <p class="intro">Explore what the compendium covers, and where an item, character, or place is still missing information.</p>

  <div class="c-stack">
    <Card title="Published">
      <ul class="published">
        {#each published as entry (entry.label)}<li><a class="c-link" href={entry.href}>{entry.label}</a></li>{/each}
      </ul>
    </Card>

    {#each coverage.gaps as gap}
      <Card title={GAPS[gap.gap].title} count={gap.pages.length}>
        <p class="text">{GAPS[gap.gap].text}</p>
        {#if gap.pages.length}
          <ul class="pages">{#each expanded[gap.gap] ? gap.pages : gap.pages.slice(0, INITIAL_ROWS) as page}<li><EntityLink ref={page} registry={data.registry} /></li>{/each}</ul>
          {#if !expanded[gap.gap] && gap.pages.length > INITIAL_ROWS}
            <button class="show-more" type="button" on:click={() => expanded = { ...expanded, [gap.gap]: true }}>Show {formatNumber(gap.pages.length - INITIAL_ROWS)} more</button>
          {/if}
        {/if}
      </Card>
    {/each}
  </div>
</PageShell>

<style>
  .intro { margin: 0 0 1.4rem; color: var(--c-text-dim); font-size: var(--c-text-body); line-height: 1.55; }
  .published { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 12rem), 1fr)); gap: .45rem 1rem; margin: 0; padding: 0; list-style: none; font-size: var(--c-text-body); }
  .text { margin: 0 0 .9rem; color: var(--c-text-dim); font-size: var(--c-text-body); line-height: 1.55; }
  .pages { columns: 16rem; column-gap: 1.5rem; margin: 0; padding: 0; list-style: none; font-size: var(--c-text-body); }
  .pages li { break-inside: avoid; padding: .15rem 0; min-height: 1.5rem; }
  .published a { display: inline-flex; align-items: center; min-height: 1.5rem; }
  .show-more { display: block; margin-top: .8rem; padding: .5rem .75rem; border: 1px solid var(--c-line); border-radius: var(--c-radius-sm); background: var(--c-surface-2); color: var(--c-accent); cursor: pointer; font: inherit; font-size: var(--c-text-small); }
  .show-more:hover { border-color: var(--c-frame-hover); color: var(--c-accent-strong); }
</style>
