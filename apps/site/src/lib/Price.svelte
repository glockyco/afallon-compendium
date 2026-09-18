<script lang="ts">
  import { base } from '$app/paths';
  import type { Price } from '@afallon/contracts/public';
  import { formatNumber } from './format';

  export let price: Price;
  export let showName = false;

  $: currency = price.currency;
  $: icon = currency.key === null ? undefined : currency.icon;
  $: currencyName = currency.key === null ? currency.label : currency.name;
</script>

<span class="c-price">
  {#if icon}<img src={`${base}/data/${icon.url}`} width={icon.width} height={icon.height} alt={currencyName} loading="lazy" />{/if}
  {formatNumber(price.amount)}{#if showName}&nbsp;{currencyName}{/if}
</span>
