<script lang="ts">
  import { phraseParts, type MechanicsRule, type PublicKindEntry, type Ref } from '@afallon/contracts/public';
  import EntityLink from '../../EntityLink.svelte';
  import { shownRowCount } from '../relation-table';

  export let rule: Pick<MechanicsRule, 'phrase' | 'operands' | 'links'>;
  export let registry: PublicKindEntry[];
  /** On an entity page, its own name and icon are text, never a link back to the same page. */
  export let self: string | undefined = undefined;

  // A phrase names its links inside the sentence with `{#n}`, or leads into a closing list of them. A long closing list
  // shows its first few, as lists of rows do.
  let expanded = false;
  $: parts = phraseParts(rule.phrase);
  $: inline = parts.some((part) => part.kind === 'link');
  $: shown = shownRowCount(rule.links.length, expanded);
  $: closing = inline ? [] : rule.links.slice(0, shown);
  const operand = (name: string) => Object.hasOwn(rule.operands, name)
    ? rule.operands[name]!.toLocaleString('en-US', { maximumFractionDigits: 4 })
    : `{${name}}`;
  // "A", "A and B", "A, B, and C". A shortened list ends with its control instead of "and".
  const separator = (index: number, count: number, complete: boolean) =>
    index === 0 ? ' ' : complete && index === count - 1 ? (count === 2 ? ' and ' : ', and ') : ', ';
  const shownRef = (ref: Ref): Ref => self && ref.key === self ? { ...ref, slug: undefined } : ref;
</script>

{#each parts as part}{#if part.kind === 'text'}{part.text}{:else if part.kind === 'operand'}{operand(part.name)}{:else}{@const ref = rule.links[part.index]}{#if ref}<EntityLink ref={shownRef(ref)} {registry} />{/if}{/if}{/each}{#if closing.length}<span class="links">{#each closing as ref, index}{separator(index, closing.length, shown === rule.links.length)}<EntityLink ref={shownRef(ref)} {registry} />{/each}{#if shown < rule.links.length}{', '}<button type="button" class="c-action more" on:click={() => (expanded = true)}>Show {rule.links.length - shown} more</button>{:else}.{/if}</span>{/if}

<style>
  .more { margin-left: .2rem; }
</style>
