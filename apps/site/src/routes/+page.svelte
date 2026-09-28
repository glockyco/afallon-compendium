<script lang="ts">
  import { base } from '$app/paths';
  import CompendiumSearch from '$lib/CompendiumSearch.svelte';
  import EntityLink from '$lib/EntityLink.svelte';
  import { formatCalendarDate, formatNumber } from '$lib/format';
  import { iconNodeToSvg } from '$lib/icon-svg';
  import { markerRegistry, type MarkerId } from '$lib/map/marker-registry';
  import PageShell from '$lib/PageShell.svelte';
  import type { PageData } from './$types';
  export let data: PageData;

  // Each shortcut opens the map with only its marker category, drawn with the marker's own icon and color.
  const mapShortcut = (id: MarkerId) => {
    const marker = markerRegistry[id];
    return { id, label: marker.pluralLabel, href: `${base}/map/?categories=${id}`, glyph: iconNodeToSvg(marker.icon, `rgb(${marker.color.join(' ')})`) };
  };
  const MAP_SHORTCUTS = (['boss', 'merchant', 'questGiver', 'flightPoint'] as const).map(mapShortcut);
  const GATHERING = (['oreVein', 'herb', 'mushroom', 'fishingSpot'] as const).map(mapShortcut);
  const STATIONS = (['alchemyStation', 'cookingStation', 'smithingStation', 'furnace', 'tailoringStation', 'craftingStation'] as const).map(mapShortcut);

  $: counts = new Map<string, number>(data.pageCounts.map((entry) => [entry.kind, entry.count]));
  $: browse = data.registry.filter((entry) => entry.pages).map((entry) => ({ label: entry.plural, href: `${base}/${entry.route}/`, count: counts.get(entry.kind) ?? 0 }));
  $: zones = data.places.filter((place) => place.placeType !== 'dungeon');
  $: dungeons = data.places.filter((place) => place.placeType === 'dungeon');
  $: placeCount = counts.get('places');
  $: recipeCount = counts.get('recipes');
  $: skillCount = counts.get('skills');
</script>

<svelte:head>
  <title>Afallon Compendium</title>
  <meta name="description" content="A reference for Afallon, read from the game data: its map, places, creatures, items, quests, classes, and crafting." />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="Afallon Compendium" />
  <meta property="og:title" content="Afallon Compendium" />
  <meta property="og:description" content="The map, places, creatures, items, quests, classes, and crafting of Afallon, read from the game data." />
  <meta property="og:url" content={`https://afallon.compendiums.org${base}/`} />
  <meta property="og:image" content={`https://afallon.compendiums.org${base}/og-default.png`} />
</svelte:head>

<PageShell registry={data.registry} release={data.release} search={false}>
  <header class="hub-head">
    <h1>Afallon Compendium</h1>
    <p class="lede">A reference for Afallon, read from the game data: its map, places, creatures, items, quests, classes, and crafting.</p>
    <div class="hub-search"><CompendiumSearch registry={data.registry} limit={10} /></div>
    <p class="release">Afallon {data.release.version} · Updated {formatCalendarDate(data.release.dataDate)} · <a class="c-link" href={data.release.patchNotes.url} rel="external">Patch notes</a></p>
  </header>

  <div class="hub-grid">
    <section class="c-card map" aria-labelledby="hub-map">
      <header><h2 id="hub-map"><a href={`${base}/map/`}>Map</a></h2></header>
      <p class="note">{formatNumber(data.placementCount)} locations on {formatNumber(data.mapCount)} maps: creatures, people, objects, resources, and places.</p>
      <ul class="shortcuts">
        {#each MAP_SHORTCUTS as shortcut (shortcut.id)}<li><a href={shortcut.href}><span class="glyph" aria-hidden="true">{@html shortcut.glyph}</span>{shortcut.label}</a></li>{/each}
      </ul>
      <a class="c-action" href={`${base}/map/`}>Open the map</a>
    </section>

    <section class="c-card places" aria-labelledby="hub-places">
      <header><h2 id="hub-places">Places by level range</h2></header>
      <p class="note">The level range that the game records for each place.</p>
      <div class="place-columns">
        {#each [{ title: 'Zones', places: zones }, { title: 'Dungeons', places: dungeons }] as group (group.title)}
          {#if group.places.length}
            <div>
              <h3>{group.title}</h3>
              <ol class="place-list">
                {#each group.places as place (place.ref.key)}<li><EntityLink ref={place.ref} registry={data.registry} /><span class="range">{place.min}–{place.max}</span></li>{/each}
              </ol>
            </div>
          {/if}
        {/each}
      </div>
      {#if placeCount !== undefined}<a class="c-link more" href={`${base}/places/`}>All {formatNumber(placeCount)} places</a>{/if}
    </section>

    {#if data.classes.length}
      <section class="c-card classes" aria-labelledby="hub-classes">
        <header><h2 id="hub-classes">Classes</h2></header>
        <ul class="entity-list">
          {#each data.classes as entry (entry.ref.key)}<li><EntityLink ref={entry.ref} registry={data.registry} />{#if entry.talentTrees !== null}<small>{entry.talentTrees} talent trees</small>{/if}</li>{/each}
        </ul>
      </section>
    {/if}

    <section class="c-card crafting" aria-labelledby="hub-crafting">
      <header><h2 id="hub-crafting">Crafting and gathering</h2></header>
      {#if data.craftingSkills.length}
        <h3>Crafting skills</h3>
        <ul class="entity-list">
          {#each data.craftingSkills as skill (skill.ref.key)}<li><EntityLink ref={skill.ref} registry={data.registry} /><small>{formatNumber(skill.recipes)} recipes</small></li>{/each}
        </ul>
      {/if}
      <h3>Gathering on the map</h3>
      <ul class="shortcuts">
        {#each GATHERING as shortcut (shortcut.id)}<li><a href={shortcut.href}><span class="glyph" aria-hidden="true">{@html shortcut.glyph}</span>{shortcut.label}</a></li>{/each}
      </ul>
      <h3>Crafting stations on the map</h3>
      <ul class="shortcuts">
        {#each STATIONS as shortcut (shortcut.id)}<li><a href={shortcut.href}><span class="glyph" aria-hidden="true">{@html shortcut.glyph}</span>{shortcut.label}</a></li>{/each}
      </ul>
      <p class="more-links">
        {#if recipeCount !== undefined}<a class="c-link" href={`${base}/recipes/`}>All {formatNumber(recipeCount)} recipes</a>{/if}
        {#if skillCount !== undefined}<a class="c-link" href={`${base}/skills/`}>All {formatNumber(skillCount)} skills</a>{/if}
      </p>
    </section>

    <section class="c-card browse" aria-labelledby="hub-browse">
      <header><h2 id="hub-browse">Browse the compendium</h2></header>
      <ul class="browse-list">
        {#each browse as entry (entry.href)}<li><a href={entry.href}><span>{entry.label}</span><span class="count">{formatNumber(entry.count)}</span></a></li>{/each}
      </ul>
    </section>
  </div>
</PageShell>

<style>
  .hub-head { display: grid; gap: .75rem; max-width: 44rem; margin: .5rem 0 2rem; }
  h1 { margin: 0; color: #f6f2e7; font: 600 clamp(2rem, 4.5vw, 2.8rem)/1.1 var(--c-serif); }
  .lede { margin: 0; color: var(--c-text-dim); font-size: .95rem; line-height: 1.55; }
  .hub-search { margin-top: .35rem; }
  .hub-search :global(.compendium-search) { max-width: none; }
  .hub-search :global(input) { min-height: 3rem; font-size: 1rem; }
  .release { margin: 0; color: var(--c-text-mute); font-size: .78rem; }

  .hub-grid { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); grid-template-areas: 'map places' 'classes places' 'crafting places' 'browse browse'; gap: 1rem; align-items: start; }
  .map { grid-area: map; }
  .places { grid-area: places; }
  .classes { grid-area: classes; }
  .crafting { grid-area: crafting; }
  .browse { grid-area: browse; }
  h2 a { color: inherit; text-decoration: none; }
  h2 a:hover { color: var(--c-accent); }
  h3 { margin: 1rem 0 .45rem; color: var(--c-text-dim); font-size: .7rem; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; }
  .place-columns h3 { margin-top: 0; }
  .note { margin: 0 0 .85rem; color: var(--c-text-dim); font-size: .82rem; line-height: 1.5; }
  ul, ol { margin: 0; padding: 0; list-style: none; }

  .shortcuts { display: flex; flex-wrap: wrap; gap: .4rem; margin-bottom: 1rem; }
  .shortcuts a { display: inline-flex; align-items: center; gap: .4rem; padding: .3rem .6rem .3rem .4rem; border: 1px solid var(--c-line); border-radius: 999px; background: var(--c-surface-2); color: var(--c-text); font-size: .8rem; text-decoration: none; }
  .shortcuts a:hover { border-color: #706548; color: var(--c-accent-strong); }
  .glyph { display: inline-grid; width: 1.1rem; height: 1.1rem; place-items: center; }
  .glyph :global(svg) { width: 100%; height: 100%; }

  .place-columns { display: grid; grid-template-columns: minmax(0, 1fr); gap: 1.1rem; }
  .place-list li, .entity-list li { display: flex; align-items: baseline; justify-content: space-between; gap: .75rem; padding: .32rem 0; border-top: 1px solid var(--c-line-soft); font-size: .86rem; }
  .place-list li:first-child, .entity-list li:first-child { border-top: 0; }
  .range, .entity-list small { flex: none; color: var(--c-text-dim); font-size: .8rem; font-variant-numeric: tabular-nums; }
  .more { display: inline-block; margin-top: .85rem; font-size: .82rem; }
  .more-links { display: flex; flex-wrap: wrap; gap: .4rem 1.1rem; margin: 0; font-size: .82rem; }

  .browse-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(12rem, 1fr)); gap: .45rem; }
  .browse-list a { display: flex; align-items: baseline; justify-content: space-between; gap: .75rem; padding: .55rem .7rem; border: 1px solid var(--c-line); border-radius: var(--c-radius-sm); background: var(--c-surface-2); color: var(--c-text); text-decoration: none; }
  .browse-list a:hover { border-color: #706548; color: var(--c-accent-strong); }
  .count { color: var(--c-text-mute); font-size: .8rem; font-variant-numeric: tabular-nums; }

  @media (max-width: 860px) {
    .hub-grid { grid-template-columns: minmax(0, 1fr); grid-template-areas: 'map' 'places' 'classes' 'crafting' 'browse'; }
  }
</style>
