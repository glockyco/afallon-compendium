<script lang="ts">
  import { pushState, replaceState } from '$app/navigation';
  import { afterUpdate, onMount, tick } from 'svelte';
  import type { ListRow, PublicKindEntry, StaticKindList } from '@afallon/contracts/public';
  import Badge from './Badge.svelte';
  import DataTable, { type TableColumn } from './DataTable.svelte';
  import EntityLink from './EntityLink.svelte';
  import ListFilterPanel from './ListFilterPanel.svelte';
  import ListSearchCount from './ListSearchCount.svelte';
  import Price from './Price.svelte';
  import { placeListName } from './place-list-name';
  import { formatNumber, intervalText, nameOf, rarityTone, readerNoun } from './format';
  import { growingCount } from './growing-count';
  import {
    activeFilterCount, emptyFilters, facetOptions, facetValueLabel, hiddenFacetOptions, listValueLabel, matchesFilters, readFilters, statAmounts, statLabel, statOptions,
    statSortValue, writeFilters, type ListFilterState,
  } from './list-filters';
  import { columnShape, columnWidths, visibleListColumns, type ColumnShape } from './list-layout';
  import { sortRows, toggleSort, type SortState, type SortValue } from './table';

  export let list: StaticKindList;
  export let kind: PublicKindEntry;
  export let registry: PublicKindEntry[];

  // Currency columns carry the game's coin colour, as a price does on a page.
  const PRICE_FIELDS: Record<string, true> = { sellPrice: true, buyPrice: true, price: true, income: true };
  // The groups that most readers use start open; every other group starts closed. Lists without an entry open all groups.
  // Long lists of names, such as places, factions, quest areas, and quest chains, start closed.
  const OPEN_GROUPS: Record<string, readonly string[]> = {
    items: ['slot', 'rarity', 'levelRequirement', 'stats'],
    npcs: ['role', 'class', 'partyRole', 'level'],
    quests: ['rewardType', 'questType', 'startType', 'repeatable'],
  };
  const STAT_COLUMN = 'stat:';
  // The result bar stays at the top of the screen, and the table header sticks just below it.
  let barHeight = 0;
  const PANEL_MIN_ROWS = 20;
  const HIDDEN_EXPLANATION = "These are in the game's files, but we found no way to get, meet, or use them in this version.";
  let explanationOpen = false;
  function hiddenLabel(count: number): string {
    const subject = kind.kind === 'items' ? `${count === 1 ? 'item' : 'items'} without a known source`
      : kind.kind === 'npcs' ? `${count === 1 ? 'NPC' : 'NPCs'} not found in the world`
        : `${count === 1 ? 'ability' : 'abilities'} nobody uses`;
    return `Show ${formatNumber(count)} ${subject}`;
  }

  let filters: ListFilterState = emptyFilters();
  let sort: SortState = kind.defaultSort ?? { id: 'name', dir: 'asc' };
  let sheet: HTMLDialogElement;

  // The filter controls include every published numeric column, even after its current result column disappears.
  $: ranges = kind.columns.filter((column) => column.numeric);
  $: rangeIds = ranges.map((column) => column.id);
  $: matchingRows = list.rows.filter((row) => matchesFilters(row, filters, kind, rangeIds));
  // Values from the matching rows, not the entire kind, determine whether a column distinguishes these results.
  $: visibleColumns = visibleListColumns(matchingRows, kind);
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

  // A list builds its first rows at once, on the server and in the browser, and then adds the rest of the current
  // results in steps between frames, so a long list opens without first building every row. A filter, search, or sort
  // change starts again from the first rows.
  const FIRST_ROWS = 60;
  const ROW_STEP = 50;
  const built = growingCount(FIRST_ROWS, ROW_STEP);
  let mounted = false;

  // Column widths follow the widest value of each column (see list-layout.ts). Above phone widths a hidden sample table
  // builds the rows that hold the longest values of each column among all current results, and the list measures those
  // with its first rows. The widths therefore fit every row from the first frame, although the list builds its rows in
  // steps. The list keeps the widest width it has seen per column, so filtering does not make columns jump. On a phone
  // each row is a card and the table keeps no widths.
  const SAMPLE_PER_COLUMN = 5;
  let listElement: HTMLDivElement;
  let sampleElement: HTMLDivElement | undefined;
  let natural: Record<string, number> = {};
  let available = 0;
  let wide = false;
  let widths: number[] | undefined;
  let measuredFor: unknown[] = [];
  $: sampleRows = wide ? widestRows(filteredRows, columns.map((column) => column.id)) : [];
  $: widths = wide && available > 0 && columns.every((column) => natural[column.id] !== undefined)
    ? sameWidths(widths, columnWidths(columns.map((column, index) => ({ shape: shapes[index]!, natural: natural[column.id]! })),
      kind.kind === 'quests' ? Math.max(available, 1150) : available))
    : undefined;

  // A table wider than its card, even with every column at its floor, scrolls inside the card instead of moving the
  // page sideways. Its header then sticks within the card only. A table flows with the page only once its measured
  // widths fit: before the first measurement, as in the page that the server renders, its values take their natural
  // widths, and a long one would otherwise spill past the card.
  $: overflowing = widths !== undefined && widths.reduce((sum, width) => sum + width, 0) > available;
  $: flowWide = widths !== undefined && !overflowing;

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
    // The first rows and the sample of the widest values stand for every row, so measuring stays short however long the
    // list is.
    const rows = [...[...table.querySelectorAll('tbody tr')].slice(0, FIRST_ROWS), ...(sampleElement?.querySelectorAll('tbody tr') ?? [])];
    for (const row of rows) {
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

  // The rows that hold the longest values of each column. A value's length in characters stands for its width, and five
  // rows per column leave room for wide letters.
  function widestRows(rows: readonly ListRow[], ids: readonly string[]): ListRow[] {
    const chosen = new Set<ListRow>();
    for (const id of ids) {
      const top: Array<{ row: ListRow; length: number }> = [];
      for (const row of rows) {
        const length = valueLength(row, id);
        if (top.length === SAMPLE_PER_COLUMN && length <= top[SAMPLE_PER_COLUMN - 1]!.length) continue;
        top.push({ row, length });
        top.sort((left, right) => right.length - left.length);
        top.length = Math.min(top.length, SAMPLE_PER_COLUMN);
      }
      for (const entry of top) chosen.add(entry.row);
    }
    return [...chosen];
  }

  // The length of the text that a cell shows, following the branches of the row snippet below.
  function valueLength(row: ListRow, id: string): number {
    if (id === 'name') return (kind.kind === 'places' ? placeListName(row.ref.name, typeof row.values.levelRange === 'string' ? row.values.levelRange : null) : row.ref.name).length;
    if (id.startsWith(STAT_COLUMN)) return statText(row, id.slice(STAT_COLUMN.length)).length;
    if (id === 'pieces' && typeof row.values.lastBonus === 'number') return `${row.values.pieces} (last bonus at ${row.values.lastBonus} pieces)`.length;
    const value = row.values[id];
    if (value === null || value === undefined) return 0;
    const relations = row.relations?.[id];
    if (relations?.length) return relations.reduce((sum, ref, index) => sum + nameOf(ref).length + (row.relationSuffixes?.[id]?.[index]?.length ?? 0) + (index ? 2 : 0), 0);
    if (typeof value === 'number') return formatNumber(value).length;
    return cellValues(row, id).map((entry) => listValueLabel(id, entry)).join(', ').length;
  }
  $: filteredRows = sortRows(matchingRows, sortValue, sort);
  $: if (mounted) built.restart(filteredRows.length);
  $: shownRows = filteredRows.slice(0, $built);
  $: activeCount = activeFilterCount(filters);
  $: chips = filterChips(filters);
  $: hiddenOptions = hiddenFacetOptions(list.rows, filters, kind, rangeIds);
  // Reserve the reveal's row while typing only if these other filters can still match a hidden entry.
  $: hasPotentialHidden = hiddenFacetOptions(list.rows, { ...filters, q: '' }, kind, rangeIds).length > 0;

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
    mounted = true;
    listElement.addEventListener('pointerover', titleIfCut);
    return () => { window.removeEventListener('popstate', restore); query.removeEventListener('change', onMedia); observer.disconnect(); listElement.removeEventListener('pointerover', titleIfCut); built.stop(); };
  });

  // The table measures again when its rows or columns change, not when only its widths do.
  afterUpdate(() => {
    const key = [filteredRows, columns, wide, natural];
    if (key.length === measuredFor.length && key.every((value, index) => value === measuredFor[index])) return;
    void tick().then(() => { measure(); measuredFor = [filteredRows, columns, wide, natural]; });
  });

  // A sort without a direction in the address uses the column's first-click order: A to Z for text, high to low for numbers.
  function naturalDir(id: string): SortState['dir'] {
    if (id.startsWith(STAT_COLUMN)) return 'desc';
    return kind.columns.find((column) => column.id === id)?.numeric ? 'desc' : 'asc';
  }

  function readUrl(url: URL): void {
    filters = readFilters(url.searchParams, kind, rangeIds);
    const defaultSort: SortState = kind.defaultSort ?? { id: 'name', dir: 'asc' };
    const requested = url.searchParams.get('sort') ?? defaultSort.id;
    const known = requested === 'name' || kind.columns.some((column) => column.id === requested)
      || (requested.startsWith(STAT_COLUMN) && filters.stats.some((filter) => filter.key === requested.slice(STAT_COLUMN.length)));
    const id = known ? requested : defaultSort.id;
    const dir = url.searchParams.get('dir');
    sort = { id, dir: dir === 'desc' || dir === 'asc' ? dir : id === defaultSort.id ? defaultSort.dir : naturalDir(id) };
  }

  function writeUrl(history: 'push' | 'replace'): void {
    const url = new URL(window.location.href);
    writeFilters(url.searchParams, filters, kind, rangeIds);
    const defaultSort: SortState = kind.defaultSort ?? { id: 'name', dir: 'asc' };
    // A sort by a stat column ends with its stat filter.
    if (sort.id.startsWith(STAT_COLUMN) && !filters.stats.some((filter) => filter.key === sort.id.slice(STAT_COLUMN.length))) sort = defaultSort;
    const write = (key: string, value: string) => value ? url.searchParams.set(key, value) : url.searchParams.delete(key);
    // The address omits what a reader of it would assume: the list's default sort, and a column's first-click order.
    write('sort', sort.id === defaultSort.id ? '' : sort.id);
    write('dir', sort.dir === (sort.id === defaultSort.id ? defaultSort.dir : naturalDir(sort.id)) ? '' : sort.dir);
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
      for (const value of state.facets[facet.id] ?? []) result.push({ label: `${facet.label}: ${facetValueLabel(facet, value)}`, remove: () => setFacet(facet.id, value, false) });
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
  function redundantCell(row: ListRow, id: string): boolean {
    return id === 'skill' && (kind.kind === 'recipes' && row.values.skill === row.values.station
      || kind.kind === 'craftingStations' && row.values.skill === row.ref.name);
  }

  // One delegated listener handles plain cut text, including rows added after the first render.
  function titleIfCut(event: PointerEvent): void {
    const cell = event.target instanceof Element ? event.target.closest('.cell') : null;
    if (!(cell instanceof HTMLElement) || !listElement.contains(cell) || cell.querySelector('.entity-link')) return;
    if (cell.scrollWidth > cell.clientWidth) cell.title = cell.textContent?.trim() ?? '';
    else cell.removeAttribute('title');
  }

  function openSheet(): void {
    sheet.showModal();
  }
</script>

{#snippet listRow(row: ListRow)}
  <tr>
    <td data-label={kind.label}><EntityLink ref={kind.kind === 'places' ? { ...row.ref, name: placeListName(row.ref.name, typeof row.values.levelRange === 'string' ? row.values.levelRange : null) } : row.ref} {registry} rarity={rarityTone(String(row.values.rarity ?? ''))} forceIcon truncate /></td>
    {#each visibleColumns as column, index}
      {@const currency = row.relations?.[`${column.id}Currency`]?.[0]}
      <td data-label={column.label} class:c-num={column.numeric} class:wide-fact={kind.kind === 'mechanics' && column.id === 'description' || kind.kind === 'properties' && column.id === 'income' || kind.kind === 'races' && column.id === 'start'} class:race-start={kind.kind === 'races' && column.id === 'start'} class:description-fact={kind.kind === 'mechanics' && column.id === 'description'}
        class:blank={(row.values[column.id] === null || row.values[column.id] === undefined) && !(kind.kind === 'factions' && column.id === 'members') || redundantCell(row, column.id)}>
        <span class={`cell ${shapes[index + 1]}`}>
        {#if kind.kind === 'factions' && column.id === 'members' && row.values.members == null}
          Count unavailable
        {:else if redundantCell(row, column.id)}
          <!-- The station or recipe already names this skill. -->
        {:else if row.values[column.id] === null || row.values[column.id] === undefined}
          <!-- A list cell without a value states nothing: the entity has no such fact. -->
        {:else if column.id === 'rarity'}
          <span data-rarity={rarityTone(String(row.values[column.id]))}><Badge label={listValueLabel(column.id, String(row.values[column.id]))} tone="rarity" /></span>
        {:else if column.id === 'role'}
          <span class="badges">{#each cellValues(row, column.id) as role}<Badge label={listValueLabel(column.id, role)} tone={role === 'boss' ? 'boss' : 'neutral'} />{/each}</span>
        {:else if row.relations?.[column.id]?.length}
          {#each row.relations[column.id] as ref, index}{#if index}{', '}{/if}<EntityLink {ref} {registry} plain truncate />{row.relationSuffixes?.[column.id]?.[index] ?? ''}{/each}
        {:else if (column.id === 'price' || column.id === 'income') && currency}
          <Price price={{ amount: row.values[column.id] as number, currency }} showName />{#if column.id === 'income' && typeof row.values.incomeInterval === 'number'}{' '}<span class="income-interval">every {intervalText(row.values.incomeInterval)} of active play</span>{/if}
        {:else if column.id === 'pieces' && typeof row.values.lastBonus === 'number'}
          {formatNumber(row.values.pieces as number)} (last bonus at {formatNumber(row.values.lastBonus)} pieces)
        {:else if typeof row.values[column.id] === 'number'}
          <span class:c-price={PRICE_FIELDS[column.id]}>{formatNumber(row.values[column.id] as number)}</span>{#if column.id === 'income' && typeof row.values.incomeInterval === 'number'}{' '}<span class="income-interval">every {intervalText(row.values.incomeInterval)} of active play</span>{/if}
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
{/snippet}

<div class="layout" class:with-panel={hasPanel}>
  {#if hasPanel}
    <aside class="sidebar" aria-label="Filters">
      <ListFilterPanel instance="side" openGroups={OPEN_GROUPS[kind.kind]} {groups} {ranges} {stats} state={filters} onFacet={setFacet} onRange={setRange} onAddStat={addStat} onStatBound={setStatBound} onRemoveStat={removeStat} />
    </aside>
  {/if}

  <div class="results">
    <ListSearchCount {kind} query={filters.q} count={filteredRows.length} total={list.rows.length} reserveReveal={hasPotentialHidden}
      onQuery={(value) => update({ ...filters, q: value }, 'replace')} bind:barHeight>
      <svelte:fragment slot="filter">{#if hasPanel}<button type="button" class="filters-button" on:click={openSheet}>Filters{#if activeCount}{` (${formatNumber(activeCount)})`}{/if}</button>{/if}</svelte:fragment>
      <svelte:fragment slot="count">
      {#if chips.length}
        <ul class="chips" aria-label="Active filters">
          {#each chips as chip}<li><button type="button" class="chip" aria-label={`Remove filter ${chip.label}`} on:click={chip.remove}>{chip.label}<span aria-hidden="true">×</span></button></li>{/each}
        </ul>
      {/if}
      {#if chips.length || filters.q.trim()}<button type="button" class="clear" on:click={clearFilters}>Clear all</button>{/if}
      {#each hiddenOptions as option}
        <span class="reveal-wrap" class:open={explanationOpen} on:focusout={() => (explanationOpen = false)}>
          <button type="button" class="reveal" aria-describedby="hidden-explanation" on:click={() => { explanationOpen = false; setFacet(option.facet.id, option.value, true); }}>{hiddenLabel(option.count)}</button>
          <button type="button" class="reveal-help" aria-label="Why are these entries hidden?" aria-describedby="hidden-explanation" on:click={(event) => { explanationOpen = !explanationOpen; if (!explanationOpen) event.currentTarget.blur(); }}>?</button>
          <span class="reveal-explanation" id="hidden-explanation" role="tooltip">{HIDDEN_EXPLANATION}</span>
        </span>
      {/each}
      {#if kind.kind === 'quests' && overflowing}<span class="scroll-hint">Scroll sideways to see areas and givers</span>{/if}
      </svelte:fragment>
    </ListSearchCount>

    <div class="list" style={`--bar-height: ${barHeight}px`} bind:this={listElement}>
      <DataTable {columns} {widths} {sort} sticky {flowWide} onSort={(id, numeric) => { sort = toggleSort(sort, id, numeric); writeUrl('push'); }} label={kind.plural}>
        {#each shownRows as row (row.ref.key)}{@render listRow(row)}{/each}
      </DataTable>
      {#if filteredRows.length === 0}<p class="c-empty empty">No {readerNoun(kind.plural)} match these filters.</p>{/if}
    </div>
    {#if sampleRows.length}
      <!-- The sample only measures the widest values of each column. Readers and assistive technology never meet it. -->
      <div class="sample" aria-hidden="true" inert bind:this={sampleElement}>
        <DataTable {columns}>{#each sampleRows as row (row.ref.key)}{@render listRow(row)}{/each}</DataTable>
      </div>
    {/if}
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
  .filters-button { display: none; flex: none; min-height: 2.35rem; padding: .4rem .8rem; border: 1px solid var(--c-line-strong); border-radius: var(--c-radius-sm); background: var(--c-surface-2); color: var(--c-text); font-weight: 600; cursor: pointer; }

  /* The count and the active filter chips stay in view while the list scrolls, and the table header sticks below them. */
  /* A table that flows sticks its header below the result bar. A table that scrolls inside its card sticks it at the
     card's top, because the card is then its scrollport. */
  .list :global(.c-table-scroll--flow-wide .c-table--sticky thead th) { top: var(--bar-height, 0px); }
  .chips { display: contents; list-style: none; }
  .chip { display: inline-flex; align-items: center; gap: .4rem; min-height: 1.75rem; padding: .2rem .55rem; border: 1px solid var(--c-accent-line); border-radius: var(--c-radius-sm); background: transparent; color: var(--c-text); font-size: var(--c-text-small); cursor: pointer; }
  .chip span { color: var(--c-text-mute); }
  .chip:hover span { color: var(--c-text); }
  .clear { min-height: 1.75rem; padding: .2rem .6rem; border: 0; background: transparent; color: var(--c-accent); font-size: var(--c-text-small); text-decoration: underline; text-underline-offset: .2em; cursor: pointer; }
  .clear:disabled { color: var(--c-text-mute); cursor: default; }
  /* Hidden entries matter to few readers, so the reveal is a quiet text link at the end of the bar rather than a control. */
  /* Baseline alignment puts the "?" on the same baseline as the link text, so the mark centres on the letters rather than on the line box. */
  .reveal-wrap { position: relative; display: inline-flex; align-items: baseline; gap: .35rem; max-width: 100%; margin-left: auto; }
  .reveal { min-height: 1.75rem; padding: .2rem 0; border: 0; background: transparent; color: var(--c-text-mute); cursor: pointer; font-size: var(--c-text-small); text-align: left; text-decoration: underline dotted; text-underline-offset: .2em; }
  .reveal:hover { color: var(--c-text-dim); }
  .reveal-help { display: inline-grid; place-items: center; width: 1.3em; height: 1.3em; flex: none; padding: 0; border: 1px solid var(--c-line-strong); border-radius: 50%; background: transparent; color: var(--c-text-mute); cursor: pointer; font-size: var(--c-text-small); font-weight: 700; line-height: 1; }
  .reveal-help:hover { color: var(--c-text-dim); }
  .reveal-explanation { display: none; position: absolute; z-index: 5; top: calc(100% + .35rem); right: 0; width: min(19rem, 80vw); padding: .6rem .75rem; border: 1px solid var(--c-accent-line); border-radius: var(--c-radius-sm); background: var(--c-surface-2); color: var(--c-text); box-shadow: 0 .3rem .8rem rgb(0 0 0 / .18); font-size: var(--c-text-small); line-height: 1.4; pointer-events: none; }
  .reveal-wrap:hover .reveal-explanation, .reveal-wrap:focus-within .reveal-explanation, .reveal-wrap.open .reveal-explanation { display: block; }
  .filters-button:focus-visible, .chip:focus-visible, .clear:focus-visible, .reveal:focus-visible, .reveal-help:focus-visible, .close:focus-visible, .show:focus-visible { outline: 2px solid var(--c-accent); outline-offset: 2px; }
  .scroll-hint { margin-left: auto; color: var(--c-text-mute); font-size: var(--c-text-small); }

  .list { padding: .35rem .5rem .5rem; border: 1px solid var(--c-line); border-radius: var(--c-radius); background: var(--c-surface-1); }
  .empty { padding: 1.5rem .6rem; text-align: center; }
  .badges { display: inline-flex; flex-wrap: wrap; gap: .3rem; }
  /* The sample lays out its values on one line at their full width, out of sight and outside the page's layout. */
  .sample { position: absolute; width: 0; height: 0; overflow: hidden; visibility: hidden; pointer-events: none; contain: strict; }
  .sample :global(table) { width: max-content; }

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
    .list :global(tbody td.wide-fact) { grid-template-columns: minmax(0, 1fr); }
    .list :global(tbody td.description-fact::before) { display: none; }
    .list :global(tbody td::before) { content: attr(data-label); color: var(--c-text-dim); font-size: var(--c-text-label); font-weight: 700; }
    .list :global(tbody td.race-start .entity-link.truncate) { white-space: normal; }
    .list :global(tbody td.race-start .entity-link .name) { overflow: visible; text-overflow: clip; white-space: normal; }
    .list :global(tbody td:first-child) { grid-template-columns: 1fr; padding-bottom: .5rem; }
    .list :global(tbody td:first-child::before) { display: none; }
    .list :global(tbody td.blank) { display: none; }
  }
</style>
