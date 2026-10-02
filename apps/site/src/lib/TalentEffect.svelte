<script lang="ts">
  import type { PublicKindEntry, TalentRow } from '@afallon/contracts/public';
  import EntityLink from './EntityLink.svelte';
  import NativeText from './NativeText.svelte';
  import { statAmount } from './progression-format';

  /** A passive talent at its first rank and, when it has more ranks, at its last rank. */
  export let row: TalentRow;
  export let registry: PublicKindEntry[];

  // The game's own names for the pets that a talent changes.
  const PETS = { beast: 'Your beast', summons: 'Summons' } as const;

  $: ranks = [row.first, row.last].filter((rank) => rank !== undefined);
</script>

<!-- One grid for all ranks, so the effects of every rank start at the same column. -->
<div class="ranks" class:labelled={ranks.length > 1}>
  {#each ranks as rank}
    {#if ranks.length > 1}<span class="label">Rank {rank.rank}</span>{/if}
    <span class="effect">
      {#if rank.stats.length || rank.petStats.length}
        {#if rank.stats.length}<span class="line">{#each rank.stats as stat, index}{index ? ', ' : ''}{statAmount(stat)} <EntityLink ref={stat.stat} {registry} />{/each}</span>{/if}
        {#each rank.petStats as group}
          <span class="line">{#if group.pets.kind === 'npc'}<EntityLink ref={group.pets.npc} {registry} />{:else}{PETS[group.pets.kind]}{/if}: {#each group.stats as stat, index}{index ? ', ' : ''}{statAmount(stat)} <EntityLink ref={stat.stat} {registry} />{/each}</span>
        {/each}
      {:else}<NativeText lines={rank.text} />{/if}
    </span>
  {/each}
</div>

<style>
  .ranks { display: grid; grid-template-columns: minmax(0, 1fr); row-gap: .2rem; align-items: baseline; }
  .ranks.labelled { grid-template-columns: auto minmax(0, 1fr); column-gap: .5rem; }
  .label { color: var(--c-text-mute); font-size: var(--c-text-small); white-space: nowrap; }
  .effect { min-width: 0; }
  .line { display: block; }
</style>
