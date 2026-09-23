<script lang="ts">
  import type { PublicPlacement } from '@afallon/contracts/public';
  import type { ResultSummary } from '../atlas-search-types';
  import { markerColorCss } from './marker-registry';
  import { markerGlyphSvg } from './icon-atlas';
  export let pending = false;
  export let error = '';
  export let searchPending = false;
  export let onRetry: () => void;
  export let resultList: HTMLElement;
  export let collapsed: boolean;
  export let displayedResults: PublicPlacement[];
  export let totalResults: number;
  export let resultLimit: number;
  export let placementCount: number;
  export let searching: boolean;
  export let hasViewport: boolean;
  export let mapUnavailable: boolean;
  export let selectedPlacementId: string | null;
  export let summaryFor: (placement: PublicPlacement) => ResultSummary;
  export let onToggle: () => void;
  export let onSelectPlacement: (placementId: string, origin: HTMLElement) => void;
  export let onHover: (placement: PublicPlacement) => void;
  export let onClearHover: () => void;
</script>

<section class:collapsed class="results" aria-labelledby="results-heading" bind:this={resultList}>
  <div class="results-header"><div><h2 id="results-heading">Results</h2>{#if searchPending}<p role="status">Loading search data…</p>{/if}{#if error}<p role="alert">{error} <button type="button" on:click={onRetry}>Retry search data</button></p>{/if}{#if pending}<p role="status">Results are not complete.</p>{:else}<p>{placementCount} distinct placements{#if hasViewport && !mapUnavailable}{' in the current viewport'}{/if}</p>{/if}{#if !pending && totalResults > resultLimit}<p class="result-limit">Showing the first {displayedResults.length} of {totalResults} results.</p>{/if}</div><div class="results-actions"><button type="button" class="quiet-button" aria-expanded={!collapsed} aria-controls="results-content" on:click={onToggle}>{collapsed ? 'Show results' : 'Hide results'}</button></div></div>
  <div id="results-content" hidden={collapsed}>
    {#if !pending && !error && placementCount === 0}<p class="empty">{searching ? 'No map locations match this search.' : 'No map locations are visible with the selected categories.'}</p>{:else}
      <ol class="result-list">{#each displayedResults as placement (placement.placementId)}
        {@const summary = summaryFor(placement)}
        <li><button data-result type="button" class:selected-result={placement.placementId === selectedPlacementId} on:click={(event) => onSelectPlacement(placement.placementId, event.currentTarget)} on:mouseenter={() => onHover(placement)} on:mouseleave={onClearHover} on:focus={() => onHover(placement)} on:blur={onClearHover}><span class="marker-badge" style:background={markerColorCss(summary.marker)} aria-hidden="true">{@html markerGlyphSvg(summary.marker)}</span><span class="result-copy"><strong>{placement.label}</strong><small>{summary.categories}</small></span></button></li>
      {/each}</ol>
    {/if}
  </div>
</section>
