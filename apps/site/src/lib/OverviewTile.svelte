<script lang="ts">
  import { base } from '$app/paths';
  import type { EntityRef, PublicKindEntry } from '@afallon/contracts/public';
  import EntityLink from './EntityLink.svelte';
  import { kindGlyphSvg } from './kind-icon';

  export let ref: EntityRef;
  export let registry: PublicKindEntry[];
  export let facts: string[] = [];
  export let metrics: Array<{ label: string; value: string | null; detail?: string }> = [];
  export let description: string | null = null;
  export let variant: 'class' | 'compact' | 'editorial' | 'property' = 'compact';
  export let home = false;
  $: glyph = kindGlyphSvg(registry.find((entry) => entry.kind === ref.kind)?.icon) ?? '';
</script>

<div class="tile" class:portrait={variant === 'class'} class:editorial={variant === 'editorial'} class:compact={variant === 'compact'} class:home>
  {#if variant !== 'editorial'}
    {#if ref.icon}<img class="art" src={`${base}/data/${ref.icon.url}`} width={variant === 'class' ? 72 : 44} height={variant === 'class' ? 72 : 44} alt="" loading="lazy" decoding="async" />
    {:else}<span class="art fallback" aria-hidden="true">{@html glyph}</span>{/if}
  {/if}
  <span class="copy">
    <span class="name"><EntityLink {ref} {registry} tooltip={false} plain /></span>
    {#if description}<span class="description">{description}</span>{/if}
    {#if facts.length}<span class="facts">{facts.join(' · ')}</span>{/if}
    {#if metrics.length}<span class="metrics">{#each metrics as metric}<span class="metric"><span class="metric-label">{metric.label}</span><span class="metric-value" class:c-price={metric.value !== null}>{metric.value ?? 'Unknown'}</span>{#if metric.detail}<span class="metric-detail">{metric.detail}</span>{/if}</span>{/each}</span>{/if}
  </span>
</div>

<style>
  .tile { position: relative; display: flex; align-items: center; gap: .75rem; min-width: 0; height: 100%; padding: .75rem .85rem; border: 1px solid var(--c-line); border-radius: var(--c-radius); background: var(--c-surface-1); color: var(--c-text); transition: border-color .15s ease; }
  .tile:hover { border-color: var(--c-frame-hover); }
  .art { flex: none; width: 2.75rem; height: 2.75rem; border: 1px solid var(--c-frame); border-radius: 10px; background: var(--c-surface-sunken); }
  .fallback { display: grid; place-items: center; color: var(--c-text-mute); }
  .fallback :global(svg) { width: 45%; height: 45%; }
  .copy { display: grid; flex: 1 1 auto; align-content: center; gap: .22rem; min-width: 0; overflow-wrap: anywhere; }
  .name { color: var(--c-text-strong); font-size: var(--c-text-lead); font-weight: 600; }
  .description { color: var(--c-text-dim); font-size: var(--c-text-small); line-height: 1.4; }
  .facts { color: var(--c-text-dim); font-size: var(--c-text-small); line-height: 1.4; font-variant-numeric: tabular-nums; }
  .metrics { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .4rem; margin-top: .35rem; font-variant-numeric: tabular-nums; }
  .metric { display: grid; gap: .15rem; min-width: 0; }
  .metric-label { color: var(--c-text-mute); font-size: var(--c-text-label); }
  .metric-value { font-size: var(--c-text-small); white-space: nowrap; }
  .metric-detail { color: var(--c-text-mute); font-size: var(--c-text-label); }
  .portrait { flex-direction: column; justify-content: flex-start; gap: .8rem; padding: 1.25rem .85rem 1rem; background: radial-gradient(120% 90% at 50% 0%, var(--c-surface-3) 0%, var(--c-surface-1) 60%); text-align: center; }
  .portrait .art { width: 4.5rem; height: 4.5rem; border-radius: 14px; box-shadow: 0 8px 20px var(--c-shadow); }
  .portrait .copy { justify-items: center; }
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
    .compact:not(.home) { flex-direction: column; align-items: flex-start; gap: .55rem; }
    .portrait:not(.home) { gap: .45rem; }
    .portrait:not(.home) .art { width: 3.25rem; height: 3.25rem; }
    .tile:not(.home) .name { font-size: var(--c-text-prose); }
  }
  @media (prefers-reduced-motion: reduce) { .tile { transition: none; } }
</style>
