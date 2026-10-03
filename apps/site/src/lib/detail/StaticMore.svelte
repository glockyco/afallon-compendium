<script lang="ts">
  import { onMount } from 'svelte';

  export let count: number;
  export let summary = `Show ${count} more`;
  let enhanced = false;
  onMount(() => { enhanced = true; });
</script>

{#if enhanced}
  <slot name="control" />
{:else}
  <!-- Native disclosure keeps every extra link available in static HTML and without JavaScript. -->
  <details class="static-more">
    <summary>{summary}</summary>
    <slot />
  </details>
{/if}

<style>
  .static-more { min-width: 0; }
  summary { width: fit-content; margin: .5rem .75rem; color: var(--c-accent); cursor: pointer; font-size: var(--c-text-small); text-decoration: underline; text-underline-offset: .2em; }
  summary:focus-visible { outline: 2px solid var(--c-accent); outline-offset: 2px; }
</style>
