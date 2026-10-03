<script lang="ts">
  import { base } from '$app/paths';
  import type { ArtRef, EntityRef, PublicKindEntry, Ref } from '@afallon/contracts/public';
  import EntityLink from './EntityLink.svelte';
  import { formatNumber, intervalText } from './format';
  import { kindGlyphSvg } from './kind-icon';
  import Price from './Price.svelte';

  export let ref: EntityRef;
  export let registry: PublicKindEntry[];
  export let facts: string[] = [];
  export let artwork: ArtRef | null = null;
  export let metrics: Array<{ label: string; amount: number | null; currency: Ref | null; interval?: number }> = [];
  export let description: string | null = null;
  export let variant: 'class' | 'compact' | 'editorial' | 'property' | 'portrait-art' = 'compact';
  export let home = false;
  $: glyph = kindGlyphSvg(registry.find((entry) => entry.kind === ref.kind)?.icon) ?? '';
  $: image = artwork ?? ref.icon;
  // Keep compound words together when a description wraps inside a narrow tile.
  $: descriptionText = description?.replace(/(?<=\p{L})-(?=\p{L})/gu, '\u2011') ?? null;
</script>

<div class="tile" class:portrait={variant === 'class'} class:editorial={variant === 'editorial'} class:compact={variant === 'compact'} class:visual-card={variant === 'property' || variant === 'portrait-art'} class:property={variant === 'property'} class:portrait-art={variant === 'portrait-art'} class:home>
  {#if variant === 'property' || variant === 'portrait-art'}
    <div class="visual" class:scene={variant === 'property'}>
      {#if image}<img class="art" src={`${base}/data/${image.url}`} width={image.width} height={image.height} alt="" loading="lazy" decoding="async" />
      {:else}<span class="art fallback" aria-hidden="true">{@html glyph}</span>{/if}
    </div>
  {:else if variant !== 'editorial'}
    {#if ref.icon}<img class="art" src={`${base}/data/${ref.icon.url}`} width={variant === 'class' ? 72 : 44} height={variant === 'class' ? 72 : 44} alt="" loading="lazy" decoding="async" />
    {:else}<span class="art fallback" aria-hidden="true">{@html glyph}</span>{/if}
  {/if}
  <span class="copy">
    <span class="name"><EntityLink {ref} {registry} tooltip={false} plain /></span>
    {#if descriptionText}<span class="description">{descriptionText}</span>{/if}
    {#if facts.length}<span class="facts">{#each facts as fact, index}{#if index}<span class="separator" aria-hidden="true">{' · '}</span>{/if}<span class="fact">{fact}</span>{/each}</span>{/if}
    {#if metrics.length}
      <span class="metrics">
        {#each metrics as metric}
          <span class="metric">
            <span class="metric-label">{metric.label}</span>
            <span class="metric-value">
              {#if metric.amount !== null}
                {#if metric.currency}
                  <Price price={{ amount: metric.amount, currency: metric.currency }} showName />
                {:else}
                  <span class="c-price">{formatNumber(metric.amount)}</span>
                {/if}
              {:else}
                Unknown
              {/if}
            </span>
            {#if metric.interval !== undefined}<span class="interval">every {intervalText(metric.interval)} of active play</span>{/if}
          </span>
        {/each}
      </span>
    {/if}
  </span>
</div>

<style>
  .tile { position: relative; display: flex; align-items: center; gap: .75rem; min-width: 0; height: 100%; padding: .75rem .85rem; border: 1px solid var(--c-line); border-radius: var(--c-radius); background: var(--c-surface-1); color: var(--c-text); transition: border-color .15s ease; }
  .tile:hover { border-color: var(--c-frame-hover); }
  .art { flex: none; width: 2.75rem; height: 2.75rem; border: 1px solid var(--c-frame); border-radius: 10px; background: var(--c-surface-sunken); }
  .visual-card { flex-direction: column; align-items: stretch; gap: 0; overflow: hidden; padding: 0; }
  .visual { display: grid; place-items: center; flex: none; width: 100%; aspect-ratio: 16 / 9; background: var(--c-surface-sunken); }
  .visual.scene { position: relative; display: block; overflow: hidden; }
  .visual.scene .art { position: absolute; inset: 0; width: 100%; height: 100%; border: 0; border-radius: 0; object-fit: cover; }
  .portrait-art .visual, .visual:not(.scene) { height: 6.5rem; aspect-ratio: auto; background: radial-gradient(ellipse at 50% 0%, var(--c-surface-3), var(--c-surface-1)); }
  .visual:not(.scene) .art { width: 5rem; height: 5rem; border-radius: 12px; object-fit: contain; }
  .visual-card .copy { display: flex; flex-direction: column; align-items: stretch; flex: 1 1 auto; width: 100%; padding: .95rem 1rem 1rem; gap: .35rem; }
  .visual-card.portrait-art .copy { align-items: center; text-align: center; }
  .visual-card .facts { margin-top: auto; }
  .visual-card.property .facts { margin-top: 0; }
  .visual-card.property .metrics { margin-top: auto; }
  .fallback { display: grid; place-items: center; color: var(--c-text-mute); }
  .fallback :global(svg) { width: 45%; height: 45%; }
  .copy { display: grid; flex: 1 1 auto; align-content: center; gap: .22rem; min-width: 0; overflow-wrap: anywhere; }
  .name { color: var(--c-text-strong); font-size: var(--c-text-lead); font-weight: 600; }
  .description { color: var(--c-text-dim); font-size: var(--c-text-small); line-height: 1.4; text-wrap: balance; }
  .facts { color: var(--c-text-dim); font-size: var(--c-text-small); line-height: 1.4; font-variant-numeric: tabular-nums; }
  .fact { white-space: nowrap; }
  .metrics { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .55rem; padding-top: .65rem; border-top: 1px solid var(--c-line-soft); font-variant-numeric: tabular-nums; }
  .metric { display: grid; align-content: start; gap: .2rem; min-width: 0; }
  .metric-label { color: var(--c-text-mute); font-size: var(--c-text-label); }
  .metric-value { color: var(--c-text-dim); font-size: var(--c-text-small); white-space: nowrap; }
  .interval { color: var(--c-text-mute); font-size: var(--c-text-label); }
  .portrait { flex-direction: column; justify-content: flex-start; gap: .8rem; padding: 1.25rem .85rem 1rem; background: radial-gradient(120% 90% at 50% 0%, var(--c-surface-3) 0%, var(--c-surface-1) 60%); text-align: center; }
  .portrait .art { width: 4.5rem; height: 4.5rem; border-radius: 14px; box-shadow: 0 8px 20px var(--c-shadow); }
  .portrait .copy { flex: 0 1 auto; align-content: start; justify-items: center; }
  .portrait:not(.home) .copy { display: flex; flex-direction: column; align-items: center; flex: 1 1 auto; width: 100%; }
  .portrait:not(.home) .description { max-width: 100%; }
  .portrait:not(.home) .facts { margin-top: auto; }
  .compact:not(.home) { align-items: flex-start; }
  .compact:not(.home) .copy { align-content: start; }
  .editorial { align-items: flex-start; padding: 1rem 1.1rem; }
  .editorial .copy { align-content: start; }
  .tile :global(.entity-link) { color: var(--c-text-strong); }
  .tile :global(.entity-link::after) { content: ''; position: absolute; inset: 0; }
  .tile:has(:global(.entity-link:focus-visible)) { outline: 2px solid var(--c-accent); outline-offset: 2px; }
  .tile :global(.plain .name), .tile :global(.plain.entity-link:hover .name) { text-decoration: none; }
  @media (max-width: 640px) {
    .home.portrait { flex-direction: row; align-items: center; gap: .9rem; padding: .75rem .9rem; text-align: left; }
    .home.portrait .art { width: 3.25rem; height: 3.25rem; box-shadow: none; }
    .home.portrait .copy { justify-items: start; }
    .tile:not(.home) { padding: .7rem; }
    .visual-card:not(.home) { padding: 0; }
    .tile:not(.home) .facts { display: grid; gap: .1rem; }
    .tile:not(.home) .separator { display: none; }
    .tile:not(.home) .fact { white-space: nowrap; }
    .compact:not(.home) { flex-direction: column; align-items: flex-start; gap: .55rem; }
    .portrait:not(.home) { gap: .45rem; }
    .portrait:not(.home) .art { width: 3.25rem; height: 3.25rem; }
    .tile:not(.home) .name { font-size: var(--c-text-prose); }
    .visual-card.portrait-art .name { font-size: var(--c-text-small); }
    .compact:not(.home) .name { font-size: var(--c-text-small); }
  }
  @media (prefers-reduced-motion: reduce) { .tile { transition: none; } }
</style>
