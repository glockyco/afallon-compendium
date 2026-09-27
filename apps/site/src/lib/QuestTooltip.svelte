<script lang="ts">
  import type { PublicKindEntry, PublicQuest } from '@afallon/contracts/public';
  import EntityHeader, { type HeaderFact } from './EntityHeader.svelte';
  import EntityReference from './EntityReference.svelte';
  import { formatNumber, levelText } from './format';

  export let document: PublicQuest;
  export let registry: PublicKindEntry[];

  $: facts = document.facts;
  $: chainQuests = document.chainQuests;
  $: chainStep = chainQuests.findIndex((quest) => quest.key === document.ref.key);
  $: headerFacts = [
    ...(facts.chain ? [{ label: 'Chain', value: `${facts.chain.name}${chainStep >= 0 ? `, step ${chainStep + 1} of ${chainQuests.length}` : ''}` }] : []),
    ...(facts.worldQuest ? [{ value: 'World Quest' }] : []),
    ...(facts.repeatable ? [{ value: 'Repeatable' }] : []),
    ...(facts.levelRange ? [{ label: 'Quest level', value: levelText(facts.levelRange) }] : []),
    ...(facts.levelRequirement !== undefined ? [{ label: 'Minimum level', value: String(facts.levelRequirement) }] : []),
    ...(facts.experience !== undefined ? [{ label: 'Experience', value: formatNumber(facts.experience) }] : []),
  ] satisfies HeaderFact[];
</script>

<article>
  <EntityHeader name={document.ref.name} art={document.art.icon ?? document.ref.icon} facts={headerFacts} description={document.description} compact />
  <dl>
    {#if document.starts.length}
      <div><dt>Start</dt><dd>{#each document.starts as start}
        {#if start.kind === 'npc'}<EntityReference ref={start.npc} {registry} />{:else if start.kind === 'worldZone'}World Quest{:else}{start.label ?? 'Interactive Object'}{/if}
      {/each}</dd></div>
    {/if}
    {#if document.turnIns.length}<div><dt>Turn-in</dt><dd>{#each document.turnIns as turnIn}<EntityReference ref={turnIn.npc} {registry} />{#if turnIn.areas.length}<span class="area">{turnIn.areas.join(', ')}</span>{/if}{/each}</dd></div>{:else if facts.turnInWithoutNpc}<div><dt>Turn-in</dt><dd>No NPC required</dd></div>{/if}
    {#if document.dungeon}<div><dt>Dungeon</dt><dd><EntityReference ref={document.dungeon} {registry} /></dd></div>{/if}
  </dl>
  {#if document.objectives.length}<section><h4>Objectives</h4><ul>{#each document.objectives as objective}<li>{objective.text}{#if 'count' in objective}<span>×{objective.count}</span>{/if}</li>{/each}</ul></section>{/if}
  {#if document.rewards.length}<section><h4>Rewards</h4><ul>{#each document.rewards as reward}<li><EntityReference ref={reward.counterpart} {registry} /><span>×{reward.count}</span></li>{/each}</ul></section>{/if}
  {#if document.rewardChoices.length}<section><h4>Choose one</h4><ul>{#each document.rewardChoices as reward}<li><EntityReference ref={reward.counterpart} {registry} /><span>×{reward.count}</span></li>{/each}</ul></section>{/if}
  {#if facts.objectiveText}<p class="quest-text">{facts.objectiveText}</p>{/if}
  {#if facts.completedDescription}<p class="quest-text completion-text">{facts.completedDescription}</p>{/if}
</article>

<style>
  dl, section { display: grid; gap: .35rem; margin: .6rem 0 0; }
  dl div { display: grid; grid-template-columns: 4rem 1fr; align-items: baseline; gap: .5rem; font-size: .82rem; }
  dt { color: var(--c-text-dim); }
  dd { display: grid; gap: .25rem; margin: 0; }
  .area { color: var(--c-text-dim); font-size: .75rem; }
  h4 { margin: 0; color: var(--c-accent-strong); font: 600 .8rem/1.25 var(--c-serif); }
  ul { display: grid; gap: .3rem; margin: 0; padding: 0; list-style: none; font-size: .82rem; }
  li { display: flex; justify-content: space-between; gap: .5rem; }
  li span { color: var(--c-text-dim); }
  .quest-text { margin: .6rem 0 0; color: var(--c-text-dim); font-size: .8rem; line-height: 1.45; }
  .completion-text { display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 4; line-clamp: 4; overflow: hidden; }
</style>
