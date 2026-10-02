<script lang="ts">
  import { onMount, tick } from 'svelte';
  import type { PublicKindEntry, PublicNpc } from '@afallon/contracts/public';
  import Availability from '../../Availability.svelte';
  import EntityLink from '../../EntityLink.svelte';
  import NpcLevel from '../../NpcLevel.svelte';
  import VariantLinks from '../../VariantLinks.svelte';
  import { alternativeText, roleLabel } from '../../format';
  import { spotOnMap } from '../../map-links';
  import { detailNavigation } from '../detail-navigation';
  import PlacesList from '../PlacesList.svelte';
  import Section from '../Section.svelte';
  import { fragmentId } from '../tab-state';

  export let document: PublicNpc;
  export let registry: PublicKindEntry[];
  export let variantTable: boolean;

  $: locations = document.locations;
  $: places = document.places.map((place) => ({
    place: { key: null, label: place.label } as const,
    spotCount: place.spotCount,
  }));
  const placeKey = (mapSpaceId: string, label: string) => JSON.stringify([mapSpaceId, label]);
  function locationPlaceIndex(location: PublicNpc['locations'][number], order: Map<string, number>, fallback: number): number {
    const placement = location.placements[0];
    return placement ? order.get(placeKey(placement.mapSpaceId, placement.label)) ?? fallback : fallback;
  }
  $: placeOrder = new Map(document.places.map((place, index) => [placeKey(place.mapSpaceId, place.label), index]));
  $: unknown = locations.filter((location) => !location.placements.some((placement) => placeOrder.has(placeKey(placement.mapSpaceId, placement.label))));
  $: detailsRows = [...locations].sort((left, right) =>
    locationPlaceIndex(left, placeOrder, document.places.length) - locationPlaceIndex(right, placeOrder, document.places.length));
  $: firstRow = new Map(document.variants.map((variant) => [variant.anchor, locations.findIndex((location) => location.variants.includes(variant.anchor))]));
  $: unplaced = document.variants.length > 1 && !variantTable ? document.variants.filter((variant) => firstRow.get(variant.anchor) === -1) : [];

  let expanded = false;
  const nav = detailNavigation();
  function holdsAnchor(id: string): boolean {
    return !variantTable && locations.some((location) => location.variants.some((anchor) => anchor === id));
  }
  async function reveal(id: string): Promise<boolean> {
    if (!holdsAnchor(id)) return false;
    expanded = true;
    await tick();
    return true;
  }
  onMount(() => {
    const fromHash = () => {
      const id = fragmentId(window.location.hash);
      if (id && holdsAnchor(id)) void reveal(id).then(() => requestAnimationFrame(() => globalThis.document.getElementById(id)?.scrollIntoView({ block: 'center' })));
    };
    fromHash();
    window.addEventListener('hashchange', fromHash);
    const remove = nav?.addRevealer(reveal);
    return () => { window.removeEventListener('hashchange', fromHash); remove?.(); };
  });
</script>

<Section id="where-to-find" title="Where to find" count={places.length || undefined}>
  {#if places.length}<PlacesList {places} {registry} />
  {:else if !locations.length}<p class="empty">No known location.</p>{/if}
  {#if unknown.length}<p class="unknown">{unknown.length} {unknown.length === 1 ? 'location has' : 'locations have'} no identified place. Their spot details are below.</p>{/if}
  {#if detailsRows.length}
    <details bind:open={expanded}>
      <summary>Show spot details and conditions</summary>
      <div class="placements">
        {#each detailsRows as location}
          <div class="placement">
            {#if !variantTable}
              {#each location.variants.filter((anchor) => firstRow.get(anchor) === locations.indexOf(location)) as anchor}<span id={anchor} class="anchor"></span>{/each}
            {/if}
            <h3>{location.label}</h3>
            {#if location.level}<p>Level <NpcLevel level={location.level} /></p>{/if}
            {#if location.roles.length}<p>Role: {location.roles.map(roleLabel).join(', ')}</p>{/if}
            {#if document.variants.length > 1}<p>Variant: <VariantLinks anchors={location.variants} variants={document.variants} /></p>{/if}
            {#if location.availability.length}<Availability rules={location.availability} {registry} />{/if}
            {#if location.alternative}<p>{alternativeText(location.alternative.chance, location.alternative.options)}</p>{/if}
            {#if location.quests.length}<p>Quests: {#each location.quests as quest, index}{index ? ', ' : ''}<EntityLink ref={quest.counterpart} {registry} /> ({quest.role}){/each}</p>{/if}
            {#if location.placements.length}<div class="spots"><span>{location.spotCount} {location.spotCount === 1 ? 'spot' : 'spots'}:</span>{#each location.placements as placement, index}<a class="c-link" href={spotOnMap(placement.placementId)} aria-label={`${location.label}, spot ${index + 1} on map`}>Spot {index + 1} on map</a>{/each}</div>{/if}
          </div>
        {/each}
      </div>
    </details>
  {/if}
  {#if unplaced.length}<p class="unknown">Without a published location: {#each unplaced as variant, index}{index ? ', ' : ''}<span id={variant.anchor}>{variant.label}</span>{/each}</p>{/if}
</Section>

<style>
  .empty, .unknown { color: var(--c-text-dim); }
  summary { min-height: 1.5rem; color: var(--c-accent); cursor: pointer; }
  .placements { display: grid; gap: .75rem; margin-top: .75rem; }
  .placement { position: relative; display: grid; gap: .35rem; padding: .9rem 1rem; border: 1px solid var(--c-line-soft); border-radius: var(--c-radius); background: var(--c-surface-1); }
  h3 { font-size: 1rem; }
  .spots { display: flex; flex-wrap: wrap; gap: .3rem .8rem; }
  .anchor { position: absolute; scroll-margin-top: 6rem; }
</style>
