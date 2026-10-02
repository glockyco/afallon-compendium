<script lang="ts">
  import type { PublicFaction } from '@afallon/contracts/public';
  import EntityHeader, { type HeaderFact } from './EntityHeader.svelte';
  import { alignmentLabel, formatNumber } from './format';

  export let document: PublicFaction;
  $: facts = [
    { value: 'Faction' },
    ...(document.newCharacter ? [{ label: 'New character stance', value: `${document.newCharacter.stance} (${alignmentLabel(document.newCharacter.alignment)})` }] : []),
    { label: 'NPCs', value: formatNumber(document.members) },
  ] satisfies HeaderFact[];
</script>

<article><EntityHeader name={document.ref.name} {facts} description={document.description} compact /></article>
