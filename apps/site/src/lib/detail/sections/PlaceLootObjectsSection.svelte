<script lang="ts">
  import type { PlaceLootObject, PublicKindEntry } from '@afallon/contracts/public';
  import Availability from '../../Availability.svelte';
  import EntityLink from '../../EntityLink.svelte';
  import { formatNumber } from '../../format';
  import { spotOnMap } from '../../map-links';
  import { shownRowCount } from '../relation-table';
  import Section from '../Section.svelte';

  /** The objects of a place that give items, with what using them takes and the items they can give. */
  export let rows: PlaceLootObject[];
  export let registry: PublicKindEntry[];
  let expanded = false;
  $: shown = shownRowCount(rows.length, expanded);
  // A row names its first items and shows the rest on request. The item pages list the chances.
  const ITEMS_SHOWN = 6;
  let open = new Set<number>();
  const reveal = (index: number) => { open = new Set([...open, index]); };
</script>

{#if rows.length}
  <Section id="loot-objects" title="Objects with loot" count={rows.length}>
    <div class="source-list">
      {#each rows.slice(0, shown) as row, rowIndex}
        <div class="source-row">
          <div class="source-main">
            <strong>{row.label}{#if row.choiceLabel}: {row.choiceLabel}{/if}</strong>
            {#if row.cost || row.availability.length}<div class="source-sub">
              {#if row.cost}<span>Pay {formatNumber(row.cost.amount)} <EntityLink ref={row.cost.currency} {registry} /></span>{/if}
              {#if row.availability.length}<Availability rules={row.availability} {registry} />{/if}
            </div>{/if}
            <p class="items">Can give {#each open.has(rowIndex) ? row.items : row.items.slice(0, ITEMS_SHOWN) as item, index}{index ? ', ' : ''}<EntityLink ref={item} {registry} />{/each}{#if !open.has(rowIndex) && row.items.length > ITEMS_SHOWN}{', '}<button type="button" class="c-action more" on:click={() => reveal(rowIndex)}>Show {formatNumber(row.items.length - ITEMS_SHOWN)} more</button>{/if}</p>
          </div>
          {#if row.placements.length === 1}<a class="c-link spots" href={spotOnMap(row.placements[0]!.placementId)}>1 spot</a>
          {:else if row.placements.length}<span class="spots">{formatNumber(row.placements.length)} spots</span>{/if}
        </div>
      {/each}
      {#if shown < rows.length}<button type="button" class="c-action show-more" on:click={() => (expanded = true)}>Show {rows.length - shown} more</button>{/if}
    </div>
  </Section>
{/if}

<style>
  .source-list { border: 1px solid var(--c-line-soft); border-radius: var(--c-radius); background: var(--c-surface-1); overflow: hidden; }
  .source-row { display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: start; gap: .5rem 1rem; min-width: 0; padding: .65rem .8rem; border-top: 1px solid var(--c-line-soft); }
  .source-row:first-child { border-top: 0; }
  .source-main { display: grid; gap: .2rem; min-width: 0; }
  strong { color: var(--c-text-strong); font-weight: 600; overflow-wrap: anywhere; }
  .source-sub { display: flex; flex-wrap: wrap; gap: .25rem .6rem; color: var(--c-text-dim); font-size: var(--c-text-small); }
  .source-sub :global(.availability li) { font-size: var(--c-text-small); }
  .items { margin: 0; line-height: 1.5; overflow-wrap: anywhere; }
  .spots { min-height: 1.5rem; white-space: nowrap; font-variant-numeric: tabular-nums; color: var(--c-text-dim); }
  .show-more { margin: .5rem .8rem; }
  .more { margin-left: .2rem; }
</style>
