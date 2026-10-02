<script lang="ts">
  import type { MechanicsRule, PublicKindEntry } from '@afallon/contracts/public';
  import EntityLink from '../../EntityLink.svelte';
  import { shownRowCount } from '../relation-table';

  export let rule: Pick<MechanicsRule, 'phrase' | 'operands' | 'links'>;
  export let registry: PublicKindEntry[];

  // A phrase ends with words that lead into its links. A long list of links shows its first few, as lists of rows do.
  let expanded = false;
  $: shown = shownRowCount(rule.links.length, expanded);
  $: phrase = rule.phrase.replace(/\{([a-z][A-Za-z0-9]*)\}/g, (match, key: string) =>
    Object.hasOwn(rule.operands, key)
      ? rule.operands[key]!.toLocaleString('en-US', { maximumFractionDigits: 4 })
      : match);
</script>

{phrase}{#if rule.links.length}<span class="links">{#each rule.links.slice(0, shown) as ref, index}{index > 0 ? ', ' : ' '}<EntityLink {ref} {registry} />{/each}{#if shown < rule.links.length}{' '}<button type="button" class="c-action more" on:click={() => (expanded = true)}>Show {rule.links.length - shown} more</button>{/if}</span>{/if}

<style>
  .more { margin-left: .2rem; }
</style>
