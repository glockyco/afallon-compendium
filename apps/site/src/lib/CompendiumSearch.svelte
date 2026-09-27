<script lang="ts">
  import { base } from '$app/paths';
  import { onMount } from 'svelte';
  import type { PublicKindEntry, PublicSearchEntry } from '@afallon/contracts/public';
  import { clientAtlasLoader } from './client-publication';
  import { rankCompendiumEntries } from './atlas-search';
  import EntityLink from './EntityLink.svelte';
  import { levelText } from './format';

  export let registry: PublicKindEntry[] = [];
  export let limit = 8;

  let query = '';
  let entries: PublicSearchEntry[] = [];
  let loading = false;
  let error = '';

  $: results = query.trim() ? rankCompendiumEntries(query, entries).slice(0, limit) : [];

  // A result names the entity's level and its place when the search corpus publishes them.
  function entryDetail(entry: PublicSearchEntry): string {
    return [entry.level === undefined ? null : `Level ${levelText(entry.level)}`, entry.place].filter((part): part is string => Boolean(part)).join(' · ');
  }

  onMount(() => {
    const loader = clientAtlasLoader();
    if (!loader) return;
    loading = true;
    void Promise.all([loader.loadIndexes(), registry.length ? Promise.resolve(registry) : loader.loadRegistry()]).then(([indexes, loadedRegistry]) => {
      entries = indexes.entries;
      registry = loadedRegistry;
    }, (cause: unknown) => {
      error = cause instanceof Error ? cause.message : String(cause);
    }).finally(() => { loading = false; });
  });
</script>

<div class="compendium-search">
  <label for="compendium-search">Search the compendium</label>
  <div class="input-wrap">
    <input id="compendium-search" type="search" bind:value={query} placeholder="Item, NPC, quest, or place" autocomplete="off" aria-busy={loading} aria-describedby={error ? 'compendium-search-error' : undefined} class:has-error={Boolean(error)} />
    {#if loading}<span class="spinner" aria-hidden="true"></span>{:else if error}<span id="compendium-search-error" class="error" role="alert" title={error}>Search is unavailable.</span>{/if}
  </div>
  <span class="visually-hidden" role="status">{loading ? 'Loading search…' : ''}</span>
  {#if results.length > 0}<ul>{#each results as entry (entry.ref.key)}<li><EntityLink ref={entry.ref} {registry} tooltip={false} />{#if entryDetail(entry)}<small>{entryDetail(entry)}</small>{/if}{#if entry.ref.kind === 'places'}<a class="atlas-link" href={`${base}/?place=${encodeURIComponent(entry.ref.key)}`}>Atlas location</a>{:else if entry.hasPlacements}<a class="atlas-link" href={`${base}/?${entry.ref.kind === 'items' ? 'item' : 'entity'}=${encodeURIComponent(entry.ref.key)}`}>Atlas locations</a>{/if}</li>{/each}</ul>{:else if query.trim() && !loading && !error}<p>No published page matches this search.</p>{/if}
</div>

<style>
  .compendium-search { position: relative; max-width: 36rem; }
  label { display: block; margin-bottom: .35rem; color: #bcb8ad; font-size: .68rem; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; }
  .input-wrap { position: relative; }
  input { width: 100%; min-height: 2.6rem; padding: .55rem .65rem; border: 1px solid #4c4d48; border-radius: 2px; background: #171818; color: #eee9dd; }
  input:where(.has-error) { padding-right: 10rem; }
  .spinner { position: absolute; top: 50%; right: .85rem; width: 1rem; height: 1rem; margin-top: -.5rem; border: 2px solid var(--c-text-mute); border-top-color: var(--c-accent); border-radius: 50%; pointer-events: none; animation: spin .7s linear infinite; }
  .error { position: absolute; top: 50%; right: .65rem; transform: translateY(-50%); color: #e5afa6; font-size: .75rem; pointer-events: none; }
  .visually-hidden { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }
  @keyframes spin { to { transform: rotate(360deg); } }
  @media (prefers-reduced-motion: reduce) { .spinner { animation: none; } }
  input:focus-visible, a:focus-visible { outline: 2px solid #d5b978; outline-offset: 2px; }
  ul { position: absolute; z-index: 12; left: 0; right: 0; display: grid; gap: 0; margin: .25rem 0 0; padding: .3rem; border: 1px solid #4c4d48; background: #202120; box-shadow: 0 8px 22px #0009; list-style: none; }
  li { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: .15rem .7rem; align-items: center; padding: .45rem; }
  li + li { border-top: 1px solid #393a37; } small { grid-column: 1; color: #aaa69d; }
  .atlas-link { grid-column: 2; grid-row: 1 / span 2; color: #d9bd79; font-size: .72rem; }
  p { margin: .45rem 0 0; color: #aaa69d; font-size: .75rem; }
</style>
