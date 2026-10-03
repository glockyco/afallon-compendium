<script lang="ts">
  import { base } from '$app/paths';
  import type { PublicKindEntry } from '@afallon/contracts/public';
  import EntityLink from '../EntityLink.svelte';
  import Price from '../Price.svelte';
  import { lineHref, type SummaryLine } from './item-sources';

  export let entry: SummaryLine;
  export let registry: PublicKindEntry[];
  /** Where the line's links lead when they open another page, such as an item's section from its currency's page. */
  export let href: string | undefined = undefined;
  export let stackPrice = false;

  $: target = href ?? lineHref(entry, registry, base);

  // Names read as a list: "A and B", "A, B and 5 more".
  function separator(index: number): string {
    if (index === 0) return '';
    return index === entry.names.length - 1 && entry.more === 0 ? ' and ' : ', ';
  }
</script>

<span class="summary">
  {#if entry.text}{#if target}<a class="c-link" href={target}>{entry.text}</a>{:else}{entry.text}{/if}
  {:else}
    {#each entry.names as name, index}{separator(index)}{#if 'ref' in name}<EntityLink ref={name.ref} {registry} />{:else}{name.text}{/if}{/each}{#if entry.more > 0}{' and '}{#if target}<a class="c-link more" href={target}>{entry.more} more</a>{:else}<span class="more">{entry.more} more</span>{/if}{/if}{#if entry.lowestPrice}<span class="price" class:stacked={stackPrice}><span class="comma">, </span>from <Price price={entry.lowestPrice} showName /></span>{/if}
  {/if}
</span>

<style>
  .summary { display: inline; }
  .more, .price { white-space: nowrap; }
  .comma { margin-right: .25em; }
  @media (max-width: 640px) {
    .price.stacked { display: block; }
    .price.stacked .comma { display: none; }
  }
</style>
