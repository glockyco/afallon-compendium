<script lang="ts">
  import { onMount } from 'svelte';
  import { afterNavigate, goto } from '$app/navigation';
  import type { PublicKindEntry, PublicSearchEntry } from '@afallon/contracts/public';
  import { clientMapLoader } from './client-publication';
  import { rankCompendiumEntries } from './map-search';
  import EntityLink from './EntityLink.svelte';
  import { levelText, searchPlaceholder } from './format';
  import { entityOnMap, itemOnMap, nodeOnMap, placeOnMap } from './map-links';
  import { Search } from 'lucide';
  import { iconNodeToSvg } from './icon-svg';

  const searchGlyph = iconNodeToSvg(Search, 'currentColor');

  export let registry: PublicKindEntry[] = [];
  export let limit = 8;
  /**
   * The header shows the compact field, and the hub shows the large field. The component owns both sizes, so no page
   * style competes with them. The label is for screen readers in both.
   */
  export let size: 'compact' | 'large' = 'compact';

  let query = '';
  // Results show only while the reader is using the search. Focus leaving the search, Escape, or a followed result
  // closes them. Clicking the field, typing, or an arrow key reopens the same query.
  let open = false;
  let active = -1;
  let root: HTMLDivElement;
  let entries: PublicSearchEntry[] = [];
  let loading = false;
  let error = '';

  $: results = query.trim() ? rankCompendiumEntries(query, entries).slice(0, limit) : [];
  $: if (active >= results.length) active = results.length - 1;
  $: listId = `compendium-search-results-${size}`;
  // The hub's large field names what it finds. The header's field is narrow, so it says only what it searches.
  $: placeholder = size === 'large' ? searchPlaceholder(registry.filter((entry) => entry.searchable).map((entry) => entry.plural)) : 'Search the Compendium';

  // A result names its kind first. The level and the place follow when the search corpus publishes them.
  function entryDetail(entry: PublicSearchEntry): string {
    const kind = registry.find((candidate) => candidate.kind === entry.ref.kind)?.label;
    return [kind, entry.level === undefined ? null : `Level ${levelText(entry.level)}`, entry.place].filter((part): part is string => Boolean(part)).join(' · ');
  }

  // The search corpus is large, and parsing it holds the main thread. It loads when a reader first focuses or types in
  // the field, not with every page or on a passing pointer. The spinner shows in the field until it is ready.
  let requested = false;
  function loadSearch(): void {
    if (requested) return;
    const loader = clientMapLoader();
    if (!loader) return;
    requested = true;
    loading = true;
    void Promise.all([loader.loadIndexes(), registry.length ? Promise.resolve(registry) : loader.loadRegistry()]).then(([indexes, loadedRegistry]) => {
      entries = indexes.entries;
      registry = loadedRegistry;
    }, (cause: unknown) => {
      error = cause instanceof Error ? cause.message : String(cause);
    }).finally(() => { loading = false; });
  }
  // A reader may type before hydration ends. The field then already has focus or text, so the corpus loads at once.
  onMount(() => { if (query || document.activeElement?.id === 'compendium-search') loadSearch(); });
  // A followed result or any other navigation ends the search, so the next page opens without stale results.
  afterNavigate((navigated) => { if (navigated.type === 'enter') return; open = false; active = -1; query = ''; });

  function close(): void { open = false; active = -1; }
  function focusOut(event: FocusEvent): void {
    if (!root.contains(event.relatedTarget as Node | null)) close();
  }
  // Escape closes the results from the field or from a focused result, and returns focus to the field.
  function escape(event: KeyboardEvent): void {
    if (event.key !== 'Escape' || !open) return;
    close();
    root.querySelector<HTMLInputElement>('input')?.focus();
    event.preventDefault();
  }
  function keydown(event: KeyboardEvent): void {
    if (!results.length) return;
    if (event.key === 'ArrowDown') { open = true; active = (active + 1) % results.length; event.preventDefault(); }
    else if (event.key === 'ArrowUp') { open = true; active = active <= 0 ? results.length - 1 : active - 1; event.preventDefault(); }
    else if (event.key === 'Enter') {
      const entry = results[Math.max(active, 0)];
      const link = root.querySelector<HTMLAnchorElement>(`#${listId}-${Math.max(active, 0)} a.entity-link`);
      if (entry && link) { event.preventDefault(); void goto(link.href); }
    }
  }
</script>

<div class="compendium-search" class:large={size === 'large'} bind:this={root} on:focusout={focusOut} on:keydown={escape}>
  <label for="compendium-search" class="visually-hidden">Search the Compendium</label>
  <div class="input-wrap">
    <span class="glyph" aria-hidden="true">{@html searchGlyph}</span>
    <input id="compendium-search" type="search" bind:value={query} {placeholder} autocomplete="off" aria-busy={loading} aria-describedby={error ? 'compendium-search-error' : undefined} class:has-error={Boolean(error)} role="combobox" aria-expanded={open && results.length > 0} aria-controls={listId} aria-autocomplete="list"
      aria-activedescendant={open && active >= 0 ? `${listId}-${active}` : undefined}
      on:focus={loadSearch} on:click={() => { if (query) open = true; }} on:input={() => { loadSearch(); open = true; active = -1; }} on:keydown={keydown} />
    {#if loading}<span class="spinner" aria-hidden="true"></span>{:else if error}<span id="compendium-search-error" class="error" role="alert" title={error}>Search is unavailable.</span>{/if}
  </div>
  <span class="visually-hidden" role="status">{loading ? 'Loading search…' : ''}</span>
  {#if open && results.length > 0}<ul id={listId} role="listbox" aria-label="Search results">{#each results as entry, index (entry.ref.key)}<li id={`${listId}-${index}`} role="option" aria-selected={index === active} class:active={index === active}><EntityLink ref={entry.ref} {registry} tooltip={false} />{#if entryDetail(entry)}<small>{entryDetail(entry)}</small>{/if}{#if entry.ref.kind === 'places'}<a class="map-link" href={placeOnMap(entry.ref.key)}>Show on Map</a>{:else if entry.hasPlacements}<a class="map-link" href={entry.ref.kind === 'items' ? itemOnMap(entry.ref.key) : entry.ref.kind === 'gatheringNodes' ? nodeOnMap(entry.ref.key) : entityOnMap(entry.ref.key)}>Show on Map</a>{/if}</li>{/each}</ul>{:else if open && query.trim() && !loading && !error}<p class="empty" role="status">No page matches this search.</p>{/if}
</div>

<style>
  .compendium-search { position: relative; max-width: 36rem; }
  .input-wrap { position: relative; }
  input { width: 100%; min-height: 2.3rem; padding: .4rem .65rem .4rem 2.1rem; border: 1px solid var(--c-line); border-radius: var(--c-radius-sm); background: var(--c-surface-0); color: var(--c-text-strong); }
  input:hover { border-color: var(--c-line-strong); }
  .glyph { position: absolute; top: 50%; left: .7rem; display: flex; color: var(--c-text-mute); transform: translateY(-50%); pointer-events: none; }
  .glyph :global(svg) { width: 1rem; height: 1rem; }
  .large .glyph { left: 1rem; }
  .large .glyph :global(svg) { width: 1.2rem; height: 1.2rem; }
  /* The large field sits on the artwork of the hub. It sets only its left padding, so the error state keeps its room. */
  .large { max-width: none; }
  .large input { min-height: 3.2rem; padding-left: 2.8rem; border-color: var(--c-frame-strong); border-radius: 6px; background: color-mix(in srgb, var(--c-surface-deep) 88%, transparent); font-size: var(--c-text-prose); box-shadow: 0 10px 30px var(--c-shadow); }
  input:where(.has-error) { padding-right: 10rem; }
  .spinner { position: absolute; top: 50%; right: .85rem; width: 1rem; height: 1rem; margin-top: -.5rem; border: 2px solid var(--c-text-mute); border-top-color: var(--c-accent); border-radius: 50%; pointer-events: none; animation: spin .7s linear infinite; }
  .error { position: absolute; top: 50%; right: .65rem; transform: translateY(-50%); color: var(--c-danger); font-size: var(--c-text-small); pointer-events: none; }
  .visually-hidden { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }
  @keyframes spin { to { transform: rotate(360deg); } }
  @media (prefers-reduced-motion: reduce) { .spinner { animation: none; } }
  input:focus-visible, a:focus-visible { outline: 2px solid var(--c-accent); outline-offset: 2px; }
  /* The results open under the field's right edge and are never narrower than a result line, even beside a short field. */
  ul, .empty { position: absolute; z-index: 12; right: 0; width: max(100%, min(24rem, calc(100vw - 2rem))); margin: .25rem 0 0; border: 1px solid var(--c-line-strong); background: var(--c-surface-1); box-shadow: 0 8px 22px var(--c-shadow); }
  ul { display: grid; gap: 0; padding: .3rem; list-style: none; }
  .empty { padding: .75rem; color: var(--c-text-dim); font-size: var(--c-text-small); }
  li { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: .15rem .7rem; align-items: center; padding: .45rem; }
  li + li { border-top: 1px solid var(--c-line); }
  li.active { background: var(--c-surface-3); box-shadow: inset 2px 0 0 var(--c-accent); } small { grid-column: 1; color: var(--c-text-dim); }
  .map-link { grid-column: 2; grid-row: 1 / span 2; color: var(--c-accent); font-size: var(--c-text-small); }
</style>
