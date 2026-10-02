<script lang="ts">
  import type { PublicLevel } from '@afallon/contracts/public';
  import MissingValue from './MissingValue.svelte';
  import { levelText } from './format';

  /** A creature level: the range and its scaling rule. A table cell puts the rule on its own line; running text reads "15–30, scales with the player". */
  export let level: PublicLevel | undefined;
  /** Suppress a scaling note when the parent section states the same rule for all rows. */
  export let showScalingNote = true;
</script>

{#if level}{levelText(level)}{#if level.scales && showScalingNote}<span class="separator">{', '}</span><small>scales with the player</small>{:else if !level.scales}<MissingValue explanation="No confirmed level rule applies" />{/if}{/if}

<style>
  /* Tables show the rule as a block line, where the separator would dangle. */
  :global(td) .separator { display: none; }
</style>
