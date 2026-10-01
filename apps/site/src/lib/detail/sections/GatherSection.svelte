<script lang="ts">
  import type { GatherRow, PublicKindEntry } from '@afallon/contracts/public';
  import Availability from '../../Availability.svelte';
  import EntityLink from '../../EntityLink.svelte';
  import Requirements from '../../Requirements.svelte';
  import { formatNumber, nameOf, rangeText } from '../../format';
  import { itemSourceOnMap } from '../../map-links';
  import { shownRowCount } from '../relation-table';
  import Section from '../Section.svelte';

  export let rows: GatherRow[];
  export let itemKey: string;
  export let registry: PublicKindEntry[];
  let expanded = false;
  $: ordered = [...rows].sort((a, b) => (b.chance ?? -1) - (a.chance ?? -1));
  $: rowIndices = new Map(rows.map((row, index) => [row, index]));
  $: shown = shownRowCount(rows.length, expanded);
  $: title = rows[0]?.skill && nameOf(rows[0].skill).toLowerCase() === 'mining' ? 'Mined from' : 'Gathered from';
</script>

{#if rows.length}
  <Section id="gathered-from" {title} count={rows.length}>
    <div class="source-list">
      {#each ordered as row, index}
        {#if index < shown}
          <div class="source-row">
            <div class="source-main">
              {#if row.counterpart}<EntityLink ref={row.counterpart} {registry} />{:else}<strong>{row.label}</strong>{/if}
              <div class="source-sub">
                {#if row.skill}<EntityLink ref={row.skill} {registry} />{#if row.rank !== undefined}{' '}{formatNumber(row.rank)}{/if}{/if}
                {#if row.requirements.length}<Requirements requirements={row.requirements} {registry} />{/if}
                {#if row.availability.length}<Availability rules={row.availability} {registry} />{/if}
              </div>
            </div>
            <span class="quantity">{#if row.min !== undefined}×{rangeText(row.min, row.max)}{/if}</span>
            <span class="chance">{#if row.chance !== undefined}{formatNumber(row.chance)}%{/if}</span>
            {#if row.placementCount > 0}<a class="c-link spots" href={itemSourceOnMap(itemKey, 'gatheredFrom', rowIndices.get(row) ?? 0)}>{formatNumber(row.placementCount)} {row.placementCount === 1 ? 'spot' : 'spots'}</a>{/if}
          </div>
        {/if}
      {/each}
      {#if shown < rows.length}<button type="button" class="c-action show-more" on:click={() => (expanded = true)}>Show {rows.length - shown} more</button>{/if}
    </div>
  </Section>
{/if}

<style>
  .source-list { border: 1px solid var(--c-line-soft); border-radius: var(--c-radius); background: var(--c-surface-1); overflow: hidden; }
  .source-row { display: grid; grid-template-columns: minmax(0, 1fr) auto auto auto; align-items: center; gap: .5rem .9rem; padding: .65rem .8rem; border-top: 1px solid var(--c-line-soft); }
  .source-row:first-child { border-top: 0; }
  .source-main { min-width: 0; }
  strong { color: var(--c-text-strong); }
  .source-sub { display: flex; flex-wrap: wrap; align-items: baseline; gap: .25rem .6rem; margin-top: .2rem; color: var(--c-text-dim); font-size: var(--c-text-small); }
  .source-sub :global(.availability li), .source-sub :global(.requirements) { font-size: var(--c-text-small); }
  .quantity, .chance, .spots { white-space: nowrap; font-variant-numeric: tabular-nums; }
  .spots { min-height: 1.5rem; }
  .show-more { margin: .5rem .8rem; }
  @media (max-width: 640px) { .source-row { grid-template-columns: minmax(0, 1fr) auto auto; } .source-main { grid-column: 1 / -1; } .quantity { grid-column: 1; } .spots { grid-column: 3; } }
</style>
