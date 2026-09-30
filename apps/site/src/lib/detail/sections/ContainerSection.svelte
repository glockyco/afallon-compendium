<script lang="ts">
  import type { AvailabilityRule, ContainerRow, PublicKindEntry } from '@afallon/contracts/public';
  import Availability from '../../Availability.svelte';
  import EntityLink from '../../EntityLink.svelte';
  import { formatNumber, rangeText } from '../../format';
  import { itemSourceOnMap } from '../../map-links';
  import Section from '../Section.svelte';

  export let id: string;
  export let title: string;
  export let rows: ContainerRow[];
  export let sourceAvailabilities: AvailabilityRule[][];
  export let itemKey: string;
  export let registry: PublicKindEntry[];
  let expanded = false;
  $: ordered = [...rows].sort((a, b) => (b.chance ?? -1) - (a.chance ?? -1));
  $: rowIndices = new Map(rows.map((row, index) => [row, index]));
</script>

{#if rows.length}
  <Section {id} {title} count={rows.length}>
    <div class="source-list">
      {#each ordered as row, index}
        {#if expanded || index < 8}
          <div class="source-row">
            <div class="source-main"><strong>{row.label}</strong><div class="source-sub">
              {#if row.counterpart}<EntityLink ref={row.counterpart} {registry} />{:else if row.places[0]}{row.places[0].label}{/if}
              {#if sourceAvailabilities[row.availabilityIndex]?.length}<Availability rules={sourceAvailabilities[row.availabilityIndex] ?? []} {registry} />{/if}
            </div></div>
            <div class="source-values">{#if row.min !== undefined}<span>×{rangeText(row.min, row.max)}</span>{/if}{#if row.chance !== undefined}<span>{formatNumber(row.chance)}%</span>{/if}</div>
            {#if row.placementCount > 0}<a class="c-link spots" href={itemSourceOnMap(itemKey, id === 'collected-from' ? 'collectedFrom' : 'inContainers', rowIndices.get(row) ?? 0)}>{formatNumber(row.placementCount)} {row.placementCount === 1 ? 'spot' : 'spots'}</a>{/if}
          </div>
        {/if}
      {/each}
      {#if !expanded && rows.length > 8}<button type="button" class="c-action show-more" on:click={() => (expanded = true)}>Show {rows.length - 8} more</button>{/if}
    </div>
  </Section>
{/if}

<style>
  .source-list { border: 1px solid var(--c-line-soft); border-radius: var(--c-radius); background: var(--c-surface-1); overflow: hidden; }
  .source-row { display: grid; grid-template-columns: minmax(0, 1fr) auto auto; align-items: center; gap: .5rem 1rem; min-width: 0; padding: .65rem .8rem; border-top: 1px solid var(--c-line-soft); }
  .source-row:first-child { border-top: 0; }
  .source-main { min-width: 0; }
  strong { color: var(--c-text-strong); font-weight: 600; overflow-wrap: anywhere; }
  .source-sub { display: flex; flex-wrap: wrap; gap: .25rem .6rem; margin-top: .2rem; color: var(--c-text-dim); font-size: var(--c-text-small); }
  .source-sub :global(.availability li) { font-size: var(--c-text-small); }
  .source-values { display: flex; gap: .7rem; white-space: nowrap; font-variant-numeric: tabular-nums; }
  .spots { min-height: 1.5rem; white-space: nowrap; font-variant-numeric: tabular-nums; }
  .show-more { margin: .5rem .8rem; }
  @media (max-width: 640px) { .source-row { grid-template-columns: minmax(0, 1fr) auto; } .spots { grid-column: 2; } .source-values { grid-column: 2; grid-row: 1; justify-content: flex-end; } }
</style>
