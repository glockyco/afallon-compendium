<script lang="ts" generics="Row">
  import { onMount, tick } from 'svelte';
  import Hint from '../Hint.svelte';
  import { sortRows, toggleSort, type SortState, type SortValue } from '../table';
  import { shownRowCount, type RelationColumn } from './relation-table';

  /** The columns that `planColumns` keeps. The first column names the counterpart of the row. */
  export let columns: RelationColumn<Row>[];
  export let rows: Row[];
  /** The accessible name of the table. */
  export let label: string;
  /** The first sort order. Without it, rows keep their published order until a reader sorts them. */
  export let sort: SortState | undefined = undefined;
  /** The anchors that a row holds, such as the variants of an NPC that stand at a location. */
  export let rowAnchors: (row: Row) => readonly string[] = () => [];

  let expanded = false;

  function sortValue(row: Row, id: string): SortValue {
    return columns.find((column) => column.id === id)?.sort?.(row);
  }

  $: sorted = sort ? sortRows(rows, sortValue, sort) : rows;
  $: shown = shownRowCount(sorted.length, expanded);
  // A table with one row has nothing to order, so its headings are plain text.
  $: sortable = rows.length > 1;

  // The address can name an anchor in a row that the limit hides. Such a row opens the table and scrolls into view.
  async function revealTarget(): Promise<void> {
    const id = decodeURIComponent(window.location.hash.slice(1));
    const index = id ? sorted.findIndex((row) => rowAnchors(row).includes(id)) : -1;
    if (index < shown) return;
    expanded = true;
    await tick();
    document.getElementById(id)?.scrollIntoView({ block: 'center' });
  }

  onMount(() => {
    void revealTarget();
    const onHashChange = () => void revealTarget();
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  });

  function ariaSort(column: RelationColumn<Row>): 'ascending' | 'descending' | 'none' | undefined {
    if (!column.sort || !sortable) return undefined;
    if (sort?.id !== column.id) return 'none';
    return sort.dir === 'asc' ? 'ascending' : 'descending';
  }

  function sortBy(column: RelationColumn<Row>): void {
    sort = toggleSort(sort ?? { id: '', dir: 'asc' }, column.id, column.numeric === true);
  }
</script>

<div class="relation-table">
  <!-- A phone restyles the table as blocks, and some browsers then drop the table semantics. The explicit roles keep them. -->
  <!-- svelte-ignore a11y_no_redundant_roles -->
  <table role="table" aria-label={label}>
    <!-- svelte-ignore a11y_no_redundant_roles -->
    <thead role="rowgroup">
      <!-- svelte-ignore a11y_no_redundant_roles -->
      <tr role="row">
        {#each columns as column}
          <th scope="col" role="columnheader" class:num={column.numeric} aria-sort={ariaSort(column)}>
            {#if column.sort && sortable}
              {#if column.hint}
                <Hint text={column.hint} wrapsControl let:control>
                  <button type="button" class="c-sort" aria-describedby={control.describedBy} on:focus={control.show} on:blur={control.close} on:keydown={control.keydown} on:click={() => { sortBy(column); control.show(); }}><span class="hint-term">{column.label}</span><span class="c-sort-mark" class:c-sort-mark--idle={sort?.id !== column.id} aria-hidden="true">{sort?.id === column.id ? (sort.dir === 'asc' ? '▲' : '▼') : '↕'}</span></button>
                </Hint>
              {:else}
                <button type="button" class="c-sort" on:click={() => sortBy(column)}>{column.label}<span class="c-sort-mark" class:c-sort-mark--idle={sort?.id !== column.id} aria-hidden="true">{sort?.id === column.id ? (sort.dir === 'asc' ? '▲' : '▼') : '↕'}</span></button>
              {/if}
            {:else if column.hint}<Hint text={column.hint}>{column.label}</Hint>
            {:else}{column.label}{/if}
          </th>
        {/each}
      </tr>
    </thead>
    <!-- svelte-ignore a11y_no_redundant_roles -->
    <tbody role="rowgroup">
      {#each sorted as row, index}
        <!-- svelte-ignore a11y_no_redundant_roles -->
        <tr role="row" hidden={index >= shown}>
          {#each columns as column, columnIndex}
            <td role="cell" class:num={column.numeric} class:name={columnIndex === 0}>
              {#if columnIndex === 0}{#each rowAnchors(row) as anchor}<span class="anchor" id={anchor}></span>{/each}{/if}
              {#if columnIndex > 0}<span class="cell-label" aria-hidden="true">{column.label}</span>{/if}
              <span class="cell-value"><slot name="cell" {row} column={column.id} /></span>
            </td>
          {/each}
        </tr>
      {/each}
    </tbody>
  </table>
  {#if shown < sorted.length}<button type="button" class="c-action show-all" on:click={() => (expanded = true)}>Show all {sorted.length}</button>{/if}
</div>

<style>
  .relation-table { min-width: 0; }
  table { width: 100%; border-collapse: collapse; font-size: var(--c-text-body); }
  /* Cells align on the text baseline, so a name after an icon lines up with plain values in the same row. */
  th, td { padding: .5rem .6rem; text-align: left; vertical-align: baseline; }
  th { border-bottom: 1px solid var(--c-line); color: var(--c-text-dim); font-size: var(--c-text-label); font-weight: 700; letter-spacing: .06em; text-transform: uppercase; white-space: nowrap; vertical-align: bottom; }
  tbody tr:nth-child(even) { background: var(--c-tint-stripe); }
  tbody tr:hover { background: var(--c-tint-hover); }
  tbody td { border-top: 1px solid var(--c-line-soft); overflow-wrap: break-word; }
  tr[hidden] { display: none; }
  .num { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
  th.num :global(.c-sort) { justify-content: flex-end; width: 100%; }
  td :global(small) { display: block; margin-top: .15rem; color: var(--c-text-mute); font-size: var(--c-text-small); white-space: normal; }
  .cell-label { display: none; }
  .anchor { scroll-margin-top: 6rem; }
  tr:has(.anchor:target) td { background: color-mix(in srgb, var(--c-accent) 12%, transparent); }
  .show-all { margin-top: .75rem; }

  /* A phone shows each row as a block of labeled values. The header row stays as a line of sort controls and hints. */
  @media (max-width: 640px) {
    table, tbody, tr, td { display: block; }
    thead tr { display: flex; flex-wrap: wrap; gap: .35rem 1rem; padding-bottom: .5rem; border-bottom: 1px solid var(--c-line); }
    th { padding: 0; border: 0; }
    tbody tr { padding: .55rem 0; border-top: 1px solid var(--c-line-soft); }
    tbody tr:nth-child(even), tbody tr:hover { background: none; }
    tbody td { display: grid; grid-template-columns: minmax(5.5rem, 35%) minmax(0, 1fr); align-items: baseline; gap: .75rem; padding: .12rem 0; border: 0; text-align: left; }
    tbody td.name { display: block; padding-bottom: .3rem; font-weight: 600; }
    /* A label without a value tells a reader nothing, so a stacked cell with no value leaves the block. */
    tbody td:not(.name):has(> .cell-value:empty) { display: none; }
    td.num { text-align: left; white-space: normal; }
    .cell-label { display: block; color: var(--c-text-mute); font-size: var(--c-text-small); }
    .cell-value { min-width: 0; }
    td.num .cell-value { font-variant-numeric: tabular-nums; white-space: nowrap; }
  }
</style>
