<script lang="ts">
  import { onMount } from 'svelte';
  import { followLocation, provideDetailNavigation } from './detail-navigation';
  import OnThisPage from './OnThisPage.svelte';

  // The sections below register themselves as they render. The side list follows them, so a prerendered page already
  // holds it and the section column keeps its width after the page starts. The disclosure precedes the sections in
  // reading order, so it appears once they have registered in the browser.
  const navigation = provideDetailNavigation();
  const sections = navigation.sections;
  onMount(() => followLocation(navigation));
</script>

<div class="section-layout">
  <OnThisPage sections={$sections} variant="disclosure" />
  <div class="c-sections"><slot /></div>
  <OnThisPage sections={$sections} variant="side" />
</div>

<style>
  .section-layout { display: grid; gap: 1.25rem; }
  .section-layout > :global(*) { min-width: 0; }
  /* A wide screen shows the list beside the section column. A narrower one shows the disclosure above the sections. */
  @media (min-width: 1100px) {
    .section-layout:has(> :global(.side)) { grid-template-columns: minmax(0, 1fr) 12rem; column-gap: 1.75rem; }
    .section-layout > :global(.side) { grid-column: 2; grid-row: 1; align-self: start; }
    .section-layout > :global(.disclosure) { display: none; }
  }
  @media (max-width: 1099.98px) {
    .section-layout > :global(.side) { display: none; }
  }
</style>
