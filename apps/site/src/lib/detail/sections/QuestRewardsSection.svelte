<script lang="ts">
  import type { PublicKindEntry, PublicQuest } from '@afallon/contracts/public';
  import EntityLink from '../../EntityLink.svelte';
  import { formatNumber } from '../../format';
  import FactList from '../FactList.svelte';
  import FactRow from '../FactRow.svelte';
  import Section from '../Section.svelte';

  export let document: PublicQuest;
  export let registry: PublicKindEntry[];

  $: facts = document.facts;
  $: hasRewards = facts.experience !== undefined || document.rewards.length > 0 || document.rewardChoices.length > 0 || document.itemsGiven.length > 0;
</script>

{#if hasRewards}
  <Section id="rewards" title="Rewards" icon="reward">
    <FactList>
      {#if facts.experience !== undefined}<FactRow label="Experience" rules={document.placedRules.filter((entry) => entry.target === 'experience')} {registry}>{formatNumber(facts.experience)}</FactRow>{/if}
      {#if document.rewards.length}
        <FactRow label="Rewards"><span class="entries">{#each document.rewards as reward}<span class="entry"><span class="quantity">{formatNumber(reward.count)} ×</span> <EntityLink ref={reward.counterpart} {registry} /></span>{/each}</span></FactRow>
      {/if}
      {#if document.rewardChoices.length}
        <FactRow label="Choose one of"><span class="entries">{#each document.rewardChoices as reward}<span class="entry"><span class="quantity">{formatNumber(reward.count)} ×</span> <EntityLink ref={reward.counterpart} {registry} /></span>{/each}</span></FactRow>
      {/if}
      {#if document.itemsGiven.length}
        <FactRow label="Given at the start"><span class="entries">{#each document.itemsGiven as item}<span class="entry"><span class="quantity">{formatNumber(item.count)} ×</span> <EntityLink ref={item.counterpart} {registry} /></span>{/each}</span></FactRow>
      {/if}
    </FactList>
  </Section>
{/if}

<style>
  .entries { display: grid; gap: .3rem; }
  .entry { display: flex; min-width: 0; flex-wrap: wrap; align-items: baseline; gap: .3rem; }
  .quantity { white-space: nowrap; font-variant-numeric: tabular-nums; }
</style>
