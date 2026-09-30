<script lang="ts">
  import type { MechanicsRule, PublicKindEntry } from '@afallon/contracts/public';
  import EntityLink from '../../EntityLink.svelte';

  export let rule: Pick<MechanicsRule, 'phrase' | 'operands' | 'links'>;
  export let registry: PublicKindEntry[];

  $: phrase = rule.phrase.replace(/\{([a-z][A-Za-z0-9]*)\}/g, (match, key: string) =>
    Object.hasOwn(rule.operands, key)
      ? rule.operands[key]!.toLocaleString('en-US', { maximumFractionDigits: 4 })
      : match);
</script>

{phrase}{#if rule.links.length}<span class="links">{#each rule.links as ref, index}{index > 0 ? ', ' : ' '}<EntityLink {ref} {registry} />{/each}</span>{/if}
