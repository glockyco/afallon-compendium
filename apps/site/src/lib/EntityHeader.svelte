<script lang="ts" context="module">
  export type HeaderBadge = { label: string; tone?: 'neutral' | 'rarity' | 'accent' | 'boss' };
  export type HeaderFact = { label: string; value: string };
</script>

<script lang="ts">
  import { base } from '$app/paths';
  import type { ArtRef } from '@afallon/contracts/public';
  import Badge from './Badge.svelte';
  import { kindGlyphSvg } from './kind-icon';

  export let name: string;
  export let art: ArtRef | undefined = undefined;
  export let artRole = 'icon';
  export let fallbackIcon: string | undefined = undefined;
  export let rarity: string | undefined = undefined;
  export let badges: HeaderBadge[] = [];
  export let facts: HeaderFact[] = [];
  export let description: string | null = null;
  export let atlasHref: string | undefined = undefined;
  export let atlasLabel = 'View on the atlas';
  export let compact = false;

  $: glyph = kindGlyphSvg(fallbackIcon);
</script>

<header class="entity-header" class:compact data-rarity={rarity}>
  <div class="art" class:ringed={Boolean(rarity)}>
    {#if art}
      <img src={`${base}/data/${art.url}`} width={art.width} height={art.height} alt={`${name} ${artRole}`} />
    {:else if glyph}
      <span class="fallback" aria-hidden="true">{@html glyph}</span>
    {/if}
  </div>
  <div class="copy">
    <div class="title-row">
      {#if compact}<h3 class:coloured={Boolean(rarity)}>{name}</h3>{:else}<h1 class:coloured={Boolean(rarity)}>{name}</h1>{/if}
      {#if atlasHref}<a class="c-action" href={atlasHref}>{atlasLabel}</a>{/if}
      {#each badges as badge}<Badge label={badge.label} tone={badge.tone ?? 'neutral'} />{/each}
    </div>
    {#if facts.length}
      <p class="subline">{#each facts as fact}<span class="subline-fact"><span class="key">{fact.label}</span><span class="value">{fact.value}</span></span>{/each}</p>
    {/if}
    {#if description}<p class="description">{description}</p>{/if}
    <slot />
  </div>
</header>

<style>
  .entity-header { display: flex; align-items: flex-start; gap: 1.25rem; margin-bottom: 1.5rem; }
  .art { flex: none; }
  .art img, .fallback { display: block; width: min(9rem, 24vw); height: auto; max-height: 11rem; border: 1px solid var(--c-line); border-radius: var(--c-radius-sm); background: #141514; object-fit: contain; }
  .art.ringed img, .art.ringed .fallback { border-color: color-mix(in srgb, var(--c-rarity) 70%, transparent); box-shadow: 0 0 0 1px color-mix(in srgb, var(--c-rarity) 22%, transparent), 0 0 18px -6px var(--c-rarity); }
  .fallback { display: grid; width: 4.5rem; aspect-ratio: 1; place-items: center; color: #7d786c; }
  .fallback :global(svg) { width: 45%; height: 45%; }
  .copy { min-width: 0; flex: 1; }
  .title-row { display: flex; flex-wrap: wrap; align-items: center; gap: .55rem .7rem; }
  h1, h3 { margin: 0; color: #f6f2e7; font-family: var(--c-serif); font-weight: 600; line-height: 1.15; overflow-wrap: anywhere; }
  h1 { font-size: clamp(1.7rem, 4vw, 2.5rem); }
  h3 { font-size: 1rem; }
  .coloured { color: var(--c-rarity); }
  .subline { display: flex; flex-wrap: wrap; gap: .25rem 1.1rem; margin: .6rem 0 0; font-size: .84rem; }
  .subline-fact { display: inline-flex; gap: .4rem; }
  .key { color: var(--c-text-dim); }
  .value { color: #ece7db; font-weight: 600; }
  .description { max-width: 62ch; margin: .8rem 0 0; color: #c0bcb2; font-size: .9rem; line-height: 1.6; white-space: pre-line; }

  .compact { gap: .7rem; margin-bottom: .8rem; }
  .compact .art img, .compact .fallback { width: 3.25rem; max-height: 3.25rem; }
  .compact .fallback { font-size: 1.1rem; }
  .compact .subline { margin-top: .35rem; gap: .2rem .7rem; font-size: .75rem; }
  .compact .description { margin-top: .45rem; font-size: .78rem; line-height: 1.45; display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 4; line-clamp: 4; overflow: hidden; }

  @media (max-width: 640px) {
    .entity-header { gap: .8rem; margin-bottom: 1.1rem; }
    .art img, .fallback { width: 4.5rem; max-height: 5.5rem; }
    h1 { font-size: 1.5rem; }
  }
</style>
