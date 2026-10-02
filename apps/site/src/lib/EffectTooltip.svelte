<script lang="ts">
  import type { PublicEffect } from '@afallon/contracts/public';
  import EntityHeader from './EntityHeader.svelte';
  import { formatNumber, nameOf, signedAmount } from './format';

  export let document: PublicEffect;
  export let rankIndex: number | undefined = undefined;

  $: rank = document.ranks.find((candidate) => candidate.rank === rankIndex) ?? document.ranks[0];
  $: timed = document.isState && !document.endless && document.durationSeconds > 0;
  $: overTime = document.type === 'Damage Over Time' || document.type === 'Heal Over Time';
  $: hasTiming = document.isState && (document.endless || timed || (overTime && document.pulses > 0));
</script>

<article class="effect-tooltip">
  <EntityHeader name={document.ref.name} art={document.art.icon ?? document.ref.icon} compact />
  <p class="type">{document.type} Effect</p>
  {#if document.description}<p class="description">{document.description}</p>{/if}
  {#if hasTiming}<p class="timing">{#if document.endless}Endless{:else if timed}Configured Duration: {formatNumber(document.durationSeconds)} Seconds{/if}{#if overTime && document.pulses > 0}{document.endless || timed ? ' · ' : ''}{formatNumber(document.pulses)} Configured {document.pulses === 1 ? 'Pulse' : 'Pulses'}{/if}</p>{/if}
  {#if overTime && document.durationSeconds > 0 && document.pulses > 0}<p class="timing">Interval from configured values: {formatNumber(document.durationSeconds / document.pulses)} seconds. The game may adjust the pulse count.</p>{/if}
  {#if rank}
    {#if document.ranks.length > 1}<p class="rank">Rank {formatNumber(rank.rank + 1)}</p>{/if}
    {#if rank.actions.length}<ul>{#each rank.actions as entry}<li><span>{entry.label}</span>{#if entry.amount !== undefined} <strong>{entry.label === 'Changes' ? signedAmount(entry.amount, entry.unit === '%') : `${formatNumber(entry.amount)}${entry.unit === '%' ? '%' : ''}`}</strong>{/if}{#if entry.target} {nameOf(entry.target)}{/if}{#if entry.unit && entry.unit !== '%'} {entry.unit}{/if}{#if entry.detail} {entry.detail}{/if}</li>{/each}</ul>{/if}
  {/if}
</article>

<style>
  .effect-tooltip { display: grid; gap: .45rem; font-size: var(--c-text-body); line-height: 1.45; }
  p { margin: 0; }
  .type, .timing, .rank { color: var(--c-text-dim); font-size: var(--c-text-small); }
  .description { color: var(--c-text-strong); }
  .rank { color: var(--c-accent-strong); font-weight: 700; }
  ul { display: grid; gap: .3rem; padding: 0; margin: 0; list-style: none; }
  li { min-width: 0; overflow-wrap: anywhere; }
  li span { color: var(--c-text-dim); margin-right: .35rem; }
  li strong { color: var(--c-text-strong); margin-right: .35rem; }
</style>
