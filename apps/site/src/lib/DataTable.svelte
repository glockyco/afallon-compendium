<script lang="ts" context="module">
  export type TableColumn = { id: string; label: string; numeric?: boolean; sortable?: boolean; hint?: string };
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
  /** Pixel widths of the columns. With widths the table lays out by them instead of by its content. */
  export let widths: number[] | undefined = undefined;
  $: fixed = widths !== undefined && widths.length === columns.length;
  // A table that fits its card takes the card's width and gives each column its share of the computed widths, so a
  // width measured a moment too early, before a scrollbar or a font change, can never push it past the card. A table
  // wider than its card keeps pixel widths and scrolls inside it.
  $: total = fixed ? widths!.reduce((sum, width) => sum + width, 0) : 0;
  $: proportional = fixed && flowWide && total > 0;
  $: columnWidth = (width: number) => proportional ? `${(width / total) * 100}%` : `${width}px`;
</script>

<div class="c-table-scroll" class:c-table-scroll--flow-wide={flowWide}>
  <table class="c-table" class:c-table--sticky={sticky} class:c-table--fixed={fixed} style={fixed ? `width: ${proportional ? '100%' : `${total}px`}` : undefined} aria-label={label}>
    {#if fixed}<colgroup>{#each widths ?? [] as width}<col style={`width: ${columnWidth(width)}`} />{/each}</colgroup>{/if}
    <thead>
      <tr>
        {#each columns as column}
          {@const active = Boolean(column.sortable) && sort?.id === column.id}
          <th scope="col" class:c-num={column.numeric} title={column.hint} aria-sort={active ? (sort?.dir === 'asc' ? 'ascending' : 'descending') : 'none'}>
            {#if column.sortable && onSort}
              <button type="button" class="c-sort" title={column.hint} on:click={() => onSort?.(column.id, column.numeric === true)}>
                {column.label}<span class="c-sort-mark" class:c-sort-mark--idle={!active} aria-hidden="true">{active ? (sort?.dir === 'asc' ? '▲' : '▼') : '↕'}</span>
              </button>
            {:else}{column.label}{/if}
          </th>
        {/each}
      </tr>
    </thead>
    <tbody><slot /></tbody>
  </table>
</div>
