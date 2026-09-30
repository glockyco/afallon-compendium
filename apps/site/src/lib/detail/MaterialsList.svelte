<script lang="ts" context="module">
  import type { Ref } from '@afallon/contracts/public';
  export interface Material { item: Ref; quantity: number }
</script>
<script lang="ts">
  import type { PublicKindEntry } from '@afallon/contracts/public';
  import EntityLink from '../EntityLink.svelte';
  export let materials: Material[];
  export let registry: PublicKindEntry[];
  export let variant: 'list' | 'equation' = 'list';
</script>

<ul class="materials" class:equation={variant === 'equation'}>
  {#each materials as material}
    <li><span class="quantity">{material.quantity}×</span><EntityLink ref={material.item} {registry} /></li>
  {/each}
</ul>

<style>
  .materials { display: grid; gap: .45rem; margin: 0; padding: 0; list-style: none; }
  li { display: grid; grid-template-columns: 2.25rem minmax(0, 1fr); align-items: center; gap: .6rem; min-width: 0; }
  .quantity { color: var(--c-text-strong); font-weight: 700; font-variant-numeric: tabular-nums; text-align: right; }
  li :global(.entity-link), li :global(.entity-text) { display: inline-flex; min-height: 2rem; align-items: center; }
  .materials.equation li { width: max-content; max-width: 100%; padding: .3rem .7rem .3rem .35rem; border: 1px solid var(--c-line); border-radius: var(--c-radius); background: var(--c-surface-0); }
</style>
