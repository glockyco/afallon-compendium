<script lang="ts">
  import type { PublicGearSet, PublicKindEntry } from '@afallon/contracts/public';
  import EntityHeader, { type HeaderFact } from './EntityHeader.svelte';
  import EntityReference from './EntityReference.svelte';
  import { signedAmount } from './format';

  export let document: PublicGearSet;
  export let registry: PublicKindEntry[];

  $: headerFacts = [{ label: 'Pieces', value: String(document.facts.memberCount) }, { label: 'Tiers', value: String(document.tiers.length) }] satisfies HeaderFact[];
</script>

<article>
  <EntityHeader name={document.ref.name} art={document.art.icon ?? document.ref.icon} fallbackIcon={registry.find((entry) => entry.kind === 'gearSets')?.icon} facts={headerFacts} description={document.description} compact />
  <section><h4>Members</h4><ul>{#each document.members as member}<li><EntityReference ref={member} {registry} /></li>{/each}</ul></section>
  {#if document.tiers.length}<section><h4>Set bonuses</h4><ul>{#each document.tiers as tier}<li><span>({tier.equipped})</span> {#each tier.stats as stat, index}{index > 0 ? ', ' : ''}{signedAmount(stat.amount, stat.isPercent)} {stat.stat.key === null ? stat.stat.label : stat.stat.name}{/each}</li>{/each}</ul></section>{/if}
</article>

<style>
  section { display: grid; gap: .35rem; margin-top: .6rem; }
  h4 { margin: 0; color: var(--c-accent-strong); font: 600 .8rem/1.25 var(--c-serif); }
  ul { display: grid; gap: .28rem; margin: 0; padding: 0; list-style: none; font-size: .82rem; }
  li > span { color: var(--c-text-dim); }
</style>
