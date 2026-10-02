<script lang="ts">
  import type { PublicKindEntry, PublicStat } from '@afallon/contracts/public';
  import EntityHeader, { type HeaderFact } from './EntityHeader.svelte';
  import EntityReference from './EntityReference.svelte';
  import { formatNumber, listText } from './format';

  // A stat names what it is and what it does, then the facts that tell it apart: a starting value or a cap that is not
  // zero, how it recovers, what it can trigger on a hit, and where it comes from. A zero base and a zero floor say
  // nothing, so they are left out.
  export let document: PublicStat;
  export let registry: PublicKindEntry[];

  $: unit = document.unit === 'percent' ? '%' : '';
  $: facts = [
    { value: document.category ?? 'Stat' },
    ...(document.unit === 'percent' ? [{ value: 'Percentage' }] : []),
  ] satisfies HeaderFact[];
  $: limits = [
    ...(document.base !== 0 ? [`starts at ${formatNumber(document.base)}${unit}`] : []),
    ...(document.min !== undefined && document.min !== 0 ? [`never below ${formatNumber(document.min)}${unit}`] : []),
    ...(document.max !== undefined ? [`at most ${formatNumber(document.max)}${unit}`] : []),
  ];
  $: sources = [
    [document.sources.fixedItems.length + document.sources.randomItems.length, 'item', 'items'],
    [document.sources.gems.length, 'gem', 'gems'],
    [document.sources.enchantments.length, 'enchantment', 'enchantments'],
    [document.sources.sets.length, 'gear set', 'gear sets'],
    [document.sources.talents.length, 'talent', 'talents'],
    [document.sources.effects.length, 'effect', 'effects'],
  ].flatMap(([count, one, many]) => Number(count) > 0 ? [`${formatNumber(Number(count))} ${count === 1 ? one : many}`] : []);
  const when = (value: 'in-combat' | 'outside-combat') => value === 'in-combat' ? 'in combat' : 'out of combat';
</script>

<article class="stat-tooltip">
  <EntityHeader name={document.ref.name} art={document.art.icon ?? document.ref.icon} {facts} description={document.description} compact />
  {#if document.note}<p class="line">{document.note}</p>{/if}
  {#if limits.length}<p class="line">{limits.join(', ').replace(/^./, (letter) => letter.toUpperCase())}.</p>{/if}
  {#if document.recovery.length}<p class="line">Recovers {listText(document.recovery.map((row) => `${formatNumber(row.amount)} every ${formatNumber(row.interval)} ${row.interval === 1 ? 'second' : 'seconds'} ${when(row.when)}`))}.</p>{/if}
  {#if document.onHit.length}
    <p class="line">On a hit: {#each document.onHit as row, index}{index ? ', ' : ''}<EntityReference ref={row.effect} {registry} plain /> ({formatNumber(row.chance)}%){/each}{#if document.procCooldown > 0}, then {formatNumber(document.procCooldown)} {document.procCooldown === 1 ? 'second' : 'seconds'} before it can trigger again{/if}.</p>
  {/if}
  {#if sources.length}<p class="line">From {listText(sources)}.</p>{/if}
</article>

<style>
  .stat-tooltip { display: grid; gap: .45rem; }
  .line { margin: 0; color: var(--c-text-dim); font-size: .875rem; line-height: 1.5; }
</style>
