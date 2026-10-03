<script lang="ts">
  import { onMount } from 'svelte';
  import type { PublicKindEntry, PublicSearchEntry } from '@afallon/contracts/public';
  import { clientMapLoader } from './client-publication';
  import { rankCompendiumEntries } from './map-search';
  import EntityLink from './EntityLink.svelte';
  import { levelText, searchPlaceholder } from './format';
  import { entityOnMap, itemOnMap, placeOnMap } from './map-links';
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
  let entries: PublicSearchEntry[] = [];
  let loading = false;
  let error = '';

  $: results = query.trim() ? rankCompendiumEntries(query, entries).slice(0, limit) : [];
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
</script>

<div class="compendium-search" class:large={size === 'large'}>
  <label for="compendium-search" class="visually-hidden">Search the Compendium</label>
  <div class="input-wrap">
    <span class="glyph" aria-hidden="true">{@html searchGlyph}</span>
    <input id="compendium-search" type="search" bind:value={query} {placeholder} autocomplete="off" aria-busy={loading} aria-describedby={error ? 'compendium-search-error' : undefined} class:has-error={Boolean(error)} on:focus={loadSearch} on:input={loadSearch} />
    {#if loading}<span class="spinner" aria-hidden="true"></span>{:else if error}<span id="compendium-search-error" class="error" role="alert" title={error}>Search is unavailable.</span>{/if}
  </div>
  <span class="visually-hidden" role="status">{loading ? 'Loading search…' : ''}</span>
  {#if results.length > 0}<ul>{#each results as entry (entry.ref.key)}<li><EntityLink ref={entry.ref} {registry} tooltip={false} />{#if entryDetail(entry)}<small>{entryDetail(entry)}</small>{/if}{#if entry.ref.kind === 'places'}<a class="map-link" href={placeOnMap(entry.ref.key)}>View on Map</a>{:else if entry.hasPlacements}<a class="map-link" href={entry.ref.kind === 'items' ? itemOnMap(entry.ref.key) : entityOnMap(entry.ref.key)}>View on Map</a>{/if}</li>{/each}</ul>{:else if query.trim() && !loading && !error}<p class="empty" role="status">No published page matches this search.</p>{/if}
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
  li + li { border-top: 1px solid var(--c-line); } small { grid-column: 1; color: var(--c-text-dim); }
  .map-link { grid-column: 2; grid-row: 1 / span 2; color: var(--c-accent); font-size: var(--c-text-small); }
</style>
