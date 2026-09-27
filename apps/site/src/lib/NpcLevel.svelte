<script lang="ts">
  import type { PublicLevel } from '@afallon/contracts/public';
  import MissingValue from './MissingValue.svelte';
  import { levelText } from './format';

  /** A creature level in a table cell: the range, with the scaling rule below it. */
  export let level: PublicLevel | undefined;
</script>

{#if level}{levelText(level)}{#if level.scales}<small>scales with the player</small>{/if}{:else}<MissingValue explanation="No confirmed level rule applies" />{/if}
