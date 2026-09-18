<script lang="ts">
  import type { PublicAbility, PublicKindEntry } from '@afallon/contracts/public';
  import EntityLink from './EntityLink.svelte';
  import FactCardFrame from './FactCardFrame.svelte';

  export let document: PublicAbility;
  export let registry: PublicKindEntry[];
  export let compact = false;
  export let showRelations = false;
  export let limit: number | undefined = undefined;
  $: usedBy = limit === undefined ? document.usedBy : document.usedBy.slice(0, limit);
  $: taughtBy = limit === undefined ? document.taughtBy : document.taughtBy.slice(0, limit);
</script>

<FactCardFrame name={document.ref.name} description={document.description} art={document.art.icon ?? document.ref.icon} fallbackIcon={registry.find((entry) => entry.kind === 'abilities')?.icon} {compact}>
  {#if showRelations}
    {#if usedBy.length}<section><h2>Used by</h2><ul>{#each usedBy as entity}<li><EntityLink ref={entity} {registry} /></li>{/each}</ul></section>{/if}
    {#if taughtBy.length}<section><h2>Taught by</h2><ul>{#each taughtBy as entity}<li><EntityLink ref={entity} {registry} /></li>{/each}</ul></section>{/if}
  {/if}
</FactCardFrame>

<style>section { margin-top: 1.25rem; } h2 { margin: 0 0 .55rem; color: #eee9dd; font: 600 1rem/1.3 Georgia, serif; } ul { display: grid; gap: .35rem; margin: 0; padding-left: 1.1rem; }</style>
