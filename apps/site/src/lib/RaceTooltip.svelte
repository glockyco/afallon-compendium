<script lang="ts">
  import type { PublicRace } from '@afallon/contracts/public';
  import EntityHeader, { type HeaderFact } from './EntityHeader.svelte';
  import { nameOf } from './format';

  export let document: PublicRace;
  $: facts = [
    { value: 'Race' },
    ...(document.start ? [{ label: 'Starts in', value: nameOf(document.start) }] : []),
    ...(document.classes.length ? [{ label: 'Classes', value: document.classes.map(nameOf).join(', ') }] : []),
  ] satisfies HeaderFact[];
</script>

<article><EntityHeader name={document.ref.name} art={document.art.icon ?? document.ref.icon} {facts} description={document.description} compact /></article>
