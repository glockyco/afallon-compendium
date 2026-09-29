<script lang="ts">
  import { pushState, replaceState } from '$app/navigation';
  import { onMount } from 'svelte';
  import type { ListRow, PublicKindEntry, StaticKindList } from '@afallon/contracts/public';
  import { categoryLabel } from '@afallon/contracts/public';
  import Badge from './Badge.svelte';
  import DataTable, { type TableColumn } from './DataTable.svelte';
  import EntityLink from './EntityLink.svelte';
  import { compareFacetValues, formatNumber, questStartLabel, rarityTone, readerNoun, roleLabel, sourceKindLabel } from './format';
  import { sortRows, toggleSort, type SortState, type SortValue } from './table';

  export let list: StaticKindList;
  export let kind: PublicKindEntry;
  export let registry: PublicKindEntry[];

  // Published column and facet ids whose values are native enums, marker roles, item source kinds, or quest start
  // kinds rather than authored names. Everything else prints as published, because a place or faction name is text.
  const ENUM_FIELDS: Record<string, true> = { rarity: true, itemType: true, slot: true, placeType: true };
  const ROLE_FIELDS: Record<string, true> = { role: true };
  const SOURCE_KIND_FIELDS: Record<string, true> = { sourceKind: true };
  const QUEST_START_FIELDS: Record<string, true> = { startType: true };
  const BOOLEAN_LABELS: Record<string, string> = { true: 'Yes', false: 'No' };
  // Currency columns carry the game's coin colour, as a price does on a page.
  const PRICE_FIELDS: Record<string, true> = { sellPrice: true, buyPrice: true, price: true, income: true };

  let nameFilter = '';
  let sort: SortState = { id: 'name', dir: 'asc' };
  let facetValues: Record<string, string[]> = {};
  let minimums: Record<string, string> = {};
  let maximums: Record<string, string> = {};

  $: facetOptions = Object.fromEntries(kind.facets.map((facet) => [
    facet.id,
    [...new Set(list.rows.flatMap((row) => row.facets[facet.id] ?? []))].sort((left, right) => compareFacetValues(facet.id, left, right)),
  ]));
  $: numericColumns = visibleColumns.filter((column) => column.numeric);
  // A facet with one value in the whole list separates nothing, so the control leaves.
  $: visibleFacets = kind.facets.filter((facet) => (facetOptions[facet.id] ?? []).length > 1);
  // A column no row fills says nothing about this kind, so it leaves rather than print a dash in
  // every row. A column some rows fill stays, and the rows without a value stay blank.
  $: visibleColumns = kind.columns.filter((column) => list.rows.some((row) => row.values[column.id] !== null && row.values[column.id] !== undefined));
  $: columns = [
    { id: 'name', label: kind.label, sortable: true },
    ...visibleColumns.map((column) => ({ id: column.id, label: column.label, numeric: column.numeric, sortable: column.sortable })),
  ] satisfies TableColumn[];
  $: filteredRows = sortRows(list.rows.filter((row) => matchesFilters(row, nameFilter, facetValues, minimums, maximums)), sortValue, sort);
  $: activeFilters = nameFilter.trim().length > 0
    || Object.values(facetValues).some((values) => values.length > 0)
    || Object.values(minimums).some(Boolean) || Object.values(maximums).some(Boolean);

  onMount(() => {
    const restore = () => readUrl(new URL(window.location.href));
    restore();
    window.addEventListener('popstate', restore);
    return () => window.removeEventListener('popstate', restore);
  });

  function readUrl(url: URL): void {
    nameFilter = url.searchParams.get('q') ?? '';
    const requestedSort = url.searchParams.get('sort') ?? 'name';
    const sortId = requestedSort === 'name' || kind.columns.some((column) => column.id === requestedSort) ? requestedSort : 'name';
    sort = { id: sortId, dir: url.searchParams.get('dir') === 'desc' ? 'desc' : 'asc' };
    facetValues = Object.fromEntries(kind.facets.map((facet) => [facet.id, url.searchParams.getAll(facet.id)]));
    minimums = Object.fromEntries(numericColumns.map((column) => [column.id, url.searchParams.get(`min.${column.id}`) ?? '']));
    maximums = Object.fromEntries(numericColumns.map((column) => [column.id, url.searchParams.get(`max.${column.id}`) ?? '']));
  }

  function matchesFilters(
    row: ListRow,
    filter: string,
    selectedFacets: Record<string, string[]>,
    selectedMinimums: Record<string, string>,
    selectedMaximums: Record<string, string>,
  ): boolean {
    const needle = filter.trim().toLocaleLowerCase();
    if (needle && !row.ref.name.toLocaleLowerCase().includes(needle)) return false;
    for (const facet of kind.facets) {
      const selected = selectedFacets[facet.id] ?? [];
      if (selected.length && !selected.some((value) => (row.facets[facet.id] ?? []).includes(value))) return false;
    }
    for (const column of numericColumns) {
      const value = row.values[column.id];
      const minimum = selectedMinimums[column.id] ? Number(selectedMinimums[column.id]) : undefined;
      const maximum = selectedMaximums[column.id] ? Number(selectedMaximums[column.id]) : undefined;
      if (minimum !== undefined && (typeof value !== 'number' || value < minimum)) return false;
      if (maximum !== undefined && (typeof value !== 'number' || value > maximum)) return false;
    }
    return true;
  }

  function sortValue(row: ListRow, id: string): SortValue {
    return id === 'name' ? row.ref.name : row.values[id];
  }

  function writeUrl(history: 'push' | 'replace'): void {
    const url = new URL(window.location.href);
    const write = (key: string, value: string) => value ? url.searchParams.set(key, value) : url.searchParams.delete(key);
    write('q', nameFilter.trim());
    write('sort', sort.id === 'name' ? '' : sort.id);
    write('dir', sort.dir === 'asc' ? '' : sort.dir);
    for (const facet of kind.facets) {
      url.searchParams.delete(facet.id);
      for (const value of facetValues[facet.id] ?? []) url.searchParams.append(facet.id, value);
    }
    for (const column of numericColumns) {
      write(`min.${column.id}`, minimums[column.id] ?? '');
      write(`max.${column.id}`, maximums[column.id] ?? '');
    }
    if (history === 'push') pushState(url, {}); else replaceState(url, {});
  }

  function setFacet(id: string, value: string): void {
    facetValues = { ...facetValues, [id]: value ? [value] : [] };
    writeUrl('push');
  }

  function setRange(bounds: 'min' | 'max', id: string, value: string): void {
    if (bounds === 'min') minimums = { ...minimums, [id]: value };
    else maximums = { ...maximums, [id]: value };
    writeUrl('push');
  }

  function clearFilters(): void {
    nameFilter = '';
    facetValues = {};
    minimums = {};
    maximums = {};
    writeUrl('push');
  }

  function fieldLabel(id: string, value: string): string {
    if (BOOLEAN_LABELS[value]) return BOOLEAN_LABELS[value]!;
    if (ROLE_FIELDS[id]) return roleLabel(value);
    if (SOURCE_KIND_FIELDS[id]) return sourceKindLabel(value);
    if (QUEST_START_FIELDS[id]) return questStartLabel(value);
    return ENUM_FIELDS[id] ? categoryLabel(value) : value;
  }

  // A column that shares its id with a facet shows the facet's values, so a row with several roles or start kinds
  // labels each one. Any other column shows its one published value.
  function cellValues(row: ListRow, id: string): string[] {
    const values = row.facets[id];
    return values && values.length > 0 ? values : [String(row.values[id])];
  }
</script>

<form class="filters" role="search" on:submit|preventDefault>
  <label class="field wide">
    <span>Name</span>
    <input type="search" bind:value={nameFilter} on:input={() => writeUrl('replace')} placeholder={`Filter ${readerNoun(kind.plural)}`} />
  </label>
  {#each visibleFacets as facet}
    <label class="field">
      <span>{facet.label}</span>
      <select value={(facetValues[facet.id] ?? [])[0] ?? ''} on:change={(event) => setFacet(facet.id, event.currentTarget.value)}>
        <option value="">All</option>
        {#each facetOptions[facet.id] ?? [] as option}<option value={option}>{fieldLabel(facet.id, option)}</option>{/each}
      </select>
    </label>
  {/each}
  {#each numericColumns as column}
    <fieldset class="field range">
      <legend>{column.label}</legend>
      <input type="number" inputmode="numeric" aria-label={`Minimum ${readerNoun(column.label)}`} placeholder="Min" value={minimums[column.id] ?? ''} on:change={(event) => setRange('min', column.id, event.currentTarget.value)} />
      <span aria-hidden="true">–</span>
      <input type="number" inputmode="numeric" aria-label={`Maximum ${readerNoun(column.label)}`} placeholder="Max" value={maximums[column.id] ?? ''} on:change={(event) => setRange('max', column.id, event.currentTarget.value)} />
    </fieldset>
  {/each}
</form>

<div class="result-bar">
  <p aria-live="polite"><strong>{formatNumber(filteredRows.length)}</strong> {filteredRows.length === 1 ? readerNoun(kind.label) : readerNoun(kind.plural)}{#if filteredRows.length !== list.rows.length}{' of '}{formatNumber(list.rows.length)}{/if}</p>
  {#if activeFilters}<button type="button" class="clear" on:click={clearFilters}>Clear filters</button>{/if}
</div>

<div class="list">
  <DataTable {columns} {sort} sticky flowWide onSort={(id, numeric) => { sort = toggleSort(sort, id, numeric); writeUrl('push'); }} label={kind.plural}>
    {#each filteredRows as row (row.ref.key)}
      <tr>
        <td data-label={kind.label}><EntityLink ref={row.ref} {registry} rarity={rarityTone(String(row.values.rarity ?? ''))} /></td>
        {#each visibleColumns as column}
          <td data-label={column.label} class:c-num={column.numeric} class:blank={row.values[column.id] === null || row.values[column.id] === undefined}>
            {#if row.values[column.id] === null || row.values[column.id] === undefined}
              <!-- A list cell without a value states nothing: the entity has no such fact. -->
            {:else if column.id === 'rarity'}
              <span data-rarity={rarityTone(String(row.values[column.id]))}><Badge label={fieldLabel(column.id, String(row.values[column.id]))} tone="rarity" /></span>
            {:else if column.id === 'role'}
              <span class="badges">{#each cellValues(row, column.id) as role}<Badge label={fieldLabel(column.id, role)} tone={role === 'boss' ? 'boss' : 'neutral'} />{/each}</span>
            {:else if typeof row.values[column.id] === 'number'}
              <span class:c-price={PRICE_FIELDS[column.id]}>{formatNumber(row.values[column.id] as number)}</span>
            {:else}
              {cellValues(row, column.id).map((value) => fieldLabel(column.id, value)).join(', ')}
            {/if}
          </td>
        {/each}
      </tr>
    {/each}
  </DataTable>
  {#if filteredRows.length === 0}<p class="c-empty empty">No {readerNoun(kind.plural)} match these filters.</p>{/if}
</div>

<style>
  .filters { gap: .75rem 1rem; display: flex; flex-wrap: wrap; align-items: end; margin: 0 0 1rem; padding: .9rem 1rem; border: 1px solid var(--c-line); border-radius: var(--c-radius); background: var(--c-surface-1); }
  /* Fields grow to share one row and wrap only when the page is narrow. */
  .field { display: grid; flex: 1 1 8.5rem; gap: .3rem; margin: 0; padding: 0; border: 0; min-width: 0; }
  .wide { flex: 2 1 14rem; }
  .field > span, legend { padding: 0; color: var(--c-text-dim); font-size: var(--c-text-label); font-weight: 700; letter-spacing: .07em; text-transform: uppercase; }
  input, select { width: 100%; min-height: 2.35rem; padding: .4rem .55rem; border: 1px solid var(--c-line-strong); border-radius: var(--c-radius-sm); background: var(--c-surface-sunken); color: var(--c-text); }
  select { appearance: none; padding-right: 1.6rem; background-image: linear-gradient(45deg, transparent 50%, var(--c-text-mute) 50%), linear-gradient(135deg, var(--c-text-mute) 50%, transparent 50%); background-position: right 1rem center, right .65rem center; background-size: .35rem .35rem; background-repeat: no-repeat; }
  input:focus-visible, select:focus-visible, .clear:focus-visible { outline: 2px solid var(--c-accent); outline-offset: 2px; }
  .range { display: grid; grid-template-columns: 1fr auto 1fr; gap: .3rem; align-items: center; }
  .range legend { grid-column: 1 / -1; }
  .range span { color: var(--c-text-mute); }
  /* Spin buttons cover the placeholder of a narrow range field. */
  .range input { appearance: textfield; -moz-appearance: textfield; }
  .range input::-webkit-inner-spin-button, .range input::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }

  .result-bar { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: .5rem; margin-bottom: .6rem; }
  .result-bar p { margin: 0; color: var(--c-text-dim); font-size: var(--c-text-small); }
  .result-bar strong { color: var(--c-text); font-variant-numeric: tabular-nums; }
  .clear { padding: .3rem .65rem; border: 1px solid var(--c-line-strong); border-radius: var(--c-radius-sm); background: transparent; color: var(--c-text-soft); font-size: var(--c-text-small); }
  .clear:hover { border-color: var(--c-accent-line); color: var(--c-text); }

  .list { padding: .35rem .5rem .5rem; border: 1px solid var(--c-line); border-radius: var(--c-radius); background: var(--c-surface-1); }
  .empty { padding: 1.5rem .6rem; text-align: center; }
  .badges { display: inline-flex; flex-wrap: wrap; gap: .3rem; }

  @media (max-width: 640px) {
    .filters { flex-direction: column; align-items: stretch; }
    .list { padding: 0; border: 0; background: none; }
    .list :global(.c-table-scroll) { overflow: visible; }
    .list :global(table), .list :global(tbody), .list :global(tr), .list :global(td) { display: block; min-width: 0; }
    .list :global(thead) { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); }
    .list :global(tbody) { display: grid; gap: .6rem; }
    .list :global(tbody tr) { padding: .6rem .7rem; border: 1px solid var(--c-line); border-radius: var(--c-radius); background: var(--c-surface-1); }
    .list :global(tbody tr:nth-child(even)) { background: var(--c-surface-1); }
    .list :global(tbody td) { display: grid; grid-template-columns: minmax(6rem, .6fr) minmax(0, 1fr); gap: .6rem; padding: .3rem 0; border: 0; text-align: left; }
    .list :global(tbody td::before) { content: attr(data-label); color: var(--c-text-dim); font-size: var(--c-text-label); font-weight: 700; letter-spacing: .05em; text-transform: uppercase; }
    .list :global(tbody td:first-child) { grid-template-columns: 1fr; padding-bottom: .5rem; }
    .list :global(tbody td:first-child::before) { display: none; }
    .list :global(tbody td.blank) { display: none; }
  }
</style>
