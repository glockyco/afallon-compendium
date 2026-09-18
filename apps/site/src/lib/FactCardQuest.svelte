<script lang="ts">
  import type { PublicKindEntry, PublicQuest } from '@afallon/contracts/public';
  import EntityLink from './EntityLink.svelte';
  import FactCardFrame from './FactCardFrame.svelte';
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
    {#if facts.chain}<div><dt>Chain</dt><dd>{facts.chain.name} · {facts.chain.order}</dd></div>{/if}
    {#if facts.levelRequirement !== undefined}<div><dt>Level requirement</dt><dd>{facts.levelRequirement}</dd></div>{/if}
    {#if facts.repeatable}<div><dt>Repeatable</dt><dd>Yes</dd></div>{/if}
    {#if facts.experience !== undefined}<div><dt>Experience</dt><dd>{facts.experience}</dd></div>{/if}
    {#if facts.requirements.length}<div><dt>Requirements</dt><dd><Requirements requirements={facts.requirements} {registry} /></dd></div>{/if}
    <div><dt>Quest giver</dt><dd>{#if document.givers.length}{#each document.givers as giver}<span class="line"><EntityLink ref={giver} {registry} /></span>{/each}{:else}<MissingValue explanation="No location is published" />{/if}</dd></div>
    <div><dt>Turn-in</dt><dd>{#if document.turnIns.length}{#each document.turnIns as turnIn}<span class="line"><EntityLink ref={turnIn} {registry} /></span>{/each}{:else if facts.turnInWithoutNpc}No NPC required{:else}<MissingValue explanation="No location is published" />{/if}</dd></div>
    {#if facts.objectiveText}<div><dt>Objective</dt><dd>{facts.objectiveText}</dd></div>{/if}
    {#if facts.completedDescription}<div><dt>Completion</dt><dd>{facts.completedDescription}</dd></div>{/if}
  </dl>
  {#if showRelations}
    <QuestTable objectives={document.objectives} {registry} heading="Objectives" {limit} />
    <QuestTable rows={document.itemsGiven} {registry} heading="Items given" {limit} />
    <QuestTable rows={document.rewards} {registry} heading="Fixed rewards" {limit} />
    <QuestTable rows={document.rewardChoices} {registry} heading="Choose a reward" {limit} />
    {#if document.previous || document.next || document.chainQuests.length}<section><h2>Quest chain</h2><ul>{#if document.previous}<li>Previous: <EntityLink ref={document.previous} {registry} /></li>{/if}{#each (limit === undefined ? document.chainQuests : document.chainQuests.slice(0, limit)) as quest}<li><EntityLink ref={quest} {registry} /></li>{/each}{#if document.next}<li>Next: <EntityLink ref={document.next} {registry} /></li>{/if}</ul></section>{/if}
  {/if}
</FactCardFrame>

<style>
  .line { display: block; } section { margin-top: 1.25rem; } h2 { margin: 0 0 .55rem; color: #eee9dd; font: 600 1rem/1.3 Georgia, serif; }
  ul { display: grid; gap: .35rem; margin: 0; padding-left: 1.1rem; }
</style>
