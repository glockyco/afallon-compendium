<script lang="ts">
  import type { PublicEffect, PublicKindEntry } from '@afallon/contracts/public';
  import EntityHeader from './EntityHeader.svelte';
  import EntityReference from './EntityReference.svelte';
  import { formatNumber } from './format';
  import { actionWords, durationWords, effectImpact } from './detail/effect-outcome';

  export let document: PublicEffect;
  export let registry: PublicKindEntry[];
  export let rankIndex: number | undefined = undefined;
  $: rank = document.ranks.find((candidate) => candidate.rank === rankIndex) ?? document.ranks[0];
  $: impact = effectImpact(document, rank);
  $: condition = !impact ? document.checkedBy.find((row) => row.owner?.key && ['abilities', 'items'].includes(row.owner.kind)) : undefined;
  $: duration = document.isState && document.durationSeconds > 0 ? durationWords(document.durationSeconds) : undefined;
</script>

<article class="effect-tooltip">
  <EntityHeader name={document.ref.name} art={document.art.icon ?? document.ref.icon} compact />
  <p class="type">{document.type} effect{rankIndex !== undefined && document.ranks.length > 1 ? ` · Rank ${formatNumber((rank?.rank ?? 0) + 1)}` : ''}</p>
  {#if document.type === 'Stat' && rank?.actions.length}<ul>{#each rank.actions as entry}{@const words = actionWords(entry)}<li>{words.before}{#if entry.target}<EntityReference ref={entry.target} {registry} plain />{/if}{words.after}</li>{/each}</ul>
  {:else if impact}<p class="outcome">{impact}</p>
  {:else if condition}<p class="outcome">{document.ref.name} must be {condition.state.toLowerCase()} for {condition.owner && 'name' in condition.owner ? condition.owner.name : 'this ability'}.</p>{/if}
  {#if document.description && document.description !== impact}<p>{document.description}</p>{/if}
  {#if duration}<p class="duration">Lasts {duration}.</p>{/if}
</article>

<style>
  .effect-tooltip { display: grid; gap: .45rem; font-size: var(--c-text-body); line-height: 1.45; }
  p { margin: 0; }
  .type, .duration { color: var(--c-text-dim); font-size: var(--c-text-small); }
  .outcome { color: var(--c-text-strong); }
  ul { display: grid; gap: .25rem; padding: 0; margin: 0; list-style: none; }
</style>
