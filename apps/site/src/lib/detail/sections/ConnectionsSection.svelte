<script lang="ts">
  import type { ConnectionRow, PublicKindEntry } from '@afallon/contracts/public';
  import EntityLink from '../../EntityLink.svelte';
  import LocationLinks from '../../LocationLinks.svelte';
  import MissingValue from '../../MissingValue.svelte';
  import { nameOf } from '../../format';
  import { placeConnectionRows, type PlaceConnectionRow } from '../place-rows';
  import { planColumns, type RelationColumn } from '../relation-table';
  import RelationTable from '../RelationTable.svelte';
  import Section from '../Section.svelte';

  export let connections: ConnectionRow[];
  export let registry: PublicKindEntry[];

  const columns: RelationColumn<PlaceConnectionRow>[] = [
    { id: 'name', label: 'Place', value: (row) => nameOf(row.counterpart), sort: (row) => nameOf(row.counterpart) },
    { id: 'way', label: 'Way of travel', value: (row) => row.way, sort: (row) => row.way },
    { id: 'spots', label: 'Map spots', value: (row) => row.placements.length },
  ];

  $: rows = placeConnectionRows(connections);
  $: plan = planColumns(columns, rows);
</script>

{#if rows.length}
  <Section id="connections" title="Connections" icon="route" count={rows.length}>
    <RelationTable columns={plan.columns} {rows} label="Connections" sort={{ id: 'name', dir: 'asc' }}>
      <svelte:fragment slot="cell" let:row let:column>
        {#if column === 'name'}<EntityLink ref={row.counterpart} {registry} />
        {:else if column === 'way'}{row.way}
        {:else if column === 'spots'}
          {#if row.placements.length}<LocationLinks placements={row.placements} />
          {:else}<MissingValue explanation="No spot is published" />{/if}
        {/if}
      </svelte:fragment>
    </RelationTable>
  </Section>
{/if}
