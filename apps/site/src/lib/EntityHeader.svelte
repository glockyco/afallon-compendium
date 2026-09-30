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

  // A compact card keeps unlabeled facts, such as the rarity and type, in the line under the name. Labeled facts form
  // an aligned list across the full card width, so long values do not wrap in a narrow column beside the art.
  $: plain = compact ? facts.filter((fact) => !fact.label) : facts;
  $: labeled = compact ? facts.filter((fact) => fact.label) : [];
</script>

<header class="entity-header" class:compact class:no-art={!art} data-rarity={rarity}>
  {#if art}
    <img class="art {artRole}" class:ringed={Boolean(rarity)} src={`${base}/data/${art.url}`} width={art.width} height={art.height} alt={`${name} ${artRole}`} />
  {/if}
  <div class="copy">
    {#if compact}<h3 class:coloured={Boolean(rarity)}>{name}</h3>{:else}<h1 class:coloured={Boolean(rarity)}>{name}</h1>{/if}
    {#if plain.length}
      <ul class="facts">{#each plain as fact}<li>{#if fact.label}<span class="label">{fact.label}</span>{/if}{#if fact.href}<a class="value c-link" href={fact.href}>{fact.value}</a>{:else}<span class="value">{fact.value}</span>{/if}</li>{/each}</ul>
    {/if}
    {#if !compact}
      {#if description}<p class="description">{description}</p>{/if}
      <slot />
    {/if}
  </div>
  {#if compact}
    {#if labeled.length}
      <dl class="fact-list">{#each labeled as fact}<dt>{fact.label}</dt><dd>{#if fact.href}<a class="c-link" href={fact.href}>{fact.value}</a>{:else}{fact.value}{/if}</dd>{/each}</dl>
    {/if}
    {#if description}<p class="description">{description}</p>{/if}
    <slot />
  {/if}
</header>

<style>
  .entity-header { display: flex; align-items: flex-start; gap: 1rem; margin-bottom: 1.5rem; }
  .art { flex: none; height: 4.5rem; border: 1px solid var(--c-line); border-radius: var(--c-radius-sm); background: var(--c-surface-sunken); }
  .art.icon, .art.portrait { width: 4.5rem; }
  .art.icon { object-fit: contain; }
  .art.portrait { object-fit: cover; }
  .art.artwork { width: 8rem; object-fit: cover; }
  .art.ringed { border-color: color-mix(in srgb, var(--c-rarity) 70%, transparent); }
  .copy { min-width: 0; flex: 1; }
  h1, h3 { margin: 0; color: var(--c-text-strong); font-family: var(--c-serif); font-weight: 600; line-height: 1.15; overflow-wrap: break-word; }
  h1 { font-size: clamp(1.6rem, 3.5vw, 2.2rem); }
  h3 { font-size: var(--c-text-lead); }
  .coloured { color: var(--c-rarity); }
  .facts { display: flex; flex-wrap: wrap; gap: .2rem 0; margin: .45rem 0 0; padding: 0; list-style: none; font-size: var(--c-text-body); }
  .facts li { display: inline-flex; align-items: baseline; gap: .35rem; }
  .facts li + li::before { content: '·'; margin: 0 .2rem; color: var(--c-text-mute); }
  .label { flex: none; color: var(--c-text-dim); white-space: nowrap; }
  .value { color: var(--c-text-strong); }
  .description { max-width: 62ch; margin: .6rem 0 0; color: var(--c-text-soft); font-size: var(--c-text-prose); line-height: 1.6; white-space: pre-line; }

  .compact { display: grid; grid-template-columns: auto minmax(0, 1fr); align-items: center; gap: .6rem .75rem; margin-bottom: .7rem; }
  .compact.no-art { grid-template-columns: minmax(0, 1fr); }
  .compact:last-child { margin-bottom: 0; }
  .compact .art { height: 3rem; }
  .compact .art.icon, .compact .art.portrait { width: 3rem; }
  .compact .art.artwork { width: 5.3rem; }
  .compact .facts { margin-top: .3rem; font-size: var(--c-text-small); }
  .compact .facts li + li::before { margin: 0 .4rem; }
  .fact-list { grid-column: 1 / -1; display: grid; grid-template-columns: max-content minmax(0, 1fr); gap: .25rem .9rem; margin: 0; font-size: var(--c-text-small); line-height: 1.45; }
  .fact-list dt { color: var(--c-text-dim); }
  .fact-list dd { margin: 0; color: var(--c-text-strong); }
  .compact .description { grid-column: 1 / -1; margin: 0; font-size: var(--c-text-small); line-height: 1.45; display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 4; line-clamp: 4; overflow: hidden; }

  @media (max-width: 640px) {
    .entity-header { gap: .8rem; margin-bottom: 1.1rem; }
    .art { height: 3.5rem; }
    .art.icon, .art.portrait { width: 3.5rem; }
    .art.artwork { width: 6.2rem; }
  }
</style>
