<script context="module" lang="ts">
  export type LayerOption = { id: string; label: string; kind: 'captured' | 'game-map' };
</script>

<script lang="ts">

  export let layerOptions: LayerOption[];
  export let tileLayerOptions: LayerOption[];
  export let gameMapOptions: LayerOption[];
  export let visibleTileLayerIds: string[];
  export let visibleGameMapIds: string[];
  export let capturedChecked: boolean;
  export let capturedPartial: boolean;
  export let gameMapsChecked: boolean;
  export let gameMapsPartial: boolean;
  export let toggleCaptured: () => void;
  export let toggleMapLayer: (id: string) => void;
  export let toggleGameMaps: () => void;
  export let toggleGameMap: (id: string) => void;
</script>

{#if layerOptions.length > 0}
  <div class="control-section layer-section">
    <h2>Map Layers</h2>
    {#if tileLayerOptions.length > 0}
      <label class="tool-option"><input type="checkbox" checked={capturedChecked} indeterminate={capturedPartial} on:change={toggleCaptured} /><span>Overworld Tiles</span><span class="count">{visibleTileLayerIds.length}/{tileLayerOptions.length}</span></label>
      {#if tileLayerOptions.length > 1}<details class="layer-maps" open={capturedPartial}><summary>Individual Maps</summary>{#each tileLayerOptions as option (option.id)}<label class="tool-option nested"><input type="checkbox" checked={visibleTileLayerIds.includes(option.id)} on:change={() => toggleMapLayer(option.id)} /><span>{option.label}</span></label>{/each}</details>{/if}
    {/if}
    {#if gameMapOptions.length > 0}
      <label class="tool-option"><input type="checkbox" checked={gameMapsChecked} indeterminate={gameMapsPartial} on:change={toggleGameMaps} /><span>Game Maps</span><span class="count">{visibleGameMapIds.length}/{gameMapOptions.length}</span></label>
      {#if gameMapOptions.length > 1}<details class="layer-maps" open={gameMapsPartial}><summary>Individual Game Maps</summary>{#each gameMapOptions as option (option.id)}<label class="tool-option nested"><input type="checkbox" checked={visibleGameMapIds.includes(option.id)} on:change={() => toggleGameMap(option.id)} /><span>{option.label}</span></label>{/each}</details>{/if}
    {/if}
  </div>
{/if}
