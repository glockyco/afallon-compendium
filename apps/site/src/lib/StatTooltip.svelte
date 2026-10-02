<script lang="ts">
  import type { PublicKindEntry, PublicStat } from '@afallon/contracts/public';
  import EntityHeader, { type HeaderFact } from './EntityHeader.svelte';
  import EntityReference from './EntityReference.svelte';
  import { formatNumber } from './format';

  export let document: PublicStat;
  export let registry: PublicKindEntry[];
  $: facts = [
    { value: document.category ?? 'Stat' },
    { value: document.unit === 'percent' ? 'Percent' : 'Flat' },
  ] satisfies HeaderFact[];
</script>

<article class="stat-tooltip">
  <EntityHeader name={document.ref.name} art={document.art.icon ?? document.ref.icon} {facts} compact />
  {#if document.description}<p class="description">{document.description}</p>{/if}
  <p class="bounds">Base: {formatNumber(document.base)}{document.unit === 'percent' ? '%' : ''}{#if document.min !== undefined} · Min: {formatNumber(document.min)}{/if}{#if document.max !== undefined} · Max: {formatNumber(document.max)}{/if}</p>
  {#if document.onHit.length}<div class="on-hit"><strong>On-Hit Effects</strong><ul>{#each document.onHit as row}<li><EntityReference ref={row.effect} {registry} /> <span>{formatNumber(row.chance)}% Effect Chance</span></li>{/each}</ul>{#if document.procCooldown > 0}<p>Configured Trigger Cooldown: {formatNumber(document.procCooldown)} Seconds</p>{/if}</div>{/if}
  {#if document.recovery.length}<div class="recovery"><strong>Recorded Recovery</strong><ul>{#each document.recovery as row}<li>{row.when === 'in-combat' ? 'In Combat' : 'Outside Combat'}: {formatNumber(row.amount)} Every {formatNumber(row.interval)} Seconds</li>{/each}</ul></div>{/if}
</article>

<style>
  .stat-tooltip { display: grid; gap: .45rem; font-size: var(--c-text-body); }
  p, ul { margin: 0; }
  .description { white-space: pre-line; }
  .bounds, .on-hit span, .on-hit p { color: var(--c-text-dim); }
  .on-hit, .recovery { display: grid; gap: .25rem; padding-top: .45rem; border-top: 1px solid var(--c-line-soft); }
  strong { color: var(--c-text-strong); }
  ul { display: grid; gap: .25rem; padding: 0; list-style: none; }
  .on-hit li { display: flex; justify-content: space-between; flex-wrap: wrap; gap: .25rem .7rem; }
</style>
