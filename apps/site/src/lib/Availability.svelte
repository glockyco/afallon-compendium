<script lang="ts">
  import type { AvailabilityRule, PublicKindEntry } from '@afallon/contracts/public';
  import MissingValue from './MissingValue.svelte';
  import Requirements from './Requirements.svelte';
  import { formatDuration } from './format';

  export let rules: AvailabilityRule[];
  export let registry: PublicKindEntry[];
</script>

{#if rules.length}
  <ul class="availability">
    {#each rules as rule}
      <li>
        {#if rule.effect === 'excludes'}Not while
        {:else if rule.effect === 'temporary'}For {#if rule.durationSeconds === undefined}<MissingValue explanation="The toggle's duration is not published" />{:else}{formatDuration(rule.durationSeconds)}{/if} after{/if}
        <Requirements requirements={rule.requirements} {registry} />
      </li>
    {/each}
  </ul>
{/if}

<style>
  .availability { display: grid; gap: .4rem; margin: 0; padding: 0; list-style: none; }
  li { font-size: .85rem; }
  li :global(.requirements) { display: inline-grid; vertical-align: baseline; }
</style>
