<script lang="ts">
  import { base } from '$app/paths';
  import type { PlacementRef } from '@afallon/contracts/public';
  import MissingValue from './MissingValue.svelte';

  export let locations: PlacementRef[];
  export let heading = 'Locations';
  export let limit: number | undefined = undefined;
  export let entityKey: string | undefined = undefined;
  export let item = false;

  $: visible = limit === undefined ? locations : locations.slice(0, limit);
  const atlasHref = (placementId: string) => `${base}/?selected=${encodeURIComponent(placementId)}${entityKey ? `&${item ? 'item' : 'entity'}=${encodeURIComponent(entityKey)}` : ''}`;
</script>

<section class="locations">
  <h2>{heading}</h2>
  {#if visible.length > 0}
    <ul>{#each visible as location}<li><a href={atlasHref(location.placementId)}>{location.label}</a></li>{/each}</ul>
  {:else}
    <p><MissingValue explanation="No location is published" /></p>
  {/if}
</section>

<style>
  section { margin-top: 1.2rem; }
  h2 { margin: 0 0 .55rem; color: #eee9dd; font: 600 1rem/1.3 Georgia, serif; }
  ul { display: grid; gap: .35rem; margin: 0; padding-left: 1.1rem; }
  p { margin: 0; }
  a { color: #d9bd79; text-underline-offset: .18em; }
</style>
