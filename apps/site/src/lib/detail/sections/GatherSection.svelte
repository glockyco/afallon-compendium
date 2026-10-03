<script lang="ts">
  import type { GatherRow, PublicKindEntry } from '@afallon/contracts/public';
  import Availability from '../../Availability.svelte';
  import EntityLink from '../../EntityLink.svelte';
  import Requirements from '../../Requirements.svelte';
  import { formatNumber, nameOf, rangeText } from '../../format';
  import { itemSourceOnMap } from '../../map-links';
  import { planColumns, type RelationColumn } from '../relation-table';
  import RelationTable from '../RelationTable.svelte';
  import Section from '../Section.svelte';

  export let rows: GatherRow[];
  export let itemKey: string;
  export let registry: PublicKindEntry[];

  const columns: RelationColumn<GatherRow>[] = [
    { id: 'source', label: 'Node', value: (row) => row.counterpart ? nameOf(row.counterpart) : row.label, sort: (row) => row.counterpart ? nameOf(row.counterpart) : row.label },
    { id: 'quantity', label: 'Quantity', numeric: true, value: (row) => row.min, sort: (row) => row.min },
    { id: 'chance', label: 'Chance per Use', numeric: true, value: (row) => row.chance, sort: (row) => row.chance },
    { id: 'spots', label: 'Spots', numeric: true, value: (row) => row.placementCount || undefined, sort: (row) => row.placementCount },
  ];
  // The map link names a row by its published position, which sorting does not change.
  $: rowIndices = new Map(rows.map((row, index) => [row, index]));
  $: plan = planColumns(columns, rows);
  $: title = rows[0]?.skill && nameOf(rows[0].skill).toLowerCase() === 'mining' ? 'Mined from' : 'Gathered from';
</script>

{#if rows.length}
  <Section id="gathered-from" {title} count={rows.length}>
    <RelationTable columns={plan.columns} {rows} label={title} sort={{ id: 'chance', dir: 'desc' }}>
      <svelte:fragment slot="cell" let:row let:column>
        {#if column === 'source'}
          {#if row.counterpart}<EntityLink ref={row.counterpart} {registry} />{:else}{row.label}{/if}
          {#if row.skill || row.requirements.length || row.availability.length}
            <div class="source-sub">
              {#if row.skill}<EntityLink ref={row.skill} {registry} />{#if row.rank !== undefined}{' '}{formatNumber(row.rank)}{/if}{/if}
              {#if row.requirements.length}<Requirements requirements={row.requirements} {registry} />{/if}
              {#if row.availability.length}<Availability rules={row.availability} {registry} />{/if}
            </div>
          {/if}
        {:else if column === 'quantity'}{#if row.min !== undefined}{rangeText(row.min, row.max)}{/if}
        {:else if column === 'chance'}{#if row.chance !== undefined}{formatNumber(row.chance)}%{/if}
        {:else if column === 'spots'}{#if row.placementCount > 0}<a class="c-link" href={itemSourceOnMap(itemKey, 'gatheredFrom', rowIndices.get(row) ?? 0)} aria-label="Show {formatNumber(row.placementCount)} {row.placementCount === 1 ? 'spot' : 'spots'} on the map">{formatNumber(row.placementCount)}</a>{/if}
        {/if}
      </svelte:fragment>
    </RelationTable>
  </Section>
{/if}

<style>
  .source-sub { display: flex; flex-wrap: wrap; align-items: baseline; gap: .25rem .6rem; margin-top: .2rem; color: var(--c-text-dim); font-size: var(--c-text-small); font-weight: 400; }
  .source-sub :global(.availability li), .source-sub :global(.requirements) { font-size: var(--c-text-small); }
  .source-sub :global(img), .source-sub :global(.kind-icon) { width: 1.25rem; height: 1.25rem; }
</style>
