<script lang="ts" context="module">
  import type { EntityRef } from '@afallon/contracts/public';
  /** `guide` links the value to the guide section that explains how the game computes it. */
  export interface Stat { label: string; value: string; note?: string; href?: string; guide?: { guide: EntityRef; section: string } }
</script>
<script lang="ts">
  import '../compendium.css';
  import HowItWorks from './HowItWorks.svelte';
  export let stats: Stat[];
  $: if (stats.length > 5) throw new Error('A stat strip cannot contain more than five facts');
</script>
{#if stats.length}
  <dl class="stat-strip" style={`--stat-count: ${stats.length}`}>
    {#each stats as stat}
      <div class="stat">
        <dt>{stat.label}</dt>
        <dd>{#if stat.href}<a class="c-link" href={stat.href}>{stat.value}</a>{:else}{stat.value}{/if}{#if stat.note}<span class="note">{stat.note}</span>{/if}{#if stat.guide}<span class="guide"><HowItWorks guide={stat.guide.guide} section={stat.guide.section} /></span>{/if}</dd>
      </div>
    {/each}
  </dl>
{/if}

<style>
  .stat-strip { display: grid; grid-template-columns: repeat(var(--stat-count, 5), minmax(0, 1fr)); margin: 1.25rem 0 0; border-block: 1px solid var(--c-line-soft); }
  .stat { min-width: 0; padding: .85rem .75rem; text-align: center; }
  .stat + .stat { border-left: 1px solid var(--c-line-soft); }
  dt, .note { color: var(--c-text-mute); font-size: var(--c-text-small); }
  .note { display: block; margin-top: .1rem; font-weight: 400; line-height: 1.4; }
  dt { font-weight: 600; }
  .guide { display: flex; justify-content: center; margin-top: .35rem; font-weight: 400; line-height: 1.4; }
  dd { margin: .15rem 0 0; color: var(--c-text-strong); font-size: 1.35rem; font-weight: 600; line-height: 1.25; font-variant-numeric: tabular-nums; overflow-wrap: break-word; }
  dd :global(.c-link) { display: inline-flex; min-height: 1.5rem; align-items: center; color: inherit; text-decoration: none; text-underline-offset: .2em; }
  dd :global(.c-link:hover), dd :global(.c-link:focus-visible) { color: var(--c-accent); text-decoration: underline; }
  dd :global(.c-link:focus-visible) { outline: 2px solid var(--c-accent); outline-offset: 2px; }
  @media (max-width: 1023px) {
    .stat-strip { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .stat:nth-child(odd) { border-left: 0; }
    .stat:nth-child(n + 3) { border-top: 1px solid var(--c-line-soft); }
  }
</style>
