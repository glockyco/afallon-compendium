<script lang="ts">
  import type { PublicKindEntry, PublicPlace } from '@afallon/contracts/public';
  import EntityHeader, { type HeaderBadge, type HeaderFact } from './EntityHeader.svelte';
  import EntityReference from './EntityReference.svelte';
  import { labelOf } from './format';

  export let document: PublicPlace;
  export let registry: PublicKindEntry[];
  export let mapSpaceLabels: Readonly<Record<string, string>> = {};

  $: facts = document.facts;
  $: badges = [{ label: labelOf(facts.placeType) }, ...(facts.guideIncluded ? [{ label: 'Guide entry', tone: 'accent' as const }] : [])] satisfies HeaderBadge[];
  $: headerFacts = [
    ...(facts.levelRange ? [{ label: 'Level', value: `${facts.levelRange.min}–${facts.levelRange.max}` }] : []),
    ...(document.space && mapSpaceLabels[document.space.mapSpaceId] ? [{ label: 'Map space', value: mapSpaceLabels[document.space.mapSpaceId]! }] : []),
  ] satisfies HeaderFact[];
  $: counts = [
    ['Bosses', document.bosses.length], ['Creatures', document.creatures.length], ['NPCs', document.npcs.length],
    ['Services', document.services.length], ['Resources', document.resources.length], ['Quests', document.quests.length], ['Connections', document.connections.length],
  ].filter((entry) => Number(entry[1]) > 0) as [string, number][];
</script>

<article>
  <EntityHeader name={document.ref.name} art={document.art.artwork ?? document.art.icon ?? document.ref.icon} artRole="artwork" fallbackIcon={registry.find((entry) => entry.kind === 'places')?.icon} {badges} facts={headerFacts} description={document.description} compact />
  {#if document.parent}<p class="parent"><span>Part of</span><EntityReference ref={document.parent} {registry} /></p>{/if}
  {#if counts.length}<dl>{#each counts as [label, count]}<div><dt>{label}</dt><dd>{count}</dd></div>{/each}</dl>{/if}
</article>

<style>
  .parent { display: flex; align-items: center; gap: .5rem; margin: 0; font-size: .82rem; }
  .parent > span { color: var(--c-text-dim); }
  dl { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .3rem .8rem; margin: .6rem 0 0; font-size: .8rem; }
  dl div { display: flex; justify-content: space-between; gap: .5rem; }
  dt { color: var(--c-text-dim); }
  dd { margin: 0; color: var(--c-text); font-weight: 650; }
</style>
