<script lang="ts">
  import type { PublicSearchEntry } from '@afallon/contracts/public';
  import type { ResultSummary, SearchResult } from '../atlas-search-types';
  import { markerColorCss } from './marker-registry';
  import { markerGlyphSvg } from './icon-atlas';
  export let pending = false;
  export let error = '';
  export let searchPending = false;
  export let onRetry: () => void;
  export let resultList: HTMLElement;
  export let collapsed: boolean;
  export let displayedResults: SearchResult[];
  export let totalResults: number;
  export let resultLimit: number;
  export let placementCount: number;
  export let entryCount: number;
  export let hasViewport: boolean;
  export let mapUnavailable: boolean;
  export let selectedKey: string | null;
  export let selectedPlacementId: string | null;
  export let summaryFor: (result: SearchResult) => ResultSummary;
  export let onToggle: () => void;
  export let onSelectEntry: (entry: PublicSearchEntry, origin: HTMLElement) => void;
  export let onSelectPlacement: (placementId: string, origin: HTMLElement) => void;
  export let onHover: (result: SearchResult) => void;
  export let onClearHover: () => void;
</script>

<section class:collapsed class="results" aria-labelledby="results-heading" bind:this={resultList}>
  <div class="results-header"><div><h2 id="results-heading">Results</h2>{#if searchPending}<p role="status">Loading search data…</p>{/if}{#if error}<p role="alert">{error} <button type="button" on:click={onRetry}>Retry search data</button></p>{/if}{#if pending}<p role="status">Results are not complete.</p>{:else}<p>{placementCount} distinct placements{#if hasViewport && !mapUnavailable}{' in the current viewport'}{/if}{#if entryCount > 0}{' · '}{entryCount} compendium entries{/if}</p>{/if}{#if !pending && totalResults > resultLimit}<p class="result-limit">Showing the first {displayedResults.length} of {totalResults} results.</p>{/if}</div><div class="results-actions"><button type="button" class="quiet-button" aria-expanded={!collapsed} aria-controls="results-content" on:click={onToggle}>{collapsed ? 'Show results' : 'Hide results'}</button></div></div>
  <div id="results-content" hidden={collapsed}>
    {#if !pending && !error && placementCount === 0 && entryCount === 0}<p class="empty">No published places or compendium entries match this search.</p>{:else}
      <ol class="result-list">{#each displayedResults as result (result.key)}
        {@const summary = summaryFor(result)}
        {#if result.kind === 'entry'}<li><button data-result type="button" class:selected-result={result.entry.ref.key === selectedKey} on:click={(event) => onSelectEntry(result.entry, event.currentTarget)} on:mouseenter={() => onHover(result)} on:mouseleave={onClearHover} on:focus={() => onHover(result)} on:blur={onClearHover}><span class="marker-badge" style:background={markerColorCss(summary.marker)} aria-hidden="true">{@html markerGlyphSvg(summary.marker)}</span><span class="result-copy"><strong>{result.entry.ref.name}</strong><small>{result.entry.place ?? summary.categories}</small></span></button></li>
        {:else}<li><button data-result type="button" class:selected-result={result.placement.placementId === selectedPlacementId} on:click={(event) => onSelectPlacement(result.placement.placementId, event.currentTarget)} on:mouseenter={() => onHover(result)} on:mouseleave={onClearHover} on:focus={() => onHover(result)} on:blur={onClearHover}><span class="marker-badge" style:background={markerColorCss(summary.marker)} aria-hidden="true">{@html markerGlyphSvg(summary.marker)}</span><span class="result-copy"><strong>{result.placement.label}</strong><small>{summary.categories}</small></span></button></li>{/if}
      {/each}</ol>
    {/if}
  </div>
</section>
