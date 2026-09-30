<script lang="ts">
  import type { PublicPlace } from '@afallon/contracts/public';
  import { categoryLabel } from '@afallon/contracts/public';
  import EntityHeader, { type HeaderFact } from './EntityHeader.svelte';
  import { formatNumber, levelText, nameOf } from './format';

  export let document: PublicPlace;
  $: facts = [
    { label: 'Type', value: categoryLabel(document.facts.placeType) },
    ...(document.facts.levelRange ? [{ label: 'Levels', value: levelText(document.facts.levelRange) }] : []),
    ...(document.parent ? [{ label: 'Part of', value: nameOf(document.parent) }] : []),
    ...(document.quests.length ? [{ label: 'Quests', value: formatNumber(document.quests.length) }] : []),
  ] satisfies HeaderFact[];
</script>

<article><EntityHeader name={document.ref.name} art={document.art.artwork ?? document.art.icon ?? document.ref.icon} artRole="artwork" {facts} description={document.description} compact /></article>
