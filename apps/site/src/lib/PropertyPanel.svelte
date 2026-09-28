<script lang="ts">
  import { base } from '$app/paths';
  import type { PublicProperty } from '@afallon/contracts/public';
  import Price from './Price.svelte';
  import { intervalText } from './format';

  // The property as the game's purchase panel shows it: its picture, its type, its prices, and its income.
  export let document: PublicProperty;

  $: facts = document.facts;
  $: image = document.art.artwork ?? document.art.icon;
</script>

<article class="property-panel">
  {#if image}<img src={`${base}/data/${image.url}`} width={image.width} height={image.height} alt={`${document.ref.name} picture`} />{/if}
  <dl>
    {#if facts.propertyType}<dt>Type</dt><dd>{facts.propertyType}</dd>{/if}
    {#if facts.price}<dt>Price</dt><dd><Price price={facts.price} showName /></dd>{/if}
    {#if facts.income}<dt>Income</dt><dd class="income"><Price price={facts.income} showName />{#if facts.incomeInterval}<span>every {intervalText(facts.incomeInterval)} of active play</span>{/if}</dd>{/if}
    {#if facts.sellPrice}<dt>Sells for</dt><dd><Price price={facts.sellPrice} showName /></dd>{/if}
  </dl>
</article>

<style>
  .property-panel { display: grid; gap: .75rem; }
  img { display: block; width: 100%; height: auto; border: 1px solid var(--c-line); border-radius: var(--c-radius-sm); }
  dl { display: grid; grid-template-columns: auto 1fr; gap: .35rem 1rem; margin: 0; font-size: var(--c-text-body); }
  dt { color: var(--c-text-dim); }
  dd { margin: 0; justify-self: end; }
  .income { display: grid; justify-items: end; gap: .1rem; }
  .income span { color: var(--c-text-dim); font-size: var(--c-text-small); }
</style>
