<script lang="ts">
  import type { PublicProperty } from '@afallon/contracts/public';
  import EntityHeader, { type HeaderFact } from './EntityHeader.svelte';
  import { formatNumber, intervalText, nameOf } from './format';

  export let document: PublicProperty;

  $: facts = document.facts;
  $: price = (amount: number, currency: Parameters<typeof nameOf>[0]) => `${formatNumber(amount)} ${nameOf(currency)}`;
  $: headerFacts = [
    ...(facts.propertyType ? [{ value: facts.propertyType }] : []),
    ...(document.place && document.place.key !== null ? [{ label: 'In', value: document.place.name }] : []),
    ...(facts.price ? [{ label: 'Costs', value: price(facts.price.amount, facts.price.currency) }] : []),
    ...(facts.income ? [{ label: 'Pays', value: `${price(facts.income.amount, facts.income.currency)}${facts.incomeInterval ? ` every ${intervalText(facts.incomeInterval)}` : ''}` }] : []),
  ] satisfies HeaderFact[];
</script>

<article>
  <EntityHeader name={document.ref.name} art={document.art.artwork ?? document.art.icon ?? document.ref.icon} artRole="artwork" facts={headerFacts} compact />
</article>
