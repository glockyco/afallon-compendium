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

  // Teleports out of the place come first, then teleports into it, then teleports inside it. In each direction, an
  // unknown place follows the named places.
  const ORDER: Record<PlaceConnectionRow['direction'], number> = { to: 0, from: 1, within: 2 };
  const placeText = (row: PlaceConnectionRow) => row.counterpart.key === null ? 'an unknown place' : nameOf(row.counterpart);
  const teleportText = (row: PlaceConnectionRow) => row.direction === 'within' ? 'Within this place' : `${row.direction === 'to' ? 'To' : 'From'} ${placeText(row)}`;

  const columns: RelationColumn<PlaceConnectionRow>[] = [
    { id: 'teleport', label: 'Teleport', value: teleportText, sort: (row) => `${ORDER[row.direction]} ${row.counterpart.key === null ? 1 : 0} ${placeText(row)}` },
    { id: 'start', label: 'Starts at', value: (row) => row.placements.length, sort: (row) => row.placements.length },
  ];

  $: rows = placeConnectionRows(connections);
  $: plan = planColumns(columns, rows);
</script>

{#if rows.length}
  <Section id="connections" title="Connections" icon="route" count={rows.length}>
    <RelationTable columns={plan.columns} {rows} label="Connections" sort={{ id: 'teleport', dir: 'asc' }}>
      <svelte:fragment slot="cell" let:row let:column>
        {#if column === 'teleport'}
          {#if row.direction === 'within' || row.counterpart.key === null}{teleportText(row)}
          {:else}{row.direction === 'to' ? 'To' : 'From'} <EntityLink ref={row.counterpart} {registry} />{/if}
        {:else if column === 'start'}
          {#if row.placements.length}<LocationLinks placements={row.placements} />
          {:else}<MissingValue explanation="The map shows no spot where this teleport starts" />{/if}
        {/if}
      </svelte:fragment>
    </RelationTable>
  </Section>
{/if}
