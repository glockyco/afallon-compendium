<script lang="ts">
  import { pushState, replaceState } from '$app/navigation';
  import { afterUpdate, onMount, tick } from 'svelte';
  import type { ListRow, PublicKindEntry, StaticKindList } from '@afallon/contracts/public';
  import Badge from './Badge.svelte';
  import DataTable, { type TableColumn } from './DataTable.svelte';
  import EntityLink from './EntityLink.svelte';
  import ListFilterPanel from './ListFilterPanel.svelte';
  import { formatNumber, rarityTone, readerNoun } from './format';
  import {
    activeFilterCount, emptyFilters, facetOptions, listValueLabel, matchesFilters, readFilters, statAmounts, statLabel, statOptions,
    statSortValue, writeFilters, type ListFilterState,
  } from './list-filters';
  import { columnShape, columnWidths, type ColumnShape } from './list-layout';
  import { sortRows, toggleSort, type SortState, type SortValue } from './table';

  export let list: StaticKindList;
  export let kind: PublicKindEntry;
  export let registry: PublicKindEntry[];

  // Currency columns carry the game's coin colour, as a price does on a page.
  const PRICE_FIELDS: Record<string, true> = { sellPrice: true, buyPrice: true, price: true, income: true };
  // The groups that most readers use start open; every other group starts closed. Lists without an entry open all groups.
  const OPEN_GROUPS: Record<string, readonly string[]> = { items: ['slot', 'rarity', 'levelRequirement', 'stats'] };
  const STAT_COLUMN = 'stat:';
  // The result bar stays at the top of the screen, and the table header sticks just below it.
  let barHeight = 0;
  const PANEL_MIN_ROWS = 20;

  let filters: ListFilterState = emptyFilters();
  let sort: SortState = kind.kind === 'stats' ? { id: 'occurrences', dir: 'desc' } : { id: 'name', dir: 'asc' };
  let sheet: HTMLDialogElement;

  // A column that has the same value in every row, or no value in any, says nothing about one row, so it leaves. A
  // column some rows fill stays, and the rows without a value stay blank.
  $: visibleColumns = kind.columns.filter((column) => {
    const values = list.rows.map((row) => row.values[column.id] ?? null);
    return values.some((value) => value !== null) && (values.length === 1 || new Set(values).size > 1);
  });
  $: ranges = visibleColumns.filter((column) => column.numeric);
  $: rangeIds = ranges.map((column) => column.id);
  $: groups = kind.facets.map((facet) => ({ facet, options: facetOptions(list.rows, filters, kind, rangeIds, facet) })).filter((group) => group.options.length > 0);
  $: stats = statOptions(list.rows);
  // A short list fits on one screen, so filters would only add noise beside it.
  $: hasPanel = list.rows.length >= PANEL_MIN_ROWS && (groups.length > 0 || ranges.length > 0 || stats.length > 0);
  $: statColumns = filters.stats.map((filter) => ({ id: `${STAT_COLUMN}${filter.key}`, label: statLabel(filter.key), numeric: true, sortable: true }));
  $: columns = <TableColumn[]>[
    { id: 'name', label: kind.label, sortable: true },
    ...visibleColumns.map((column) => ({ id: column.id, label: column.label, numeric: column.numeric, sortable: column.sortable })),
    ...statColumns,
  ];
  $: shapes = columns.map((column) => columnShape(column.id, column.numeric === true));

  // Column widths follow the widest value of each column (see list-layout.ts). Above phone widths the table measures
  // its cells after each render and keeps the widest width it has seen per column, so filtering does not make columns
  // jump. On a phone each row is a card and the table keeps no widths.
  let listElement: HTMLDivElement;
  let natural: Record<string, number> = {};
  let available = 0;
  let wide = false;
  let widths: number[] | undefined;
  let measuredFor: unknown[] = [];
  $: widths = wide && available > 0 && columns.every((column) => natural[column.id] !== undefined)
    ? sameWidths(widths, columnWidths(columns.map((column, index) => ({ shape: shapes[index]!, natural: natural[column.id]! })), available))
    : undefined;

  // A table wider than its card, even with every column at its floor, scrolls inside the card instead of moving the
  // page sideways. Its header then sticks within the card only.
  $: overflowing = widths !== undefined && widths.reduce((sum, width) => sum + width, 0) > available;

  function sameWidths(previous: number[] | undefined, next: number[]): number[] {
    return previous && previous.length === next.length && previous.every((width, index) => width === next[index]) ? previous : next;
  }

  function measure(): void {
    const table = listElement?.querySelector('table');
    if (!table || !wide) return;
    const cellPadding = (cell: Element) => { const style = getComputedStyle(cell); return parseFloat(style.paddingLeft) + parseFloat(style.paddingRight); };
    const next = { ...natural };
    const grow = (id: string, width: number) => { next[id] = Math.ceil(Math.max(next[id] ?? 0, width)); };
    // A numeric heading's sort button fills its cell, so the heading measures the extent of its text and sort mark.
    const range = document.createRange();
    table.querySelectorAll('thead th').forEach((cell, index) => {
      const column = columns[index];
      if (!column) return;
      range.selectNodeContents(cell.querySelector('.c-sort') ?? cell);
      grow(column.id, range.getBoundingClientRect().width + cellPadding(cell));
    });
    for (const row of table.querySelectorAll('tbody tr')) {
      row.querySelectorAll(':scope > td').forEach((cell, index) => {
        const column = columns[index];
        if (!column) return;
        // A truncated name shows less than its text: the whole width is the link without its name, plus the name's text.
        const link = cell.querySelector('.entity-link, .entity-text'), name = link?.querySelector('.name');
        const content = column.id === 'name' && link && name ? link.getBoundingClientRect().width - name.clientWidth + name.scrollWidth
          : cell.querySelector('.cell')?.scrollWidth ?? 0;
        grow(column.id, content + cellPadding(cell));
      });
    }
    if (Object.keys(next).some((id) => next[id] !== natural[id])) natural = next;
  }
  $: filteredRows = sortRows(list.rows.filter((row) => matchesFilters(row, filters, kind, rangeIds)), sortValue, sort);
  $: activeCount = activeFilterCount(filters);
  $: chips = filterChips(filters);
  $: hiddenOptions = kind.facets.flatMap((facet) => (facet.defaultHiddenValues ?? []).map((value) => ({
    facet, value, count: list.rows.filter((row) => (row.facets[facet.id] ?? []).includes(value)).length,
  }))).filter((option) => option.count > 0 && !(filters.facets[option.facet.id] ?? []).length);

  onMount(() => {
    const restore = () => readUrl(new URL(window.location.href));
    restore();
    window.addEventListener('popstate', restore);
    const query = window.matchMedia('(min-width: 641px)');
    const onMedia = () => { wide = query.matches; measuredFor = []; };
    onMedia();
    query.addEventListener('change', onMedia);
    // The table fills the card, so the width it may take is the results column's, less the card's own frame.
    const column = listElement.parentElement!;
    const observer = new ResizeObserver(() => {
      const style = getComputedStyle(listElement);
      const frame = ['paddingLeft', 'paddingRight', 'borderLeftWidth', 'borderRightWidth'].reduce((sum, key) => sum + parseFloat(style[key as 'paddingLeft']), 0);
      available = Math.max(0, column.clientWidth - frame);
    });
    observer.observe(column);
    // Widths measured in a fallback font are wrong once the page font arrives, so the table measures again.
    void document.fonts?.ready.then(() => { natural = {}; measuredFor = []; });
    return () => { window.removeEventListener('popstate', restore); query.removeEventListener('change', onMedia); observer.disconnect(); };
  });

  // The table measures again when its rows or columns change, not when only its widths do.
  afterUpdate(() => {
    const key = [filteredRows, columns, wide, natural];
    if (key.length === measuredFor.length && key.every((value, index) => value === measuredFor[index])) return;
    void tick().then(() => { measure(); measuredFor = [filteredRows, columns, wide, natural]; });
  });

  function readUrl(url: URL): void {
    filters = readFilters(url.searchParams, kind, rangeIds);
    const defaultSort: SortState = kind.kind === 'stats' ? { id: 'occurrences', dir: 'desc' } : { id: 'name', dir: 'asc' };
    const requested = url.searchParams.get('sort') ?? defaultSort.id;
    const known = requested === 'name' || kind.columns.some((column) => column.id === requested)
      || (requested.startsWith(STAT_COLUMN) && filters.stats.some((filter) => filter.key === requested.slice(STAT_COLUMN.length)));
    sort = { id: known ? requested : defaultSort.id, dir: url.searchParams.get('dir') === 'desc' ? 'desc' : url.searchParams.has('dir') ? 'asc' : defaultSort.dir };
  }

  function writeUrl(history: 'push' | 'replace'): void {
    const url = new URL(window.location.href);
    writeFilters(url.searchParams, filters, kind, rangeIds);
    // A sort by a stat column ends with its stat filter.
    if (sort.id.startsWith(STAT_COLUMN) && !filters.stats.some((filter) => filter.key === sort.id.slice(STAT_COLUMN.length))) sort = { id: 'name', dir: 'asc' };
    const write = (key: string, value: string) => value ? url.searchParams.set(key, value) : url.searchParams.delete(key);
    write('sort', sort.id === 'name' ? '' : sort.id);
    write('dir', sort.dir === 'asc' ? '' : sort.dir);
    if (history === 'push') pushState(url, {}); else replaceState(url, {});
  }

  function update(next: ListFilterState, history: 'push' | 'replace' = 'push'): void {
    filters = next;
    writeUrl(history);
  }

  function setFacet(id: string, value: string, checked: boolean): void {
    const current = filters.facets[id] ?? [];
    update({ ...filters, facets: { ...filters.facets, [id]: checked ? [...current, value] : current.filter((entry) => entry !== value) } });
  }

  function setRange(bound: 'min' | 'max', id: string, value: string): void {
    update(bound === 'min' ? { ...filters, minimums: { ...filters.minimums, [id]: value } } : { ...filters, maximums: { ...filters.maximums, [id]: value } });
  }

  function addStat(key: string): void {
    update({ ...filters, stats: [...filters.stats, { key, min: '', max: '' }] });
  }

  function setStatBound(index: number, bound: 'min' | 'max', value: string): void {
    update({ ...filters, stats: filters.stats.map((filter, position) => position === index ? { ...filter, [bound]: value } : filter) });
  }

  function removeStat(index: number): void {
    update({ ...filters, stats: filters.stats.filter((_, position) => position !== index) });
  }

  function clearFilters(): void {
    update(emptyFilters());
  }

  function boundsText(min: string, max: string): string {
    if (min.trim() && max.trim()) return `${min}–${max}`;
    return min.trim() ? `at least ${min}` : `at most ${max}`;
  }

  // Each active filter is one chip that removes only that filter.
  function filterChips(state: ListFilterState): Array<{ label: string; remove: () => void }> {
    const result: Array<{ label: string; remove: () => void }> = [];
    for (const facet of kind.facets) {
      for (const value of state.facets[facet.id] ?? []) result.push({ label: `${facet.label}: ${listValueLabel(facet.id, value)}`, remove: () => setFacet(facet.id, value, false) });
    }
    for (const range of ranges) {
      const min = state.minimums[range.id] ?? '', max = state.maximums[range.id] ?? '';
      if (min.trim() || max.trim()) result.push({ label: `${range.label}: ${boundsText(min, max)}`, remove: () => update({ ...filters, minimums: { ...filters.minimums, [range.id]: '' }, maximums: { ...filters.maximums, [range.id]: '' } }) });
    }
    state.stats.forEach((filter, index) => result.push({
      label: filter.min.trim() || filter.max.trim() ? `${statLabel(filter.key)}: ${boundsText(filter.min, filter.max)}` : statLabel(filter.key),
      remove: () => removeStat(index),
    }));
    return result;
  }

  function sortValue(row: ListRow, id: string): SortValue {
    if (id === 'name') return row.ref.name;
    if (id.startsWith(STAT_COLUMN)) return statSortValue(row, id.slice(STAT_COLUMN.length));
    return row.values[id];
  }

  function statText(row: ListRow, key: string): string {
    return statAmounts(row, key).map((stat) => `${formatNumber(stat.min)}${stat.max === stat.min ? '' : `–${formatNumber(stat.max)}`}${stat.percent ? '%' : ''}`).join(', ');
  }

  // A column that shares its id with a facet shows the facet's values, so a row with several roles or start kinds
  // labels each one. Any other column shows its one published value.
  function cellValues(row: ListRow, id: string): string[] {
    const values = row.facets[id];
    return values && values.length > 0 ? values : [String(row.values[id])];
  }

  // Only plain cut text needs a native title. An EntityLink has its own full-name hover card.
  function titleIfCut(event: PointerEvent): void {
    const cell = event.currentTarget as HTMLElement;
    if (cell.querySelector('.entity-link')) return;
    if (cell.scrollWidth > cell.clientWidth) cell.title = cell.textContent?.trim() ?? '';
    else cell.removeAttribute('title');
  }

  function openSheet(): void {
    sheet.showModal();
  }
</script>

<div class="layout" class:with-panel={hasPanel}>
  {#if hasPanel}
    <aside class="sidebar" aria-label="Filters">
      <ListFilterPanel instance="side" openGroups={OPEN_GROUPS[kind.kind]} {groups} {ranges} {stats} state={filters} onFacet={setFacet} onRange={setRange} onAddStat={addStat} onStatBound={setStatBound} onRemoveStat={removeStat} />
    </aside>
  {/if}

  <div class="results">
    <div class="toolbar">
      <input class="search" type="search" aria-label={`Filter ${readerNoun(kind.plural)} by name`} placeholder={`Filter ${readerNoun(kind.plural)} by name`}
        value={filters.q} on:input={(event) => update({ ...filters, q: event.currentTarget.value }, 'replace')} />
      {#if hasPanel}<button type="button" class="filters-button" on:click={openSheet}>Filters{#if activeCount}{` (${formatNumber(activeCount)})`}{/if}</button>{/if}
    </div>

    <div class="result-bar" bind:offsetHeight={barHeight}>
      <p aria-live="polite"><strong>{formatNumber(filteredRows.length)}</strong>{#if filteredRows.length !== list.rows.length}{' of '}{formatNumber(list.rows.length)}{/if} {list.rows.length === 1 ? readerNoun(kind.label) : readerNoun(kind.plural)}</p>
      {#if chips.length}
        <ul class="chips" aria-label="Active filters">
          {#each chips as chip}<li><button type="button" class="chip" aria-label={`Remove filter ${chip.label}`} on:click={chip.remove}>{chip.label}<span aria-hidden="true">×</span></button></li>{/each}
        </ul>
      {/if}
      {#if chips.length || filters.q.trim()}<button type="button" class="clear" on:click={clearFilters}>Clear all</button>{/if}
      {#each hiddenOptions as option}
        <button type="button" class="reveal" on:click={() => setFacet(option.facet.id, option.value, true)}>Show {formatNumber(option.count)} hidden ({listValueLabel(option.facet.id, option.value)})</button>
      {/each}
    </div>

    <div class="list" style={`--bar-height: ${barHeight}px`} bind:this={listElement}>
      <DataTable {columns} {widths} {sort} sticky flowWide={!overflowing} onSort={(id, numeric) => { sort = toggleSort(sort, id, numeric); writeUrl('push'); }} label={kind.plural}>
        {#each filteredRows as row (row.ref.key)}
          <tr>
            <td data-label={kind.label}><EntityLink ref={row.ref} {registry} rarity={rarityTone(String(row.values.rarity ?? ''))} truncate /></td>
            {#each visibleColumns as column, index}
              <td data-label={column.label} class:c-num={column.numeric} class:blank={row.values[column.id] === null || row.values[column.id] === undefined}><span class={`cell ${shapes[index + 1]}`} on:pointerenter={titleIfCut}>
                {#if row.values[column.id] === null || row.values[column.id] === undefined}
                  <!-- A list cell without a value states nothing: the entity has no such fact. -->
                {:else if column.id === 'rarity'}
                  <span data-rarity={rarityTone(String(row.values[column.id]))}><Badge label={listValueLabel(column.id, String(row.values[column.id]))} tone="rarity" /></span>
                {:else if column.id === 'role'}
                  <span class="badges">{#each cellValues(row, column.id) as role}<Badge label={listValueLabel(column.id, role)} tone={role === 'boss' ? 'boss' : 'neutral'} />{/each}</span>
                {:else if row.relations?.[column.id]?.length}
                  {#each row.relations[column.id] as ref, index}{#if index}{', '}{/if}<EntityLink {ref} {registry} truncate />{row.relationSuffixes?.[column.id]?.[index] ?? ''}{/each}
                {:else if typeof row.values[column.id] === 'number'}
                  <span class:c-price={PRICE_FIELDS[column.id]}>{formatNumber(row.values[column.id] as number)}</span>
                {:else}
                  {cellValues(row, column.id).map((value) => listValueLabel(column.id, value)).join(', ')}
                {/if}
              </span></td>
            {/each}
            {#each filters.stats as filter (filter.key)}
              {@const text = statText(row, filter.key)}
              <td data-label={statLabel(filter.key)} class="c-num" class:blank={!text}><span class="cell number">{text}</span></td>
            {/each}
          </tr>
        {/each}
      </DataTable>
      {#if filteredRows.length === 0}<p class="c-empty empty">No {readerNoun(kind.plural)} match these filters.</p>{/if}
    </div>
  </div>
</div>

{#if hasPanel}
  <dialog class="sheet" bind:this={sheet} aria-label="Filters">
    <header class="sheet-head">
      <h2>Filters</h2>
      <button type="button" class="close" aria-label="Close filters" on:click={() => sheet.close()}>×</button>
    </header>
    <div class="sheet-body">
      <ListFilterPanel instance="sheet" openGroups={OPEN_GROUPS[kind.kind]} {groups} {ranges} {stats} state={filters} onFacet={setFacet} onRange={setRange} onAddStat={addStat} onStatBound={setStatBound} onRemoveStat={removeStat} />
    </div>
    <footer class="sheet-foot">
      <button type="button" class="clear" on:click={clearFilters} disabled={!activeCount}>Clear all</button>
      <button type="button" class="show" on:click={() => sheet.close()}>Show {formatNumber(filteredRows.length)} {filteredRows.length === 1 ? readerNoun(kind.label) : readerNoun(kind.plural)}</button>
    </footer>
  </dialog>
{/if}

<style>
  .layout { display: block; }
  /* The filters sit beside the results where the page is wide enough for both. */
  .layout.with-panel { display: grid; grid-template-columns: 15.5rem minmax(0, 1fr); gap: 1.75rem; align-items: start; }
  /* The panel scrolls with the page. A sticky panel with its own scroll hid its end below the screen until the page
     itself scrolled, and the chips above the results keep the active filters in view. */
  .sidebar { padding-right: .5rem; }
  .results { min-width: 0; }
  .toolbar { display: flex; gap: .6rem; margin-bottom: .75rem; }
  .search { flex: 1 1 auto; min-width: 0; min-height: 2.35rem; padding: .4rem .6rem; border: 1px solid var(--c-line-strong); border-radius: var(--c-radius-sm); background: var(--c-surface-sunken); color: var(--c-text); }
  .filters-button { display: none; flex: none; min-height: 2.35rem; padding: .4rem .8rem; border: 1px solid var(--c-line-strong); border-radius: var(--c-radius-sm); background: var(--c-surface-2); color: var(--c-text); font-weight: 600; cursor: pointer; }

  /* The count and the active filter chips stay in view while the list scrolls, and the table header sticks below them. */
  .result-bar { position: sticky; top: 0; z-index: 3; display: flex; flex-wrap: wrap; align-items: center; gap: .45rem .6rem; margin-bottom: .6rem; padding: .4rem 0; background: var(--c-surface-0); }
  /* A table that flows sticks its header below the result bar. A table that scrolls inside its card sticks it at the
     card's top, because the card is then its scrollport. */
  .list :global(.c-table-scroll--flow-wide .c-table--sticky thead th) { top: var(--bar-height, 0px); }
  .result-bar p { margin: 0 .25rem 0 0; color: var(--c-text-dim); font-size: var(--c-text-small); }
  .result-bar strong { color: var(--c-text); font-variant-numeric: tabular-nums; }
  .chips { display: contents; list-style: none; }
  .chip { display: inline-flex; align-items: center; gap: .4rem; min-height: 1.75rem; padding: .2rem .55rem; border: 1px solid var(--c-accent-line); border-radius: var(--c-radius-sm); background: transparent; color: var(--c-text); font-size: var(--c-text-small); cursor: pointer; }
  .chip span { color: var(--c-text-mute); }
  .chip:hover span { color: var(--c-text); }
  .clear { min-height: 1.75rem; padding: .2rem .6rem; border: 0; background: transparent; color: var(--c-accent); font-size: var(--c-text-small); text-decoration: underline; text-underline-offset: .2em; cursor: pointer; }
  .clear:disabled { color: var(--c-text-mute); cursor: default; }
  .reveal { min-height: 1.75rem; padding: .25rem .6rem; border: 1px solid var(--c-accent-line); border-radius: var(--c-radius-sm); color: var(--c-accent-strong); background: var(--c-surface-2); cursor: pointer; font-size: var(--c-text-small); }
  .search:focus-visible, .filters-button:focus-visible, .chip:focus-visible, .clear:focus-visible, .reveal:focus-visible, .close:focus-visible, .show:focus-visible { outline: 2px solid var(--c-accent); outline-offset: 2px; }

  .list { padding: .35rem .5rem .5rem; border: 1px solid var(--c-line); border-radius: var(--c-radius); background: var(--c-surface-1); }
  .empty { padding: 1.5rem .6rem; text-align: center; }
  .badges { display: inline-flex; flex-wrap: wrap; gap: .3rem; }

  /* The phone sheet fills the screen; its footer stays in view while its filters scroll. */
  .sheet { width: 100%; max-width: 100%; height: 100%; max-height: 100%; margin: 0; padding: 0; border: 0; background: var(--c-surface-1); color: var(--c-text); }
  .sheet[open] { display: flex; flex-direction: column; }
  .sheet::backdrop { background: rgb(0 0 0 / .55); }
  .sheet-head { display: flex; align-items: center; justify-content: space-between; padding: .85rem 1rem; border-bottom: 1px solid var(--c-line); }
  .sheet-head h2 { margin: 0; font-size: 1.1rem; }
  .close { width: 2.25rem; height: 2.25rem; border: 1px solid var(--c-line-strong); border-radius: var(--c-radius-sm); background: transparent; color: var(--c-text); font-size: 1.2rem; cursor: pointer; }
  .sheet-body { flex: 1 1 auto; overflow-y: auto; padding: 1rem; }
  .sheet-foot { display: flex; align-items: center; justify-content: space-between; gap: .75rem; padding: .75rem 1rem; border-top: 1px solid var(--c-line); background: var(--c-surface-2); }
  .show { min-height: 2.5rem; padding: .45rem 1rem; border: 0; border-radius: var(--c-radius-sm); background: var(--c-accent); color: var(--c-surface-1); font-weight: 700; cursor: pointer; }

  @media (max-width: 959px) {
    .layout.with-panel { display: block; }
    .sidebar { display: none; }
    .filters-button { display: inline-flex; align-items: center; }
  }
  @media (min-width: 960px) {
    .sheet { display: none; }
  }
  /* Above phone widths every value stays on one line. A name, a text, or a label past its column width ends in an ellipsis;
     the tooltip, the page, or the title of a cut cell shows the whole value. A cell's content is only as wide as its value, which
     is the width that the table measures. A label is cut only when the names and texts beside it are at their floors. */
  @media (min-width: 641px) {
    .cell { display: inline-block; max-width: 100%; vertical-align: middle; white-space: nowrap; }
    .cell.text, .cell.label { overflow: hidden; text-overflow: ellipsis; }
    .cell .badges { flex-wrap: nowrap; }
  }

  @media (max-width: 640px) {
    .list { padding: 0; border: 0; background: none; }
    .list :global(.c-table-scroll) { overflow: visible; }
    .list :global(table), .list :global(tbody), .list :global(tr), .list :global(td) { display: block; min-width: 0; }
    .list :global(thead) { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); }
    .list :global(tbody) { display: grid; gap: .6rem; }
    .list :global(tbody tr) { padding: .6rem .7rem; border: 1px solid var(--c-line); border-radius: var(--c-radius); background: var(--c-surface-1); }
    .list :global(tbody tr:nth-child(even)) { background: var(--c-surface-1); }
    .list :global(tbody td) { display: grid; grid-template-columns: minmax(5rem, .6fr) minmax(0, 1fr); gap: .6rem; padding: .3rem 0; border: 0; text-align: left; overflow-wrap: anywhere; }
    .list :global(tbody td::before) { content: attr(data-label); color: var(--c-text-dim); font-size: var(--c-text-label); font-weight: 700; }
    .list :global(tbody td:first-child) { grid-template-columns: 1fr; padding-bottom: .5rem; }
    .list :global(tbody td:first-child::before) { display: none; }
    .list :global(tbody td.blank) { display: none; }
  }
</style>
