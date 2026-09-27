<script lang="ts">
  import type { PublicSkill } from '@afallon/contracts/public';
  import EntityHeader, { type HeaderFact } from './EntityHeader.svelte';

  export let document: PublicSkill;

  $: facts = [
    ...(document.facts.highestLevel !== undefined ? [{ label: 'Highest level', value: String(document.facts.highestLevel) }] : []),
    ...(document.recipes.length ? [{ label: 'Recipes', value: String(document.recipes.length) }] : []),
  ] satisfies HeaderFact[];
</script>

<article><EntityHeader name={document.ref.name} art={document.ref.icon} {facts} description={document.description} compact /></article>
