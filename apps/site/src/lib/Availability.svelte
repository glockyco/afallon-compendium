<script lang="ts">
  import type { AvailabilityRule, PublicKindEntry } from '@afallon/contracts/public';
  import MissingValue from './MissingValue.svelte';
  import Requirements from './Requirements.svelte';
  import { formatDuration } from './format';

  export let rules: AvailabilityRule[];
  export let registry: PublicKindEntry[];

  const effectOrder: Record<AvailabilityRule['effect'], number> = { requires: 0, excludes: 1, temporary: 2 };
  $: orderedRules = rules.length > 1 ? [...rules].sort((a, b) =>
    effectOrder[a.effect] - effectOrder[b.effect]
    || (a.requirements[0]?.requirements[0]?.type.name ?? '').localeCompare(b.requirements[0]?.requirements[0]?.type.name ?? '')
    || (a.requirements[0]?.requirements[0]?.label ?? '').localeCompare(b.requirements[0]?.requirements[0]?.label ?? '')
  ) : rules;
</script>

<!-- Each rule is its own item, such as "Uses up 1 Chest Key" and "Levels 1–10", so no rule reads as part of another. -->
{#if orderedRules.length}
  <ul class="availability">
    {#each orderedRules as rule}
      <li>
        {#if rule.effect === 'excludes'}Not while{' '}
        {:else if rule.effect === 'temporary'}For {#if rule.durationSeconds === undefined}<MissingValue explanation="The toggle's duration is not published" />{:else}{formatDuration(rule.durationSeconds)}{/if} after{' '}{/if}
        <Requirements requirements={rule.requirements} {registry} opensSentence={rule.effect === 'requires'} />
      </li>
    {/each}
  </ul>
{/if}

<style>
  .availability { margin: 0; padding: 0; list-style: none; line-height: 1.5; }
  li { display: inline; font-size: var(--c-text-body); }
  li + li::before { content: ' · '; color: var(--c-text-mute); }
</style>
