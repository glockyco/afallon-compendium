<script lang="ts">
  import type { PublicKindEntry } from '@afallon/contracts/public';
  import EntityLink from '../EntityLink.svelte';
  import Price from '../Price.svelte';
  import type { SummaryLine } from './item-sources';

  export let entry: SummaryLine;
  export let registry: PublicKindEntry[];

  // Names read as a list: "A and B", "A, B and 5 more".
  function separator(index: number): string {
    if (index === 0) return '';
    return index === entry.names.length - 1 && entry.more === 0 ? ' and ' : ', ';
  }
</script>

<span class="summary">
  {#if entry.text}<a class="c-link" href={`#${entry.id}`}>{entry.text}</a>
  {:else}
    {#each entry.names as name, index}{separator(index)}{#if 'ref' in name}<EntityLink ref={name.ref} {registry} />{:else}{name.text}{/if}{/each}{#if entry.more > 0}{' and '}<a class="c-link more" href={`#${entry.id}`}>{entry.more} more</a>{/if}{#if entry.lowestPrice}<span class="price">, from <Price price={entry.lowestPrice} showName /></span>{/if}
  {/if}
</span>

<style>
  .summary { display: inline; }
  .more, .price { white-space: nowrap; }
</style>
