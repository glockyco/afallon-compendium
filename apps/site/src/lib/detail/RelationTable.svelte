<script lang="ts" generics="Row">
  import { onMount, tick } from 'svelte';
  import { growingCount } from '../growing-count';
  import HowItWorks from './HowItWorks.svelte';
  import { sortRows, toggleSort, type SortState, type SortValue } from '../table';
  import { shownRowCount, type RelationColumn } from './relation-table';
  import { detailNavigation } from './detail-navigation';
  import { fragmentId } from './tab-state';

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
  // Hidden rows cost nothing until a reader reveals them: the table builds only the rows it shows, and builds revealed
  // rows in steps so that a long relation does not stall the page.
  const REVEAL_STEP = 100;
  const built = growingCount(shownRowCount(rows.length, false), REVEAL_STEP);
  let mounted = false;

  function sortValue(row: Row, id: string): SortValue {
    return columns.find((column) => column.id === id)?.sort?.(row);
  }

  $: sorted = sort ? sortRows(rows, sortValue, sort) : rows;
  $: shown = shownRowCount(sorted.length, expanded);
  $: if (mounted) built.growTo(shown);
  $: builtRows = sorted.slice(0, Math.min($built, shown));
  // An address can name a row that is not built yet. Its anchor waits beside the control that reveals the row, so every
  // fragment link has a target in the page, and without a script the browser lands at that control.
  $: waitingAnchors = sorted.slice(builtRows.length).flatMap((row) => rowAnchors(row));
  // A table with one row has nothing to order, so its headings are plain text.
  $: sortable = rows.length > 1;
  // On a phone, up to two numbers sit beside the name when no other column comes before them. Every other column is a
  // labelled detail line below the name.
  $: besideName = columns.map((column, index) => index > 0 && index <= 2 && columns.slice(1, index + 1).every((entry) => entry.numeric));

  // The address can name an anchor in a row that the limit hides. Such a row opens the table, is built, and scrolls into
  // view. A built row is already in the page, and the browser scrolls to it.
  async function revealTarget(): Promise<void> {
    const id = fragmentId(window.location.hash);
    const index = id ? sorted.findIndex((row) => rowAnchors(row).includes(id)) : -1;
    if (index < 0 || index < $built) return;
    await buildThrough(index);
    requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ block: 'center' }));
  }

  async function buildThrough(index: number): Promise<void> {
    if (index >= shown) {
      expanded = true;
      await tick();
    }
    built.showAtLeast(index + 1);
    await tick();
  }

  // A tab set asks the tables of its panel to reveal an anchor before it scrolls, also for a repeated fragment link.
  const navigation = detailNavigation();
  async function revealAnchor(id: string): Promise<boolean> {
    const index = sorted.findIndex((row) => rowAnchors(row).includes(id));
    if (index < 0) return false;
    if (index >= $built) await buildThrough(index);
    return true;
  }

  onMount(() => {
    mounted = true;
    void revealTarget();
    const onHashChange = () => void revealTarget();
    window.addEventListener('hashchange', onHashChange);
    const removeRevealer = navigation?.addRevealer(revealAnchor);
    return () => {
      window.removeEventListener('hashchange', onHashChange);
      removeRevealer?.();
      built.stop();
    };
  });

  function ariaSort(column: RelationColumn<Row>): 'ascending' | 'descending' | 'none' | undefined {
    if (!column.sort || !sortable) return undefined;
    if (sort?.id !== column.id) return 'none';
    return sort.dir === 'asc' ? 'ascending' : 'descending';
  }

  function sortBy(column: RelationColumn<Row>): void {
    sort = toggleSort(sort ?? { id: '', dir: 'asc' }, column.id, column.numeric === true);
    void tick().then(revealTarget);
  }
</script>

<div class="relation-table">
  <!-- A phone restyles the table as blocks, and some browsers then drop the table semantics. The explicit roles keep them. -->
  <!-- svelte-ignore a11y_no_redundant_roles -->
  <table role="table" aria-label={label}>
    <!-- svelte-ignore a11y_no_redundant_roles -->
    <thead role="rowgroup" class:single={!sortable}>
      <!-- svelte-ignore a11y_no_redundant_roles -->
      <tr role="row">
        {#each columns as column}
          <th scope="col" role="columnheader" class:num={column.numeric} aria-sort={ariaSort(column)}>
            {#if column.sort && sortable}
              <button type="button" class="c-sort" on:click={() => sortBy(column)}>{column.label}<span class="c-sort-mark" class:c-sort-mark--idle={sort?.id !== column.id} aria-hidden="true">{sort?.id === column.id ? (sort.dir === 'asc' ? '▲' : '▼') : '↕'}</span></button>
            {:else}{column.label}{/if}
            {#each column.rules ?? [] as entry}<HowItWorks guide={entry.guide} section={entry.section} />{/each}
          </th>
        {/each}
      </tr>
    </thead>
    <!-- svelte-ignore a11y_no_redundant_roles -->
    <tbody role="rowgroup">
      {#each builtRows as row}
        <!-- svelte-ignore a11y_no_redundant_roles -->
        <tr role="row">
          {#each columns as column, columnIndex}
            <td role="cell" class:num={column.numeric} class:name={columnIndex === 0} class:detail={columnIndex > 0 && !besideName[columnIndex]}>
              {#if columnIndex === 0}{#each rowAnchors(row) as anchor}<span class="anchor" id={anchor}></span>{/each}{/if}
              {#if columnIndex > 0}<span class="cell-label" aria-hidden="true">{column.label}</span>{/if}
              <span class="cell-value"><slot name="cell" {row} column={column.id} /></span>
            </td>
          {/each}
        </tr>
      {/each}
    </tbody>
  </table>
  {#each waitingAnchors as anchor}<span class="anchor" id={anchor}></span>{/each}
  {#if shown < sorted.length}<button type="button" class="c-action show-all" on:click={() => (expanded = true)}>Show {sorted.length - shown} more</button>{/if}
</div>

<style>
  .relation-table { min-width: 0; border: 1px solid var(--c-line-soft); border-radius: var(--c-radius); background: var(--c-surface-1); overflow: hidden; }
  th :global(.how-it-works) { margin-left: .5rem; font-weight: 400; }
  table { width: 100%; border-collapse: collapse; font-size: var(--c-text-body); }
  /* Cells align on the text baseline, so a name after an icon lines up with plain values in the same row. */
  th, td { padding: .55rem .75rem; text-align: left; vertical-align: middle; }
  th { border-bottom: 1px solid var(--c-line-soft); color: var(--c-text-mute); font-size: var(--c-text-label); font-weight: 600; white-space: normal; }
  tbody tr:hover { background: var(--c-tint-hover); }
  tbody td { border-top: 1px solid var(--c-line-soft); overflow-wrap: break-word; }
  .num { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
  th.num :global(.c-sort) { justify-content: flex-end; width: 100%; }
  td :global(small) { display: block; margin-top: .15rem; color: var(--c-text-mute); font-size: var(--c-text-small); white-space: normal; }
  .cell-label { display: none; }
  .anchor { scroll-margin-top: 6rem; }
  tr:has(.anchor:target) td { background: color-mix(in srgb, var(--c-accent) 12%, transparent); }
  .show-all { margin: .5rem .75rem; min-height: 1.5rem; }

  /* Keep the name and up to two comparison values across; any other fields stay as labeled detail lines. */
  @media (max-width: 640px) {
    table, tbody, tr, td { display: block; }
    thead { display: block; padding: .2rem .7rem; border-bottom: 1px solid var(--c-line-soft); }
    thead tr { display: flex; flex-wrap: wrap; justify-content: space-between; gap: .4rem; }
    thead.single { position: absolute; width: 1px; height: 1px; padding: 0; overflow: hidden; clip-path: inset(50%); }
    tbody tr { display: grid; grid-template-columns: minmax(0, 1fr) auto auto; align-items: center; gap: 0 .6rem; padding: .45rem .7rem; border-top: 1px solid var(--c-line-soft); }
    tbody tr:first-child { border-top: 0; }
    tbody td { min-width: 0; padding: .1rem 0; border: 0; }
    tbody td.name { font-weight: 600; }
    tbody td.detail { grid-column: 1 / -1; display: grid; grid-template-columns: minmax(5rem, 38%) minmax(0, 1fr); gap: .5rem; font-size: var(--c-text-small); }
    tbody td:not(.name):has(> .cell-value:empty) { display: none; }
    td.num { white-space: nowrap; }
    td.num:not(.detail) { text-align: right; }
    td.num.detail { text-align: left; }
    .cell-label { display: none; }
    td.detail .cell-label { display: block; color: var(--c-text-mute); }
    .cell-value { min-width: 0; }
    td.num .cell-value { font-variant-numeric: tabular-nums; }
  }
</style>
