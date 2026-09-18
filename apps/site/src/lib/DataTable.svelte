<script lang="ts" context="module">
  export type TableColumn = { id: string; label: string; numeric?: boolean; sortable?: boolean };
</script>

<script lang="ts">
  import type { SortState } from './table';

  export let columns: TableColumn[];
  export let sort: SortState | undefined = undefined;
  export let onSort: ((id: string, numeric: boolean) => void) | undefined = undefined;
  export let sticky = false;
  export let label: string | undefined = undefined;
  /** A sticky header needs the wide layout to scroll with the page, not inside the wrapper. */
  export let flowWide = false;
</script>

<div class="c-table-scroll" class:c-table-scroll--flow-wide={flowWide}>
  <table class="c-table" class:c-table--sticky={sticky} aria-label={label}>
    <thead>
      <tr>
        {#each columns as column}
          {@const active = Boolean(column.sortable) && sort?.id === column.id}
          <th scope="col" class:c-num={column.numeric} aria-sort={active ? (sort?.dir === 'asc' ? 'ascending' : 'descending') : 'none'}>
            {#if column.sortable && onSort}
              <button type="button" class="c-sort" on:click={() => onSort?.(column.id, column.numeric === true)}>
                {column.label}<span class="c-sort-mark" aria-hidden="true">{active ? (sort?.dir === 'asc' ? '▲' : '▼') : '↕'}</span>
              </button>
            {:else}{column.label}{/if}
          </th>
        {/each}
      </tr>
    </thead>
    <tbody><slot /></tbody>
  </table>
</div>
