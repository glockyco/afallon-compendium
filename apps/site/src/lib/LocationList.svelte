<script lang="ts">
  import { base } from '$app/paths';
  import type { PlacementRef } from '@afallon/contracts/public';
  import Card from './Card.svelte';
  import MissingValue from './MissingValue.svelte';
  import { groupPlacementsByLabel } from './placements';

  export let locations: PlacementRef[];
  export let heading = 'Locations';
  export let limit: number | undefined = undefined;
  export let entityKey: string | undefined = undefined;
  export let item = false;

  $: groups = groupPlacementsByLabel(locations);
  $: visible = limit === undefined ? groups : groups.slice(0, limit);
  const atlasHref = (placementId: string) => `${base}/?selected=${encodeURIComponent(placementId)}${entityKey ? `&${item ? 'item' : 'entity'}=${encodeURIComponent(entityKey)}` : ''}`;
</script>

<Card title={heading} count={locations.length > 0 ? locations.length : undefined}>
  {#if visible.length > 0}
    <ul>
      {#each visible as [label, members]}
        <li class:group={members.length > 1}>
          {#if members.length === 1}<a class="c-link" href={atlasHref(members[0]!.placementId)}>{label}</a>
          {:else}{label}{#each members as placement, index}<a class="c-link number" href={atlasHref(placement.placementId)} aria-label={`${label}, location ${index + 1} of ${members.length}`}>{index + 1}</a>{/each}{/if}
        </li>
      {/each}
    </ul>
  {:else}
    <p class="c-empty"><MissingValue explanation="No location is published" /> No location is published for this build.</p>
  {/if}
</Card>

<style>
  ul { display: grid; gap: .4rem; grid-template-columns: repeat(auto-fill, minmax(13rem, 1fr)); margin: 0; padding: 0; list-style: none; }
  li { font-size: .84rem; }
  .group { grid-column: 1 / -1; }
  .number { margin-left: .4rem; }
</style>
