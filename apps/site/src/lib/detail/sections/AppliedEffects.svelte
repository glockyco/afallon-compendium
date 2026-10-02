<script lang="ts">
  import type { AbilityAppliedEffect, PublicKindEntry } from '@afallon/contracts/public';
  import EntityLink from '../../EntityLink.svelte';
  import { formatNumber } from '../../format';
  import { shownRowCount } from '../relation-table';

  export let rows: AbilityAppliedEffect[];
  export let registry: PublicKindEntry[];
  export let heading = true;
  let showAll = false;
  $: shown = shownRowCount(rows.length, showAll);

  const duration = (seconds: number) => `${formatNumber(seconds)} ${seconds === 1 ? 'second' : 'seconds'}`;
  const context = (row: AbilityAppliedEffect) => [
    row.rank === undefined ? undefined : `Rank ${row.rank + 1}`,
    row.chance === undefined ? undefined : `${formatNumber(row.chance)}% chance`,
    row.target,
    row.endless ? 'Ongoing' : row.durationSeconds ? duration(row.durationSeconds) : undefined,
  ].filter(Boolean).join(' · ');
</script>

{#if rows.length}
  <div class="applied-effects">
    {#if heading}<h3>Applies effects</h3>{/if}
    <ul>
      {#each rows.slice(0, shown) as row, index (index)}
        {@const details = context(row)}
        <li><EntityLink ref={row.effect} {registry} />{#if details}<span>{details}</span>{/if}</li>
      {/each}
    </ul>
    {#if shown < rows.length}<button class="c-action" type="button" on:click={() => (showAll = true)}>Show {rows.length - shown} more</button>{/if}
  </div>
{/if}

<style>
  .applied-effects { display: grid; gap: .55rem; min-width: 0; }
  h3 { color: var(--c-text-strong); font: 600 1.05rem/1.3 var(--c-serif); }
  ul { display: grid; gap: .6rem; margin: 0; padding: 0; list-style: none; }
  li { display: grid; gap: .12rem; min-width: 0; }
  li span { color: var(--c-text-dim); font-size: var(--c-text-small); }
  button { width: fit-content; }
</style>
