<script lang="ts">
  import type { PublicCurrency } from '@afallon/contracts/public';
  import EntityHeader, { type HeaderFact } from './EntityHeader.svelte';
  import { formatNumber } from './format';

  export let document: PublicCurrency;
  $: facts = [
    { value: 'Currency' },
    ...(document.purchases.length ? [{ label: 'Items sold for it', value: formatNumber(document.purchases.length) }] : []),
    ...(document.rewards.length ? [{ label: 'Quest rewards', value: formatNumber(document.rewards.length) }] : []),
  ] satisfies HeaderFact[];
</script>

<article><EntityHeader name={document.ref.name} art={document.art.icon ?? document.ref.icon} {facts} description={document.description} compact /></article>
