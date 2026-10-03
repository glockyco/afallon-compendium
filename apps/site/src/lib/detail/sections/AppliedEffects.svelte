<script lang="ts">
  import type { AbilityAppliedEffect, PublicKindEntry } from '@afallon/contracts/public';
  import EntityLink from '../../EntityLink.svelte';
  import { formatNumber } from '../../format';
  import { isNamedAppliedEffect } from '../effect-outcome';
  import { shownRowCount } from '../relation-table';
  import StaticMore from '../StaticMore.svelte';

  export let rows: AbilityAppliedEffect[];
  export let registry: PublicKindEntry[];
  export let heading = true;
  let showAll = false;
  $: visibleRows = rows.filter(isNamedAppliedEffect);
  $: shown = shownRowCount(visibleRows.length, showAll);

  const duration = (seconds: number) => {
    if (seconds < 60) return `${formatNumber(seconds)} ${seconds === 1 ? 'second' : 'seconds'}`;
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) return `${seconds % 60 ? 'About ' : ''}${formatNumber(minutes)} ${minutes === 1 ? 'minute' : 'minutes'}`;
    const hours = Math.floor(minutes / 60), remaining = minutes % 60;
    return `${seconds % 60 ? 'About ' : ''}${formatNumber(hours)} ${hours === 1 ? 'hour' : 'hours'}${remaining ? ` ${remaining} ${remaining === 1 ? 'minute' : 'minutes'}` : ''}`;
  };
  // Ranks only tell readers something when the ability applies effects at more than one rank.
  $: ranked = new Set(rows.map((row) => row.rank ?? 0)).size > 1;
  const context = (row: AbilityAppliedEffect) => [
    ranked ? `At rank ${formatNumber((row.rank ?? 0) + 1)}` : undefined,
    row.chance === undefined ? undefined : `${formatNumber(row.chance)}% chance per hit`,
    row.target === 'Target' ? 'On the target' : row.target === 'Caster' ? 'On the caster' : row.target ? `On ${row.target.toLocaleLowerCase()}` : undefined,
    row.endless ? 'Ongoing' : row.durationSeconds ? duration(row.durationSeconds) : undefined,
  ].filter(Boolean).join(' · ');
</script>

{#if visibleRows.length}
  <div class="applied-effects">
    {#if heading}<h3>Applies Effects</h3>{/if}
    {#if visibleRows.some((row) => row.chance !== undefined)}<p class="chance-note">The chance applies to each hit, so hitting several enemies or hitting several times gives several chances.</p>{/if}
    <ul>
      {#each visibleRows.slice(0, shown) as row, index (index)}
        {@const details = context(row)}
        <li><span class="effect-link"><EntityLink ref={row.effect} {registry} /></span>{#if details}<span>{details}</span>{/if}</li>
      {/each}
    </ul>
    {#if shown < visibleRows.length}
      <StaticMore count={visibleRows.length - shown}>
        <button slot="control" class="c-action" type="button" on:click={() => (showAll = true)}>Show {visibleRows.length - shown} More</button>
        <ul>
          {#each visibleRows.slice(shown) as row}
            {@const details = context(row)}
            <li><EntityLink ref={row.effect} {registry} />{#if details}<span>{details}</span>{/if}</li>
          {/each}
        </ul>
      </StaticMore>
    {/if}
  </div>
{/if}

<style>
  .applied-effects { display: grid; gap: .55rem; min-width: 0; }
  h3 { color: var(--c-text-strong); font: 600 1.05rem/1.3 var(--c-serif); }
  ul { display: grid; gap: .6rem; margin: 0; padding: 0; list-style: none; }
  li { display: grid; gap: .12rem; min-width: 0; }
  .chance-note { margin: 0; color: var(--c-text-dim); font-size: var(--c-text-small); }
  .effect-link { color: inherit; font-size: inherit; }
  li span { color: var(--c-text-dim); font-size: var(--c-text-small); }
  button { width: fit-content; }
</style>
