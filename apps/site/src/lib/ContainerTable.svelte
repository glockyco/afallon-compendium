<script lang="ts">
  import { base } from '$app/paths';
  import type { ContainerRow, PublicKindEntry } from '@afallon/contracts/public';
  import Card from './Card.svelte';
  import DataTable, { type TableColumn } from './DataTable.svelte';
  import EntityLink from './EntityLink.svelte';
  import MissingValue from './MissingValue.svelte';
  import Requirements from './Requirements.svelte';
  import { formatNumber, rangeText } from './format';
  import { sortRows, toggleSort, type SortState, type SortValue } from './table';

  export let rows: ContainerRow[];
  export let registry: PublicKindEntry[];
  export let heading = 'In containers';
  export let itemKey: string;
  export let limit: number | undefined = undefined;

  let sort: SortState = { id: 'chance', dir: 'desc' };

  $: hasRequirements = rows.some((row) => row.requirements.length > 0);
  // With no placement anywhere in the table there is nothing to compare a dash against, so the
  // column leaves; a dash marks the gap only where a sibling row does publish its locations.
  $: hasLocations = rows.some((row) => row.placementCount > 0);
  // A grouped row names its container type in `label` and the place it stands in as its
  // counterpart, so the two read as separate columns instead of one replacing the other.
  $: hasPlaces = rows.some((row) => row.counterpart !== undefined);
  $: columns = [
    { id: 'name', label: 'Container', sortable: true },
    ...(hasPlaces ? [{ id: 'place', label: 'Place', sortable: true }] : []),
    { id: 'quantity', label: 'Quantity', numeric: true, sortable: true },
    { id: 'chance', label: 'Chance', numeric: true, sortable: true },
    ...(hasRequirements ? [{ id: 'requirements', label: 'Requirements' }] : []),
    ...(hasLocations ? [{ id: 'locations', label: 'Locations', numeric: true }] : []),
  ] satisfies TableColumn[];
  $: visible = sortRows(rows, value, sort).slice(0, limit ?? rows.length);

  function value(row: ContainerRow, id: string): SortValue {
    if (id === 'quantity') return row.max ?? row.min;
    if (id === 'chance') return row.chance;
    if (id === 'locations') return row.placementCount;
    if (id === 'place') return row.counterpart === undefined ? undefined : row.counterpart.key === null ? row.counterpart.label : row.counterpart.name;
    return row.label;
  }
</script>

{#if rows.length > 0}
  <Card title={heading} count={rows.length}>
    <DataTable {columns} {sort} onSort={(id, numeric) => (sort = toggleSort(sort, id, numeric))}>
      {#each visible as row}
        <tr>
          <td>{row.label}</td>
          {#if hasPlaces}<td>{#if row.counterpart}<EntityLink ref={row.counterpart} {registry} />{/if}</td>{/if}
          <td class="c-num">{#if rangeText(row.min, row.max) === null}<MissingValue explanation="No quantity is published" />{:else}{rangeText(row.min, row.max)}{/if}</td>
          <td class="c-num">{#if row.chance === undefined}<MissingValue explanation="Not measured for this build" />{:else}{formatNumber(row.chance)}%{/if}</td>
          {#if hasRequirements}<td><Requirements requirements={row.requirements} {registry} /></td>{/if}
          {#if hasLocations}<td class="c-num">{#if row.placementCount > 0}<a class="c-link" href={`${base}/?item=${encodeURIComponent(itemKey)}`}>{row.placementCount} {row.placementCount === 1 ? 'location' : 'locations'}</a>{:else}<MissingValue explanation="No location is published" />{/if}</td>{/if}
        </tr>
      {/each}
    </DataTable>
  </Card>
{/if}
