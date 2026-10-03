<script lang="ts">
  import { onMount } from 'svelte';
  import type { LevelCurve as LevelCurveData } from '@afallon/contracts/public';
  import { cumulativeExperience } from '../level-curve';
  import LevelControl from '../LevelControl.svelte';

  export let curve: LevelCurveData;
  export let level = 1;
  /** The subject of the curve in labels: "Character" or a skill name. */
  export let subject = 'Character';
  /** In the detail-page aside, fit the chart without making the page scroll sideways. */
  export let compact = false;
  /** Character Progression owns one remembered control outside its two chart views. */
  export let chartOnly = false;
  // Full and compact chart views need distinct SVG label ids on the progression page.
  $: uid = `curve-${subject.toLowerCase().replace(/[^a-z0-9]+/g, '-')}${compact ? '-compact' : ''}`;

  let chart: SVGSVGElement;
  let chartContainer: HTMLDivElement;
  let containerWidth = 920;
  let renderedWidth = compact ? 320 : 920;
  $: narrow = !compact && containerWidth < 576;
  $: width = compact ? 320 : narrow ? Math.max(300, containerWidth) : 920;
  $: height = compact ? 180 : narrow ? 260 : 320;
  $: left = compact ? 55 : narrow ? 55 : 94;
  $: right = compact ? 12 : narrow ? 12 : 28;
  $: top = compact ? 12 : narrow ? 18 : 24;
  $: bottom = compact ? 30 : narrow ? 38 : 52;
  $: tickSize = 13 * width / renderedWidth;
  onMount(() => {
    const observer = new ResizeObserver(() => {
      const available = chartContainer.getBoundingClientRect().width;
      const displayed = chart.getBoundingClientRect().width;
      if (available > 0) containerWidth = available;
      if (displayed > 0) renderedWidth = displayed;
    });
    observer.observe(chartContainer);
    observer.observe(chart);
    return () => observer.disconnect();
  });
  $: plotWidth = width - left - right;
  $: plotHeight = height - top - bottom;
  const format = (value: number) => value.toLocaleString('en-US');
  const shortTick = (value: number) => value >= 1_000_000 ? `${format(value / 1_000_000)}M`
    : value >= 1_000 ? `${format(value / 1_000)}K` : format(value);

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
  $: points = curve.rows.map((row) => `${x(row.level, left, plotWidth)},${y(row.toNext, top, plotHeight, logMin, logMax)}`).join(' ');
  $: yTicks = ticks.map((value) => ({ value, position: y(value, top, plotHeight, logMin, logMax) }));
  $: levelTicks = xTicks.map((value) => ({ value, position: x(value, left, plotWidth) }));
  $: markerX = x(level, left, plotWidth);
  $: markerY = next > 0 ? y(next, top, plotHeight, logMin, logMax) : 0;

  function x(value: number, start: number, span: number): number {
    return start + (value - curve.rows[0]!.level) / Math.max(1, curve.rows[curve.rows.length - 1]!.level - curve.rows[0]!.level) * span;
  }
  function y(value: number, start: number, span: number, minimum: number, maximum: number): number {
    return start + (maximum - Math.log10(value)) / Math.max(1, maximum - minimum) * span;
  }
</script>

{#if !compact && !chartOnly}<p class="intro">Each point shows the experience from that level to the next. The scale is logarithmic, so each grid line is ten times the one below it.</p>{/if}
<div bind:this={chartContainer} class="chart-scroll" class:compact class:chartOnly={chartOnly} role="region" aria-label="Level curve chart">
  <svg bind:this={chart} viewBox={`0 0 ${width} ${height}`} role="img" preserveAspectRatio="xMidYMid meet" aria-labelledby={`${uid}-title ${uid}-description`}>
    <title id={`${uid}-title`}>Experience to next level by {subject.toLowerCase() === "character" ? "character" : subject} level</title>
    <desc id={`${uid}-description`}>A logarithmic chart of experience to the next level for each known level below the cap. The marked point follows the selected level.</desc>
    {#each yTicks as tick}
      <line class="grid" x1={left} x2={width - right} y1={tick.position} y2={tick.position} />
      <text class="tick" style:font-size={`${tickSize}px`} x={left - 10} y={tick.position + 4} text-anchor="end">{shortTick(tick.value)}</text>
    {/each}
    <line class="axis" x1={left} x2={left} y1={top} y2={top + plotHeight} />
    <line class="axis" x1={left} x2={width - right} y1={top + plotHeight} y2={top + plotHeight} />
    <polyline class="curve" points={points} />
    <!-- The selected level of the slider; the cap has no next level, so it has no point on the curve. -->
    {#if next > 0}
      <line class="marker" x1={markerX} x2={markerX} y1={top} y2={top + plotHeight} />
      <circle class="marker-point" cx={markerX} cy={markerY} r="5" />
    {/if}
    {#each levelTicks as tick}
      <line class="axis" x1={tick.position} x2={tick.position} y1={top + plotHeight} y2={top + plotHeight + 5} />
      <text class="tick" style:font-size={`${tickSize}px`} x={tick.position} y={top + plotHeight + 22} text-anchor="middle">{format(tick.value)}</text>
    {/each}
  </svg>
</div>
{#if !chartOnly}
  <div class="selector">
    <LevelControl id={`${uid}-level`} label={`${subject} Level`} min={1} max={curve.cap} bind:level />
    <dl class="totals">
      <div><dt>Experience to the next level</dt><dd>{format(next)}</dd></div>
      <div><dt>Total experience to reach level {format(level)}</dt><dd>{format(earned)}</dd></div>
      <div><dt>Experience from level {format(level)} to {format(curve.cap)}</dt><dd>{format(remaining)}</dd></div>
    </dl>
  </div>
{/if}

<style>
  .intro { color: var(--c-text-dim); line-height: 1.5; }
  .chart-scroll { max-width: 100%; overflow-x: auto; overscroll-behavior-inline: contain; }
  svg { display: block; width: 100%; min-width: 36rem; height: auto; background: var(--c-surface-sunken); border-radius: var(--c-radius-sm); }
  .chart-scroll.compact svg, .chart-scroll.chartOnly svg { min-width: 0; }
  @media (max-width: 640px) { .chart-scroll.chartOnly svg { height: 260px; } }
  .grid { stroke: var(--c-line); stroke-dasharray: 3 4; }
  .axis { stroke: var(--c-text-dim); }
  .curve { fill: none; stroke: var(--c-accent); stroke-width: 2.5; stroke-linejoin: round; }
  .marker { stroke: var(--c-text-strong); stroke-width: 1.5; stroke-dasharray: 4 3; }
  .marker-point { fill: var(--c-text-strong); stroke: var(--c-surface-sunken); stroke-width: 2; }
  .tick { fill: var(--c-text-dim); font-family: Inter, ui-sans-serif, system-ui, sans-serif; }
  .selector { display: grid; gap: .6rem; }
  .totals { display: grid; gap: .5rem; }
  .totals div { display: flex; flex-wrap: wrap; justify-content: space-between; gap: .2rem 1rem; border-bottom: 1px solid var(--c-line-soft); padding-bottom: .5rem; }
  .totals dt { color: var(--c-text-dim); }
  .totals dd { color: var(--c-text-strong); font-variant-numeric: tabular-nums; }
</style>
