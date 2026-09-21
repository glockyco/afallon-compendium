<script lang="ts">
  import type { PublicKindEntry, PublicProperty } from '@afallon/contracts/public';
  import EntityHeader, { type HeaderFact } from './EntityHeader.svelte';
  import EntityReference from './EntityReference.svelte';
  import Price from './Price.svelte';
  import { formatNumber } from './format';

  export let document: PublicProperty;
  export let registry: PublicKindEntry[];

  $: headerFacts = [
    ...(document.facts.income !== undefined ? [{ label: 'Income', value: formatNumber(document.facts.income) }] : []),
    ...(document.locations.length ? [{ label: 'Locations', value: String(document.locations.length) }] : []),
  ] satisfies HeaderFact[];
</script>

<article>
  <EntityHeader name={document.ref.name} art={document.art.artwork ?? document.art.icon ?? document.ref.icon} fallbackIcon={registry.find((entry) => entry.kind === 'properties')?.icon} facts={headerFacts} description={document.description} compact />
  {#if document.place}<p><span>Place</span><EntityReference ref={document.place} {registry} /></p>{/if}
  {#if document.facts.price}<p><span>Price</span><Price price={document.facts.price} showName /></p>{/if}
</article>

<style>
  p { display: flex; align-items: center; justify-content: space-between; gap: .75rem; margin: .35rem 0 0; font-size: .82rem; }
  p > span:first-child { color: var(--c-text-dim); }
</style>
