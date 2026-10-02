<script lang="ts">
  import type { PublicCraftingStation } from '@afallon/contracts/public';
  import EntityHeader, { type HeaderFact } from './EntityHeader.svelte';
  import { formatNumber, nameOf } from './format';

  export let document: PublicCraftingStation;
  $: spots = document.places.reduce((sum, place) => sum + place.spotCount, 0);
  $: facts = [
    { value: 'Crafting Station' },
    ...(document.skills.length ? [{ label: document.skills.length === 1 ? 'Skill' : 'Skills', value: document.skills.map(nameOf).join(', ') }] : []),
    ...(document.recipes.length ? [{ label: 'Recipes', value: formatNumber(document.recipes.length) }] : []),
    ...(spots ? [{ label: 'Map spots', value: formatNumber(spots) }] : []),
  ] satisfies HeaderFact[];
</script>

<article><EntityHeader name={document.ref.name} art={document.art.icon ?? document.ref.icon} {facts} description={document.description} compact /></article>
