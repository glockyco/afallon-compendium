<script lang="ts">
  import type { PublicLevel } from '@afallon/contracts/public';
  import { levelText } from './format';

  /**
   * A creature level: the range and its scaling rule. A table cell puts the rule on its own line; running text reads
   * "15–30, scales with the player". A level that does not scale is a fixed level or a level rolled within its range, so
   * it needs no note.
   */
  export let level: PublicLevel | undefined;
  /** Suppress a scaling note when the parent section states the same rule for all rows. */
  export let showScalingNote = true;
</script>

{#if level}{levelText(level)}{#if level.scales && showScalingNote}<span class="separator">{', '}</span><small>scales with the player</small>{/if}{/if}

<style>
  /* Tables show the rule as a block line, where the separator would dangle. */
  :global(td) .separator { display: none; }
</style>
