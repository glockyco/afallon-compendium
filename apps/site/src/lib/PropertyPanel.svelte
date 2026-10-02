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

<!-- The picture sits beside the prices on a wide screen and above them on a phone. The default slot follows the prices,
     such as where to buy the property. -->
<article class="property-panel" class:with-image={Boolean(image)}>
  {#if image}<img src={`${base}/data/${image.url}`} width={image.width} height={image.height} alt={`${document.ref.name} picture`} />{/if}
  <div class="purchase">
    <dl>
      {#if facts.price}<dt>Purchase price</dt><dd><Price price={facts.price} showName /></dd>{/if}
      {#if facts.income}<dt>Income</dt><dd><Price price={facts.income} showName />{#if facts.incomeInterval}<span class="interval">{' '}every {intervalText(facts.incomeInterval)} of active play</span>{/if}</dd>{/if}
      {#if facts.sellPrice}<dt>Sell price</dt><dd><Price price={facts.sellPrice} showName /></dd>{/if}
    </dl>
    <slot />
  </div>
</article>

<style>
  .property-panel { display: grid; gap: 1.25rem; align-items: start; }
  .with-image { grid-template-columns: minmax(0, 24rem) minmax(0, 1fr); }
  img { display: block; width: 100%; height: auto; border: 1px solid var(--c-line); border-radius: var(--c-radius-sm); }
  .purchase { display: grid; gap: 1rem; min-width: 0; }
  dl { display: grid; grid-template-columns: max-content minmax(0, 1fr); gap: .45rem 1.25rem; margin: 0; font-size: var(--c-text-body); }
  dt { color: var(--c-text-dim); }
  dd { margin: 0; }
  /* The interval continues the amount as one phrase, "90 Gold Coin every 5 minutes of active play". */
  .interval { color: var(--c-text-dim); }
  @media (max-width: 640px) { .with-image { grid-template-columns: minmax(0, 1fr); } }
</style>
