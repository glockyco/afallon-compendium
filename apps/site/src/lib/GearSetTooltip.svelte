<script lang="ts">
  import type { PublicGearSet } from '@afallon/contracts/public';
  import EntityHeader, { type HeaderFact } from './EntityHeader.svelte';
  import { formatNumber, nameOf, signedAmount } from './format';

  export let document: PublicGearSet;
  $: facts = [
    { value: document.type ? `${document.type} Gear Set` : 'Gear Set' },
    { label: 'Pieces', value: formatNumber(document.pieces.length) },
  ] satisfies HeaderFact[];
</script>

<article>
  <EntityHeader name={document.ref.name} {facts} description={document.description} compact />
  {#if document.tiers.length}
    <ul class="tiers">{#each document.tiers as tier}<li><span class="dim">({tier.equipped})</span> {tier.stats.map((stat) => `${signedAmount(stat.amount, stat.isPercent)} ${nameOf(stat.stat)}`).join(', ')}</li>{/each}</ul>
  {/if}
</article>

<style>
  .tiers { display: grid; gap: .2rem; margin: .55rem 0 0; padding: 0; list-style: none; color: var(--c-positive); font-size: .875rem; line-height: 1.45; }
  .dim { color: var(--c-text-dim); }
</style>
