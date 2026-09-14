<script lang="ts">
  import { markerColorCss, markerFor, type MarkerDefinition } from './marker-registry';
  import { markerGlyphSvg } from './icon-atlas';
  import type { PublicPlacement } from '@afallon/contracts/public';

  export let canvas: HTMLCanvasElement;
  export let mapReady: boolean;
  export let mapUnavailable: boolean;
  export let previewPlacement: PublicPlacement | null;
  export let previewMarker: MarkerDefinition | null;
  export let matchingCount: number;
  export let viewportCount: number;
  export let showsExtraSelection: boolean;
  export let onZoomIn: () => void;
  export let onZoomOut: () => void;
  export let onFit: () => void;
</script>

<div class="map-frame">
  <canvas class:ready={mapReady} bind:this={canvas} aria-label="Afallon map. Use the result list for keyboard navigation."></canvas>
  {#if mapUnavailable}
    <div class="map-unavailable" role="alert"><div><h2>Interactive map unavailable</h2><p>This browser could not start the map's WebGL2 renderer.</p><a href="https://get.webgl.org/webgl2/" target="_blank" rel="noreferrer">Check WebGL2 support</a></div></div>
  {:else}
    {#if !mapReady}<div class="map-loading" role="status"><div class="loading-indicator"><div class="spinner" aria-hidden="true"></div><span>Loading map...</span></div></div>{/if}
    <div class="map-top-overlay">
      <div class="map-controls"><button class="icon-button" type="button" aria-label="Zoom in" on:click={onZoomIn}>+</button><button class="icon-button" type="button" aria-label="Zoom out" on:click={onZoomOut}>−</button><button type="button" disabled={!mapReady} on:click={onFit}>Fit map</button><a class="kofi-button" href="https://ko-fi.com/wowmuch" aria-label="Support on Ko-fi" title="Support on Ko-fi"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M23.881 8.948c-.773-4.085-4.859-4.593-4.859-4.593H.723c-.604 0-.679.798-.679.798s-.082 7.324-.022 11.822c.164 2.424 2.586 2.672 2.586 2.672s8.267-.023 11.966-.049c2.438-.426 2.683-2.566 2.658-3.734 4.352.24 7.422-2.831 6.649-6.916zm-11.062 3.511c-1.246 1.453-4.011 3.976-4.011 3.976s-.121.119-.31.023c-.076-.057-.108-.09-.108-.09-.443-.441-3.368-3.049-4.034-3.954-.709-.965-1.041-2.7-.091-3.71.951-1.01 3.005-1.086 4.363.407 0 0 1.565-1.782 3.468-.963 1.904.82 1.832 3.011.723 4.311zm6.173.478c-.928.116-1.682.028-1.682.028V7.284h1.77s1.971.551 1.971 2.638c0 1.913-.985 2.667-2.059 3.015z" /></svg><span>Support</span></a></div>
      {#if previewPlacement}<div class="hover-preview"><div class="preview-title">{#if previewMarker}<span class="marker-badge" style:background={markerColorCss(previewMarker)} aria-hidden="true">{@html markerGlyphSvg(previewMarker)}</span>{/if}<strong>{previewPlacement.label}</strong></div><span class="preview-meta">{[...previewPlacement.categories.map(category => markerFor(category).label), previewPlacement.movement.some(movement => movement.kind === 'patrol') ? 'Patrolling' : '', previewPlacement.movement.some(movement => movement.kind === 'roaming') ? 'Roaming' : ''].filter(Boolean).join(' · ')}</span></div>{/if}
    </div>
    <div class="map-status" aria-live="polite">{matchingCount} matching placements · {viewportCount} in viewport{#if showsExtraSelection}{' · selected location also shown'}{/if}</div>
  {/if}
</div>
