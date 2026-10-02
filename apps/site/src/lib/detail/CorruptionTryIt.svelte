<script lang="ts">
  import type { CorruptionGuide, PublicItem, PublicKindEntry } from '@afallon/contracts/public';
  import EntityLink from '../EntityLink.svelte';
  import ItemTooltip from '../ItemTooltip.svelte';
  import { clientMapLoader } from '../client-publication';
  import { formatNumber, rangeText, signedAmount } from '../format';
  import { corruptionDisplay, tooltipStat } from './corruption';
  import LevelSlider from './LevelSlider.svelte';

  export let guide: CorruptionGuide;
  export let inlineItem: PublicItem | undefined;
  export let registry: PublicKindEntry[];

  let selectedKey = guide.tryIt.defaultItem.key;
  let item: PublicItem | undefined = inlineItem;
  let loading = false;
  let error = '';
  let from = 0;
  let to = guide.maxLevel ?? 30;
  let request = 0;

  $: first = item && corruptionDisplay(item.facts, from);
  $: second = item && corruptionDisplay(item.facts, to);
  $: changes = item && first && second ? compare(first, second, from, to) : [];

  type Display = NonNullable<ReturnType<typeof corruptionDisplay>>;
  type Change = { name: string; before: string; after: string; difference: string; negative: boolean };
  const displayedStat = (amount: number, isPercent: boolean, level: number): string =>
    level === 0 ? signedAmount(amount, isPercent) : `${amount < 0 ? '-' : '+'}${tooltipStat(Math.abs(amount))}${isPercent ? '%' : ''}`;
  const displayedNumber = (text: string): number => Number(text.replaceAll(',', '').replace('%', ''));
  const delta = (difference: number, isPercent = false): string =>
    `${difference < 0 ? '-' : '+'}${tooltipStat(Math.abs(difference))}${isPercent ? '%' : ''}`;

  function compare(before: Display, after: Display, fromLevel: number, toLevel: number): Change[] {
    const rows: Change[] = [];
    const numeric = (name: string, left: number | undefined, right: number | undefined, render = formatNumber) => {
      if (left === undefined || right === undefined || left === right) return;
      const beforeText = render(left), afterText = render(right);
      if (beforeText === afterText) return;
      const difference = Number((displayedNumber(afterText) - displayedNumber(beforeText)).toFixed(2));
      rows.push({ name, before: beforeText, after: afterText, difference: delta(difference), negative: difference < 0 });
    };
    numeric('Item power', before.itemPower, after.itemPower);
    if (before.minDamage !== undefined && before.maxDamage !== undefined && after.minDamage !== undefined && after.maxDamage !== undefined && (before.minDamage !== after.minDamage || before.maxDamage !== after.maxDamage)) {
      const low = after.minDamage - before.minDamage, high = after.maxDamage - before.maxDamage;
      rows.push({ name: 'Damage', before: rangeText(before.minDamage, before.maxDamage)!, after: rangeText(after.minDamage, after.maxDamage)!,
        difference: `${low < 0 ? '-' : '+'}${rangeText(Math.abs(low), Math.abs(high))}`, negative: low < 0 });
    }
    numeric('Damage per second', before.damagePerSecond === undefined ? undefined : Number(before.damagePerSecond.toFixed(1)), after.damagePerSecond === undefined ? undefined : Number(after.damagePerSecond.toFixed(1)), (value) => value.toFixed(1));
    before.stats.forEach((stat, index) => {
      const next = after.stats[index];
      if (!next || next.amount === stat.amount) return;
      const beforeText = displayedStat(stat.amount, stat.isPercent, fromLevel);
      const afterText = displayedStat(next.amount, next.isPercent, toLevel);
      if (beforeText === afterText) return;
      const difference = Number((displayedNumber(afterText) - displayedNumber(beforeText)).toFixed(2));
      rows.push({ name: stat.stat.key === null ? stat.stat.label : stat.stat.name, before: beforeText, after: afterText,
        difference: delta(difference, stat.isPercent), negative: difference < 0 });
    });
    return rows;
  }

  async function choose(key: string): Promise<void> {
    selectedKey = key;
    const ref = guide.tryIt.groups.flatMap((group) => group.items).find((entry) => entry.item.key === key)?.item;
    if (!ref) return;
    const current = ++request;
    if (inlineItem?.ref.key === key) { item = inlineItem; loading = false; error = ''; return; }
    loading = true;
    error = '';
    try {
      const page = await clientMapLoader()?.loadPageForRef(ref);
      if (current !== request) return;
      if (!page || page.kind !== 'items') throw new Error('The item could not be loaded.');
      item = page.document;
    } catch (cause) {
      if (current === request) { error = cause instanceof Error ? cause.message : String(cause); selectedKey = item?.ref.key ?? guide.tryIt.defaultItem.key; }
    } finally {
      if (current === request) loading = false;
    }
  }
  function navigate(event: KeyboardEvent): void {
    if (!['ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) return;
    const select = event.currentTarget as HTMLSelectElement;
    const last = select.options.length - 1;
    const index = event.key === 'Home' ? 0 : event.key === 'End' ? last
      : Math.max(0, Math.min(last, select.selectedIndex + (event.key === 'ArrowDown' ? 1 : -1)));
    event.preventDefault();
    const option = select.options.item(index);
    if (option) void choose(option.value);
  }

</script>

<div class="try-it">
<div class="picker">
  <label for="corruption-try-item">Item</label>
  <span class="picker-status" role="status" aria-live="polite">{loading ? 'Loading item…' : error}</span>
  <select id="corruption-try-item" value={selectedKey} on:change={(event) => choose(event.currentTarget.value)} on:keydown={navigate}>
    {#each guide.tryIt.groups as group}
      <optgroup label={group.place.name}>
        {#each group.items as entry}<option value={entry.item.key}>{entry.item.name}</option>{/each}
      </optgroup>
    {/each}
  </select>
</div>
<div class="comparison" aria-busy={loading}>
  <div class="from-control"><LevelSlider id="corruption-from" label="From" min={0} max={guide.maxLevel ?? 30} bind:level={from} readout={(level) => level === 0 ? 'None' : `+${level}`} valueText={(level) => level === 0 ? 'None' : `+${level}`} /></div>
  <div class="to-control"><LevelSlider id="corruption-to" label="To" min={0} max={guide.maxLevel ?? 30} bind:level={to} readout={(level) => level === 0 ? 'None' : `+${level}`} valueText={(level) => level === 0 ? 'None' : `+${level}`} /></div>
  <div class="summary" aria-live="polite" aria-atomic="true">
    <h3>What changes</h3>
    <table class="c-table c-table--calculator c-table--comparison" aria-label="Corrupted item stat changes">
      <caption>From {from === 0 ? 'None' : `+${from}`} to {to === 0 ? 'None' : `+${to}`}</caption>
      <thead><tr><th scope="col">Stat</th><th scope="col" class="c-num from-value">From</th><th scope="col" class="c-num to-value">To</th><th scope="col" class="c-num change-value">Change</th></tr></thead>
      <tbody>{#each changes as change}<tr><th scope="row">{change.name}</th><td class="c-num from-value">{change.before}</td><td class="c-num to-value">{change.after}</td><td class:negative={change.negative} class:positive={!change.negative} class="c-num change-value">{change.difference}</td></tr>{/each}</tbody>
    </table>
    {#if item}
      {#if from === to}<p>Both levels are the same.</p>{:else if !changes.length}<p>These levels show the same item values.</p>{/if}
      {#if item.facts.dungeonRewards?.length}<dl class="drop-list"><div><dt>Can drop corrupted from</dt><dd>{#each item.facts.dungeonRewards as source}<span class="source-line"><EntityLink ref={source.place} {registry} /> · {#each source.bosses as boss, bossIndex}{bossIndex ? ', ' : ''}<EntityLink ref={boss} {registry} />{/each}</span>{/each}</dd></div></dl>{/if}
    {:else if error}<p role="alert">{error}</p>{/if}
  </div>
  <div class="from-tip tooltip-frame c-game-frame">
    {#if item}<ItemTooltip document={item} {registry} corruptionLevel={from} />{:else}<p role="status">Loading item…</p>{/if}
  </div>
  <div class="to-tip tooltip-frame c-game-frame">
    {#if item}<ItemTooltip document={item} {registry} corruptionLevel={to} />{:else}<p role="status">Loading item…</p>{/if}
  </div>
</div>
</div>

<style>
  .picker { position: relative; display: grid; gap: .35rem; max-width: 30rem; margin-bottom: 1.2rem; }
  .picker label { font-weight: 600; color: var(--c-text-strong); }
  .picker-status { position: absolute; top: 0; right: 0; color: var(--c-text-dim); font-size: .875rem; }
  select { width: 100%; min-height: 2.75rem; padding: .4rem .6rem; border: 1px solid var(--c-frame); border-radius: var(--c-radius-sm); background: var(--c-surface-sunken); color: var(--c-text); font: inherit; }
  .try-it { container: try-it / inline-size; }
  .comparison { display: grid; gap: 1rem; min-width: 0; }
  .from-control, .to-control, .from-tip, .to-tip, .summary { min-width: 0; }
  .tooltip-frame { box-sizing: border-box; }
  .summary { box-sizing: border-box; padding: .8rem; border: 1px solid var(--c-line); border-radius: var(--c-radius-sm); }
  h3 { margin: 0 0 .45rem; color: var(--c-text-strong); font: 600 var(--c-text-lead)/1.3 var(--c-serif); }
  .summary p { margin: .45rem 0 0; }
  .drop-list { margin: .5rem 0 0; padding-top: .3rem; border-top: 1px solid var(--c-line-soft); }
  .drop-list dd { margin: 0; }
  .source-line { display: block; margin-top: .3rem; color: var(--c-text); }
  @container try-it (min-width: 45rem) {
    .comparison { grid-template-columns: repeat(2, minmax(0, 1fr)); grid-template-areas: "from to" "summary summary" "fromTip toTip"; align-items: stretch; }
    .from-control { grid-area: from; }
    .to-control { grid-area: to; }
    .summary { grid-area: summary; }
    .from-tip { grid-area: fromTip; }
    .to-tip { grid-area: toTip; }
    .tooltip-frame { height: 100%; }
  }
  /* Published gear needs 526px for the longest unwrapped label and 65px for the widest
     change. A 61rem section leaves at least 207px for wrapping labels in each third. */
  @container try-it (min-width: 61rem) {
    .comparison { grid-template-columns: repeat(3, minmax(0, 1fr)); grid-template-areas: "from to ." "fromTip toTip summary"; grid-template-rows: auto 1fr; align-items: stretch; }
  }
</style>
