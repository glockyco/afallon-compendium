<script lang="ts">
  import type { PlacedRule, Ref } from '@afallon/contracts/public';
  import { formatNumber, nameOf } from '../../format';
  import HowItWorks from '../HowItWorks.svelte';
  export let rules: PlacedRule[];
  export let skill: Ref | undefined = undefined;
  const percent = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 });
</script>

{#if rules.length}
  <div class="placed-facts">
    {#each rules as entry}
      <div>
        {#if entry.levelChances?.length}
          <p>{#each entry.levelChances as value, index}{index > 0 ? ' · ' : ''}At {skill ? nameOf(skill) : 'skill'} level {formatNumber(value.level)}: {percent.format(value.chance)}%{/each}</p>
        {/if}
        <HowItWorks guide={entry.guide} stepId={entry.stepId} />
      </div>
    {/each}
  </div>
{/if}

<style>
  .placed-facts { display: grid; gap: .65rem; }
  p { margin: 0 0 .2rem; }
</style>
