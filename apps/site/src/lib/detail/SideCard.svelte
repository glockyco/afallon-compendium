<script lang="ts">
  import '../compendium.css';
  // One card of a page's side column: the entity's facts, its arrival, its experience, and similar short groups. Every
  // side card shares this frame, so the side reads as one column of equal cards.
  /** A heading, when the card holds more than the entity's own facts. */
  export let title: string | undefined = undefined;
  export let id: string | undefined = undefined;
</script>

<section class="side-card" {id} aria-label={title}>
  {#if title}<h2>{title}</h2>{/if}
  <slot />
</section>

<style>
  .side-card { display: grid; gap: .75rem; min-width: 0; padding: 1rem; border: 1px solid var(--c-line-soft); border-radius: var(--c-radius); background: var(--c-surface-1); }
  h2 { margin: 0; color: var(--c-text-strong); font: 600 1.05rem/1.3 var(--c-serif); }
  .side-card :global(.fact-list dl) { grid-template-columns: max-content minmax(0, 1fr); gap: .45rem .75rem; }
  .side-card :global(.fact-row dd) { text-align: right; }
  .side-card :global(p) { margin: 0; color: var(--c-text-dim); line-height: 1.5; }
</style>
