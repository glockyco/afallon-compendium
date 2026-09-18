<script lang="ts">
  import { browser } from '$app/environment';
  import { pushState, replaceState } from '$app/navigation';
  import { page } from '$app/stores';
  import type { ListRow, PublicKindEntry, StaticKindList } from '@afallon/contracts/public';
  import EntityLink from './EntityLink.svelte';
  import MissingValue from './MissingValue.svelte';

  export let list: StaticKindList;
  export let kind: PublicKindEntry;
  export let registry: PublicKindEntry[];

  let nameFilter = '';
  let sortId = 'name';
  let direction: 'asc' | 'desc' = 'asc';
  let facetValues: Record<string, string[]> = {};
  let minimums: Record<string, string> = {};
  let maximums: Record<string, string> = {};
  let currentSearch = '';

  $: facetOptions = Object.fromEntries(kind.facets.map((facet) => [facet.id, [...new Set(list.rows.flatMap((row) => row.facets[facet.id] ?? []))].sort((left, right) => left.localeCompare(right))]));
  $: numericColumns = kind.columns.filter((column) => column.numeric);
  $: incomingSearch = browser ? $page.url.search : '';
  $: if (browser && incomingSearch !== currentSearch) readUrl($page.url);
  $: filteredRows = list.rows
    .filter((row) => matchesFilters(row, nameFilter, facetValues, minimums, maximums))
    .sort((left, right) => compareRows(left, right, sortId, direction));

  function readUrl(url: URL): void {
    currentSearch = url.search;
    nameFilter = url.searchParams.get('q') ?? '';
    const requestedSort = url.searchParams.get('sort') ?? 'name';
    sortId = requestedSort === 'name' || kind.columns.some((column) => column.id === requestedSort) ? requestedSort : 'name';
    direction = url.searchParams.get('dir') === 'desc' ? 'desc' : 'asc';
    facetValues = Object.fromEntries(kind.facets.map((facet) => [facet.id, url.searchParams.getAll(`facet.${facet.id}`)]));
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

  function compareRows(
    left: ListRow,
    right: ListRow,
    activeSort: string,
    activeDirection: 'asc' | 'desc',
  ): number {
    const leftValue = activeSort === 'name' ? left.ref.name : left.values[activeSort];
    const rightValue = activeSort === 'name' ? right.ref.name : right.values[activeSort];
    let comparison = 0;
    if (typeof leftValue === 'number' && typeof rightValue === 'number') comparison = leftValue - rightValue;
    else comparison = String(leftValue ?? '').localeCompare(String(rightValue ?? ''), undefined, { numeric: true });
    if (comparison === 0) comparison = left.ref.name.localeCompare(right.ref.name);
    return activeDirection === 'asc' ? comparison : -comparison;
  }

  function writeUrl(history: 'push' | 'replace'): void {
    const url = new URL(window.location.href);
    const write = (key: string, value: string) => value ? url.searchParams.set(key, value) : url.searchParams.delete(key);
    write('q', nameFilter.trim());
    write('sort', sortId === 'name' ? '' : sortId);
    write('dir', direction === 'asc' ? '' : direction);
    for (const facet of kind.facets) {
      const key = `facet.${facet.id}`;
      url.searchParams.delete(key);
      for (const value of facetValues[facet.id] ?? []) url.searchParams.append(key, value);
    }
    for (const column of numericColumns) {
      write(`min.${column.id}`, minimums[column.id] ?? '');
      write(`max.${column.id}`, maximums[column.id] ?? '');
    }
    if (history === 'push') pushState(url, {}); else replaceState(url, {});
  }

  function setFacet(id: string, select: HTMLSelectElement): void {
    facetValues = { ...facetValues, [id]: [...select.selectedOptions].map((option) => option.value) };
    writeUrl('push');
  }

  function setMinimum(id: string, value: string): void {
    minimums = { ...minimums, [id]: value };
    writeUrl('push');
  }

  function setMaximum(id: string, value: string): void {
    maximums = { ...maximums, [id]: value };
    writeUrl('push');
  }

  function setSort(id: string): void {
    if (sortId === id) direction = direction === 'asc' ? 'desc' : 'asc';
    else { sortId = id; direction = 'asc'; }
    writeUrl('push');
  }
</script>

<div class="filters">
  <label>Name<input type="search" bind:value={nameFilter} on:input={() => writeUrl('replace')} placeholder={`Filter ${kind.plural.toLocaleLowerCase()}`} /></label>
  {#each kind.facets as facet}<label>{facet.label}<select multiple size={Math.min(4, Math.max(2, facetOptions[facet.id]?.length ?? 2))} on:change={(event) => setFacet(facet.id, event.currentTarget)} aria-label={`${facet.label}; select one or more`}>{#each facetOptions[facet.id] ?? [] as option}<option value={option} selected={(facetValues[facet.id] ?? []).includes(option)}>{option}</option>{/each}</select></label>{/each}
  {#each numericColumns as column}<fieldset><legend>{column.label}</legend><label>Min<input type="number" value={minimums[column.id] ?? ''} on:change={(event) => setMinimum(column.id, event.currentTarget.value)} /></label><label>Max<input type="number" value={maximums[column.id] ?? ''} on:change={(event) => setMaximum(column.id, event.currentTarget.value)} /></label></fieldset>{/each}
</div>
<p class="result-count" aria-live="polite">{filteredRows.length} {filteredRows.length === 1 ? kind.label.toLocaleLowerCase() : kind.plural.toLocaleLowerCase()}</p>
<div class="list-scroll"><table><thead><tr><th><button type="button" on:click={() => setSort('name')}>Name{sortId === 'name' ? (direction === 'asc' ? ' ↑' : ' ↓') : ''}</button></th>{#each kind.columns as column}<th><button type="button" disabled={!column.sortable} on:click={() => column.sortable && setSort(column.id)}>{column.label}{sortId === column.id ? (direction === 'asc' ? ' ↑' : ' ↓') : ''}</button></th>{/each}</tr></thead><tbody>{#each filteredRows as row (row.ref.key)}<tr><td data-label="Name"><EntityLink ref={row.ref} {registry} /></td>{#each kind.columns as column}<td data-label={column.label}>{#if row.values[column.id] === null || row.values[column.id] === undefined}<MissingValue explanation={`No ${column.label.toLocaleLowerCase()} is published`} />{:else}{row.values[column.id]}{/if}</td>{/each}</tr>{/each}</tbody></table></div>

<style>
  .filters { display: grid; grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr)); gap: .75rem; margin: 1.25rem 0; padding: .9rem; border: 1px solid #3d3e3a; background: #202120; }
  label, legend { color: #bcb8ad; font-size: .7rem; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; }
  input, select { width: 100%; min-height: 2.5rem; margin-top: .35rem; padding: .45rem .55rem; border: 1px solid #4c4d48; border-radius: 2px; background: #171818; color: #eee9dd; }
  fieldset { display: grid; grid-template-columns: 1fr 1fr; gap: .4rem; margin: 0; padding: 0; border: 0; } fieldset legend { grid-column: 1 / -1; }
  .result-count { color: #aaa69d; font-size: .78rem; } .list-scroll { overflow-x: auto; }
  table { width: 100%; border-collapse: collapse; background: #202120; font-size: .84rem; }
  th, td { padding: .65rem; border-bottom: 1px solid #3a3b37; text-align: left; vertical-align: middle; }
  th button { border: 0; padding: 0; background: none; color: #c8c3b7; font-size: .68rem; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; }
  th button:disabled { cursor: default; opacity: 1; }
  button:focus-visible, input:focus-visible, select:focus-visible { outline: 2px solid #d5b978; outline-offset: 2px; }
  @media (max-width: 640px) {
    .list-scroll { overflow: visible; } table, tbody, tr, td { display: block; } thead { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }
    tbody { display: grid; gap: .75rem; } tr { padding: .65rem; border: 1px solid #3a3b37; background: #202120; }
    td { display: grid; grid-template-columns: minmax(7rem, .7fr) minmax(0, 1fr); gap: .6rem; padding: .4rem 0; border: 0; }
    td::before { content: attr(data-label); color: #aaa69d; font-size: .68rem; font-weight: 700; text-transform: uppercase; }
  }
</style>
