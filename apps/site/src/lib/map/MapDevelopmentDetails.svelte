<script lang="ts">
  import { base } from '$app/paths';
  import type { PublicKindEntry, PublicPlacement, StaticDocument } from '@afallon/contracts/public';
  import { alternativeText, formatNumber, npcLevelText } from '../format';
  import TooltipPresenter from '../TooltipPresenter.svelte';
  import { markerFor, resolveMarker } from './marker-registry';

  export let detailsPanel: HTMLElement;
  export let page: StaticDocument | null;
  export let selectedPlacement: PublicPlacement | null;
  export let registry: PublicKindEntry[];
  export let mapSpaceLabels: Readonly<Record<string, string>>;
  export let loading: boolean;
  export let error: string;
  export let staleSelection: string;
  export let onRetry: () => void;
  export let onClose: () => void;

  $: kind = page ? registry.find((entry) => entry.kind === page?.kind) : undefined;
  // A card links a page only when the kind publishes pages and the reference names one.
  $: pageHref = page && kind?.pages && page.document.ref.slug ? `${base}/${kind.route}/${page.document.ref.slug}/` : null;
  $: placementMarker = selectedPlacement ? resolveMarker(selectedPlacement) : null;
  $: kindLabel = kind?.label ?? (placementMarker ? markerFor(placementMarker).label : null);
  $: placementFacts = selectedPlacement ? [
    { label: 'Placement', value: page && page.document.ref.name !== selectedPlacement.label ? selectedPlacement.label : undefined },
    { label: 'Map', value: mapSpaceLabels[selectedPlacement.mapSpaceId] },
    { label: 'Category', value: selectedPlacement.categories.map((category) => markerFor(category).label).join(', ') },
    { label: 'Level', value: selectedPlacement.level ? npcLevelText(selectedPlacement.level) : undefined },
    { label: 'Spawn', value: selectedPlacement.alternative ? alternativeText(selectedPlacement.alternative.chance, selectedPlacement.alternative.options) : undefined },
    { label: 'Movement', value: [...new Set(selectedPlacement.movement.map((movement) => movement.kind === 'patrol' ? 'Patrolling' : 'Roaming'))].join(', ') || undefined },
    { label: 'Position', value: selectedPlacement.position.map((coordinate) => formatNumber(Math.round(coordinate))).join(', ') },
  ].filter((fact): fact is { label: string; value: string } => Boolean(fact.value)) : [];
</script>

<aside class="details-panel" bind:this={detailsPanel} aria-label="Development selection details">
  <div class="details-header"><div>{#if kindLabel}<span class="eyebrow">{kindLabel}</span>{/if}<h2 tabindex="-1">{page?.document.ref.name ?? selectedPlacement?.label ?? 'Selection'}</h2>{#if pageHref}<a class="page-link" href={pageHref}>Open page</a>{/if}</div>{#if page || selectedPlacement || staleSelection}<button type="button" class="close-button" on:click={onClose}>Close</button>{/if}</div>
  {#if staleSelection}<div class="stale-warning" role="alert"><p>{staleSelection}</p></div>{/if}
  {#if error}<div class="stale-warning" role="alert"><p>{error}</p><button type="button" class="inline-link" on:click={onRetry}>Retry details</button></div>{/if}
  {#if loading && !page}<p class="muted" role="status">Loading document…</p>{/if}
  {#if page}<TooltipPresenter {page} {registry} {mapSpaceLabels} />{/if}
  {#if placementFacts.length}
    <dl class="placement-facts">
      {#each placementFacts as fact (fact.label)}<dt>{fact.label}</dt><dd>{fact.value}</dd>{/each}
    </dl>
  {/if}
  {#if page}<details class="entity-block"><summary>Published document</summary><pre>{JSON.stringify(page.document, null, 2)}</pre></details>{/if}
  {#if selectedPlacement}<details class="entity-block"><summary>Published placement</summary><pre>{JSON.stringify(selectedPlacement, null, 2)}</pre></details>{/if}
  {#if !page && !selectedPlacement && !staleSelection}<div class="details-empty"><span class="eyebrow">Development details</span><p>Select a marker or a result to inspect its published data.</p></div>{/if}
</aside>

<style>
  .page-link { display: inline-block; margin-top: .4rem; color: #d9bd79; font-size: var(--c-text-small); text-underline-offset: 2px; }
  .page-link:hover { color: #f0dcae; }
  .placement-facts { display: grid; grid-template-columns: max-content minmax(0, 1fr); gap: .3rem .8rem; margin: .8rem 0; font-size: var(--c-text-small); }
  dt { color: #8f8c83; }
  dd { margin: 0; color: #d8d3c7; overflow-wrap: anywhere; }
  pre { max-height: 24rem; overflow: auto; color: #c8c4ba; font: .68rem/1.4 ui-monospace, monospace; white-space: pre-wrap; overflow-wrap: anywhere; }
</style>
