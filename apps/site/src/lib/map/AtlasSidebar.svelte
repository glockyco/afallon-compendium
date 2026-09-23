<script lang="ts">
  import { dev } from '$app/environment';
  import { MARKER_SIZE_RANGE } from '../atlas-state';
  import CategoryRow from './CategoryRow.svelte';
  import MapSidebarSection from './MapSidebarSection.svelte';
  import AtlasLayerControls, { type LayerOption } from './AtlasLayerControls.svelte';
  import type { MarkerDefinition, MarkerId } from './marker-registry';
  import type { WorldOffsetOverrides } from './world-layout';

  export let collapsed: boolean;
  export let logoBase: string;
  export let searchInput: HTMLInputElement;
  export let query: string;
  export let sections: { id: string; label: string; markers: MarkerDefinition[] }[];
  export let categories: MarkerId[];
  export let categoryCounts: Record<MarkerId, number>;
  export let countsPending = false;
  export let placementCount: number;
  export let isDefaultCategories: boolean;
  export let layerOptions: LayerOption[];
  export let tileLayerOptions: LayerOption[];
  export let gameMapOptions: LayerOption[];
  export let visibleTileLayerIds: string[];
  export let visibleGameMapIds: string[];
  export let capturedChecked: boolean;
  export let capturedPartial: boolean;
  export let gameMapsChecked: boolean;
  export let gameMapsPartial: boolean;
  export let showConnections: boolean;
  export let showMovement: boolean;
  export let showZones: boolean;
  export let markerSize: number;
  export let authoring: boolean;
  export let worldOffsetOverrides: WorldOffsetOverrides;
  export let onToggle: () => void;
  export let onQuery: (query: string) => void;
  export let onSubmitSearch: () => void;
  export let onResetCategories: () => void;
  export let onShowAllCategories: () => void;
  export let onToggleCategory: (category: MarkerId) => void;
  export let onToggleAllCategories: (categories: readonly MarkerId[]) => void;
  export let onToggleCaptured: () => void;
  export let onToggleMapLayer: (id: string) => void;
  export let onToggleGameMaps: () => void;
  export let onToggleGameMap: (id: string) => void;
  export let onToggleConnections: () => void;
  export let onToggleMovement: () => void;
  export let onToggleZones: () => void;
  export let onMarkerSizeChange: (size: number) => void;
  export let onResetMarkerSize: () => void;
  export let onToggleAuthoring: () => void;
  export let onExportWorldOffsets: () => void;
  export let onDiscardWorldOffsets: () => void;
</script>

<aside class:collapsed class="control-panel" aria-label="Atlas controls">
  <div class="panel-header">
    {#if !collapsed}<a class="home-link" href="{logoBase}/" aria-label="Afallon Compendium home"><img src="{logoBase}/logo.png" alt="" /><span class="brand-copy"><strong>Afallon</strong><span>Compendium</span></span></a>{/if}
    <button class="panel-toggle" type="button" on:click={onToggle} aria-label={collapsed ? 'Expand atlas controls' : 'Collapse atlas controls'} title="⌘/Ctrl+B" aria-expanded={!collapsed}>{collapsed ? '»' : '«'}</button>
  </div>
  {#if collapsed}
    <nav class="panel-rail" aria-label="Quick category toggles">{#each sections as section}<div class="rail-group" aria-label={section.label}>{#each section.markers as marker (marker.id)}<CategoryRow marker={marker} checked={categories.includes(marker.id)} count={categoryCounts[marker.id] ?? 0} pending={countsPending} compact onToggle={() => onToggleCategory(marker.id)} />{/each}</div>{/each}</nav>
  {:else}
    <div class="panel-body">
      <div class="control-section search-section"><div class="search-field"><span class="search-glyph" aria-hidden="true"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg></span><input id="atlas-search" bind:this={searchInput} value={query} on:input={(event) => onQuery(event.currentTarget.value)} on:keydown={(event) => { if (event.key === 'Enter') { event.preventDefault(); onSubmitSearch(); } if (event.key === 'Escape' && query) { event.preventDefault(); onQuery(''); } }} placeholder="Search..." aria-label="Search places, entities, and items" autocomplete="off" /><kbd class="search-key" aria-hidden="true">⌘K</kbd></div></div>
      <div class="categories-block"><div class="section-heading"><h2>Categories</h2><span class="heading-actions">{#if !isDefaultCategories}<button type="button" class="text-button" on:click={onResetCategories}>Reset</button>{/if}{#if categories.length > 0}<button type="button" class="text-button" on:click={onShowAllCategories}>Show all</button>{/if}</span><span class="count">{placementCount}</span></div>{#each sections as section (section.id)}<MapSidebarSection title={section.label} categories={section.markers} activeCategories={categories} counts={categoryCounts} {countsPending} storageKey={`afallon-atlas-section-${section.id}`} onToggleCategory={onToggleCategory} onToggleAll={onToggleAllCategories} />{/each}</div>
      <AtlasLayerControls {layerOptions} {tileLayerOptions} {gameMapOptions} {visibleTileLayerIds} {visibleGameMapIds} {capturedChecked} {capturedPartial} {gameMapsChecked} {gameMapsPartial} toggleCaptured={onToggleCaptured} toggleMapLayer={onToggleMapLayer} toggleGameMaps={onToggleGameMaps} toggleGameMap={onToggleGameMap} />
      <div class="control-section world-tools"><h2>Map Options</h2>
        <div class="marker-size-option">
          <div class="marker-size-heading"><label for="marker-size">Marker Size</label><output for="marker-size">{markerSize}%</output></div>
          <input id="marker-size" type="range" min={MARKER_SIZE_RANGE.min} max={MARKER_SIZE_RANGE.max} step="1" value={markerSize} on:input={(event) => onMarkerSizeChange(event.currentTarget.valueAsNumber)} />
          <button type="button" class="text-button" disabled={markerSize === MARKER_SIZE_RANGE.default} on:click={onResetMarkerSize}>Reset marker size</button>
        </div>
        <label class="tool-option"><input type="checkbox" checked={showConnections} on:change={onToggleConnections} /><span>Travel Connections</span></label><label class="tool-option"><input type="checkbox" checked={showMovement} on:change={onToggleMovement} /><span>NPC Movement</span></label><label class="tool-option"><input type="checkbox" checked={showZones} on:change={onToggleZones} /><span>Zone Areas and Names</span></label>{#if dev}<label class="tool-option"><input type="checkbox" checked={authoring} on:change={onToggleAuthoring} /><span>Authoring Mode</span></label>{#if authoring}<button type="button" class="quiet-button" on:click={onExportWorldOffsets}>Export World Offsets</button>{#if Object.keys(worldOffsetOverrides).length > 0}<button type="button" class="quiet-button" on:click={onDiscardWorldOffsets}>Discard {Object.keys(worldOffsetOverrides).length} Dragged Offsets</button>{/if}<p class="hint">Drag a map anywhere inside its rectangle to review its placement. Dragged offsets show only while authoring and stay in this browser until exported or discarded.</p>{/if}{/if}</div>
    </div>
  {/if}
</aside>
