<script lang="ts">
  import type { PublicSkill } from '@afallon/contracts/public';
  import EntityHeader, { type HeaderFact } from './EntityHeader.svelte';
  import { formatNumber } from './format';

  export let document: PublicSkill;

  $: sources = [
    ...(document.experience.autoAttack ? ['Weapon attacks'] : []),
    ...(document.experience.crafting ? ['Crafting'] : []),
    ...(document.experience.gathering ? ['Gathering'] : []),
  ];
  $: facts = [
    ...(sources.length ? [{ label: 'Trained by', value: sources.join(', ') }] : []),
    ...(document.facts.highestLevel !== undefined ? [{ label: 'Highest level', value: formatNumber(document.facts.highestLevel) }] : []),
    ...(document.recipes.length ? [{ label: 'Recipes', value: formatNumber(document.recipes.length) }] : []),
    ...(document.gatheringNodes.length ? [{ label: 'Gathering nodes', value: formatNumber(document.gatheringNodes.length) }] : []),
  ] satisfies HeaderFact[];
</script>

<article><EntityHeader name={document.ref.name} art={document.ref.icon} {facts} description={document.description} compact /></article>
