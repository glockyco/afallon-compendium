<script lang="ts">
  import { base } from '$app/paths';
  import type { PlacementRef } from '@afallon/contracts/public';
  import MissingValue from './MissingValue.svelte';
  import { groupPlacementsByLabel } from './placements';

  export let placements: PlacementRef[];

  $: groups = groupPlacementsByLabel(placements);
  const href = (placement: PlacementRef) => `${base}/map/?selected=${encodeURIComponent(placement.placementId)}`;
</script>

{#if placements.length}
  {#each groups as [label, members]}
    {#if members.length === 1}<a class="location" href={href(members[0]!)}>{label}</a>
    {:else}<span class="location">{label}{#each members as placement, index}<a href={href(placement)} aria-label={`${label}, location ${index + 1} of ${members.length}`}>{index + 1}</a>{/each}</span>{/if}
  {/each}
{:else}<MissingValue explanation="No location is published" />{/if}

<style>
  a { color: #d9bd79; text-underline-offset: .18em; }
  .location { display: block; }
  /* The numbered links carry no spaces between them, so the label and the numbers wrap as flex items. */
  span.location { display: flex; flex-wrap: wrap; align-items: baseline; gap: .1rem .4rem; }
  .location + .location { margin-top: .2rem; }
</style>
