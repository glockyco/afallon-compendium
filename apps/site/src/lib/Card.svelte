<script lang="ts">
  // Every compendium surface reaches the shared tokens through a card, including the tooltip and
  // the atlas detail panel, so the stylesheet is imported here rather than per page.
  import './compendium.css';

  export let title: string;
  export let count: number | undefined = undefined;
  /** The facts of a page carry more than a chip list, so they take two columns of the card grid. */
  export let wide = false;
</script>

<section class="c-card" class:c-card--wide={wide}>
  <header><h2>{title}</h2>{#if count !== undefined}<span class="c-count">({count})</span>{/if}<slot name="action" /></header>
  <slot />
</section>
