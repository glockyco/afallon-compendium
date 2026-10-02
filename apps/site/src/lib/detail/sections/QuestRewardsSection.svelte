<script lang="ts">
  import type { PublicKindEntry, PublicQuest } from '@afallon/contracts/public';
  import EntityLink from '../../EntityLink.svelte';
  import { formatNumber } from '../../format';
  import HowItWorks from '../HowItWorks.svelte';
  import Section from '../Section.svelte';

  export let document: PublicQuest;
  export let registry: PublicKindEntry[];

  $: hasRewards = document.rewards.length > 0 || document.rewardChoices.length > 0 || document.itemsGiven.length > 0;
</script>

{#if hasRewards}
  <Section id="rewards" title="Rewards">
    {#if document.rewards.length}<ul class="reward-list">{#each document.rewards as reward}<li><EntityLink ref={reward.counterpart} {registry} /><span class="quantity">{formatNumber(reward.count)} ×</span></li>{/each}</ul>{/if}
    {#if document.rewardChoices.length}<div class="group"><h3>Choose one</h3><ul class="reward-list">{#each document.rewardChoices as reward}<li><EntityLink ref={reward.counterpart} {registry} /><span class="quantity">{formatNumber(reward.count)} ×</span></li>{/each}</ul></div>{/if}
    {#if document.itemsGiven.length}<div class="group"><h3>Given at the start</h3><ul class="reward-list">{#each document.itemsGiven as item}<li><EntityLink ref={item.counterpart} {registry} /><span class="quantity">{formatNumber(item.count)} ×</span></li>{/each}</ul></div>{/if}
    {#if document.facts.worldQuest && document.rewards.some((reward) => reward.counterpart.key !== null && reward.counterpart.kind === 'currencies')}
      <p class="world-currency">Your currency reward is scaled to your level. Heroic Cache also changes it while the Heroic Tier is live.
        <HowItWorks guide={{ key: 'mechanics:world-quests', kind: 'mechanics', name: 'World Quests', slug: 'world-quests' }} section="rewards" label="How World Quest rewards work" />
      </p>
    {/if}
  </Section>
{/if}

<style>
  .group { margin-top: .9rem; }
  .world-currency { margin-top: .75rem; color: var(--c-text-dim); line-height: 1.5; }
  h3 { margin: 0 0 .35rem; color: var(--c-text-dim); font-size: .875rem; font-weight: 600; }
  .reward-list { margin: 0; padding: 0; border: 1px solid var(--c-line-soft); border-radius: var(--c-radius); background: var(--c-surface-1); list-style: none; }
  li { display: flex; min-height: 2.75rem; align-items: center; justify-content: space-between; gap: .75rem; padding: .5rem .75rem; }
  li + li { border-top: 1px solid var(--c-line-soft); }
  li > :global(*) { min-width: 0; }
  .quantity { flex: none; color: var(--c-text-dim); font-variant-numeric: tabular-nums; white-space: nowrap; }
</style>
