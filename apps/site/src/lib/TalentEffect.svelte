<script lang="ts">
  import type { TalentRow } from '@afallon/contracts/public';
  import NativeText from './NativeText.svelte';
  import { statChange } from './progression-format';

  /** A passive talent at its first rank and, when it has more ranks, at its last rank. */
  export let row: TalentRow;

  $: ranks = [row.first, row.last].filter((rank) => rank !== undefined);
</script>

{#each ranks as rank}
  <div class="rank">
    {#if ranks.length > 1}<span class="label">Rank {rank.rank}</span>{/if}
    <span class="effect">{#if rank.stats.length}{rank.stats.map(statChange).join(', ')}{:else}<NativeText lines={rank.text} />{/if}</span>
  </div>
{/each}

<style>
  .rank { display: flex; gap: .5rem; align-items: baseline; }
  .rank + .rank { margin-top: .2rem; }
  .label { flex: none; color: var(--c-text-mute); font-size: var(--c-text-small); white-space: nowrap; }
  .effect { min-width: 0; }
</style>
