<script lang="ts">
  import type { PlacementRef, PublicKindEntry, PublicQuest, QuestStart, QuestTurnIn } from '@afallon/contracts/public';
  import Availability from '../../Availability.svelte';
  import EntityLink from '../../EntityLink.svelte';
  import { formatNumber, intervalText } from '../../format';
  import { entityOnMap, spotOnMap } from '../../map-links';

  export let document: PublicQuest;
  export let registry: PublicKindEntry[];

  type NpcStart = Extract<QuestStart, { kind: 'npc' }>;
  function sameNpc(start: NpcStart, turnIn: QuestTurnIn): boolean {
    if (start.npc.key !== null && turnIn.npc.key !== null) return start.npc.key === turnIn.npc.key;
    if (start.npc.key === null && turnIn.npc.key === null) return start.npc.label === turnIn.npc.label;
    return false;
  }
  $: npcStarts = document.starts.filter((start): start is NpcStart => start.kind === 'npc');
  $: people = npcStarts.map((start) => {
    const matches = document.turnIns.filter((turnIn) => sameNpc(start, turnIn));
    return { npc: start.npc, ends: matches.length > 0, areas: [...new Set([ ...start.areas, ...matches.flatMap((turnIn) => turnIn.areas) ])] };
  });
  $: remainingTurnIns = document.turnIns.filter((turnIn) => !npcStarts.some((start) => sameNpc(start, turnIn)));
  $: zones = document.starts.filter((start): start is Extract<QuestStart, { kind: 'worldZone' }> => start.kind === 'worldZone');
  $: objects = document.starts.filter((start): start is Extract<QuestStart, { kind: 'object' }> => start.kind === 'object');
</script>

{#snippet startSpots(placements: PlacementRef[])}
  {#if placements.length}
    <a class="c-link" href={spotOnMap(placements[0]!.placementId)} aria-label={`Show ${placements.length === 1 ? 'the spot' : `the first of ${placements.length} spots`} on the map`}>{placements.length === 1 ? 'Show on map' : `${formatNumber(placements.length)} spots`}</a>
  {/if}
{/snippet}

<div class="starters">
  {#each people as person}
    <div><h3>{person.ends ? 'Starts and ends with' : 'Starts with'}</h3>
      <p><EntityLink ref={person.npc} {registry} />{#if person.areas.length}{' · '}{person.areas.join(', ')}{/if}{#if person.npc.key !== null}{' · '}<a class="c-link" href={entityOnMap(person.npc.key)}>Show on map</a>{/if}</p>
    </div>
  {/each}
  {#if zones.length || objects.length}<div><h3>Starts with</h3>
    {#each zones as zone}
      <div class="source"><p>Enter the zone while its world quest is active, or stay inside until it appears.</p>{@render startSpots(zone.placements)}
        {#if zone.availability.length}<Availability rules={zone.availability} {registry} />{/if}
        {#if zone.pool.length}<p>Other quests here: {#each zone.pool as quest, index}{index ? ', ' : ''}<EntityLink ref={quest} {registry} />{/each}</p>{/if}
        {#if zone.zoneDelaySeconds !== undefined}<p>Zone delay after a quest ends: {intervalText(zone.zoneDelaySeconds)}</p>{/if}
      </div>
    {/each}
    {#each objects as object}<div class="source"><p>Use {object.label ?? 'an object'}</p>{@render startSpots(object.placements)}{#if object.availability.length}<Availability rules={object.availability} {registry} />{/if}</div>{/each}
  </div>{/if}
  {#if remainingTurnIns.length || (!document.turnIns.length && (document.facts.turnInWithoutNpc || document.facts.worldQuest))}
    <div><h3>{document.facts.worldQuest && !document.turnIns.length ? 'Completion' : 'Turn in to'}</h3>
      {#each remainingTurnIns as turnIn}<p><EntityLink ref={turnIn.npc} {registry} />{#if turnIn.areas.length}{' · '}{turnIn.areas.join(', ')}{/if}{#if turnIn.npc.key !== null}{' · '}<a class="c-link" href={entityOnMap(turnIn.npc.key)}>Show on map</a>{/if}</p>{/each}
      {#if !document.turnIns.length}<p>{document.facts.worldQuest ? 'Completes automatically when its objectives are finished.' : document.facts.turnInWithoutNpc ? 'Completes without a turn-in character.' : 'No turn-in character is named.'}</p>{/if}
    </div>
  {/if}
</div>

<style>
  .starters { display: grid; gap: .85rem; padding-top: var(--c-space-block); border-top: 1px solid var(--c-line-soft); }
  h3 { margin-bottom: .25rem; color: var(--c-text-dim); font-size: .875rem; font-weight: 600; }
  .source + .source { margin-top: .65rem; }
</style>
