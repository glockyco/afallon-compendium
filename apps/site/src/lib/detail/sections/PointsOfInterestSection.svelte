<script lang="ts">
  import type { PlacementGroup } from '@afallon/contracts/public';
  import { roleLabel } from '../../format';
  import { placeOnMap } from '../../map-links';
  import { planColumns, type RelationColumn } from '../relation-table';
  import RelationTable from '../RelationTable.svelte';
  import Section from '../Section.svelte';

  export let id = 'points-of-interest';
  export let title = 'Points of interest';
  export let rows: PlacementGroup[];
  export let placeKey: string;
  export let hasSpace: boolean;

  const columns: RelationColumn<PlacementGroup>[] = [
    { id: 'name', label: 'Category', value: (row) => roleLabel(row.category), sort: (row) => roleLabel(row.category) },
    { id: 'spots', label: 'Map spots', numeric: true, value: (row) => row.placementCount, sort: (row) => row.placementCount },
  ];
  $: plan = planColumns(columns, rows);
</script>

{#if rows.length}
  <Section {id} {title} count={rows.length}>
    <RelationTable columns={plan.columns} {rows} label={title}>
      <svelte:fragment slot="cell" let:row let:column>
        {#if column === 'name'}{roleLabel(row.category)}
        {:else if column === 'spots'}{#if hasSpace}<a class="c-link" href={placeOnMap(placeKey, row.category)}>{row.placementCount} {row.placementCount === 1 ? 'spot' : 'spots'}</a>{:else}{row.placementCount}{/if}{/if}
      </svelte:fragment>
    </RelationTable>
  </Section>
{/if}
