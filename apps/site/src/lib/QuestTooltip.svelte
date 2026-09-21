<script lang="ts">
  import type { PublicKindEntry, PublicQuest } from '@afallon/contracts/public';
  import EntityHeader, { type HeaderBadge, type HeaderFact } from './EntityHeader.svelte';
  import EntityReference from './EntityReference.svelte';
  import { formatNumber } from './format';

  export let document: PublicQuest;
  export let registry: PublicKindEntry[];

  $: facts = document.facts;
  $: badges = [
    ...(facts.chain ? [{ label: facts.chain.name, tone: 'accent' as const }] : []),
    ...(facts.repeatable ? [{ label: 'Repeatable' }] : []),
  ] satisfies HeaderBadge[];
  $: headerFacts = [
    ...(facts.levelRequirement !== undefined ? [{ label: 'Requires level', value: String(facts.levelRequirement) }] : []),
    ...(facts.experience !== undefined ? [{ label: 'Experience', value: formatNumber(facts.experience) }] : []),
  ] satisfies HeaderFact[];
</script>

<article>
  <EntityHeader name={document.ref.name} art={document.art.icon ?? document.ref.icon} fallbackIcon={registry.find((entry) => entry.kind === 'quests')?.icon} {badges} facts={headerFacts} description={document.description} compact />
  <dl>
    {#if document.givers.length}<div><dt>Giver</dt><dd>{#each document.givers as ref}<EntityReference {ref} {registry} />{/each}</dd></div>{/if}
    {#if document.turnIns.length}<div><dt>Turn-in</dt><dd>{#each document.turnIns as ref}<EntityReference {ref} {registry} />{/each}</dd></div>{:else if facts.turnInWithoutNpc}<div><dt>Turn-in</dt><dd>No NPC required</dd></div>{/if}
  </dl>
  {#if document.objectives.length}<section><h4>Objectives</h4><ul>{#each document.objectives as objective}<li>{objective.label}</li>{/each}</ul></section>{/if}
  {#if document.rewards.length || document.rewardChoices.length}<section><h4>Rewards</h4><ul>{#each [...document.rewards, ...document.rewardChoices] as reward}<li><EntityReference ref={reward.counterpart} {registry} /><span>×{reward.count}</span></li>{/each}</ul></section>{/if}
  {#if facts.objectiveText}<p class="quest-text">{facts.objectiveText}</p>{/if}
  {#if facts.completedDescription}<p class="quest-text">{facts.completedDescription}</p>{/if}
</article>

<style>
  dl, section { display: grid; gap: .35rem; margin: .6rem 0 0; }
  dl div { display: grid; grid-template-columns: 4rem 1fr; gap: .5rem; font-size: .82rem; }
  dt { color: var(--c-text-dim); }
  dd { display: grid; gap: .25rem; margin: 0; }
  h4 { margin: 0; color: var(--c-accent-strong); font: 600 .8rem/1.25 var(--c-serif); }
  ul { display: grid; gap: .3rem; margin: 0; padding: 0; list-style: none; font-size: .82rem; }
  li { display: flex; justify-content: space-between; gap: .5rem; }
  li span { color: var(--c-text-dim); }
  .quest-text { margin: .6rem 0 0; color: var(--c-text-dim); font-size: .8rem; line-height: 1.45; }
</style>
