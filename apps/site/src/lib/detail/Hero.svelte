<script lang="ts">
  import '../compendium.css';

  /**
   * The width of the view area: `wide` for a tooltip, a panel, or artwork, and `narrow` for a portrait. Without a view,
   * the facts use the whole panel.
   */
  export let view: 'wide' | 'narrow' | undefined = undefined;
</script>

<section class="hero" class:with-view={view !== undefined} data-view={view} aria-label="Overview">
  {#if view}<div class="view"><slot name="view" /></div>{/if}
  <div class="facts"><slot /></div>
</section>

<style>
  .hero { display: grid; gap: 1.25rem; align-items: start; margin-bottom: 1.75rem; padding: 1rem; border: 1px solid var(--c-line); border-radius: var(--c-radius); background: var(--c-surface-1); }
  .with-view { grid-template-columns: var(--view-width) minmax(0, 1fr); }
  [data-view='wide'] { --view-width: 24rem; }
  [data-view='narrow'] { --view-width: 12rem; }
  .view, .facts { min-width: 0; }
  .facts { display: grid; gap: 1rem; align-content: start; }
  /* The grid gap spaces the facts, so a page style that gives paragraphs a bottom margin cannot add space below the last one. */
  .facts > :global(*) { margin-block: 0; }
  @media (max-width: 760px) {
    .with-view { grid-template-columns: minmax(0, 1fr); }
    [data-view='narrow'] .view { max-width: 12rem; }
  }
</style>
