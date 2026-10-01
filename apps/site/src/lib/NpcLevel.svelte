<script lang="ts">
  import type { PublicLevel } from '@afallon/contracts/public';
  import MissingValue from './MissingValue.svelte';
  import { levelText } from './format';

  /** A creature level: the range and its scaling rule. A table cell puts the rule on its own line; running text reads "15–30, scales with the player". */
  export let level: PublicLevel | undefined;
</script>

{#if level}{levelText(level)}{#if level.scales}<span class="separator">{', '}</span><small>scales with the player</small>{/if}{:else}<MissingValue explanation="No confirmed level rule applies" />{/if}

<style>
  /* Tables show the rule as a block line, where the separator would dangle. */
  :global(td) .separator { display: none; }
</style>
