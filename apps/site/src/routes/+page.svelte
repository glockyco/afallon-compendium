<script lang="ts">
  import { base } from '$app/paths';
  import { MapPin } from 'lucide';
  import type { ArtRef, EntityRef } from '@afallon/contracts/public';
  import CompendiumSearch from '$lib/CompendiumSearch.svelte';
  import EntityLink from '$lib/EntityLink.svelte';
  import { formatCalendarDate, formatNumber, rarityTone } from '$lib/format';
  import { iconNodeToSvg } from '$lib/icon-svg';
  import { kindGlyphSvg } from '$lib/kind-icon';
  import { markerRegistry, type MarkerId } from '$lib/map/marker-registry';
  import OverviewTile from '$lib/OverviewTile.svelte';
  import PageShell from '$lib/PageShell.svelte';
  import SeoHead from '$lib/SeoHead.svelte';
  import { STEAM_URL, STEAM_GUIDE_URL } from '$lib/seo';
  import { shownRowCount } from '$lib/detail/relation-table';
  import { CHARACTER_LEVEL, clearReaderLevel, readerLevels, setReaderLevel } from '$lib/reader-levels';
  import type { PageData } from './$types';
  export let data: PageData;

  const mapGlyph = iconNodeToSvg(MapPin, 'currentColor');
  // Each gathering link opens the map with one resource category, drawn with the icon and color of its marker. The
  // glyphs come from the bundled marker registry, so `{@html}` renders only known markup.
  const GATHERING = (['oreVein', 'herb', 'mushroom', 'fishingSpot'] as const).map((id: MarkerId) => {
    const marker = markerRegistry[id];
    return { id, label: marker.pluralLabel, href: `${base}/map/?${new URLSearchParams({ categories: id })}`, glyph: iconNodeToSvg(marker.icon, `rgb(${marker.color.join(' ')})`) };
  });

  const artUrl = (art: ArtRef) => `${base}/data/${art.url}`;
  const countText = (count: number, one: string, many: string) => `${formatNumber(count)} ${count === 1 ? one : many}`;

  $: routes = new Map<string, string>(data.registry.filter((entry) => entry.pages).map((entry) => [entry.kind, entry.route]));
  $: pageHref = (ref: EntityRef) => { const route = routes.get(ref.kind); return route && ref.slug ? `${base}/${route}/${ref.slug}/${ref.variant ? `#${ref.variant}` : ''}` : undefined; };
  $: listHref = (kind: string) => { const route = data.registry.find((entry) => entry.kind === kind && entry.list)?.route; return route ? `${base}/${route}/` : undefined; };
  $: counts = new Map<string, number>([...data.pageCounts.map((entry) => [entry.kind, entry.count] as const), ['recipes', data.recipeCount] as const]);
  // Browse tiles are reference lists. Mechanics pages have their own section above.
  $: browse = data.registry.filter((entry) => entry.list && entry.kind !== 'mechanics').map((entry) => ({ label: entry.plural, href: `${base}/${entry.route}/`, count: counts.get(entry.kind) ?? 0, glyph: kindGlyphSvg(entry.icon) }));
  // A tile without art shows the glyph of its kind in the same box, so the tiles stay aligned.
  $: kindGlyph = (kind: string) => kindGlyphSvg(data.registry.find((entry) => entry.kind === kind)?.icon) ?? '';
  // The places follow their level ranges. With the reader's character level, which the mechanics calculators share, the
  // places whose range holds it come first and carry a mark. The sort is stable, so each group keeps the range order.
  type HubPlace = (typeof data.placeTiles)[number];
  let showAllPlaces = false;
  $: yourLevel = $readerLevels[CHARACTER_LEVEL];
  $: fits = (place: HubPlace) => yourLevel !== undefined && place.min <= yourLevel && yourLevel <= place.max;
  // A place with creatures or quests comes before one that records neither, within the same group.
  $: orderedPlaces = [...data.placeTiles].sort((left, right) => Number(!fits(left)) - Number(!fits(right))
    || Number(!(left.creatures || left.quests)) - Number(!(right.creatures || right.quests)));
  $: shownPlaces = orderedPlaces.slice(0, shownRowCount(orderedPlaces.length, showAllPlaces));
  const placeContents = (place: HubPlace) => [
    place.creatures ? countText(place.creatures, 'creature', 'creatures') : '', place.quests ? countText(place.quests, 'quest', 'quests') : '',
  ].filter(Boolean).join(' · ');
  // The places follow each keystroke. An empty field forgets the level, and a value outside the levels is ignored.
  function chooseLevel(event: Event): void {
    const text = (event.currentTarget as HTMLInputElement).value.trim();
    if (text === '') { clearReaderLevel(CHARACTER_LEVEL); return; }
    const value = Number(text);
    if (Number.isInteger(value) && value >= 1 && value <= data.levelScale) setReaderLevel(CHARACTER_LEVEL, value);
  }
</script>

<SeoHead title="Afallon Wiki and Interactive Map · Afallon Compendium" description="Explore the Afallon Compendium wiki and interactive map for items, quests, classes, crafting, and places in this unofficial game reference." website />

<PageShell registry={data.registry} release={data.release} search={false}>
  <section slot="hero" class="hero" aria-labelledby="hub-title">
    {#if data.world?.artwork}<img class="hero-art" src={artUrl(data.world.artwork)} width={data.world.artwork.width} height={data.world.artwork.height} alt="" fetchpriority="high" />{/if}
    <div class="hero-inner">
      <h1 id="hub-title">Afallon Compendium</h1>
      <p class="hero-intro">Afallon is a single‑player RPG with the feel of an MMO. Choose a class, explore the open world, and run dungeons with NPC adventurers. This&nbsp;wiki and interactive map are generated from the game's files.</p>
      <div class="hero-search"><CompendiumSearch registry={data.registry} limit={8} size="large" /></div>
      <div class="hero-actions">
        <a class="map-action" href={`${base}/map/`}><span class="glyph" aria-hidden="true">{@html mapGlyph}</span>Open the Map</a>
        {#if listHref('items')}<a class="items-action" href={listHref('items')}>Browse Items</a>{/if}
      </div>
      <p class="steam-links"><a href={STEAM_URL} rel="external">Play Afallon on Steam</a><a href={STEAM_GUIDE_URL} rel="external">Steam Guide</a></p>
      <p class="release">
        <span>Afallon {data.release.version}</span>
        <span>Patched {formatCalendarDate(data.release.patchNotes.date)}</span>
        <span>Data from {formatCalendarDate(data.release.dataDate)}</span>
        <a href={data.release.patchNotes.url} rel="external">Patch Notes</a>
      </p>
    </div>
    {#if data.world}
      <span class="hero-caption"><EntityLink ref={data.world.ref} registry={data.registry} plain />{#if data.world.range}, levels {data.world.range.min}–{data.world.range.max}{/if}</span>
    {/if}
  </section>

  {#if data.itemGroups.length && listHref('items')}
    <section class="section" aria-labelledby="hub-items">
      <div class="section-head">
        <h2 id="hub-items">Items</h2>
        <a class="section-link" href={listHref('items')}>All {countText(counts.get('items') ?? 0, 'Item', 'Items')}</a>
      </div>
      <ul class="item-groups">
        {#each data.itemGroups as group (group.type)}
          <li>
            <a class="item-group" href={`${listHref('items')}?${new URLSearchParams({ itemType: group.type })}`}>
              {#if group.icon}<img src={artUrl(group.icon)} width="56" height="56" alt="" loading="lazy" decoding="async" data-rarity={rarityTone(group.rarity ?? undefined)} />{:else}<span class="item-art fallback" aria-hidden="true">{@html kindGlyph('items')}</span>{/if}
              <span class="item-copy"><span class="tile-name">{group.label}</span><span class="tile-meta">{countText(group.count, 'item', 'items')}</span></span>
            </a>
          </li>
        {/each}
      </ul>
    </section>
  {/if}

  {#if data.dungeons.length}
    <section class="section" aria-labelledby="hub-dungeons">
      <div class="section-head"><h2 id="hub-dungeons">Dungeons</h2></div>
      <ul class="dungeons">
        {#each data.dungeons as dungeon (dungeon.ref.key)}
          <li class="dungeon">
            <div class="dungeon-art">
              {#if dungeon.artwork}<img src={artUrl(dungeon.artwork)} width={dungeon.artwork.width} height={dungeon.artwork.height} alt="" loading="lazy" decoding="async" />{/if}
              <span class="levels">Levels {dungeon.min}–{dungeon.max}</span>
            </div>
            <h3 class="dungeon-link"><EntityLink ref={dungeon.ref} registry={data.registry} tooltip={false} plain /></h3>
            {#if dungeon.bosses.length}
              <ul class="bosses" aria-label={`Bosses of ${dungeon.ref.name}`}>
                {#each dungeon.bosses as boss (boss.ref.key)}
                  <li><span class="boss-link"><EntityLink ref={{ ...boss.ref, ...(boss.portrait ? { portrait: boss.portrait } : {}) }} registry={data.registry} truncate /></span></li>
                {/each}
              </ul>
            {/if}
          </li>
        {/each}
      </ul>
    </section>
  {/if}

  {#if data.placeTiles.length}
    <section class="section" aria-labelledby="hub-places">
      <div class="section-head">
        <h2 id="hub-places">Places by Level</h2>
        <div class="section-links">
          <label class="your-level">Your Level <input type="number" inputmode="numeric" min="1" max={data.levelScale} value={yourLevel ?? ''} placeholder="Any" on:input={chooseLevel} /></label>
          {#if listHref('places')}<a class="section-link" href={listHref('places')}>All {countText(counts.get('places') ?? 0, 'Place', 'Places')}</a>{/if}
        </div>
      </div>
      <ul class="places">
        {#each shownPlaces as place (place.ref.key)}
          <li class="place">
            <div class="place-art">
              {#if place.artwork}<img src={artUrl(place.artwork)} width={place.artwork.width} height={place.artwork.height} alt="" loading="lazy" decoding="async" />{/if}
              <span class="levels">Levels {place.min}–{place.max}</span>
              {#if fits(place)}<span class="fits">Your Level</span>{/if}
            </div>
            <h3><a class="place-link" href={pageHref(place.ref)}>{place.ref.name}</a></h3>
            {#if placeContents(place)}<p class="place-meta">{placeContents(place)}</p>{/if}
          </li>
        {/each}
      </ul>
      {#if shownPlaces.length < orderedPlaces.length}<button type="button" class="c-action show-more" on:click={() => (showAllPlaces = true)}>Show {orderedPlaces.length - shownPlaces.length} More</button>{/if}
    </section>
  {/if}

  {#if data.classes.length}
    <section class="section" aria-labelledby="hub-classes">
      <div class="section-head"><h2 id="hub-classes">Classes</h2></div>
      <ul class="classes">
        {#each data.classes as entry (entry.ref.key)}
          <li>
            <OverviewTile ref={entry.ref} registry={data.registry} variant="class" home facts={[entry.talentTrees === null ? '' : countText(entry.talentTrees, 'Talent Tree', 'Talent Trees'), entry.abilities === null ? '' : countText(entry.abilities, 'Ability', 'Abilities')].filter(Boolean)} />
          </li>
        {/each}
      </ul>
    </section>
  {/if}

  <section class="section" aria-labelledby="hub-crafting">
    <div class="section-head">
      <h2 id="hub-crafting">Crafting and Gathering</h2>
      <div class="section-links">
        {#if listHref('recipes')}<a class="section-link" href={listHref('recipes')}>All {countText(counts.get('recipes') ?? 0, 'Recipe', 'Recipes')}</a>{/if}
        {#if listHref('skills')}<a class="section-link" href={listHref('skills')}>All {countText(counts.get('skills') ?? 0, 'Skill', 'Skills')}</a>{/if}
      </div>
    </div>
    {#if data.craftingSkills.length}
      <ul class="skills">
        {#each data.craftingSkills as skill (skill.ref.key)}
          <li>
            <OverviewTile ref={skill.ref} registry={data.registry} home facts={[countText(skill.recipes, 'Recipe', 'Recipes')]} />
          </li>
        {/each}
      </ul>
    {/if}
    <div class="gathering">
      <h3>Gathering on the Map</h3>
      <ul>
        {#each GATHERING as shortcut (shortcut.id)}<li><a href={shortcut.href}><span class="glyph" aria-hidden="true">{@html shortcut.glyph}</span>{shortcut.label}</a></li>{/each}
      </ul>
    </div>
  </section>

  {#if data.guides.length}
    <section class="section" aria-labelledby="hub-guides">
      <div class="section-head">
        <h2 id="hub-guides">Mechanics</h2>
        {#if listHref('mechanics')}<a class="section-link" href={listHref('mechanics')}>All {countText(counts.get('mechanics') ?? 0, 'Mechanic', 'Mechanics')}</a>{/if}
      </div>
      <ul class="guides">
        {#each data.guides as guide (guide.ref.key)}
          <li><a class="guide-tile" href={pageHref(guide.ref)}><span class="tile-name">{guide.ref.name}</span>{#if guide.description}<span class="guide-text">{guide.description}</span>{/if}</a></li>
        {/each}
      </ul>
    </section>
  {/if}

  <section class="section" aria-labelledby="hub-browse">
    <div class="section-head"><h2 id="hub-browse">Browse the Compendium</h2></div>
    <ul class="browse">
      {#each browse as entry (entry.href)}
        <li><a href={entry.href}><span class="kind-glyph" aria-hidden="true">{@html entry.glyph ?? ''}</span><span class="browse-copy"><span class="browse-label">{entry.label}</span><span class="tile-meta">{formatNumber(entry.count)}</span></span></a></li>
      {/each}
    </ul>
  </section>
</PageShell>

<style>
  ul { margin: 0; padding: 0; list-style: none; }

  /* The world artwork runs the full width. A dark wash on the left keeps the title and search readable, and the bottom
     fades into the page. The hero does not clip its content, so search results open over the sections below, and its
     stacking level keeps them above the cards. */
  .hero { position: relative; z-index: 2; display: flex; align-items: flex-end; min-height: clamp(24rem, 34vw, 31rem); background: var(--c-surface-deep); }
  /* The artwork is 1,600 pixels wide. Wider screens show it at that width, centred, with its sides fading into the band,
     instead of enlarging and cropping it to a sliver of the scene. */
  .hero-art { position: absolute; inset: 0; z-index: -2; width: 100%; height: 100%; object-fit: cover; object-position: 50% 40%; }
  @media (min-width: 100rem) {
    .hero-art { left: 50%; width: 100rem; transform: translateX(-50%); mask-image: linear-gradient(90deg, transparent, #000 12%, #000 88%, transparent); }
  }
  .hero::before { content: ''; position: absolute; inset: 0; z-index: -1; background: linear-gradient(90deg, color-mix(in srgb, var(--c-surface-deep) 95%, transparent) 0%, color-mix(in srgb, var(--c-surface-deep) 82%, transparent) 30%, color-mix(in srgb, var(--c-surface-deep) 30%, transparent) 60%, color-mix(in srgb, var(--c-surface-deep) 5%, transparent) 82%), linear-gradient(0deg, var(--c-surface-0) 0%, transparent 32%); }
  .hero-inner { width: min(72rem, 100%); margin: 0 auto; padding: 5rem 1.5rem 3.5rem; }
  h1 { max-width: 12ch; margin: 0 0 1.4rem; color: var(--c-text-strong); font: 600 clamp(2.5rem, 4.6vw, 3.75rem)/1.02 var(--c-serif); letter-spacing: -.01em; text-shadow: 0 2px 24px var(--c-shadow-strong); }
  .hero-intro { max-width: 44rem; margin: -.35rem 0 1.25rem; color: var(--c-text); font-size: var(--c-text-body); line-height: 1.55; text-shadow: 0 1px 10px var(--c-shadow-strong); }
  .hero-search { max-width: 34rem; }
  .hero-actions { display: flex; flex-wrap: wrap; align-items: center; gap: .9rem 1.4rem; margin-top: 1.1rem; }
  .map-action { display: inline-flex; align-items: center; gap: .5rem; padding: .62rem 1.05rem; border-radius: 6px; background: var(--c-accent); color: var(--c-on-accent); font-size: var(--c-text-body); font-weight: 600; text-decoration: none; box-shadow: 0 6px 20px var(--c-shadow); }
  .map-action:hover { background: var(--c-accent-strong); }
  .items-action { display: inline-flex; align-items: center; padding: .62rem 1.05rem; border: 1px solid color-mix(in srgb, var(--c-accent) 60%, transparent); border-radius: 6px; background: color-mix(in srgb, var(--c-surface-deep) 70%, transparent); color: var(--c-accent-strong); font-size: var(--c-text-body); font-weight: 600; text-decoration: none; }
  .items-action:hover { border-color: var(--c-accent); background: color-mix(in srgb, var(--c-surface-deep) 90%, transparent); }
  .steam-links { display: flex; align-items: baseline; gap: 1.1rem; margin: .9rem 0 0; }
  .steam-links a { color: var(--c-text-strong); font-size: var(--c-text-small); text-underline-offset: .2em; white-space: nowrap; }
  .steam-links a:hover { color: var(--c-accent-strong); }
  .glyph { display: inline-grid; flex: none; width: 1.05rem; height: 1.05rem; place-items: center; }
  .glyph :global(svg) { width: 100%; height: 100%; }
  .release { display: flex; flex-wrap: wrap; align-items: baseline; gap: .2rem .9rem; margin: .9rem 0 0; color: var(--c-text); font-size: var(--c-text-small); text-shadow: 0 1px 8px var(--c-shadow-strong); }
  .release a { color: var(--c-accent-strong); }
  .release > * { white-space: nowrap; }
  .hero-caption { position: absolute; right: max(1.5rem, calc((100% - 72rem) / 2 + 1.5rem)); bottom: 1.1rem; color: color-mix(in srgb, var(--c-text) 82%, transparent); font-size: var(--c-text-small); text-shadow: 0 1px 6px var(--c-shadow-strong); }
  .hero-caption :global(.entity-link) { color: inherit; }
  .hero-caption :global(.entity-link:hover) { color: var(--c-accent-strong); }
  .hero :focus-visible { outline: 2px solid var(--c-accent); outline-offset: 2px; }

  .section { margin-top: 3.25rem; }
  .section:first-of-type { margin-top: .75rem; }
  .section-head { display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: .5rem 1.25rem; margin-bottom: 1.1rem; }
  h2 { margin: 0; color: var(--c-text-strong); font: 600 1.55rem/1.2 var(--c-serif); }
  .section-links { display: flex; flex-wrap: wrap; gap: .4rem 1.2rem; }
  .section-link { display: inline-flex; align-items: center; min-height: 1.5rem; color: var(--c-accent); font-size: var(--c-text-small); text-decoration: none; }
  .section-link:hover { color: var(--c-accent-strong); text-decoration: underline; text-underline-offset: .18em; }
  .tile-name { color: var(--c-text-strong); font: 600 var(--c-text-lead)/1.25 var(--c-serif); }
  .tile-meta { color: var(--c-text-mute); font-size: var(--c-text-small); font-variant-numeric: tabular-nums; }

  /* The dungeon title links the card; the boss links remain separately clickable above it. */
  .dungeons { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 1rem; }
  .dungeon { position: relative; isolation: isolate; display: flex; flex-direction: column; min-width: 0; overflow: hidden; border: 1px solid var(--c-line); border-radius: var(--c-radius); background: var(--c-surface-1); transition: border-color .15s ease; }
  .dungeon:hover { border-color: var(--c-frame-hover); }
  .dungeon:has(.dungeon-link :global(.entity-link:focus-visible)) { outline: 2px solid var(--c-accent); outline-offset: 2px; }
  .dungeon-art { position: relative; aspect-ratio: 16 / 10; background: var(--c-surface-deep); }
  .dungeon-art img { display: block; width: 100%; height: 100%; object-fit: cover; }
  .dungeon-art::after { content: ''; position: absolute; inset: 0; background: linear-gradient(0deg, var(--c-surface-1) 0%, transparent 32%); }
  .levels { position: absolute; z-index: 1; top: .6rem; left: .6rem; padding: .22rem .55rem; border: 1px solid color-mix(in srgb, var(--c-accent) 45%, transparent); border-radius: 999px; background: color-mix(in srgb, var(--c-surface-deep) 80%, transparent); color: var(--c-accent-strong); font-size: var(--c-text-label); font-weight: 600; font-variant-numeric: tabular-nums; }
  .dungeon h3 { margin: .6rem .9rem .7rem; font: 600 var(--c-text-lead)/1.25 var(--c-serif); }
  .dungeon-link :global(.entity-link) { color: var(--c-text-strong); }
  .dungeon-link :global(.entity-link::after) { content: ''; position: absolute; inset: 0; z-index: 1; }
  .bosses { display: grid; grid-template-columns: minmax(0, 1fr); gap: .35rem; margin: 0 .9rem .95rem; }
  .boss-link { display: flex; align-items: center; gap: .5rem; min-width: 0; min-height: 1.5rem; color: var(--c-text-dim); font-size: var(--c-text-small); }
  /* Only a boss link sits above the dungeon's stretched link, so the space beside a boss name still opens the dungeon. */
  .boss-link :global(.entity-link) { position: relative; z-index: 2; color: inherit; }
  .boss-link :global(.entity-link:hover) { color: var(--c-accent-strong); }
  .boss-link :global(.entity-link img), .boss-link :global(.entity-link .kind-icon) { width: 1.75rem; height: 1.75rem; border-radius: 50%; object-fit: cover; }

  /* Item groups: two rows of four on desktop and two columns on a phone. Each tile puts the icon beside its name, as the
     skill tiles do. The icon ring takes the rarity color of the pictured item. */
  .item-groups { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: .75rem; }
  .item-group { display: flex; align-items: center; gap: .9rem; height: 100%; padding: .85rem 1rem; border: 1px solid var(--c-line); border-radius: var(--c-radius); background: var(--c-surface-1); color: var(--c-text); text-decoration: none; transition: border-color .15s ease; }
  .item-group:hover { border-color: var(--c-frame-hover); }
  .item-group img, .item-art { flex: none; width: 3.25rem; height: 3.25rem; border: 1px solid var(--c-frame); border-radius: 10px; background: var(--c-surface-sunken); box-shadow: 0 6px 16px var(--c-shadow); }
  .item-group img[data-rarity] { border-color: color-mix(in srgb, var(--c-rarity) 70%, transparent); }
  .item-copy { display: grid; gap: .1rem; min-width: 0; overflow-wrap: anywhere; }
  .item-art.fallback { display: grid; place-items: center; color: var(--c-text-mute); }
  .item-art.fallback :global(svg) { width: 45%; height: 45%; }
  .item-group .tile-name { font-size: var(--c-text-lead); }
  /* Place tiles share the look of the dungeon tiles: artwork with its level range, then the name and what is there. */
  .places { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 1rem; }
  .place { position: relative; display: flex; flex-direction: column; overflow: hidden; border: 1px solid var(--c-line); border-radius: var(--c-radius); background: var(--c-surface-1); transition: border-color .15s ease; }
  .place:hover { border-color: var(--c-frame-hover); }
  .place:has(.place-link:focus-visible) { outline: 2px solid var(--c-accent); outline-offset: 2px; }
  .place-art { position: relative; aspect-ratio: 16 / 9; background: var(--c-surface-deep); }
  .place-art img { display: block; width: 100%; height: 100%; object-fit: cover; }
  .place-art::after { content: ''; position: absolute; inset: 0; background: linear-gradient(0deg, var(--c-surface-1) 0%, transparent 32%); }
  .fits { position: absolute; z-index: 1; top: .6rem; right: .6rem; padding: .22rem .55rem; border-radius: 999px; background: var(--c-accent); color: var(--c-surface-deep); font-size: var(--c-text-label); font-weight: 700; }
  .place h3 { margin: .6rem .9rem .2rem; font: 600 var(--c-text-lead)/1.25 var(--c-serif); }
  .place-link { color: var(--c-text-strong); text-decoration: none; }
  .place-link:focus-visible { outline: none; }
  .place-link::after { content: ''; position: absolute; inset: 0; z-index: 1; }
  .place-meta { margin: 0 .9rem .9rem; color: var(--c-text-dim); font-size: var(--c-text-small); }
  .place h3:last-child { margin-bottom: .9rem; }
  .show-more { margin-top: 1rem; }
  .your-level { display: inline-flex; align-items: center; gap: .5rem; color: var(--c-text-dim); font-size: var(--c-text-small); }
  .your-level input { width: 4.25rem; min-height: 2rem; padding: .25rem .5rem; border: 1px solid var(--c-line); border-radius: var(--c-radius-sm); background: var(--c-surface-0); color: var(--c-text-strong); font-variant-numeric: tabular-nums; }
  .your-level input:focus-visible { outline: 2px solid var(--c-accent); outline-offset: 2px; }

  .classes { display: grid; grid-template-columns: repeat(auto-fit, minmax(9.5rem, 1fr)); gap: 1rem; }

  .skills { display: grid; grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr)); gap: .75rem; }
  .gathering { display: flex; flex-wrap: wrap; align-items: center; gap: .6rem 1rem; margin-top: 1.1rem; }
  .gathering h3 { margin: 0; color: var(--c-text-mute); font-size: var(--c-text-label); font-weight: 700; }
  .gathering ul { display: flex; flex-wrap: wrap; gap: .45rem; }
  .gathering a { display: inline-flex; align-items: center; gap: .4rem; padding: .32rem .7rem .32rem .5rem; border: 1px solid var(--c-line); border-radius: 999px; background: var(--c-surface-1); color: var(--c-text); font-size: var(--c-text-small); text-decoration: none; }
  .gathering a:hover { border-color: var(--c-frame-strong); color: var(--c-accent-strong); }

  /* Each mechanics page is a card with its name and a sentence about what it explains. */
  .guides { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: .75rem; }
  .guide-tile { display: grid; align-content: start; gap: .35rem; height: 100%; padding: .95rem 1.1rem 1rem; border: 1px solid var(--c-line); border-radius: var(--c-radius); background: var(--c-surface-1); color: var(--c-text); text-decoration: none; transition: border-color .15s ease; }
  .guide-tile:hover { border-color: var(--c-frame-hover); }
  .guide-text { color: var(--c-text-dim); font-size: var(--c-text-small); line-height: 1.45; }
  .dungeon-link :global(.plain .name), .boss-link :global(.plain .name), .hero-caption :global(.plain .name) { text-decoration: none; }
  /* The dungeon and its boss links never underline as the pointer crosses the card. */
  .dungeon-link.dungeon-link :global(.plain.entity-link:hover .name) { text-decoration: none; }

  /* Browse is the index of every list, below the featured sections, so each link is one compact line. */
  .browse { display: grid; grid-template-columns: repeat(auto-fill, minmax(11.5rem, 1fr)); gap: .4rem; }
  .browse a { display: flex; align-items: center; gap: .55rem; min-height: 2.5rem; padding: .35rem .7rem; border: 1px solid var(--c-line); border-radius: var(--c-radius-sm); background: var(--c-surface-1); color: var(--c-text); text-decoration: none; }
  .browse a:hover { border-color: var(--c-frame-strong); color: var(--c-accent-strong); }
  .kind-glyph { display: grid; flex: none; width: 2rem; height: 2rem; place-items: center; border-radius: 6px; background: var(--c-surface-2); color: var(--c-accent-muted); }
  .kind-glyph :global(svg) { width: 1.05rem; height: 1.05rem; }
  .browse .kind-glyph { width: auto; height: auto; background: none; }
  /* The count sits at the end of the line, so the name keeps the space beside the icon. */
  .browse-copy { display: flex; flex: 1; align-items: baseline; justify-content: space-between; gap: .5rem; min-width: 0; }
  .browse-label { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: var(--c-text-body); }

  @media (max-width: 1100px) { .dungeons, .places { grid-template-columns: repeat(3, minmax(0, 1fr)); } .guides { grid-template-columns: repeat(2, minmax(0, 1fr)); } }

  @media (max-width: 760px) {
    .hero { min-height: 0; }
    .hero::before { background: linear-gradient(0deg, var(--c-surface-0) 0%, color-mix(in srgb, var(--c-surface-deep) 80%, transparent) 45%, color-mix(in srgb, var(--c-surface-deep) 40%, transparent) 100%); }
    .hero-inner { padding: 8rem 1rem 2rem; }
    h1 { font-size: 2.4rem; }
    .dungeons, .places { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .75rem; }
    .section { margin-top: 2.5rem; }
  }

  /* On a phone, classes become rows with the icon beside the name. */
  @media (max-width: 640px) {
    .hero-caption { top: .85rem; right: 1rem; bottom: auto; }
    .dungeon h3 { margin-inline: .7rem; font-size: var(--c-text-prose); }
    .bosses { margin-inline: .7rem; }
    .place h3 { margin-inline: .7rem; font-size: .9375rem; }
    .place-meta { margin-inline: .7rem; }
    .item-groups { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .6rem; }
    .item-group { flex-direction: column; gap: .55rem; padding: .9rem .6rem .8rem; text-align: center; }
    .item-group img, .item-art { width: 3rem; height: 3rem; }
    .classes, .guides { grid-template-columns: minmax(0, 1fr); gap: .6rem; }
  }

  @media (prefers-reduced-motion: reduce) {
    .dungeon, .place, .item-group, .guide-tile { transition: none; }
  }
</style>
