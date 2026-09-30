<script lang="ts">
  import type { PublicNpc } from '@afallon/contracts/public';
  import EntityHeader, { type HeaderFact } from './EntityHeader.svelte';
  import { creatureTypeLabel, formatNumber, nameOf, npcLevelText, npcTypeLabel, placesText, roleLabel } from './format';

  export let document: PublicNpc;
  export let variant: string | undefined = undefined;

  $: selected = document.variants.find((candidate) => candidate.anchor === variant);
  $: record = { ...document.facts, ...selected?.facts };
  $: level = selected?.level ?? document.facts.level;
  $: locations = selected ? document.locations.filter((location) => location.variants.includes(selected.anchor)) : document.locations;
  $: places = placesText(selected ? locations.map((location) => location.label) : document.places.map((place) => place.label));
  $: kind = [npcTypeLabel(record.npcType), creatureTypeLabel(record.creatureType), ...record.roles.map(roleLabel)].filter((part, index, parts) => part && parts.indexOf(part) === index).join(' · ');
  $: health = record.stats.find((stat) => nameOf(stat.stat).toLowerCase() === 'health' && stat.amount > 0);
  $: facts = [
    ...(kind ? [{ label: 'Type', value: kind }] : []),
    ...(level ? [{ label: 'Level', value: npcLevelText(level) }] : []),
    ...(places ? [{ label: 'Found in', value: places }] : []),
    ...(record.faction ? [{ label: 'Faction', value: nameOf(record.faction) }] : health ? [{ label: 'Health', value: formatNumber(health.amount) }] : []),
  ] satisfies HeaderFact[];
</script>

<article><EntityHeader name={document.ref.name} art={selected?.portrait ?? document.art.portrait ?? document.art.icon ?? document.ref.icon} artRole="portrait" {facts} description={document.description} compact />
  {#if selected && document.variantFields.length}<p class="context">{selected.label}</p>{/if}
</article>

<style>.context { margin: .5rem 0 0; color: var(--c-text-dim); font-size: .875rem; }</style>
