<script lang="ts">
  import type { DropRow, PublicKindEntry } from '@afallon/contracts/public';
  import Card from './Card.svelte';
  import DataTable, { type TableColumn } from './DataTable.svelte';
  import EntityLink from './EntityLink.svelte';
  import MissingValue from './MissingValue.svelte';
  import Requirements from './Requirements.svelte';
  import { formatNumber, rangeText } from './format';
  import { sortRows, toggleSort, type SortState, type SortValue } from './table';

  export let rows: DropRow[];
  export let registry: PublicKindEntry[];
  export let heading = 'Drops';
  export let counterpartLabel = 'Entity';
  export let limit: number | undefined = undefined;

  let sort: SortState = { id: 'chance', dir: 'desc' };

  $: hasLevels = rows.some((row) => row.levelBand);
  $: hasRequirements = rows.some((row) => row.requirements.length > 0);
  $: columns = [
    { id: 'name', label: counterpartLabel, sortable: true },
    { id: 'quantity', label: 'Quantity', numeric: true, sortable: true },
    { id: 'chance', label: 'Chance', numeric: true, sortable: true },
    ...(hasLevels ? [{ id: 'level', label: 'Level', numeric: true, sortable: true }] : []),
    ...(hasRequirements ? [{ id: 'requirements', label: 'Requirements' }] : []),
  ] satisfies TableColumn[];
  $: visible = sortRows(rows, value, sort).slice(0, limit ?? rows.length);

  function value(row: DropRow, id: string): SortValue {
    if (id === 'quantity') return row.max ?? row.min;
    if (id === 'chance') return row.chance;
    if (id === 'level') return row.levelBand?.min;
    return row.counterpart.key === null ? row.counterpart.label : row.counterpart.name;
  }
</script>

{#if rows.length > 0}
  <Card title={heading} count={rows.length}>
    <DataTable {columns} {sort} onSort={(id, numeric) => (sort = toggleSort(sort, id, numeric))}>
      {#each visible as row}
        <tr>
          <td><EntityLink ref={row.counterpart} {registry} /></td>
          <td class="c-num">{#if rangeText(row.min, row.max) === null}<MissingValue explanation="No quantity is published" />{:else}{rangeText(row.min, row.max)}{/if}</td>
          <td class="c-num">{#if row.chance === undefined}<MissingValue explanation="Not measured for this build" />{:else}{formatNumber(row.chance)}%{/if}</td>
          {#if hasLevels}<td class="c-num">{#if row.levelBand}{row.levelBand.min}–{row.levelBand.max}{:else}<MissingValue explanation="No level range is published" />{/if}</td>{/if}
          {#if hasRequirements}<td><Requirements requirements={row.requirements} {registry} /></td>{/if}
        </tr>
      {/each}
    </DataTable>
  </Card>
{/if}
