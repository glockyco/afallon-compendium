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
      <div class="map-controls"><button class="icon-button" type="button" aria-label="Zoom in" on:click={onZoomIn}>+</button><button class="icon-button" type="button" aria-label="Zoom out" on:click={onZoomOut}>−</button><button type="button" disabled={!mapReady} on:click={onFit}>Fit map</button><a class="kofi-button" href="https://ko-fi.com/wowmuch" aria-label="Support on Ko-fi" title="Support on Ko-fi"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M23.881 8.948c-.773-4.085-4.859-4.593-4.859-4.593H.723c-.604 0-.679.798-.679.798s-.082 7.324-.022 11.822c.164 2.424 2.586 2.672 2.586 2.672s8.267-.023 11.966-.031c2.629-.73 3.483-2.642 3.483-2.642 3.013-.432 5.218-2.361 5.724-5.708.506-3.347-.108-4.388-.108-4.388zm-7.03 3.094c-.417 2.207-2.512 2.316-2.512 2.316V8.201h2.54s.389 1.634-.028 3.841zM6.865 17.74l-.056-.003c-.314-.24-3.164-2.499-3.164-5.5 0-1.596.805-2.978 2.146-3.699.979-.526 2.174-.57 3.207-.122.938-.407 2.022-.407 2.96.004 1.355.595 2.227 1.965 2.227 3.489 0 3.237-3.442 5.658-3.588 5.759l-.104.072H6.865z" /></svg><span>Support</span></a></div>
      {#if previewPlacement}<div class="hover-preview"><div class="preview-title">{#if previewMarker}<span class="marker-badge" style:background={markerColorCss(previewMarker)} aria-hidden="true">{@html markerGlyphSvg(previewMarker)}</span>{/if}<strong>{previewPlacement.label}</strong></div><span class="preview-meta">{[...previewPlacement.categories.map(category => markerFor(category).label), previewPlacement.movement.some(movement => movement.kind === 'patrol') ? 'Patrolling' : '', previewPlacement.movement.some(movement => movement.kind === 'roaming') ? 'Roaming' : ''].filter(Boolean).join(' · ')}</span></div>{/if}
    </div>
    <div class="map-status" aria-live="polite">{matchingCount} matching placements · {viewportCount} in viewport{#if showsExtraSelection}{' · selected location also shown'}{/if}</div>
  {/if}
</div>
