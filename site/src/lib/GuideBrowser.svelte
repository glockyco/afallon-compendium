<script lang="ts">
  import { base } from '$app/paths';
  import { onMount } from 'svelte';
  import GuideBossDetails from './GuideBossDetails.svelte';
  import type {
    PublicAdventureGuide,
    PublicEntity,
    PublicationData,
  } from '../../../pipeline/public-contracts';

  export let section: 'all' | 'dungeons' | 'bosses' | 'regions' | 'properties' = 'all';

  let guide: PublicAdventureGuide | null = null;
  let entities = new Map<string, PublicEntity>();
  let loading = true;
  let error = '';
  let requestedKey: string | null = null;

  $: requestedDungeon = requestedKey ? guide?.dungeons.find((dungeon) => dungeon.dungeonKey === requestedKey) ?? null : null;
  $: requestedBoss = requestedKey ? guide?.bosses.find((boss) => boss.bossKey === requestedKey) ?? null : null;
  $: visibleSection = guide && (section === 'all' || (section === 'dungeons' && guide.dungeons.length > 0) || (section === 'bosses' && guide.bosses.length > 0) || (section === 'regions' && guide.regions.length > 0) || (section === 'properties' && guide.properties.length > 0)) ? section : 'all';
  $: selectedDungeon = visibleSection === 'dungeons' && requestedDungeon ? requestedDungeon : null;
  $: selectedBoss = visibleSection === 'bosses' && requestedBoss ? requestedBoss : null;

  onMount(() => {
    requestedKey = new URLSearchParams(window.location.search).get('id');
    const controller = new AbortController();
    const publicationUrl = new URL(`${base}/data/publication.json`, window.location.href).toString();
    fetch(publicationUrl, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error(`Publication request failed (${response.status})`);
        const value = (await response.json()) as PublicationData;
        if (value.schemaVersion !== 'compendium.publication.v6') throw new Error('Unsupported publication schema.');
        return value;
      })
      .then((value) => {
        guide = value.guide;
        entities = new Map(value.entities.map((entity) => [entity.entityKey, entity]));
        loading = false;
      })
      .catch((reason: unknown) => {
        if (reason instanceof DOMException && reason.name === 'AbortError') return;
        loading = false;
        error = reason instanceof Error ? reason.message : 'The publication could not be loaded.';
      });
    return () => controller.abort();
  });

  function levelLabel(range: { min: number; max: number } | undefined): string {
    return range ? `lvl.${range.min}-${range.max}` : '';
  }

  function mapHref(placementId: string): string {
    return `${base}/?selected=${encodeURIComponent(placementId)}`;
  }

  function dungeonHref(dungeonKey: string): string {
    return `${base}/guide/dungeons/?id=${encodeURIComponent(dungeonKey)}`;
  }

  function bossHref(bossKey: string): string {
    return `${base}/guide/bosses/?id=${encodeURIComponent(bossKey)}`;
  }
</script>

<svelte:head>
  <title>Adventure Guide · Afallon Compendium</title>
  <meta name="description" content="Afallon's published Adventure Guide for dungeons, bosses, regions, and properties." />
</svelte:head>

<div class="guide-shell">
  <header class="guide-header">
    <div>
      <p class="eyebrow">Afallon Compendium</p>
      <h1>Adventure Guide</h1>
      <p class="lede">The same dungeon, boss, region, and property groups shown in game.</p>
    </div>
    <a class="atlas-link" href={`${base}/`}>World atlas</a>
  </header>

  {#if loading}
    <main class="state-card" aria-live="polite"><h2>Loading the Adventure Guide</h2><p>Only the generated static publication is used.</p></main>
  {:else if error}
    <main class="state-card error" role="alert"><h2>Adventure Guide unavailable</h2><p>{error}</p></main>
  {:else if guide}
    <nav class="guide-nav" aria-label="Adventure Guide sections">
      <a class:active={visibleSection === 'all'} href={`${base}/guide/`}>Overview</a>
      {#if guide.dungeons.length}<a class:active={visibleSection === 'dungeons'} href={`${base}/guide/dungeons/`}>Dungeons <span>{guide.dungeons.length}</span></a>{/if}
      {#if guide.bosses.length}<a class:active={visibleSection === 'bosses'} href={`${base}/guide/bosses/`}>Bosses <span>{guide.bosses.length}</span></a>{/if}
      {#if guide.regions.length}<a class:active={visibleSection === 'regions'} href={`${base}/guide/regions/`}>Regions <span>{guide.regions.length}</span></a>{/if}
      {#if guide.properties.length}<a class:active={visibleSection === 'properties'} href={`${base}/guide/properties/`}>Properties <span>{guide.properties.length}</span></a>{/if}
    </nav>

    {#if visibleSection === 'all'}
      <main class="guide-grid">
        {#if guide.dungeons.length}<section class="guide-card"><div class="card-heading"><h2>Dungeons</h2><a href={`${base}/guide/dungeons/`}>View all</a></div><p>Dungeons, their level ranges, and their bosses.</p><ul>{#each guide.dungeons.slice(0, 5) as dungeon}<li><a href={dungeonHref(dungeon.dungeonKey)}>{dungeon.label}</a>{#if dungeon.levelRange}<span>{levelLabel(dungeon.levelRange)}</span>{/if}</li>{/each}</ul></section>{/if}
        {#if guide.bosses.length}<section class="guide-card"><div class="card-heading"><h2>Bosses</h2><a href={`${base}/guide/bosses/`}>View all</a></div><p>Boss abilities, stats, and loot where published.</p><ul>{#each guide.bosses.slice(0, 5) as boss}<li><a href={bossHref(boss.bossKey)}>{boss.label}</a>{#if boss.level !== undefined}<span>lvl.{boss.level}</span>{:else if boss.levelRange}<span>{levelLabel(boss.levelRange)}</span>{/if}</li>{/each}</ul></section>{/if}
        {#if guide.regions.length}<section class="guide-card"><div class="card-heading"><h2>Regions</h2><a href={`${base}/guide/regions/`}>View all</a></div><p>Regions, their descriptions, and their authored level ranges.</p><ul>{#each guide.regions.slice(0, 5) as region}<li><a href={`${base}/guide/regions/?id=${encodeURIComponent(region.regionKey)}`}>{region.label}</a>{#if region.levelRange}<span>{levelLabel(region.levelRange)}</span>{/if}</li>{/each}</ul></section>{/if}
        {#if guide.properties.length}<section class="guide-card"><div class="card-heading"><h2>Properties</h2><a href={`${base}/guide/properties/`}>View all</a></div><p>Properties and their published income.</p><ul>{#each guide.properties.slice(0, 5) as property}<li><a href={`${base}/guide/properties/?id=${encodeURIComponent(property.propertyKey)}`}>{property.label}</a></li>{/each}</ul></section>{/if}
      </main>
    {:else if visibleSection === 'dungeons'}
      <main class="listing">
        <div class="listing-heading"><h2>Dungeons</h2><p>Select a dungeon to view its bosses.</p></div>
        {#if selectedDungeon}
          <a class="back-link" href={`${base}/guide/dungeons/`}>← All dungeons</a>
          <article class="guide-detail">
            <header><h2>{selectedDungeon.label}</h2>{#if selectedDungeon.levelRange}<span class="level">{levelLabel(selectedDungeon.levelRange)}</span>{/if}</header>
            {#if selectedDungeon.description}<p class="description">{selectedDungeon.description}</p>{/if}
            {#if selectedDungeon.placementIds.length}<div class="locations"><h3>Locations</h3>{#each selectedDungeon.placementIds as placementId}<a href={mapHref(placementId)}>Open on the world atlas</a>{/each}</div>{/if}
            <h3>Bosses</h3>
            {#if selectedDungeon.bosses.length === 0}<p class="muted">No bosses are published for this dungeon.</p>{/if}
            <div class="boss-list">{#each selectedDungeon.bosses as boss}<article class="boss-card"><header><h4><a href={bossHref(boss.bossKey)}>{boss.label}</a></h4>{#if boss.level !== undefined}<span class="level">lvl.{boss.level}</span>{:else if boss.levelRange}<span class="level">{levelLabel(boss.levelRange)}</span>{/if}</header><GuideBossDetails {boss} entities={entities} /></article>{/each}</div>
          </article>
        {:else}
          <div class="listing-grid">{#each guide.dungeons as dungeon}<a class="listing-card" href={dungeonHref(dungeon.dungeonKey)}><strong>{dungeon.label}</strong>{#if dungeon.levelRange}<span>{levelLabel(dungeon.levelRange)}</span>{/if}<small>{dungeon.bosses.length} {dungeon.bosses.length === 1 ? 'boss' : 'bosses'}</small></a>{/each}</div>
        {/if}
      </main>
    {:else if visibleSection === 'bosses'}
      <main class="listing">
        <div class="listing-heading"><h2>Bosses</h2><p>Abilities, stats, and loot follow the game's boss groups.</p></div>
        {#if selectedBoss}
          <a class="back-link" href={`${base}/guide/bosses/`}>← All bosses</a>
          <article class="guide-detail"><header><h2>{selectedBoss.label}</h2>{#if selectedBoss.level !== undefined}<span class="level">lvl.{selectedBoss.level}</span>{:else if selectedBoss.levelRange}<span class="level">{levelLabel(selectedBoss.levelRange)}</span>{/if}</header>{#if selectedBoss.dungeonKeys?.length}<p class="context-links">{#each selectedBoss.dungeonKeys as dungeonKey}<a href={dungeonHref(dungeonKey)}>From {guide.dungeons.find((dungeon) => dungeon.dungeonKey === dungeonKey)?.label ?? dungeonKey}</a>{/each}</p>{/if}{#if selectedBoss.placementIds.length}<div class="locations"><h3>Locations</h3>{#each selectedBoss.placementIds as placementId}<a href={mapHref(placementId)}>Open on the world atlas</a>{/each}</div>{/if}<GuideBossDetails boss={selectedBoss} entities={entities} /></article>
        {:else}
          <div class="listing-grid">{#each guide.bosses as boss}<a class="listing-card" href={bossHref(boss.bossKey)}><strong>{boss.label}</strong>{#if boss.level !== undefined}<span>lvl.{boss.level}</span>{:else if boss.levelRange}<span>{levelLabel(boss.levelRange)}</span>{/if}<small>{boss.loot.length} loot {boss.loot.length === 1 ? 'entry' : 'entries'}</small></a>{/each}</div>
        {/if}
      </main>
    {:else if visibleSection === 'regions'}
      <main class="listing"><div class="listing-heading"><h2>Regions</h2><p>Region descriptions and level ranges from the native guide records.</p></div><div class="listing-grid">{#each guide.regions as region}<article class="listing-card"><header><h3>{region.label}</h3>{#if region.levelRange}<span>{levelLabel(region.levelRange)}</span>{/if}</header>{#if region.description}<p>{region.description}</p>{/if}{#each region.placementIds as placementId}<a href={mapHref(placementId)}>Open on the world atlas</a>{/each}</article>{/each}</div></main>
    {:else}
      <main class="listing"><div class="listing-heading"><h2>Properties</h2><p>Property descriptions and income from the native guide records.</p></div><div class="listing-grid">{#each guide.properties as property}<article class="listing-card"><h3>{property.label}</h3>{#if property.description}<p>{property.description}</p>{/if}{#if property.income !== undefined}<p class="income">Income <strong>{property.income}</strong></p>{/if}{#each property.placementIds as placementId}<a href={mapHref(placementId)}>Open on the world atlas</a>{/each}</article>{/each}</div></main>
    {/if}
  {/if}
</div>

<style>
  :global(*) { box-sizing: border-box; }
  :global(body) { margin: 0; background: #171818; color: #e9e4d9; font-family: Inter, ui-sans-serif, system-ui, -apple-system, sans-serif; }
  :global(a) { color: #d5b978; }
  .guide-shell { min-height: 100vh; padding: 2rem clamp(1rem, 4vw, 4rem) 4rem; background: radial-gradient(circle at 10% 0%, #282722, transparent 38%), #171818; }
  .guide-header { display: flex; align-items: start; justify-content: space-between; gap: 1rem; max-width: 1100px; margin: 0 auto 2rem; }
  .eyebrow { margin: 0 0 .4rem; color: #b6a878; font-size: .72rem; letter-spacing: .1em; text-transform: uppercase; }
  h1, h2, h3, h4, p { margin-top: 0; }
  h1 { margin-bottom: .5rem; font-size: clamp(2rem, 5vw, 3.4rem); }
  .lede { max-width: 40rem; margin-bottom: 0; color: #a9a59b; }
  .atlas-link { border: 1px solid #5c5139; border-radius: .35rem; padding: .5rem .7rem; text-decoration: none; white-space: nowrap; }
  .guide-nav { display: flex; flex-wrap: wrap; gap: .45rem; max-width: 1100px; margin: 0 auto 1.5rem; border-bottom: 1px solid #3a3934; padding-bottom: .75rem; }
  .guide-nav a { border-radius: .3rem; padding: .45rem .7rem; text-decoration: none; color: #a9a59b; }
  .guide-nav a.active, .guide-nav a:hover { background: #353127; color: #f1e6c5; }
  .guide-nav span { color: #77756e; font-size: .75rem; }
  .guide-grid, .listing, .state-card { max-width: 1100px; margin: 0 auto; }
  .guide-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1rem; }
  .guide-card, .listing-card, .guide-detail, .boss-card { border: 1px solid #3a3934; border-radius: .5rem; background: #20211f; }
  .guide-card { padding: 1rem; }
  .card-heading, .listing-heading, .guide-detail > header, .boss-card > header, .listing-card > header { display: flex; justify-content: space-between; align-items: baseline; gap: .75rem; }
  .guide-card h2, .listing-heading h2, .guide-detail h2 { margin-bottom: .25rem; }
  .guide-card p, .listing-heading p, .listing-card p, .description { color: #a9a59b; line-height: 1.5; }
  ul { margin: 0; padding: 0; list-style: none; }
  .guide-card li { display: flex; justify-content: space-between; gap: 1rem; padding: .55rem 0; border-top: 1px solid #353633; }
  .guide-card li span, .listing-card span, .level { color: #b6a878; font-size: .8rem; white-space: nowrap; }
  .listing-heading { margin-bottom: 1rem; }
  .listing-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: .8rem; }
  .listing-card { display: block; padding: 1rem; text-decoration: none; color: #e9e4d9; }
  .listing-card strong, .listing-card h3 { display: block; margin-bottom: .35rem; color: #f1e6c5; }
  .listing-card small { display: block; margin-top: .75rem; color: #85837c; }
  .listing-card p { margin-bottom: .55rem; font-size: .9rem; }
  .listing-card a { display: block; margin-top: .5rem; font-size: .82rem; }
  .guide-detail { padding: clamp(1rem, 3vw, 1.5rem); }
  .guide-detail > header { border-bottom: 1px solid #3a3934; padding-bottom: .8rem; }
  .locations, .context-links { display: flex; flex-wrap: wrap; gap: .65rem; margin: 1rem 0; }
  .locations h3 { width: 100%; margin-bottom: -.35rem; }
  .locations a, .context-links a, .back-link { font-size: .84rem; }
  .boss-list { display: grid; gap: .8rem; }
  .boss-card { padding: 1rem; }
  .boss-card h4 { margin-bottom: 0; font-size: 1.05rem; }
  .guide-detail > h3 { border-bottom: 1px solid #3a3934; padding-bottom: .45rem; font-size: .85rem; letter-spacing: .05em; text-transform: uppercase; color: #b6b2a7; }
  .income { color: #d5b978 !important; }
  .state-card { border: 1px solid #3a3934; border-radius: .5rem; padding: 2rem; }
  .state-card p { color: #a9a59b; }
  .error { border-color: #754f4a; }
  .muted { color: #85837c; }
  @media (max-width: 650px) {
    .guide-header { display: block; }
    .atlas-link { display: inline-block; margin-top: 1rem; }
    .guide-grid { grid-template-columns: 1fr; }
  }
</style>
