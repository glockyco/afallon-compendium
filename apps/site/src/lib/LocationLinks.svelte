<script lang="ts">
  import { base } from '$app/paths';
  import type { PlacementRef } from '@afallon/contracts/public';
  import MissingValue from './MissingValue.svelte';

  export let placements: PlacementRef[];
</script>

{#if placements.length}{#each placements as placement}<a href={`${base}/?selected=${encodeURIComponent(placement.placementId)}`}>{placement.label}</a>{/each}{:else}<MissingValue explanation="No location is published" />{/if}

<style>a { display: block; color: #d9bd79; text-underline-offset: .18em; } a + a { margin-top: .2rem; }</style>
