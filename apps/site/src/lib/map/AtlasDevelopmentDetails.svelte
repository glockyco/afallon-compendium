<script lang="ts">
  import DetailSections from '../DetailSections.svelte';
  import { markerFor } from './marker-registry';
  import type { PublicDetailSection, PublicEntity, PublicEntitySummary, PublicItemSource, PublicItemSummary, PublicPlacement } from '@afallon/contracts/public';

  type DetailLink = { placementId: string; label: string };
  const levelRangeLabel = (range: { min: number; max: number }): string => `(lvl.${range.min}-${range.max})`;
  export let detailsPanel: HTMLElement;
  export let selectedPlacement: PublicPlacement | null;
  export let selectedEntityKey: string | null;
  export let itemKey: string | null;
  export let staleSelection: string;
  export let selectedItemEntity: PublicEntity | null;
  export let itemIndexByKey: ReadonlyMap<string, PublicItemSummary>;
  export let selectedEntity: PublicEntity | null;
  export let selectedEntitySummary: PublicEntitySummary | null;
  export let detailLoading: boolean;
  export let detailError: string;
  export let itemContext: PublicItemSource | null;
  export let entityByKey: ReadonlyMap<string, PublicEntity>;
  export let filteredItemSources: PublicItemSource['sources'];
  export let itemContextSections: PublicDetailSection[];
  export let selectedEntities: PublicEntity[];
  export let filteredDetail: PublicDetailSection[];
  export let selectedPlacementDetails: PublicDetailSection[];
  export let itemSourceQuery: string;
  export let detailQuery: string;
  export let sourceRows: (source: PublicItemSource['sources'][number], query: string) => PublicDetailSection[];
  export let entityLinks: (sections: PublicDetailSection[]) => DetailLink[];
  export let onRetry: () => void;
  export let onClose: () => void;
  export let onQueryChange: () => void;
  export let onOpenEntity: (key: string, origin: HTMLElement) => void;
  export let onSelectPlacement: (placementId: string, origin?: HTMLElement | HTMLCanvasElement | null) => void;
  export let onSelectEntity: (entity: PublicEntity | PublicEntitySummary, origin?: HTMLElement | null) => void;
</script>

<aside class="details-panel" bind:this={detailsPanel} aria-label="Selected details">
  {#if selectedPlacement || selectedEntityKey || itemKey || staleSelection}
    <div class="details-header"><div><span class="eyebrow">{itemKey ? 'Item sources' : selectedEntityKey ? 'Entity details' : 'Selected location'}</span><h2 tabindex="-1">{itemKey ? selectedItemEntity?.name ?? itemIndexByKey.get(itemKey)?.name ?? 'Unnamed item' : selectedEntity?.name ?? selectedEntitySummary?.name ?? selectedPlacement?.label ?? 'Unavailable selection'}</h2></div><button class="close-button" type="button" on:click={onClose} aria-label="Close details">Close</button></div>
    {#if staleSelection}<div class="stale-warning" role="alert"><strong>Stale selection</strong><p>{staleSelection}</p><button type="button" class="text-button" on:click={onClose}>Show available content</button></div>{/if}
    {#if detailLoading}<p class="notice">Loading selected details…</p>{/if}
    {#if detailError}<p class="inline-error" role="alert">{detailError} <button type="button" on:click={onRetry}>Retry selected details</button></p>{/if}
    {#if itemKey}
      {#if selectedItemEntity}{#if selectedItemEntity.description}<p>{selectedItemEntity.description}</p>{/if}<details class="entity-block"><summary>Item properties and relationships</summary><DetailSections sections={selectedItemEntity.sections} entities={entityByKey} onEntity={onOpenEntity} onPlacement={onSelectPlacement} /></details>{/if}
      {#if itemContext && itemContext.sections.length > 0}<DetailSections sections={itemContextSections} entities={entityByKey} onEntity={onOpenEntity} onPlacement={onSelectPlacement} />{/if}
      <label class="detail-search" for="source-search">Search item sources and conditions<input id="source-search" bind:value={itemSourceQuery} on:input={onQueryChange} placeholder="Merchant, loot, requirement" /></label>
      {#if selectedPlacement}<p class="notice">Selected source: {selectedPlacement.label}. The selected item remains active.</p>{/if}
      <div class="item-sources">{#if !detailLoading && !detailError && itemContext && filteredItemSources.length === 0}<p class="empty">No item sources match this search.</p>{/if}{#each filteredItemSources as source}<article class="source-card"><div class="source-title"><strong>{source.label}</strong><span>{source.kind}</span></div><DetailSections sections={sourceRows(source, itemSourceQuery)} entities={entityByKey} onEntity={onOpenEntity} onPlacement={onSelectPlacement} />{#each source.placementIds as placementId}<button type="button" class="source-location" on:click={(event) => onSelectPlacement(placementId, event.currentTarget)}>Open source location</button>{/each}</article>{/each}</div>
    {:else if selectedEntityKey}
      {#if selectedEntity?.description ?? selectedEntitySummary?.description}<p>{selectedEntity?.description ?? selectedEntitySummary?.description}</p>{/if}
      <label class="detail-search" for="detail-search">Search this entity's details<input id="detail-search" bind:value={detailQuery} on:input={onQueryChange} placeholder="Condition, reward, requirement" /></label>
      {#each selectedEntity?.placementIds ?? [] as placementId}<button type="button" class="source-location" on:click={(event) => onSelectPlacement(placementId, event.currentTarget)}>Open location details</button>{/each}
      {#if selectedEntity}<DetailSections sections={filteredDetail} entities={entityByKey} onEntity={onOpenEntity} onPlacement={onSelectPlacement} />{/if}
    {:else if selectedPlacement}
      <label class="detail-search" for="detail-search">Search this location's details<input id="detail-search" bind:value={detailQuery} on:input={onQueryChange} placeholder="Condition, reward, requirement" /></label>
      <div class="location-summary"><p class="category-line">{selectedPlacement.categories.map(category => markerFor(category).label).join(' · ')}</p>{#if selectedPlacement.levelRange}<p class="level-line">{levelRangeLabel(selectedPlacement.levelRange)}</p>{/if}</div>
      {#each selectedEntities as entity}<article class="entity-block"><div class="entity-heading"><h3>{entity.name}</h3></div>{#if entity.description}<p>{entity.description}</p>{/if}<button type="button" class="inline-link" on:click={(event) => onSelectEntity(entity, event.currentTarget)}>Open entity details</button></article>{/each}
      <DetailSections sections={filteredDetail} entities={entityByKey} onEntity={onOpenEntity} onPlacement={onSelectPlacement} />
      {#if entityLinks(selectedPlacementDetails).length > 0}<div class="linked-locations"><h3>Linked locations</h3>{#each entityLinks(selectedPlacementDetails) as link}<button class="inline-link" type="button" on:click={(event) => onSelectPlacement(link.placementId, event.currentTarget)}>{link.label}</button>{/each}</div>{/if}
    {/if}
  {:else}<div class="details-empty"><span class="eyebrow">Location details</span><p>Select a marker or a result to inspect it.</p></div>{/if}
</aside>
