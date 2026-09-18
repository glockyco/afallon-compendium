<script lang="ts">
  import type { PublicKindEntry, PublicQuest } from '@afallon/contracts/public';
  import EntityLink from './EntityLink.svelte';
  import FactCardFrame from './FactCardFrame.svelte';
  import LocationList from './LocationList.svelte';
  import MissingValue from './MissingValue.svelte';
  import QuestTable from './QuestTable.svelte';
  import Requirements from './Requirements.svelte';

  export let document: PublicQuest;
  export let registry: PublicKindEntry[];
  export let compact = false;
  export let showRelations = false;
  export let limit: number | undefined = undefined;
  $: facts = document.facts;
</script>

<FactCardFrame name={document.ref.name} description={document.description} art={document.art.icon ?? document.ref.icon} fallbackIcon={registry.find((entry) => entry.kind === 'quests')?.icon} {compact}>
  <dl class="facts">
    <div><dt>Chain</dt><dd>{facts.chain ? `${facts.chain.name} · ${facts.chain.order}` : 'None'}</dd></div>
    <div><dt>Level requirement</dt><dd>{#if facts.levelRequirement !== undefined}{facts.levelRequirement}{:else}<MissingValue explanation="Not measured for this build" />{/if}</dd></div>
    <div><dt>Repeatable</dt><dd>{facts.repeatable ? 'Yes' : 'No'}</dd></div>
    <div><dt>Experience</dt><dd>{#if facts.experience !== undefined}{facts.experience}{:else}<MissingValue explanation="Not measured for this build" />{/if}</dd></div>
    <div><dt>Requirements</dt><dd><Requirements requirements={facts.requirements} {registry} /></dd></div>
    <div><dt>Quest giver</dt><dd>{#if document.givers.length}{#each document.givers as giver}<span class="line"><EntityLink ref={giver} {registry} /></span>{/each}{:else}<MissingValue explanation="No location is published" />{/if}</dd></div>
    <div><dt>Turn-in</dt><dd>{#if document.turnIns.length}{#each document.turnIns as turnIn}<span class="line"><EntityLink ref={turnIn} {registry} /></span>{/each}{:else if facts.turnInWithoutNpc}No NPC required{:else}<MissingValue explanation="No location is published" />{/if}</dd></div>
    <div><dt>Objective</dt><dd>{#if facts.objectiveText}{facts.objectiveText}{:else}<MissingValue explanation="No objective text is published" />{/if}</dd></div>
    <div><dt>Completion</dt><dd>{#if facts.completedDescription}{facts.completedDescription}{:else}<MissingValue explanation="No completion text is published" />{/if}</dd></div>
  </dl>
  {#if showRelations}
    <QuestTable objectives={document.objectives} {registry} heading="Objectives" {limit} />
    <QuestTable rows={document.itemsGiven} {registry} heading="Items given" {limit} />
    <QuestTable rows={document.rewards} {registry} heading="Fixed rewards" {limit} />
    <QuestTable rows={document.rewardChoices} {registry} heading="Choose a reward" {limit} />
    {#if document.previous || document.next || document.chainQuests.length}<section><h2>Quest chain</h2><ul>{#if document.previous}<li>Previous: <EntityLink ref={document.previous} {registry} /></li>{/if}{#each (limit === undefined ? document.chainQuests : document.chainQuests.slice(0, limit)) as quest}<li><EntityLink ref={quest} {registry} /></li>{/each}{#if document.next}<li>Next: <EntityLink ref={document.next} {registry} /></li>{/if}</ul></section>{/if}
    <LocationList locations={document.locations} entityKey={document.ref.key} {limit} />
  {/if}
</FactCardFrame>

<style>
  .line { display: block; } section { margin-top: 1.25rem; } h2 { margin: 0 0 .55rem; color: #eee9dd; font: 600 1rem/1.3 Georgia, serif; }
  ul { display: grid; gap: .35rem; margin: 0; padding-left: 1.1rem; }
</style>
