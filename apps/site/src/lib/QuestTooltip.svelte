<script lang="ts">
  import type { PublicQuest } from '@afallon/contracts/public';
  import EntityHeader, { type HeaderFact } from './EntityHeader.svelte';
  import { levelText, nameOf, placesText } from './format';

  export let document: PublicQuest;
  $: givers = placesText(document.starts.filter((start) => start.kind === 'npc').map((start) => nameOf(start.npc)));
  $: areas = placesText(document.starts.filter((start) => start.kind === 'npc').flatMap((start) => start.areas));
  $: facts = [
    ...(document.facts.levelRange ? [{ label: 'Quest level', value: levelText(document.facts.levelRange) }] : []),
    ...(document.facts.levelRequirement !== undefined ? [{ label: 'Minimum level', value: String(document.facts.levelRequirement) }] : []),
    ...(givers ? [{ label: 'Starts with', value: givers }] : []),
    ...(areas ? [{ label: 'In', value: areas }] : document.dungeon ? [{ label: 'Dungeon', value: nameOf(document.dungeon) }] : []),
  ] satisfies HeaderFact[];
</script>

<article><EntityHeader name={document.ref.name} art={document.art.icon ?? document.ref.icon} {facts} description={document.description} compact />
  {#if document.facts.worldQuest}<p class="context">World Quest</p>{:else if document.facts.repeatable}<p class="context">Repeatable Quest</p>{:else if document.facts.chain}<p class="context">{document.facts.chain.name} · Quest Chain</p>{/if}
</article>

<style>.context { margin: .5rem 0 0; color: var(--c-text-dim); font-size: .875rem; }</style>
