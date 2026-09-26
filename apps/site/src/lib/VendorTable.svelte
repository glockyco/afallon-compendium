<script lang="ts">
  import type { PublicKindEntry, VendorRow } from '@afallon/contracts/public';
  import Card from './Card.svelte';
  import DataTable, { type TableColumn } from './DataTable.svelte';
  import EntityLink from './EntityLink.svelte';
  import Price from './Price.svelte';
  import Requirements from './Requirements.svelte';
  import { sortRows, toggleSort, type SortState, type SortValue } from './table';

  export let rows: VendorRow[];
  export let registry: PublicKindEntry[];
  export let heading = 'Vendor stock';
  export let counterpartLabel = 'Entity';
  export let limit: number | undefined = undefined;

  let sort: SortState = { id: 'name', dir: 'asc' };

  $: columns = [
    { id: 'name', label: counterpartLabel, sortable: true },
    { id: 'price', label: 'Price', numeric: true, sortable: true },
    { id: 'unlock', label: 'Unlock requirement' },
  ] satisfies TableColumn[];
  $: visible = compactRows(sortRows(rows, value, sort), limit);

  function value(row: VendorRow, id: string): SortValue {
    if (id === 'price') return row.price.amount;
    return row.counterpart.key === null ? row.counterpart.label : row.counterpart.name;
  }

  // A shortened list keeps one conditional row, because an unlock requirement is the fact a reader
  // most needs from a merchant and the first rows rarely carry one.
  function compactRows(allRows: VendorRow[], maximum: number | undefined): VendorRow[] {
    if (maximum === undefined) return allRows;
    const compact = allRows.slice(0, maximum);
    if (compact.some((row) => row.requirements.length > 0)) return compact;
    const conditional = allRows.find((row) => row.requirements.length > 0);
    if (conditional && compact.length === maximum) compact[compact.length - 1] = conditional;
    return compact;
  }
</script>

{#if rows.length > 0}
  <Card title={heading} count={rows.length}>
    <DataTable {columns} {sort} onSort={(id, numeric) => (sort = toggleSort(sort, id, numeric))}>
      {#each visible as row}
        <tr>
          <td><EntityLink ref={row.counterpart} {registry} /></td>
          <td class="c-num"><Price price={row.price} /></td>
          <td><Requirements requirements={row.requirements} {registry} emptyExplanation="Unlock requirement unknown" /></td>
        </tr>
      {/each}
    </DataTable>
  </Card>
{/if}
