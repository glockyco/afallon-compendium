<script lang="ts">
  import type { PublicKindEntry, Ref } from '@afallon/contracts/public';
  import EntityLink from '../EntityLink.svelte';
  import { shownRowCount } from './relation-table';

  // A grid of links that shows its first rows and a button for the rest, as a relation table does. Each name stays on
  // one line and ends with an ellipsis when its column is too narrow, and its hover card names it in full.
  export let refs: Ref[];
  export let registry: PublicKindEntry[];
  /** Shows every link at once, for a grid that sits behind its own disclosure. */
  export let expanded = false;
  $: shown = shownRowCount(refs.length, expanded);
</script>

<div class="link-grid-wrap">
  <ul class="link-grid">{#each refs.slice(0, shown) as ref}<li><EntityLink {ref} {registry} truncate /></li>{/each}</ul>
  {#if shown < refs.length}<button type="button" class="c-action show-all" on:click={() => (expanded = true)}>Show {refs.length - shown} more</button>{/if}
</div>

<style>
  .link-grid-wrap { display: grid; gap: .6rem; justify-items: start; }
  .link-grid { display: grid; gap: .45rem 1rem; grid-template-columns: repeat(auto-fill, minmax(min(100%, 14rem), 1fr)); width: 100%; margin: 0; padding: 0; list-style: none; font-size: var(--c-text-body); }
  .link-grid li { min-width: 0; }
  .show-all { min-height: 1.5rem; }
</style>
