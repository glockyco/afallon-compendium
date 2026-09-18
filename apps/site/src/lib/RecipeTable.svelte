<script lang="ts">
  import type { PublicKindEntry, RecipeRow } from '@afallon/contracts/public';
  import Card from './Card.svelte';
  import DataTable, { type TableColumn } from './DataTable.svelte';
  import EntityLink from './EntityLink.svelte';

  export let rows: RecipeRow[];
  export let registry: PublicKindEntry[];
  export let heading = 'Recipes';
  export let counterpartLabel = 'Entity';
  export let limit: number | undefined = undefined;

  $: columns = [
    { id: 'name', label: counterpartLabel },
    { id: 'count', label: 'Quantity', numeric: true },
  ] satisfies TableColumn[];
  $: visible = limit === undefined ? rows : rows.slice(0, limit);
</script>

{#if rows.length > 0}
  <Card title={heading} count={rows.length}>
    <DataTable {columns}>
      {#each visible as row}
        <tr><td><EntityLink ref={row.counterpart} {registry} /></td><td class="c-num">{row.count}</td></tr>
      {/each}
    </DataTable>
  </Card>
{/if}
