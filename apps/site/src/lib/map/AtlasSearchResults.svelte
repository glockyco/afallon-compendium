<script context="module" lang="ts">
  import type { PublicEntitySummary, PublicItemSummary, PublicPlacement } from '@afallon/contracts/public';
  import type { MarkerDefinition } from './marker-registry';
  export type SearchResult = { key: string; name: string; rank: number } & (
    | { kind: 'item'; item: PublicItemSummary }
    | { kind: 'entity'; entity: PublicEntitySummary }
    | { kind: 'placement'; placement: PublicPlacement }
  );
  export type ResultSummary = { marker: MarkerDefinition; categories: string };
</script>

<script lang="ts">
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
  export let itemCount: number;
  export let entityCount: number;
  export let hasViewport: boolean;
  export let mapUnavailable: boolean;
  export let itemContextActive: boolean;
  export let selectedItemKey: string | null;
  export let selectedEntityKey: string | null;
  export let selectedPlacementId: string | null;
  export let summaryFor: (result: SearchResult) => ResultSummary;
  export let onToggle: () => void;
  export let onExitItemContext: () => void;
  export let onSelectItem: (item: PublicItemSummary, origin: HTMLElement) => void;
  export let onSelectEntity: (entity: PublicEntitySummary, origin: HTMLElement) => void;
  export let onSelectPlacement: (placementId: string, origin: HTMLElement) => void;
  export let onHover: (result: SearchResult) => void;
  export let onClearHover: () => void;
</script>

<section class:collapsed class="results" aria-labelledby="results-heading" bind:this={resultList}>
  <div class="results-header"><div><h2 id="results-heading">Results</h2>{#if searchPending}<p role="status">Loading search data...</p>{/if}{#if error}<p role="alert">{error} <button type="button" on:click={onRetry}>Retry search data</button></p>{/if}{#if pending}<p role="status">Results are not complete.</p>{:else}<p>{placementCount} distinct placements{#if hasViewport && !mapUnavailable}{' in the current viewport'}{/if}{#if itemCount > 0}{' · '}{itemCount} items{/if}{#if entityCount > 0}{' · '}{entityCount} entity definitions{/if}</p>{/if}{#if !pending && totalResults > resultLimit}<p class="result-limit">Showing the first {displayedResults.length} of {totalResults} results.</p>{/if}</div><div class="results-actions">{#if itemContextActive}<button class="quiet-button" type="button" on:click={onExitItemContext}>Exit item context</button>{/if}<button class="quiet-button" type="button" aria-controls="results-content" aria-expanded={!collapsed} on:click={onToggle}>{collapsed ? 'Show results' : 'Hide results'}</button></div></div>
  <div id="results-content" hidden={collapsed}>
    {#if !pending && !error && placementCount === 0 && itemCount === 0 && entityCount === 0}<p class="empty">No published places, entities, or items match this search.</p>{:else}
      <ol class="result-list">{#each displayedResults as result (result.key)}
        {@const summary = summaryFor(result)}
        {#if result.kind === 'item'}<li><button data-result type="button" class:selected-result={result.item.itemKey === selectedItemKey} on:click={(event) => onSelectItem(result.item, event.currentTarget)} on:mouseenter={() => onHover(result)} on:mouseleave={onClearHover} on:focus={() => onHover(result)} on:blur={onClearHover}><span class="marker-badge" style:background={markerColorCss(summary.marker)} aria-hidden="true">{@html markerGlyphSvg(summary.marker)}</span><span class="result-copy"><strong>{result.item.name || 'Unnamed item'}</strong><small>{summary.categories}</small></span></button></li>
        {:else if result.kind === 'entity'}<li><button data-result type="button" class:selected-result={result.entity.entityKey === selectedEntityKey} on:click={(event) => onSelectEntity(result.entity, event.currentTarget)} on:mouseenter={() => onHover(result)} on:mouseleave={onClearHover} on:focus={() => onHover(result)} on:blur={onClearHover}><span class="marker-badge" style:background={markerColorCss(summary.marker)} aria-hidden="true">{@html markerGlyphSvg(summary.marker)}</span><span class="result-copy"><strong>{result.entity.name}</strong><small>{summary.categories}</small></span></button></li>
        {:else}<li><button data-result type="button" class:selected-result={result.placement.placementId === selectedPlacementId} on:click={(event) => onSelectPlacement(result.placement.placementId, event.currentTarget)} on:mouseenter={() => onHover(result)} on:mouseleave={onClearHover} on:focus={() => onHover(result)} on:blur={onClearHover}><span class="marker-badge" style:background={markerColorCss(summary.marker)} aria-hidden="true">{@html markerGlyphSvg(summary.marker)}</span><span class="result-copy"><strong>{result.placement.label}</strong><small>{summary.categories}</small></span></button></li>{/if}
      {/each}</ol>
    {/if}
  </div>
</section>
