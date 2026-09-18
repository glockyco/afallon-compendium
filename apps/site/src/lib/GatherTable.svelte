<script lang="ts">
  import { base } from '$app/paths';
  import type { GatherRow, PublicKindEntry } from '@afallon/contracts/public';
  import Card from './Card.svelte';
  import DataTable, { type TableColumn } from './DataTable.svelte';
  import EntityLink from './EntityLink.svelte';
  import MissingValue from './MissingValue.svelte';
  import { formatNumber, rangeText } from './format';
  import { sortRows, toggleSort, type SortState, type SortValue } from './table';

  export let rows: GatherRow[];
  export let registry: PublicKindEntry[];
  export let heading = 'Gathered from';
  export let itemKey: string;
  export let limit: number | undefined = undefined;

  let sort: SortState = { id: 'chance', dir: 'desc' };

  $: hasLocations = rows.some((row) => row.placementCount > 0);
  $: columns = [
    { id: 'name', label: 'Resource', sortable: true },
    { id: 'skill', label: 'Skill', sortable: true },
    { id: 'rank', label: 'Rank', numeric: true, sortable: true },
    { id: 'quantity', label: 'Quantity', numeric: true, sortable: true },
    { id: 'chance', label: 'Chance', numeric: true, sortable: true },
    ...(hasLocations ? [{ id: 'locations', label: 'Locations', numeric: true }] : []),
  ] satisfies TableColumn[];
  $: visible = sortRows(rows, value, sort).slice(0, limit ?? rows.length);

  function value(row: GatherRow, id: string): SortValue {
    if (id === 'skill') return row.skill?.key === null ? row.skill.label : row.skill?.name;
    if (id === 'rank') return row.rank;
    if (id === 'quantity') return row.max ?? row.min;
    if (id === 'chance') return row.chance;
    if (id === 'locations') return row.placementCount;
    return row.counterpart && row.counterpart.key !== null ? row.counterpart.name : row.label;
  }
</script>

{#if rows.length > 0}
  <Card title={heading} count={rows.length}>
    <DataTable {columns} {sort} onSort={(id, numeric) => (sort = toggleSort(sort, id, numeric))}>
      {#each visible as row}
        <tr>
          <td>{#if row.counterpart}<EntityLink ref={row.counterpart} {registry} />{:else}{row.label}{/if}</td>
          <td>{#if row.skill}<EntityLink ref={row.skill} {registry} />{:else}<MissingValue explanation="No gathering skill is published" />{/if}</td>
          <td class="c-num">{#if row.rank === undefined}<MissingValue explanation="No rank is published" />{:else}{row.rank}{/if}</td>
          <td class="c-num">{#if rangeText(row.min, row.max) === null}<MissingValue explanation="No quantity is published" />{:else}{rangeText(row.min, row.max)}{/if}</td>
          <td class="c-num">{#if row.chance === undefined}<MissingValue explanation="Not measured for this build" />{:else}{formatNumber(row.chance)}%{/if}</td>
          {#if hasLocations}<td class="c-num">{#if row.placementCount > 0}<a class="c-link" href={`${base}/?item=${encodeURIComponent(itemKey)}`}>{row.placementCount} {row.placementCount === 1 ? 'location' : 'locations'}</a>{:else}<MissingValue explanation="No location is published" />{/if}</td>{/if}
        </tr>
      {/each}
    </DataTable>
  </Card>
{/if}
