<script lang="ts">
  import { base } from '$app/paths';
  import type { PublicDocument, PublicKindEntry, PublicPlacement } from '@afallon/contracts/public';
  import FactCard from './FactCard.svelte';

  export let detailsPanel: HTMLElement;
  export let document: PublicDocument | null;
  export let selectedPlacement: PublicPlacement | null;
  export let registry: PublicKindEntry[];
  export let mapSpaceLabels: Readonly<Record<string, string>>;
  export let loading: boolean;
  export let error: string;
  export let staleSelection: string;
  export let onRetry: () => void;
  export let onClose: () => void;

  $: kind = document ? registry.find((entry) => entry.kind === document?.ref.kind) : undefined;
  $: pageHref = document?.ref.slug && kind?.pages ? `${base}/${kind.route}/${document.ref.slug}/` : null;
</script>

<aside class="details-panel" bind:this={detailsPanel} aria-label="Selected details">
  <div class="details-header"><div><span class="eyebrow">Compendium details</span><h2 tabindex="-1">{document?.ref.name ?? selectedPlacement?.label ?? 'Selection'}</h2></div>{#if document || selectedPlacement || staleSelection}<button type="button" class="close-button" on:click={onClose}>Close</button>{/if}</div>
  {#if staleSelection}<div class="stale-warning" role="alert"><p>{staleSelection}</p><button type="button" class="inline-link" on:click={onClose}>Clear selection</button></div>
  {:else if error}<div class="stale-warning" role="alert"><p>{error}</p><button type="button" class="inline-link" on:click={onRetry}>Retry details</button></div>
  {:else if loading && !document}<p class="muted" role="status">Loading details…</p>
  {:else if document}
    {#if selectedPlacement}<p class="selected-location"><span>Selected location</span><strong>{selectedPlacement.label}</strong></p>{/if}
    <FactCard {document} {registry} {mapSpaceLabels} compact showRelations limit={5} />
    {#if pageHref}<a class="page-link" href={pageHref}>Open the full {kind?.label.toLocaleLowerCase()} page</a>{/if}
  {:else if selectedPlacement}
    <div class="location-only"><p class="category-line">{selectedPlacement.categories.join(' · ')}</p>{#if selectedPlacement.levelRange}<p>Level {selectedPlacement.levelRange.min}–{selectedPlacement.levelRange.max}</p>{/if}<p>This location has no compendium page.</p></div>
  {:else}<div class="details-empty"><span class="eyebrow">Location details</span><p>Select a marker or a result to inspect it.</p></div>{/if}
</aside>

<style>
  /* The panel heading already names the selection, so the card does not repeat it. */
  .details-panel :global(.entity-header h3) { display: none; }
  .selected-location { display: grid; gap: .2rem; margin: .8rem 0; padding: .6rem; border-left: 2px solid #bca36e; background: #292820; }
  .selected-location span { color: #aaa69d; font-size: .66rem; font-weight: 700; letter-spacing: .07em; text-transform: uppercase; }
  .selected-location strong { font-size: .8rem; }
  .page-link { display: block; margin-top: 1.2rem; padding: .65rem; border: 1px solid #806d4a; background: #2a261e; color: #e4ce99; font-size: .78rem; text-align: center; text-underline-offset: .18em; }
  .location-only { color: #bbb7ae; font-size: .78rem; line-height: 1.45; }
</style>
