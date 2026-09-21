<script lang="ts">
  import type { PublicKindEntry, PublicRecipe } from '@afallon/contracts/public';
  import EntityHeader, { type HeaderFact } from './EntityHeader.svelte';
  import EntityReference from './EntityReference.svelte';

  export let document: PublicRecipe;
  export let registry: PublicKindEntry[];

  $: facts = document.facts;
  $: headerFacts = [
    ...(facts.station ? [{ label: 'Station', value: facts.station.key === null ? facts.station.label : facts.station.name }] : []),
    ...(facts.skill ? [{ label: 'Skill', value: facts.skill.key === null ? facts.skill.label : facts.skill.name }] : []),
    ...(facts.rank !== undefined ? [{ label: 'Rank', value: String(facts.rank) }] : []),
  ] satisfies HeaderFact[];
</script>

<article>
  <EntityHeader name={document.ref.name} art={document.art.icon ?? document.ref.icon} fallbackIcon={registry.find((entry) => entry.kind === 'recipes')?.icon} facts={headerFacts} description={document.description} compact />
  {#if document.product}<p><span>Produces</span><EntityReference ref={document.product.counterpart} {registry} /> ×{document.product.count}</p>{/if}
  {#if document.materials.length}<h4>Materials</h4><ul>{#each document.materials as material}<li><EntityReference ref={material.counterpart} {registry} /><span>×{material.count}</span></li>{/each}</ul>{/if}
</article>

<style>
  p, li { display: flex; align-items: center; gap: .5rem; margin: 0; font-size: .82rem; }
  p > span:first-child, li > span:last-child { color: var(--c-text-dim); }
  h4 { margin: .65rem 0 .35rem; color: var(--c-accent-strong); font: 600 .8rem/1.25 var(--c-serif); }
  ul { display: grid; gap: .3rem; margin: 0; padding: 0; list-style: none; }
  li { justify-content: space-between; }
</style>
