<script lang="ts">
  import { base } from '$app/paths';
  import SeoHead from '$lib/SeoHead.svelte';
  import { STEAM_GUIDE_URL, UNOFFICIAL_NOTICE } from '$lib/seo';
  import MapExplorer from '$lib/MapExplorer.svelte';
  import type { PageData } from './$types';
  export let data: PageData;
</script>

<SeoHead title="Afallon Interactive Map | Afallon Wiki" description="Find Afallon bosses, dungeons, merchants, quests, resources and item sources on the interactive map. Search locations and travel points." />

<MapExplorer release={data.release} />

<section class="map-context" aria-labelledby="map-heading">
  <h1 id="map-heading">Afallon Interactive Map</h1>
  <p>Explore places and find bosses, dungeons, merchants, quests, resources, and travel points. Use the map's search and filters to find locations and item sources.</p>
  <nav aria-label="Explore the map">
    <a href={`${base}/map/?categories=boss`}>Bosses</a>
    <a href={`${base}/map/?categories=dungeonEntrance`}>Dungeons</a>
    <a href={`${base}/map/?categories=merchant`}>Merchants</a>
    <a href={`${base}/map/?categories=questGiver`}>Quests</a>
    <a href={`${base}/places/`}>Places</a>
  </nav>
  <footer><a href={`${base}/about/`}>About</a><a href={STEAM_GUIDE_URL} rel="external">Steam Guide</a><span>{UNOFFICIAL_NOTICE}</span></footer>
</section>

<style>
  .map-context { max-width: 72rem; margin: 0 auto; padding: 2rem 1.5rem; color: var(--c-text-dim); }
  h1 { margin: 0 0 .5rem; color: var(--c-text-strong); font: 600 1.55rem/1.2 var(--c-serif); }
  p { max-width: 48rem; margin: 0; line-height: 1.55; }
  nav { display: flex; flex-wrap: wrap; gap: .7rem 1.2rem; margin-top: 1rem; }
  a { color: var(--c-accent); text-underline-offset: .2em; }
  footer { display: flex; flex-wrap: wrap; gap: .5rem 1rem; margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid var(--c-line); font-size: var(--c-text-small); }
  @media (max-width: 640px) { .map-context { padding: 1.4rem 1rem; } }
</style>
