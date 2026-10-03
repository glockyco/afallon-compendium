<script lang="ts">
  import type { PublicKindEntry } from '@afallon/contracts/public';
  import { formatNumber, readerNoun } from './format';

  export let kind: PublicKindEntry;
  export let query = '';
  export let count: number;
  export let total: number;
  export let onQuery: (query: string) => void;
  export let barHeight = 0;
  export let reserveReveal = false;
</script>

<div class="toolbar">
  <input type="search" aria-label={`Filter ${readerNoun(kind.plural)} by name`} placeholder={`Filter ${readerNoun(kind.plural)} by name`}
    value={query} on:input={(event) => onQuery(event.currentTarget.value)} />
  <slot name="filter" />
</div>
<div class="result-bar" class:visibility-list={reserveReveal} bind:offsetHeight={barHeight}>
  <p aria-live="polite"><strong>{formatNumber(count)}</strong>{#if count !== total}{' of '}{formatNumber(total)}{/if} {count === 1 ? readerNoun(kind.label) : readerNoun(kind.plural)}</p>
  <slot name="count" />
</div>

<style>
  .toolbar { display: flex; gap: .6rem; margin-bottom: .75rem; }
  input { flex: 1 1 auto; min-width: 0; min-height: 2.35rem; padding: .4rem .6rem; border: 1px solid var(--c-line-strong); border-radius: var(--c-radius-sm); background: var(--c-surface-sunken); color: var(--c-text); }
  input:focus-visible { outline: 2px solid var(--c-accent); outline-offset: 2px; }
  .result-bar { position: sticky; top: 0; z-index: 3; display: flex; flex-wrap: wrap; align-items: center; gap: .45rem .6rem; margin-bottom: .6rem; padding: .4rem 0; background: var(--c-surface-0); }
  .result-bar.visibility-list { min-height: 2.75rem; }
  .result-bar p { margin: 0 .25rem 0 0; color: var(--c-text-dim); font-size: var(--c-text-small); }
  .result-bar strong { color: var(--c-text); font-variant-numeric: tabular-nums; }
  @media (max-width: 640px) { .result-bar.visibility-list { min-height: 5rem; } }
</style>
