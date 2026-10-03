<script lang="ts">
  import type { PublicItem, PublicKindEntry } from '@afallon/contracts/public';
  import ItemTooltip from '../ItemTooltip.svelte';
  import { compareItems, itemDisplay } from './item-comparison';

  export let item: PublicItem | undefined;
  export let registry: PublicKindEntry[];
  export let beforeLabel: string;
  export let afterLabel: string;
  export let beforeLevel = 0;
  export let afterLevel = 0;
  export let beforeHeroic = false;
  export let afterHeroic = false;
  export let loading = false;
  export let error = '';
  export let tableLabel: string;

  $: changes = item ? compareItems(itemDisplay(item.facts, beforeLevel, beforeHeroic), itemDisplay(item.facts, afterLevel, afterHeroic), beforeLevel, afterLevel) : [];
</script>

<div class="comparison-wrap">
<div class="comparison" aria-busy={loading}>
  <div class="from-control"><slot name="before-control" /></div>
  <div class="to-control"><slot name="after-control" /></div>
  <div class="summary" aria-live="polite" aria-atomic="true">
    <h3>What Changes</h3>
    <table class="c-table c-table--calculator c-table--comparison" aria-label={tableLabel}>
      <caption>{beforeLabel} to {afterLabel}</caption>
      <thead><tr><th scope="col">Stat</th><th scope="col" class="c-num from-value">{beforeLabel}</th><th scope="col" class="c-num to-value">{afterLabel}</th><th scope="col" class="c-num change-value">Change</th></tr></thead>
      <tbody>{#each changes as change}<tr><th scope="row">{change.name}</th><td class="c-num from-value">{change.before}</td><td class="c-num to-value">{change.after}</td><td class:negative={change.negative} class:positive={!change.negative} class="c-num change-value">{change.difference}</td></tr>{/each}</tbody>
    </table>
    {#if item && !changes.length}<p>These versions show the same item values.</p>{:else if error}<p role="alert">{error}</p>{/if}
    <slot name="summary" />
  </div>
  <div class="from-tip tooltip-frame c-game-frame" class:empty={!item && !error}>{#if item}<ItemTooltip document={item} {registry} corruptionLevel={beforeLevel} heroic={beforeHeroic} />{:else if !error}<p role="status">Loading Item…</p>{/if}</div>
  <div class="to-tip tooltip-frame c-game-frame" class:empty={!item && !error}>{#if item}<ItemTooltip document={item} {registry} corruptionLevel={afterLevel} heroic={afterHeroic} />{:else if !error}<p role="status">Loading Item…</p>{/if}</div>
</div>
</div>

<style>
  .comparison-wrap { container: comparison / inline-size; min-width: 0; }
  .comparison { display: grid; gap: 1rem; min-width: 0; }
  .from-control, .to-control, .from-tip, .to-tip, .summary { min-width: 0; }
  .tooltip-frame { box-sizing: border-box; }
  .tooltip-frame.empty { min-height: 16rem; }
  .summary { box-sizing: border-box; padding: .8rem; border: 1px solid var(--c-line); border-radius: var(--c-radius-sm); }
  h3 { margin: 0 0 .45rem; color: var(--c-text-strong); font: 600 var(--c-text-lead)/1.3 var(--c-serif); }
  .summary p { margin: .45rem 0 0; }
  @container comparison (min-width: 45rem) {
    .comparison { grid-template-columns: repeat(2, minmax(0, 1fr)); grid-template-areas: "from to" "summary summary" "fromTip toTip"; align-items: stretch; }
    .from-control { grid-area: from; }
    .to-control { grid-area: to; }
    .summary { grid-area: summary; }
    .from-tip { grid-area: fromTip; }
    .to-tip { grid-area: toTip; }
    .tooltip-frame { height: 100%; }
  }
  @container comparison (min-width: 61rem) {
    .comparison { grid-template-columns: repeat(3, minmax(0, 1fr)); grid-template-areas: "from to ." "fromTip toTip summary"; grid-template-rows: auto 1fr; }
  }
</style>
