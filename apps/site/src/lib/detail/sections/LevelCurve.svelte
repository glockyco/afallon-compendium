<script lang="ts">
  import type { LevelCurve as LevelCurveData } from '@afallon/contracts/public';
  import { cumulativeExperience } from '../level-curve';

  export let curve: LevelCurveData;

  const width = 920;
  const height = 320;
  const left = 94;
  const right = 28;
  const top = 24;
  const bottom = 52;
  const plotWidth = width - left - right;
  const plotHeight = height - top - bottom;
  const format = (value: number) => value.toLocaleString('en-US');
  let level: number;

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
  function select(value: number): void {
    if (Number.isFinite(value)) level = Math.min(curve.cap, Math.max(1, Math.trunc(value)));
  }
</script>

<p class="intro">Each point shows the experience needed to advance from that level to the next. The vertical axis uses a logarithmic scale.</p>
<!-- The scrollable chart needs focus so keyboard readers can pan it without changing the selected level. -->
<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<div class="chart-scroll" role="region" aria-label="Level curve chart; scroll horizontally to see all levels" tabindex="0">
  <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} role="img" aria-labelledby="level-curve-title level-curve-description">
    <title id="level-curve-title">Experience to next level by character level</title>
    <desc id="level-curve-description">A logarithmic chart of experience to the next level for each published level below the cap. Select a level below for exact values.</desc>
    {#each ticks as tick}
      <line class="grid" x1={left} x2={width - right} y1={y(tick)} y2={y(tick)} />
      <text class="tick" x={left - 10} y={y(tick) + 4} text-anchor="end">{format(tick)}</text>
    {/each}
    <line class="axis" x1={left} x2={left} y1={top} y2={top + plotHeight} />
    <line class="axis" x1={left} x2={width - right} y1={top + plotHeight} y2={top + plotHeight} />
    <polyline class="curve" points={points} />
    {#each xTicks as tick}
      <line class="axis" x1={x(tick)} x2={x(tick)} y1={top + plotHeight} y2={top + plotHeight + 5} />
      <text class="tick" x={x(tick)} y={top + plotHeight + 22} text-anchor="middle">{format(tick)}</text>
    {/each}
    <text class="axis-label" x={left + plotWidth / 2} y={height - 4} text-anchor="middle">Level</text>
    <text class="axis-label" transform={`translate(18 ${top + plotHeight / 2}) rotate(-90)`} text-anchor="middle">Experience to next level (logarithmic)</text>
  </svg>
</div>
<div class="selector">
  <label for="curve-level">Character level: {format(level)}</label>
  <div class="controls">
    <input id="curve-level" type="range" min="1" max={curve.cap} step="1" value={level} on:input={(event) => select(event.currentTarget.valueAsNumber)} />
    <input class="level-number" type="number" min="1" max={curve.cap} step="1" value={level} aria-label="Character level number" on:change={(event) => { select(event.currentTarget.valueAsNumber); event.currentTarget.value = String(level); }} />
  </div>
  <p class="note">These are a fresh character's totals from the level template, not saved progress.</p>
  <dl class="totals">
    <div><dt>Experience to next level</dt><dd>{format(next)}</dd></div>
    <div><dt>Experience earned before level {format(level)}</dt><dd>{format(earned)}</dd></div>
    <div><dt>Experience left to reach level {format(curve.cap)}</dt><dd>{format(remaining)}</dd></div>
  </dl>
</div>

<style>
  .intro, .note { margin: 0 0 .75rem; color: var(--c-text-dim); line-height: 1.5; }
  .chart-scroll { max-width: 100%; overflow-x: auto; overscroll-behavior-inline: contain; }
  svg { display: block; max-width: none; background: var(--c-surface-sunken); border-radius: var(--c-radius-sm); }
  .grid { stroke: var(--c-line); stroke-dasharray: 3 4; }
  .axis { stroke: var(--c-text-dim); }
  .curve { fill: none; stroke: var(--c-accent); stroke-width: 2.5; stroke-linejoin: round; }
  .tick, .axis-label { fill: var(--c-text); font-family: Inter, ui-sans-serif, system-ui, sans-serif; font-size: 12px; }
  .axis-label { font-size: 13px; }
  .selector { display: grid; gap: .6rem; margin-top: 1rem; }
  .selector label { color: var(--c-text-strong); font-weight: 600; }
  .controls { display: flex; align-items: center; gap: .75rem; }
  .controls input[type='range'] { flex: 1; min-width: 0; accent-color: var(--c-accent); }
  .level-number { box-sizing: border-box; width: 5rem; padding: .35rem; border: 1px solid var(--c-frame); border-radius: var(--c-radius-sm); background: var(--c-surface-sunken); color: var(--c-text); font: inherit; }
  .note { margin: 0; }
  .totals { display: grid; gap: .5rem; margin: .2rem 0 0; }
  .totals div { display: flex; flex-wrap: wrap; justify-content: space-between; gap: .2rem 1rem; border-bottom: 1px solid var(--c-line-soft); padding-bottom: .5rem; }
  .totals dt { color: var(--c-text-dim); }
  .totals dd { margin: 0; color: var(--c-text-strong); font-variant-numeric: tabular-nums; }
</style>
