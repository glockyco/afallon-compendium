<script lang="ts">
  import type { LevelCurve as LevelCurveData } from '@afallon/contracts/public';
  import { cumulativeExperience } from '../level-curve';
  import LevelSlider from '../LevelSlider.svelte';

  export let curve: LevelCurveData;
  export let level = 1;
  /** The subject of the curve in labels: "Character" or a skill name. */
  export let subject = 'Character';
  /** In the detail-page aside, fit the chart without making the page scroll sideways. */
  export let compact = false;
  // A page shows at most one curve, so the subject names its ids the same way on the server and in the browser.
  $: uid = `curve-${subject.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

  $: width = compact ? 320 : 920;
  $: height = compact ? 180 : 320;
  $: left = compact ? 55 : 94;
  $: right = compact ? 12 : 28;
  $: top = compact ? 12 : 24;
  $: bottom = compact ? 30 : 52;
  $: plotWidth = width - left - right;
  $: plotHeight = height - top - bottom;
  const format = (value: number) => value.toLocaleString('en-US');

  $: cumulative = cumulativeExperience(curve);
  $: total = cumulative[curve.cap] ?? 0;
  $: level = Math.min(curve.cap, Math.max(1, level || 1));
  $: next = curve.rows[level - 1]?.toNext ?? 0;
  $: earned = cumulative[level] ?? 0;
  $: remaining = total - earned;
  $: minimum = Math.min(...curve.rows.map((row) => row.toNext));
  $: maximum = Math.max(...curve.rows.map((row) => row.toNext));
  $: logMin = Math.floor(Math.log10(minimum));
  $: logMax = Math.ceil(Math.log10(maximum));
  $: ticks = Array.from({ length: logMax - logMin + 1 }, (_, index) => 10 ** (logMin + index));
  $: xTicks = [...new Set([0, 1, 2, 3, 4].map((step) => curve.rows[Math.round(step * (curve.rows.length - 1) / 4)]?.level).filter((value): value is number => value !== undefined))];
  $: points = curve.rows.map((row) => `${x(row.level)},${y(row.toNext)}`).join(' ');

  function x(value: number): number {
    return left + (value - curve.rows[0]!.level) / Math.max(1, curve.rows[curve.rows.length - 1]!.level - curve.rows[0]!.level) * plotWidth;
  }
  function y(value: number): number {
    return top + (logMax - Math.log10(value)) / Math.max(1, logMax - logMin) * plotHeight;
  }
</script>

<p class="intro">Each point shows the experience from that level to the next. The scale is logarithmic, so each grid line is ten times the one below it.</p>
<!-- The scrollable chart needs focus so keyboard readers can pan it without changing the selected level. -->
<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<div class="chart-scroll" class:compact role="region" aria-label={compact ? 'Level curve chart' : 'Level curve chart; scroll horizontally to see all levels'} tabindex="0">
  <svg viewBox={`0 0 ${width} ${height}`} role="img" preserveAspectRatio="xMidYMid meet" aria-labelledby={`${uid}-title ${uid}-description`}>
    <title id={`${uid}-title`}>Experience to next level by {subject.toLowerCase() === "character" ? "character" : subject} level</title>
    <desc id={`${uid}-description`}>A logarithmic chart of experience to the next level for each published level below the cap. Select a level below for exact values.</desc>
    {#each ticks as tick}
      <line class="grid" x1={left} x2={width - right} y1={y(tick)} y2={y(tick)} />
      <text class="tick" x={left - 10} y={y(tick) + 4} text-anchor="end">{format(tick)}</text>
    {/each}
    <line class="axis" x1={left} x2={left} y1={top} y2={top + plotHeight} />
    <line class="axis" x1={left} x2={width - right} y1={top + plotHeight} y2={top + plotHeight} />
    <polyline class="curve" points={points} />
    <!-- The selected level of the slider; the cap has no next level, so it has no point on the curve. -->
    {#if next > 0}
      <line class="marker" x1={x(level)} x2={x(level)} y1={top} y2={top + plotHeight} />
      <circle class="marker-point" cx={x(level)} cy={y(next)} r="5" />
    {/if}
    {#each xTicks as tick}
      <line class="axis" x1={x(tick)} x2={x(tick)} y1={top + plotHeight} y2={top + plotHeight + 5} />
      <text class="tick" x={x(tick)} y={top + plotHeight + 22} text-anchor="middle">{format(tick)}</text>
    {/each}
    {#if !compact}<text class="axis-label" x={left + plotWidth / 2} y={height - 4} text-anchor="middle">Level</text>{/if}
    {#if !compact}<text class="axis-label" transform={`translate(18 ${top + plotHeight / 2}) rotate(-90)`} text-anchor="middle">Experience to next level (logarithmic)</text>{/if}
  </svg>
</div>
<div class="selector">
  <LevelSlider id={`${uid}-level`} label={`${subject} level`} min={1} max={curve.cap} bind:level readout={format} />
  <dl class="totals">
    <div><dt>Experience to the next level</dt><dd>{format(next)}</dd></div>
    <div><dt>Total experience to reach level {format(level)}</dt><dd>{format(earned)}</dd></div>
    <div><dt>Experience from level {format(level)} to {format(curve.cap)}</dt><dd>{format(remaining)}</dd></div>
  </dl>
</div>

<style>
  .intro { color: var(--c-text-dim); line-height: 1.5; }
  .chart-scroll { max-width: 100%; overflow-x: auto; overscroll-behavior-inline: contain; }
  svg { display: block; width: 100%; min-width: 36rem; height: auto; background: var(--c-surface-sunken); border-radius: var(--c-radius-sm); }
  .chart-scroll.compact svg { min-width: 0; }
  .grid { stroke: var(--c-line); stroke-dasharray: 3 4; }
  .axis { stroke: var(--c-text-dim); }
  .curve { fill: none; stroke: var(--c-accent); stroke-width: 2.5; stroke-linejoin: round; }
  .marker { stroke: var(--c-text-strong); stroke-width: 1.5; stroke-dasharray: 4 3; }
  .marker-point { fill: var(--c-text-strong); stroke: var(--c-surface-sunken); stroke-width: 2; }
  .tick, .axis-label { fill: var(--c-text); font-family: Inter, ui-sans-serif, system-ui, sans-serif; font-size: .875rem; }
  .selector { display: grid; gap: .6rem; }
  .totals { display: grid; gap: .5rem; }
  .totals div { display: flex; flex-wrap: wrap; justify-content: space-between; gap: .2rem 1rem; border-bottom: 1px solid var(--c-line-soft); padding-bottom: .5rem; }
  .totals dt { color: var(--c-text-dim); }
  .totals dd { color: var(--c-text-strong); font-variant-numeric: tabular-nums; }
</style>
