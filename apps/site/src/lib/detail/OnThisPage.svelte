<script lang="ts">
  import { SECTION_LIST_MINIMUM, type SectionEntry } from './detail-navigation';

  /** The rendered sections of the page, in page order. */
  export let sections: SectionEntry[];
  /** `side` stands beside the sections on a wide screen. `disclosure` stands above them on a narrow screen. */
  export let variant: 'side' | 'disclosure';

  let details: HTMLDetailsElement | undefined;
</script>

{#if sections.length >= SECTION_LIST_MINIMUM}
  {#if variant === 'side'}
    <nav class="outline side" aria-label="On this page">
      <p class="heading">On this page</p>
      <ol>{#each sections as section (section.id)}<li><a href={`#${section.id}`}>{section.title}</a></li>{/each}</ol>
    </nav>
  {:else}
    <details class="outline disclosure" bind:this={details}>
      <summary>On this page</summary>
      <nav aria-label="On this page">
        <ol>{#each sections as section (section.id)}<li><a href={`#${section.id}`} on:click={() => { if (details) details.open = false; }}>{section.title}</a></li>{/each}</ol>
      </nav>
    </details>
  {/if}
{/if}

<style>
  ol { display: grid; gap: .1rem; margin: 0; padding: 0; list-style: none; }
  a { display: block; padding: .3rem .5rem; border-radius: var(--c-radius-sm); color: var(--c-text-dim); font-size: var(--c-text-body); line-height: 1.35; text-decoration: none; overflow-wrap: anywhere; }
  a:hover { background: var(--c-tint-hover); color: var(--c-text-strong); }
  a:focus-visible, summary:focus-visible { outline: 2px solid var(--c-accent); outline-offset: 1px; }
  .heading { margin: 0 0 .35rem; padding: 0 .5rem; color: var(--c-text-mute); font-size: var(--c-text-label); font-weight: 700; letter-spacing: .06em; text-transform: uppercase; }
  .side { position: sticky; top: 1rem; max-height: calc(100vh - 2rem); overflow-y: auto; }
  .disclosure { border: 1px solid var(--c-line); border-radius: var(--c-radius); background: var(--c-surface-1); }
  summary { padding: .65rem .85rem; color: var(--c-text-strong); font-weight: 600; cursor: pointer; }
  .disclosure nav { padding: 0 .35rem .5rem; }
  .disclosure a { padding: .55rem .5rem; }
</style>
