<script lang="ts">
  import { base } from '$app/paths';
  import { onMount } from 'svelte';
  import type { PublicKindEntry, PublicSearchEntry } from '@afallon/contracts/public';
  import { clientAtlasLoader } from './client-publication';
  import { rankCompendiumEntries } from './atlas-search';
  import EntityLink from './EntityLink.svelte';

  export let registry: PublicKindEntry[] = [];
  export let limit = 8;

  let query = '';
  let entries: PublicSearchEntry[] = [];
  let loading = false;
  let error = '';

  $: results = query.trim() ? rankCompendiumEntries(query, entries).slice(0, limit) : [];

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
  <input id="compendium-search" type="search" bind:value={query} placeholder="Item, NPC, quest, or place" autocomplete="off" />
  {#if loading}<p role="status">Loading search…</p>{:else if error}<p class="error" role="alert">Search is unavailable.</p>{/if}
  {#if results.length > 0}<ul>{#each results as entry (entry.ref.key)}<li><EntityLink ref={entry.ref} {registry} tooltip={false} />{#if entry.place}<small>{entry.place}</small>{/if}{#if entry.placementIds.length}<a class="atlas-link" href={`${base}/?selected=${encodeURIComponent(entry.placementIds[0]!)}${entry.ref.kind === 'items' ? `&item=${encodeURIComponent(entry.ref.key)}` : ''}`}>Atlas location</a>{/if}</li>{/each}</ul>{:else if query.trim() && !loading}<p>No published page matches this search.</p>{/if}
</div>

<style>
  .compendium-search { position: relative; max-width: 36rem; }
  label { display: block; margin-bottom: .35rem; color: #bcb8ad; font-size: .68rem; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; }
  input { width: 100%; min-height: 2.6rem; padding: .55rem .65rem; border: 1px solid #4c4d48; border-radius: 2px; background: #171818; color: #eee9dd; }
  input:focus-visible, a:focus-visible { outline: 2px solid #d5b978; outline-offset: 2px; }
  ul { position: absolute; z-index: 12; left: 0; right: 0; display: grid; gap: 0; margin: .25rem 0 0; padding: .3rem; border: 1px solid #4c4d48; background: #202120; box-shadow: 0 8px 22px #0009; list-style: none; }
  li { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: .15rem .7rem; align-items: center; padding: .45rem; }
  li + li { border-top: 1px solid #393a37; } small { grid-column: 1; color: #aaa69d; }
  .atlas-link { grid-column: 2; grid-row: 1 / span 2; color: #d9bd79; font-size: .72rem; }
  p { margin: .45rem 0 0; color: #aaa69d; font-size: .75rem; } .error { color: #e5afa6; }
</style>
