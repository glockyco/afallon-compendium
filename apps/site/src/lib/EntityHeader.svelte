<script lang="ts" context="module">
  /**
   * One fact of the header line. A fact without a label is a plain value, such as "Merchant" or "Repeatable". A fact
   * with `href` links its value, for example a place to the map.
   */
  export type HeaderFact = { label?: string; value: string; href?: string };
</script>

<script lang="ts">
  import { base } from '$app/paths';
  import type { ArtRef } from '@afallon/contracts/public';

  export let name: string;
  /** Real artwork only. A page without artwork shows no image box. */
  export let art: ArtRef | undefined = undefined;
  /** Icons are square and keep their whole image. Portraits and artwork fill a box of the same height. */
  export let artRole: 'icon' | 'portrait' | 'artwork' = 'icon';
  export let rarity: string | undefined = undefined;
  export let facts: HeaderFact[] = [];
  export let description: string | null = null;
  export let compact = false;
</script>

<header class="entity-header" class:compact data-rarity={rarity}>
  {#if art}
    <img class="art {artRole}" class:ringed={Boolean(rarity)} src={`${base}/data/${art.url}`} width={art.width} height={art.height} alt={`${name} ${artRole}`} />
  {/if}
  <div class="copy">
    {#if compact}<h3 class:coloured={Boolean(rarity)}>{name}</h3>{:else}<h1 class:coloured={Boolean(rarity)}>{name}</h1>{/if}
    {#if facts.length}
      <ul class="facts">{#each facts as fact}<li>{#if fact.label}<span class="label">{fact.label}</span>{/if}{#if fact.href}<a class="value c-link" href={fact.href}>{fact.value}</a>{:else}<span class="value">{fact.value}</span>{/if}</li>{/each}</ul>
    {/if}
    {#if description}<p class="description">{description}</p>{/if}
    <slot />
  </div>
</header>

<style>
  .entity-header { display: flex; align-items: flex-start; gap: 1rem; margin-bottom: 1.5rem; }
  .art { flex: none; height: 4.5rem; border: 1px solid var(--c-line); border-radius: var(--c-radius-sm); background: #141514; }
  .art.icon, .art.portrait { width: 4.5rem; }
  .art.icon { object-fit: contain; }
  .art.portrait { object-fit: cover; }
  .art.artwork { width: 8rem; object-fit: cover; }
  .art.ringed { border-color: color-mix(in srgb, var(--c-rarity) 70%, transparent); }
  .copy { min-width: 0; flex: 1; }
  h1, h3 { margin: 0; color: #f6f2e7; font-family: var(--c-serif); font-weight: 600; line-height: 1.15; overflow-wrap: break-word; }
  h1 { font-size: clamp(1.6rem, 3.5vw, 2.2rem); }
  h3 { font-size: 1rem; }
  .coloured { color: var(--c-rarity); }
  .facts { display: flex; flex-wrap: wrap; gap: .2rem 0; margin: .45rem 0 0; padding: 0; list-style: none; font-size: .86rem; }
  .facts li { display: inline-flex; align-items: baseline; gap: .35rem; }
  .facts li + li::before { content: '·'; margin: 0 .2rem; color: var(--c-text-mute); }
  .label { color: var(--c-text-dim); }
  .value { color: #ece7db; }
  .description { max-width: 62ch; margin: .6rem 0 0; color: #c0bcb2; font-size: .9rem; line-height: 1.6; white-space: pre-line; }

  .compact { gap: .7rem; margin-bottom: .7rem; }
  .compact .art { height: 3rem; }
  .compact .art.icon, .compact .art.portrait { width: 3rem; }
  .compact .art.artwork { width: 5.3rem; }
  .compact .facts { margin-top: .3rem; font-size: .75rem; }
  .compact .facts li + li::before { margin: 0 .4rem; }
  .compact .description { margin-top: .45rem; font-size: .78rem; line-height: 1.45; display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 4; line-clamp: 4; overflow: hidden; }

  @media (max-width: 640px) {
    .entity-header { gap: .8rem; margin-bottom: 1.1rem; }
    .art { height: 3.5rem; }
    .art.icon, .art.portrait { width: 3.5rem; }
    .art.artwork { width: 6.2rem; }
  }
</style>
