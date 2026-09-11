<script lang="ts">
  import { markerColorCss, type MarkerDefinition } from './marker-registry';
  import { markerGlyphSvg } from './icon-atlas';

  export let marker: MarkerDefinition;
  export let checked = false;
  export let count = 0;
  export let compact = false;
  export let onToggle: () => void;
</script>

<label class:compact class="category-row" title={marker.pluralLabel}>
  <input type="checkbox" checked={checked} on:change={onToggle} aria-label={`Show ${marker.pluralLabel}`} />
  <span class="category-symbol" style:background={markerColorCss(marker)} aria-hidden="true">{@html markerGlyphSvg(marker)}</span>
  <span class="category-label">{marker.pluralLabel}</span>
  <span class="category-count" aria-label={`${count} placements`}>{count}</span>
</label>

<style>
  .category-row {
    display: grid;
    grid-template-columns: 16px 20px minmax(0, 1fr) auto;
    align-items: center;
    gap: .45rem;
    min-height: 30px;
    margin: .12rem 0;
    color: #dedbd2;
    font-size: .77rem;
    letter-spacing: normal;
    text-transform: none;
    cursor: pointer;
  }
  .category-row input {
    width: 14px;
    height: 14px;
    margin: 0;
    accent-color: #bca36e;
  }
  .category-symbol {
    display: inline-grid;
    place-items: center;
    width: 20px;
    height: 20px;
    border: 1px solid rgba(0, 0, 0, .45);
    border-radius: 50%;
    color: white;
  }
  .category-symbol :global(svg) {
    width: 12px;
    height: 12px;
    filter: drop-shadow(0 0 1px rgba(0, 0, 0, .8));
  }
  .category-label {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .category-count {
    color: #8f9089;
    font-size: .68rem;
    font-variant-numeric: tabular-nums;
  }
  .category-row:has(input:focus-visible) {
    outline: 2px solid #d5b978;
    outline-offset: 2px;
  }
  .category-row.compact {
    grid-template-columns: 1fr;
    justify-items: center;
    width: 34px;
    min-height: 34px;
    margin: .18rem auto;
  }
  .category-row.compact input {
    position: absolute;
    width: 1px;
    height: 1px;
    opacity: 0;
  }
  .category-row.compact .category-symbol {
    width: 28px;
    height: 28px;
    transition: opacity .15s ease, transform .15s ease;
  }
  .category-row.compact:not(:has(input:checked)) .category-symbol {
    opacity: .35;
  }
  .category-row.compact .category-label,
  .category-row.compact .category-count {
    display: none;
  }
</style>
