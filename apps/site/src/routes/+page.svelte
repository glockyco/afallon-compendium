<script lang="ts">
  import { base } from '$app/paths';
  import { MapPin } from 'lucide';
  import type { ArtRef, EntityRef } from '@afallon/contracts/public';
  import CompendiumSearch from '$lib/CompendiumSearch.svelte';
  import { formatCalendarDate, formatNumber, rarityTone } from '$lib/format';
  import { iconNodeToSvg } from '$lib/icon-svg';
  import { kindGlyphSvg } from '$lib/kind-icon';
  import { markerRegistry, type MarkerId } from '$lib/map/marker-registry';
  import PageShell from '$lib/PageShell.svelte';
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
  $: pageHref = (ref: EntityRef) => { const route = routes.get(ref.kind); return route && ref.slug ? `${base}/${route}/${ref.slug}/` : undefined; };
  $: listHref = (kind: string) => { const route = routes.get(kind); return route ? `${base}/${route}/` : undefined; };
  $: counts = new Map<string, number>(data.pageCounts.map((entry) => [entry.kind, entry.count]));
  $: browse = data.registry.filter((entry) => entry.pages).map((entry) => ({ label: entry.plural, href: `${base}/${entry.route}/`, count: counts.get(entry.kind) ?? 0, glyph: kindGlyphSvg(entry.icon) }));
  // A tile without art shows the glyph of its kind in the same box, so the tiles stay aligned.
  $: kindGlyph = (kind: string) => kindGlyphSvg(data.registry.find((entry) => entry.kind === kind)?.icon) ?? '';
  // A level bar marks a range on one scale, from level 1 to the highest recorded level.
  $: barPercent = (level: number) => ((level - 1) / Math.max(1, data.levelScale - 1)) * 100;
</script>

<svelte:head>
  <title>Afallon Compendium</title>
  <meta name="description" content="The map, places, creatures, items, quests, classes, and crafting of Afallon, read from the game data." />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="Afallon Compendium" />
  <meta property="og:title" content="Afallon Compendium" />
  <meta property="og:description" content="The map, places, creatures, items, quests, classes, and crafting of Afallon, read from the game data." />
  <meta property="og:url" content={`https://afallon.compendiums.org${base}/`} />
  <meta property="og:image" content={`https://afallon.compendiums.org${base}/og-default.png`} />
</svelte:head>

<PageShell registry={data.registry} release={data.release} search={false}>
  <section slot="hero" class="hero" aria-labelledby="hub-title">
    {#if data.world?.artwork}<img class="hero-art" src={artUrl(data.world.artwork)} width={data.world.artwork.width} height={data.world.artwork.height} alt="" fetchpriority="high" />{/if}
    <div class="hero-inner">
      <h1 id="hub-title">Afallon Compendium</h1>
      <div class="hero-search"><CompendiumSearch registry={data.registry} limit={8} size="large" /></div>
      <div class="hero-actions">
        <a class="map-action" href={`${base}/map/`}><span class="glyph" aria-hidden="true">{@html mapGlyph}</span>Open the map</a>
        {#if listHref('items')}<a class="items-action" href={listHref('items')}>Browse items</a>{/if}
      </div>
      <p class="release">Afallon {data.release.version} · Patched {formatCalendarDate(data.release.patchNotes.date)} · Data from {formatCalendarDate(data.release.dataDate)} · <a href={data.release.patchNotes.url} rel="external">Patch notes</a></p>
    </div>
    {#if data.world}
      <a class="hero-caption" href={pageHref(data.world.ref)}>{data.world.ref.name}{#if data.world.range}, levels {data.world.range.min}–{data.world.range.max}{/if}</a>
    {/if}
  </section>

  {#if data.itemGroups.length && listHref('items')}
    <section class="section" aria-labelledby="hub-items">
      <div class="section-head">
        <h2 id="hub-items">Items</h2>
        <a class="section-link" href={listHref('items')}>All {countText(counts.get('items') ?? 0, 'item', 'items')}</a>
      </div>
      <ul class="item-groups">
        {#each data.itemGroups as group (group.type)}
          <li>
            <a class="item-group" href={`${listHref('items')}?${new URLSearchParams({ itemType: group.type })}`}>
              {#if group.icon}<img src={artUrl(group.icon)} width="56" height="56" alt="" loading="lazy" decoding="async" data-rarity={rarityTone(group.rarity ?? undefined)} />{:else}<span class="item-art fallback" aria-hidden="true">{@html kindGlyph('items')}</span>{/if}
              <span class="skill-copy"><span class="tile-name">{group.label}</span><span class="tile-meta">{countText(group.count, 'item', 'items')}</span></span>
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
            <h3><a class="dungeon-link" href={pageHref(dungeon.ref)}>{dungeon.ref.name}</a></h3>
            {#if dungeon.bosses.length}
              <ul class="bosses" aria-label={`Bosses of ${dungeon.ref.name}`}>
                {#each dungeon.bosses as boss (boss.ref.key)}
                  <li><a href={pageHref(boss.ref)}>{#if boss.portrait}<img class="avatar" src={artUrl(boss.portrait)} width="28" height="28" alt="" loading="lazy" decoding="async" />{:else}<span class="avatar" aria-hidden="true"></span>{/if}<span>{boss.ref.name}</span></a></li>
                {/each}
              </ul>
            {/if}
          </li>
        {/each}
      </ul>
    </section>
  {/if}

  {#if data.bands.length}
    <section class="section" aria-labelledby="hub-zones">
      <div class="section-head">
        <h2 id="hub-zones">Zones by level range</h2>
        {#if listHref('places')}<a class="section-link" href={listHref('places')}>All {countText(counts.get('places') ?? 0, 'place', 'places')}</a>{/if}
      </div>
      <div class="bands">
        {#each data.bands as band (`${band.min}-${band.max}`)}
          <div class="band">
            <h3><span class="band-label">Levels</span><span class="band-range">{band.min}–{band.max}</span></h3>
            <div class="range-bar" aria-hidden="true"><span style:left={`${barPercent(band.min)}%`} style:right={`${100 - barPercent(band.max)}%`}></span></div>
            <ul>
              {#each band.places as place (place.key)}<li><a href={pageHref(place)}>{place.name}</a></li>{/each}
            </ul>
          </div>
        {/each}
      </div>
    </section>
  {/if}

  {#if data.classes.length}
    <section class="section" aria-labelledby="hub-classes">
      <div class="section-head"><h2 id="hub-classes">Classes</h2></div>
      <ul class="classes">
        {#each data.classes as entry (entry.ref.key)}
          <li>
            <a class="class-tile" href={pageHref(entry.ref)}>
              {#if entry.ref.icon}<img class="class-art" src={artUrl(entry.ref.icon)} width="72" height="72" alt="" loading="lazy" decoding="async" />{:else}<span class="class-art fallback" aria-hidden="true">{@html kindGlyph(entry.ref.kind)}</span>{/if}
              <span class="tile-name">{entry.ref.name}</span>
              <span class="tile-meta">{[entry.talentTrees === null ? null : countText(entry.talentTrees, 'talent tree', 'talent trees'), entry.abilities === null ? null : countText(entry.abilities, 'ability', 'abilities')].filter(Boolean).join(' · ')}</span>
            </a>
          </li>
        {/each}
      </ul>
    </section>
  {/if}

  <section class="section" aria-labelledby="hub-crafting">
    <div class="section-head">
      <h2 id="hub-crafting">Crafting and gathering</h2>
      <div class="section-links">
        {#if listHref('recipes')}<a class="section-link" href={listHref('recipes')}>All {countText(counts.get('recipes') ?? 0, 'recipe', 'recipes')}</a>{/if}
        {#if listHref('skills')}<a class="section-link" href={listHref('skills')}>All {countText(counts.get('skills') ?? 0, 'skill', 'skills')}</a>{/if}
      </div>
    </div>
    {#if data.craftingSkills.length}
      <ul class="skills">
        {#each data.craftingSkills as skill (skill.ref.key)}
          <li>
            <a class="skill-tile" href={pageHref(skill.ref)}>
              {#if skill.ref.icon}<img class="skill-art" src={artUrl(skill.ref.icon)} width="44" height="44" alt="" loading="lazy" decoding="async" />{:else}<span class="skill-art fallback" aria-hidden="true">{@html kindGlyph(skill.ref.kind)}</span>{/if}
              <span class="skill-copy"><span class="tile-name">{skill.ref.name}</span><span class="tile-meta">{countText(skill.recipes, 'recipe', 'recipes')}</span></span>
            </a>
          </li>
        {/each}
      </ul>
    {/if}
    <div class="gathering">
      <h3>Gathering on the map</h3>
      <ul>
        {#each GATHERING as shortcut (shortcut.id)}<li><a href={shortcut.href}><span class="glyph" aria-hidden="true">{@html shortcut.glyph}</span>{shortcut.label}</a></li>{/each}
      </ul>
    </div>
  </section>

  <section class="section" aria-labelledby="hub-browse">
    <div class="section-head"><h2 id="hub-browse">Browse the compendium</h2></div>
    <ul class="browse">
      {#each browse as entry (entry.href)}
        <li><a href={entry.href}><span class="kind-glyph" aria-hidden="true">{@html entry.glyph ?? ''}</span><span class="browse-label">{entry.label}</span><span class="count">{formatNumber(entry.count)}</span></a></li>
      {/each}
    </ul>
  </section>
</PageShell>

<style>
  ul { margin: 0; padding: 0; list-style: none; }

  /* The world artwork runs the full width. A dark wash on the left keeps the title and search readable, and the bottom
     fades into the page. The hero does not clip its content, so search results open over the sections below, and its
     stacking level keeps them above the cards. */
  .hero { position: relative; z-index: 2; display: flex; align-items: flex-end; min-height: clamp(24rem, 34vw, 31rem); background: #101111; }
  .hero-art { position: absolute; inset: 0; z-index: -2; width: 100%; height: 100%; object-fit: cover; object-position: 50% 40%; }
  .hero::before { content: ''; position: absolute; inset: 0; z-index: -1; background: linear-gradient(90deg, rgb(16 17 17 / .95) 0%, rgb(16 17 17 / .82) 30%, rgb(16 17 17 / .3) 60%, rgb(16 17 17 / .05) 82%), linear-gradient(0deg, var(--c-surface-0) 0%, rgb(23 24 24 / 0) 32%); }
  .hero-inner { width: min(72rem, 100%); margin: 0 auto; padding: 5rem 1.5rem 3.5rem; }
  h1 { max-width: 12ch; margin: 0 0 1.4rem; color: #fbf6ea; font: 600 clamp(2.5rem, 4.6vw, 3.75rem)/1.02 var(--c-serif); letter-spacing: -.01em; text-shadow: 0 2px 24px rgb(0 0 0 / .55); }
  .hero-search { max-width: 34rem; }
  .hero-actions { display: flex; flex-wrap: wrap; align-items: center; gap: .9rem 1.4rem; margin-top: 1.1rem; }
  .map-action { display: inline-flex; align-items: center; gap: .5rem; padding: .62rem 1.05rem; border-radius: 6px; background: var(--c-accent); color: #1b1a16; font-size: .9rem; font-weight: 600; text-decoration: none; box-shadow: 0 6px 20px rgb(0 0 0 / .35); }
  .map-action:hover { background: var(--c-accent-strong); }
  .items-action { display: inline-flex; align-items: center; padding: .62rem 1.05rem; border: 1px solid rgb(213 185 120 / .6); border-radius: 6px; background: rgb(14 15 15 / .7); color: var(--c-accent-strong); font-size: .9rem; font-weight: 600; text-decoration: none; }
  .items-action:hover { border-color: var(--c-accent); background: rgb(14 15 15 / .9); }
  .glyph { display: inline-grid; flex: none; width: 1.05rem; height: 1.05rem; place-items: center; }
  .glyph :global(svg) { width: 100%; height: 100%; }
  .release { margin: 1rem 0 0; color: #d6cfbf; font-size: .8rem; text-shadow: 0 1px 8px rgb(0 0 0 / .7); }
  .release a { color: var(--c-accent-strong); }
  .hero-caption { position: absolute; right: max(1.5rem, calc((100% - 72rem) / 2 + 1.5rem)); bottom: 1.1rem; color: rgb(240 233 218 / .82); font-size: .74rem; text-decoration: none; text-shadow: 0 1px 6px rgb(0 0 0 / .9); }
  .hero-caption:hover { color: var(--c-accent-strong); text-decoration: underline; text-underline-offset: .18em; }
  .hero :focus-visible { outline: 2px solid var(--c-accent); outline-offset: 2px; }

  .section { margin-top: 3.25rem; }
  .section:first-of-type { margin-top: .75rem; }
  .section-head { display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: .5rem 1.25rem; margin-bottom: 1.1rem; }
  h2 { margin: 0; color: #f3eee1; font: 600 1.55rem/1.2 var(--c-serif); }
  .section-links { display: flex; flex-wrap: wrap; gap: .4rem 1.2rem; }
  .section-link { color: var(--c-accent); font-size: .84rem; text-decoration: none; }
  .section-link:hover { color: var(--c-accent-strong); text-decoration: underline; text-underline-offset: .18em; }
  .tile-name { color: #f3eee1; font: 600 1.05rem/1.25 var(--c-serif); }
  .tile-meta { color: var(--c-text-mute); font-size: .76rem; font-variant-numeric: tabular-nums; }

  /* A dungeon card is one link. Its boss links sit above the card link, so a boss opens its own page. */
  .dungeons { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 1rem; }
  .dungeon { position: relative; isolation: isolate; display: flex; flex-direction: column; min-width: 0; overflow: hidden; border: 1px solid var(--c-line); border-radius: var(--c-radius); background: var(--c-surface-1); transition: border-color .15s ease, transform .15s ease, box-shadow .15s ease; }
  .dungeon:hover { border-color: #7d6e4a; transform: translateY(-2px); box-shadow: 0 12px 28px rgb(0 0 0 / .45); }
  .dungeon:has(.dungeon-link:focus-visible) { outline: 2px solid var(--c-accent); outline-offset: 2px; }
  .dungeon-art { position: relative; aspect-ratio: 16 / 10; background: #0f1010; }
  .dungeon-art img { display: block; width: 100%; height: 100%; object-fit: cover; }
  .dungeon-art::after { content: ''; position: absolute; inset: 0; background: linear-gradient(0deg, var(--c-surface-1) 0%, rgb(32 33 32 / 0) 32%); }
  .levels { position: absolute; z-index: 1; top: .6rem; left: .6rem; padding: .22rem .55rem; border: 1px solid rgb(213 185 120 / .45); border-radius: 999px; background: rgb(14 14 13 / .8); color: #f0dcae; font-size: .72rem; font-weight: 600; font-variant-numeric: tabular-nums; }
  .dungeon h3 { margin: .6rem .9rem .7rem; font: 600 1.08rem/1.25 var(--c-serif); }
  .dungeon-link { color: #f6f1e4; text-decoration: none; }
  .dungeon-link:focus-visible { outline: none; }
  .dungeon-link::after { content: ''; position: absolute; inset: 0; z-index: 1; }
  .bosses { display: grid; grid-template-columns: minmax(0, 1fr); gap: .35rem; margin: 0 .9rem .95rem; }
  .bosses a { position: relative; z-index: 2; display: flex; align-items: center; gap: .5rem; min-width: 0; color: var(--c-text-dim); font-size: .8rem; text-decoration: none; }
  .bosses a:hover { color: var(--c-accent-strong); }
  .bosses span { min-width: 0; line-height: 1.25; }
  .avatar { flex: none; width: 1.75rem; height: 1.75rem; border: 1px solid #5b523d; border-radius: 50%; background: #111; object-fit: cover; }

  /* Item groups: two rows of four on desktop and two columns on a phone. Each tile puts the icon beside its name, as the
     skill tiles do. The icon ring takes the rarity color of the pictured item. */
  .item-groups { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: .75rem; }
  .item-group { display: flex; align-items: center; gap: .9rem; height: 100%; padding: .85rem 1rem; border: 1px solid var(--c-line); border-radius: var(--c-radius); background: var(--c-surface-1); color: var(--c-text); text-decoration: none; transition: border-color .15s ease, transform .15s ease; }
  .item-group:hover { border-color: #7d6e4a; transform: translateY(-2px); }
  .item-group img, .item-art { flex: none; width: 3.25rem; height: 3.25rem; border: 1px solid #4d4838; border-radius: 10px; background: #141514; box-shadow: 0 6px 16px rgb(0 0 0 / .45); }
  .item-group img[data-rarity] { border-color: color-mix(in srgb, var(--c-rarity) 70%, transparent); }
  .item-group .tile-name { font-size: 1.05rem; }
  .bands { display: grid; grid-template-columns: repeat(auto-fit, minmax(10.5rem, 1fr)); gap: 1rem; }
  .band { padding: 1.05rem 1.1rem 1rem; border: 1px solid var(--c-line); border-radius: var(--c-radius); background: var(--c-surface-1); }
  .band h3 { display: grid; gap: .2rem; margin: 0; }
  .band-label { color: var(--c-text-mute); font-size: .66rem; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; }
  .band-range { color: #f0dcae; font: 600 2.1rem/1 var(--c-serif); }
  .range-bar { position: relative; height: 4px; margin: .8rem 0 .85rem; border-radius: 2px; background: #30312d; }
  .range-bar span { position: absolute; top: 0; bottom: 0; border-radius: 2px; background: linear-gradient(90deg, #a88b4f, #e0c68a); }
  .band li + li { border-top: 1px solid var(--c-line-soft); }
  .band a { display: block; padding: .42rem 0; color: var(--c-text); font-size: .88rem; line-height: 1.3; text-decoration: none; }
  .band a:hover { color: var(--c-accent-strong); }

  .classes { display: grid; grid-template-columns: repeat(auto-fit, minmax(9.5rem, 1fr)); gap: 1rem; }
  .class-tile { display: grid; justify-items: center; gap: .3rem; height: 100%; padding: 1.4rem .8rem 1.15rem; border: 1px solid var(--c-line); border-radius: var(--c-radius); background: radial-gradient(120% 90% at 50% 0%, #2c2c27 0%, var(--c-surface-1) 60%); color: var(--c-text); text-align: center; text-decoration: none; transition: border-color .15s ease, transform .15s ease; }
  .class-tile:hover { border-color: #7d6e4a; transform: translateY(-2px); }
  .class-art { width: 4.5rem; height: 4.5rem; margin-bottom: .5rem; border: 1px solid #5b523d; border-radius: 14px; background: #141514; box-shadow: 0 8px 20px rgb(0 0 0 / .5); }

  .skills { display: grid; grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr)); gap: .75rem; }
  .skill-tile { display: flex; align-items: center; gap: .75rem; height: 100%; padding: .75rem .85rem; border: 1px solid var(--c-line); border-radius: var(--c-radius); background: var(--c-surface-1); color: var(--c-text); text-decoration: none; transition: border-color .15s ease; }
  .skill-tile:hover { border-color: #7d6e4a; }
  .skill-art { flex: none; width: 2.75rem; height: 2.75rem; border: 1px solid #4d4838; border-radius: 10px; background: #141514; }
  .fallback { display: grid; place-items: center; color: #8d8778; }
  .fallback :global(svg) { width: 45%; height: 45%; }
  .skill-copy { display: grid; gap: .1rem; min-width: 0; }
  .skill-copy .tile-name { font-size: .98rem; }
  .gathering { display: flex; flex-wrap: wrap; align-items: center; gap: .6rem 1rem; margin-top: 1.1rem; }
  .gathering h3 { margin: 0; color: var(--c-text-mute); font-size: .7rem; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; }
  .gathering ul { display: flex; flex-wrap: wrap; gap: .45rem; }
  .gathering a { display: inline-flex; align-items: center; gap: .4rem; padding: .32rem .7rem .32rem .5rem; border: 1px solid var(--c-line); border-radius: 999px; background: var(--c-surface-1); color: var(--c-text); font-size: .82rem; text-decoration: none; }
  .gathering a:hover { border-color: #706548; color: var(--c-accent-strong); }

  .browse { display: grid; grid-template-columns: repeat(auto-fill, minmax(11.5rem, 1fr)); gap: .6rem; }
  .browse a { display: flex; align-items: center; gap: .7rem; padding: .65rem .85rem; border: 1px solid var(--c-line); border-radius: var(--c-radius-sm); background: var(--c-surface-1); color: var(--c-text); text-decoration: none; }
  .browse a:hover { border-color: #706548; color: var(--c-accent-strong); }
  .kind-glyph { display: grid; flex: none; width: 2rem; height: 2rem; place-items: center; border-radius: 6px; background: var(--c-surface-2); color: #b9a77c; }
  .kind-glyph :global(svg) { width: 1.05rem; height: 1.05rem; }
  .browse-label { flex: 1; font-size: .92rem; }
  .count { color: var(--c-text-mute); font-size: .8rem; font-variant-numeric: tabular-nums; }

  @media (max-width: 1100px) { .dungeons { grid-template-columns: repeat(3, minmax(0, 1fr)); } }

  @media (max-width: 760px) {
    .hero { min-height: 0; }
    .hero::before { background: linear-gradient(0deg, var(--c-surface-0) 0%, rgb(16 17 17 / .8) 45%, rgb(16 17 17 / .4) 100%); }
    .hero-inner { padding: 8rem 1rem 2rem; }
    h1 { font-size: 2.4rem; }
    .dungeons { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .75rem; }
    .section { margin-top: 2.5rem; }
  }

  /* On a phone, bands stack so place names stay on one line, and classes become rows with the icon beside the name. */
  @media (max-width: 640px) {
    .hero-caption { top: .85rem; right: 1rem; bottom: auto; }
    .dungeon h3 { margin-inline: .7rem; font-size: 1rem; }
    .bosses { margin-inline: .7rem; }
    .bands { grid-template-columns: minmax(0, 1fr); }
    .item-groups { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .6rem; }
    .item-group { flex-direction: column; gap: .55rem; padding: .9rem .6rem .8rem; text-align: center; }
    .item-group img, .item-art { width: 3rem; height: 3rem; }
    .classes { grid-template-columns: minmax(0, 1fr); gap: .6rem; }
    .class-tile { grid-template-columns: auto minmax(0, 1fr); justify-items: start; align-items: center; column-gap: .9rem; row-gap: .1rem; padding: .75rem .9rem; text-align: left; }
    .class-art { grid-row: 1 / span 2; width: 3.25rem; height: 3.25rem; margin: 0; }
    .class-tile .tile-name { grid-column: 2; align-self: end; }
    .class-tile .tile-meta { grid-column: 2; align-self: start; }
  }

  @media (prefers-reduced-motion: reduce) {
    .dungeon, .class-tile, .item-group { transition: none; }
    .dungeon:hover, .class-tile:hover, .item-group:hover { transform: none; }
  }
</style>
