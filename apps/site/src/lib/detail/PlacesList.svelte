<script lang="ts" context="module">
  import type { Ref } from '@afallon/contracts/public';
  export interface PlaceCount { place: Ref; spotCount: number; nameHref?: string; id?: string }
</script>
<script lang="ts">
  import { onMount, tick } from 'svelte';
  import type { PublicKindEntry } from '@afallon/contracts/public';
  import EntityLink from '../EntityLink.svelte';
  import { detailNavigation } from './detail-navigation';
  import { shownRowCount } from './relation-table';
  import { fragmentId } from './tab-state';
  export let places: PlaceCount[];
  export let registry: PublicKindEntry[];
  let expanded = false;
  const navigation = detailNavigation();
  $: sorted = [...places].sort((left, right) => right.spotCount - left.spotCount || ('name' in left.place && 'name' in right.place ? left.place.name.localeCompare(right.place.name) : 0));
  $: maximum = Math.max(1, ...places.map((place) => place.spotCount));
  $: shown = shownRowCount(sorted.length, expanded);

  async function reveal(anchor: string): Promise<boolean> {
    const index = sorted.findIndex((place) => place.id === anchor);
    if (index < 0) return false;
    if (index >= shown) {
      expanded = true;
      await tick();
    }
    return true;
  }

  onMount(() => {
    const follow = async () => {
      const anchor = fragmentId(window.location.hash);
      if (await reveal(anchor)) requestAnimationFrame(() => document.getElementById(anchor)?.scrollIntoView({ block: 'center' }));
    };
    void follow();
    window.addEventListener('hashchange', follow);
    window.addEventListener('popstate', follow);
    const removeRevealer = navigation?.addRevealer(reveal);
    return () => {
      window.removeEventListener('hashchange', follow);
      window.removeEventListener('popstate', follow);
      removeRevealer?.();
    };
  });
</script>

<ul class="places">
  {#each sorted as place, index}
    <li id={place.id} hidden={index >= shown}>
      <span class="name">{#if place.nameHref}<a class="c-link place-name" href={place.nameHref}>{place.place.key === null ? place.place.label : place.place.name}</a>{:else}<EntityLink ref={place.place} {registry} />{/if}</span>
      <span class="spots">{place.spotCount} {place.spotCount === 1 ? 'spot' : 'spots'}</span>
      <span class="bar" aria-hidden="true"><span style={`width: ${place.spotCount / maximum * 100}%`}></span></span>
    </li>
  {/each}
</ul>
{#if shown < sorted.length}<button class="c-action show-more" type="button" on:click={() => (expanded = true)}>Show {sorted.length - shown} more</button>{/if}

<style>
  .places { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0 1.5rem; margin: 0; padding: 0; list-style: none; }
  li { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: .2rem .75rem; align-items: center; min-width: 0; padding: .5rem 0; border-bottom: 1px solid var(--c-line-soft); scroll-margin-top: 6rem; }
  li[hidden] { display: none; }
  .name { min-width: 0; overflow-wrap: break-word; }
  .place-name { display: inline-flex; min-height: 1.5rem; align-items: center; color: var(--c-text-strong); text-decoration: none; }
  .place-name:hover, .place-name:focus-visible { color: var(--c-accent); text-decoration: underline; }
  .place-name:focus-visible { outline: 2px solid var(--c-accent); outline-offset: 2px; }
  .spots { color: var(--c-text-dim); font-size: var(--c-text-small); font-variant-numeric: tabular-nums; text-align: right; }
  .bar { grid-column: 1 / -1; height: .1875rem; border-radius: .125rem; background: var(--c-line-soft); }
  .bar span { display: block; height: 100%; border-radius: inherit; background: var(--c-accent-muted); }
  .show-more { margin-top: .75rem; }
  @media (max-width: 1023px) { .places { grid-template-columns: minmax(0, 1fr); } }
</style>
