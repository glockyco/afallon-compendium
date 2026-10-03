<script lang="ts">
  import { base } from '$app/paths';
  import KofiGlyph from '../KofiGlyph.svelte';
  import { markerColorCss, markerFor, type MarkerDefinition } from './marker-registry';
  import { markerGlyphSvg } from './icon-sheet';
  import type { PublicPlacement } from '@afallon/contracts/public';
  import { alternativeText, formatNumber, levelText } from '../format';

  export let canvas: HTMLCanvasElement;
  export let mapReady: boolean;
  export let mapUnavailable: boolean;
  export let previewPlacement: PublicPlacement | null;
  export let previewMarker: MarkerDefinition | null;
  export let previewGroup: PublicPlacement[];
  export let previewSelected = false;
  export let countsPending = false;
  export let matchingCount: number;
  export let viewportCount: number;
  export let showsExtraSelection: boolean;
  export let onZoomIn: () => void;
  export let onZoomOut: () => void;
  export let onFit: () => void;
  export let onSelectPlacement: (placementId: string, origin: HTMLElement) => void;

  $: previewMeta = previewPlacement ? [
    ...previewPlacement.categories.map((category) => markerFor(category).label).filter((label) => label !== previewPlacement.label),
    previewPlacement.level ? `Level ${levelText(previewPlacement.level)}` : '',
    previewPlacement.alternative ? alternativeText(previewPlacement.alternative.chance, previewPlacement.alternative.options) : '',
    previewPlacement.movement.some((movement) => movement.kind === 'patrol') ? 'Patrolling' : '',
    previewPlacement.movement.some((movement) => movement.kind === 'roaming') ? 'Roaming' : '',
  ].filter(Boolean).join(' · ') : '';
</script>

<div class="map-frame">
  <canvas class:ready={mapReady} bind:this={canvas} aria-label="Afallon map. Use the result list for keyboard navigation."></canvas>
  {#if mapUnavailable}
    <div class="map-unavailable" role="alert"><div><h2>Interactive map unavailable</h2><p>This browser could not start the map's WebGL2 renderer.</p><a href="https://get.webgl.org/webgl2/" target="_blank" rel="noreferrer">Check WebGL2 support</a></div></div>
  {:else}
    {#if !mapReady}<div class="map-loading" role="status"><div class="loading-indicator"><div class="spinner" aria-hidden="true"></div><span>Loading map…</span></div></div>{/if}
    <div class="map-top-overlay">
      <div class="map-controls"><button class="icon-button" type="button" aria-label="Zoom in" on:click={onZoomIn}>+</button><button class="icon-button" type="button" aria-label="Zoom out" on:click={onZoomOut}>−</button><button type="button" disabled={!mapReady} on:click={onFit}>Fit map</button><a class="kofi-button" href="https://ko-fi.com/wowmuch" aria-label="Support on Ko-fi" title="Support on Ko-fi"><KofiGlyph /><span>Support</span></a></div>
      {#if previewPlacement}
        <div class="hover-preview" class:has-guide={(previewSelected && Boolean(previewMarker?.guide)) || previewGroup.length > 1}>
          <div class="preview-title">
            {#if previewMarker}<span class="marker-badge" style:background={markerColorCss(previewMarker)} aria-hidden="true">{@html markerGlyphSvg(previewMarker)}</span>{/if}
            <strong>{previewPlacement.label}</strong>
          </div>
          {#if previewMeta}<span class="preview-meta">{previewMeta}</span>{/if}
          {#if previewGroup.length > 1}
            <div class="preview-group" aria-label="Spots At This Location">
              <span>{previewGroup.length} Spots Here</span>
              {#each previewGroup as placement, index (placement.placementId)}
                <button type="button" aria-label={`${placement.label}, spot ${index + 1} of ${previewGroup.length}`} on:click={(event) => onSelectPlacement(placement.placementId, event.currentTarget)}>{placement.label}{#if previewGroup.some((other) => other !== placement && other.label === placement.label)} {' · '}{index + 1}{/if}</button>
              {/each}
            </div>
          {/if}
          {#if previewSelected && previewMarker?.description}<p class="preview-description">{previewMarker.description}</p>{/if}
          {#if previewSelected && previewMarker?.guide}<a class="c-link preview-guide" href={`${base}${previewMarker.guide.href}`}>{previewMarker.guide.label}</a>{/if}
        </div>
      {/if}
    </div>
    <div class="map-status" aria-live="polite">{#if countsPending}Loading Spots…{:else}{formatNumber(matchingCount)} {matchingCount === 1 ? 'Spot Matches' : 'Spots Match'} · {formatNumber(viewportCount)} In View{/if}{#if showsExtraSelection}{' · Selected Spot Also Shown'}{/if}</div>
  {/if}
</div>
