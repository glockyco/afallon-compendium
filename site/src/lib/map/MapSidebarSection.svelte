<script lang="ts">
  import { onMount } from 'svelte';
  import CategoryRow from './CategoryRow.svelte';
  import type { MarkerDefinition, MarkerId } from './marker-registry';

  export let title: string;
  export let categories: readonly MarkerDefinition[] = [];
  export let activeCategories: readonly MarkerId[] = [];
  export let counts: Readonly<Record<MarkerId, number>>;
  export let onToggleCategory: (id: MarkerId) => void;
  export let onToggleAll: (ids: readonly MarkerId[]) => void;
  export let storageKey = '';

  let expanded = true;
  let toggleInput: HTMLInputElement;

  $: selectedCount = categories.filter((marker) => activeCategories.includes(marker.id)).length;
  $: allSelected = categories.length > 0 && selectedCount === categories.length;
  $: partiallySelected = selectedCount > 0 && !allSelected;
  $: if (toggleInput) toggleInput.indeterminate = partiallySelected;

  onMount(() => {
    if (!storageKey) return;
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored === 'open' || stored === 'closed') expanded = stored === 'open';
    } catch {
      // A blocked storage API should not prevent the sidebar from opening.
    }
  });

  function toggleExpanded(): void {
    expanded = !expanded;
    if (!storageKey) return;
    try {
      localStorage.setItem(storageKey, expanded ? 'open' : 'closed');
    } catch {
      // The section remains usable when browser storage is unavailable.
    }
  }
</script>

<section class:collapsed={!expanded} class="sidebar-section">
  <div class="section-header">
    <input
      bind:this={toggleInput}
      class="toggle-all"
      type="checkbox"
      checked={allSelected}
      aria-checked={partiallySelected ? 'mixed' : allSelected}
      on:change={() => onToggleAll(categories.map((marker) => marker.id))}
      aria-label={`Toggle all ${title}`}
    />
    <button class="section-trigger" type="button" aria-expanded={expanded} on:click={toggleExpanded}>
      <span class="section-title">{title}</span>
      <span class="section-count">{selectedCount}/{categories.length}</span>
      <span class="chevron" aria-hidden="true">{expanded ? '⌃' : '⌄'}</span>
    </button>
  </div>
  {#if expanded}
    <div class="section-body">
      {#each categories as marker (marker.id)}
        <CategoryRow marker={marker} checked={activeCategories.includes(marker.id)} count={counts[marker.id] ?? 0} onToggle={() => onToggleCategory(marker.id)} />
      {/each}
    </div>
  {/if}
</section>

<style>
  .sidebar-section {
    margin: 0 0 .65rem;
    border: 1px solid #393a38;
    background: #1b1c1b;
  }
  .section-header {
    display: grid;
    grid-template-columns: 16px minmax(0, 1fr);
    align-items: center;
    gap: .4rem;
    min-height: 40px;
    padding: .25rem .45rem .25rem .5rem;
    background: #252622;
  }
  .toggle-all {
    width: 14px;
    height: 14px;
    margin: 0;
    accent-color: #bca36e;
  }
  .section-trigger {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto 14px;
    align-items: center;
    gap: .4rem;
    min-width: 0;
    padding: .25rem 0;
    border: 0;
    background: transparent;
    color: #dedbd2;
    font-size: .69rem;
    font-weight: 700;
    letter-spacing: .075em;
    text-align: left;
    text-transform: uppercase;
  }
  .section-title { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .section-count {
    color: #9a998f;
    font-size: .62rem;
    font-variant-numeric: tabular-nums;
    letter-spacing: normal;
    white-space: nowrap;
  }
  .chevron {
    color: #bca36e;
    font-size: 1rem;
    line-height: 1;
    text-align: center;
  }
  .section-body {
    padding: .35rem .55rem .45rem;
  }
  .sidebar-section.collapsed .section-header {
    border-bottom: 0;
  }
  .section-trigger:focus-visible, .toggle-all:focus-visible {
    outline: 2px solid #d5b978;
    outline-offset: 2px;
  }
</style>
