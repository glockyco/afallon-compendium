<script lang="ts">
  import type { PublicKindEntry } from '@afallon/contracts/public';
  import EntityLink from './EntityLink.svelte';
  import LevelControl from './detail/LevelControl.svelte';
  import { formatNumber } from './format';
  import { placeListName } from './place-list-name';
  import { CHARACTER_LEVEL, readerLevels, setReaderLevel } from './reader-levels';
  import { levelTicks, progressionAxis, progressionGroups, rangePosition, type ProgressionEntry } from './progression-overview';

  export let entries: ProgressionEntry[];
  export let registry: PublicKindEntry[];
  /** Entity-specific plural headings leave other progression modes free to name their own categories. */
  export let groupTitles: Readonly<Record<string, string>> = {};
  /** The same renderer can show a skill's gathering progression with its skill-level key. */
  export let levelId = CHARACTER_LEVEL;
  export let levelLabel = 'Your Level';
  export let description = 'Highlighted places include your level. Ranges can overlap.';

  $: selectedLevel = $readerLevels[levelId];
  $: axisEnd = progressionAxis(entries, selectedLevel);
  $: groups = progressionGroups(entries);
  $: ticks = levelTicks(axisEnd);
  $: marker = selectedLevel === undefined ? null : levelPoint(selectedLevel, axisEnd);

  function levelPoint(level: number, end: number): number {
    return (level - 0.5) / end * 100;
  }

  let dragging: number | null = null;

  function dragLevel(event: PointerEvent): void {
    const track = event.currentTarget as HTMLElement;
    const rect = track.getBoundingClientRect();
    const fraction = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
    setReaderLevel(levelId, Math.max(1, Math.min(axisEnd, Math.ceil(fraction * axisEnd))));
  }

  function startDrag(event: PointerEvent): void {
    if (event.button !== 0) return;
    dragging = event.pointerId;
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    dragLevel(event);
  }

  function moveDrag(event: PointerEvent): void {
    if (dragging === event.pointerId) dragLevel(event);
  }

  function stopDrag(event: PointerEvent): void {
    if (dragging === event.pointerId) dragging = null;
  }

  function moveMarker(event: KeyboardEvent): void {
    const current = selectedLevel ?? 1;
    const next = event.key === 'ArrowUp' || event.key === 'ArrowRight' ? current + 1
      : event.key === 'ArrowDown' || event.key === 'ArrowLeft' ? current - 1
      : event.key === 'PageUp' ? current + 10 : event.key === 'PageDown' ? current - 10
      : event.key === 'Home' ? 1 : event.key === 'End' ? axisEnd : undefined;
    if (next !== undefined) {
      event.preventDefault();
      setReaderLevel(levelId, Math.max(1, Math.min(axisEnd, next)));
    }
  }
</script>

<div class="progression">
  <div class="intro">
    <p>{description}</p>
    <LevelControl id={`progression-${levelId.replace(/[^a-zA-Z0-9-]/g, '-')}`} label={levelLabel} min={1} max={axisEnd} level={selectedLevel} readerId={levelId} optional slider={false} />
  </div>
  {#if groups.length}
    {#each groups as group, index (group.label)}
      <section class="group" aria-label={groupTitles[group.label] ?? group.label}>
        <h2>{groupTitles[group.label] ?? group.label} <small>{formatNumber(group.entries.length)}</small></h2>
        <div class="group-box">
          {#if !group.unknown}
            <div class="axis" aria-label={`Level axis from 1 to ${formatNumber(axisEnd)}`}>
              <div class="axis-track">
                <span class="baseline"></span>
                {#each ticks as tick (tick)}
                  <span class="axis-tick" style:left={`${levelPoint(tick, axisEnd)}%`}><span>{formatNumber(tick)}</span></span>
                {/each}
                {#if marker !== null}
                  <span class="axis-reader" style:left={`${marker}%`}></span>
                  {#if index === 0}
                    <span class="reader-flag" style:left={`clamp(0px, calc(${marker}% - 2.6rem), calc(100% - 5.2rem))`}>You {formatNumber(selectedLevel!)}</span>
                    <span class="flag-arrow" style:left={`${marker}%`} aria-hidden="true"></span>
                  {/if}
                {/if}
                {#if index === 0}<div class="axis-drag" role="slider" tabindex="0" aria-label={`${levelLabel} on Level Axis`} aria-valuemin="1" aria-valuemax={axisEnd} aria-valuenow={selectedLevel ?? 1} on:pointerdown={startDrag} on:pointermove={moveDrag} on:pointerup={stopDrag} on:pointercancel={stopDrag} on:keydown={moveMarker}></div>{/if}
              </div>
            </div>
          {/if}
          <ul>
            {#each group.entries as entry (entry.ref.key)}
              {@const fit = selectedLevel !== undefined && entry.range !== null && entry.range.min <= selectedLevel && selectedLevel <= entry.range.max}
              <li class:fit>
                <div class="place-name"><EntityLink ref={{ ...(entry.artwork ? { ...entry.ref, icon: entry.artwork } : entry.ref), name: placeListName(entry.ref.name, entry.range ? `${entry.range.min}–${entry.range.max}` : null) }} {registry} forceIcon /></div>
                {#if entry.range}
                  {@const position = rangePosition(entry.range, axisEnd)}
                  <div class="track" aria-hidden="true">{#each ticks as tick (tick)}<span class="tick-line" style:left={`${levelPoint(tick, axisEnd)}%`}></span>{/each}<span class="fill" style:left={`${position.left}%`} style:width={`${position.width}%`}></span>{#if marker !== null}<span class="marker" style:left={`${marker}%`}></span>{/if}</div>
                  <span class="range-text">{formatNumber(entry.range.min)}–{formatNumber(entry.range.max)}</span>
                {:else}<span class="unknown">Level Range Unknown</span>{/if}
                {#if entry.detail}<div class="detail">{entry.detail}</div>{/if}
                {#if entry.mapHref}<a class="map-link" href={entry.mapHref} aria-label={`Show ${entry.ref.name} on Map`}><span class="map-long">Show on Map</span><span class="map-short">Map</span></a>{/if}
              </li>
            {/each}
          </ul>
        </div>
      </section>
    {/each}
  {:else}<p class="c-empty">No entries are available.</p>{/if}
</div>

<style>
  .progression { min-width: 0; }
  .intro { display: flex; align-items: center; justify-content: space-between; gap: 1rem; margin: 0 0 1.2rem; }
  .intro p { max-width: 44rem; margin: 0; color: var(--c-text-dim); line-height: 1.5; }
  .intro :global(.level-control) { flex: none; }
  .axis, li { display: grid; grid-template-columns: minmax(16rem, 20rem) minmax(9rem, 1fr) 4.25rem 5.25rem 6rem; align-items: center; gap: .55rem; }
  .axis { min-height: 4rem; padding: .35rem .85rem .2rem; border-bottom: 1px solid var(--c-line-strong); color: var(--c-text-dim); font-size: var(--c-text-small); }
  .axis-track { position: relative; grid-column: 2; align-self: stretch; min-width: 0; font-variant-numeric: tabular-nums; }
  .baseline { position: absolute; top: 3.35rem; left: 0; right: 0; border-top: 1px solid var(--c-line-strong); }
  .axis-tick { position: absolute; top: 2.1rem; height: 1.35rem; }
  .axis-tick span { position: absolute; top: 0; left: 0; transform: translateX(-50%); white-space: nowrap; }
  .axis-tick::after { content: ''; position: absolute; top: .95rem; height: .4rem; border-left: 1px solid var(--c-line-strong); }
  .axis-reader { position: absolute; top: 3.1rem; bottom: .35rem; width: 2px; background: var(--c-accent); transform: translateX(-50%); }
  .reader-flag { position: absolute; top: .1rem; box-sizing: border-box; width: 5.2rem; padding: .05rem .2rem; border: 1px solid var(--c-frame); border-radius: var(--c-radius-sm); background: var(--c-accent-surface); color: var(--c-accent-strong); font-size: var(--c-text-small); text-align: center; white-space: nowrap; pointer-events: none; }
  .flag-arrow { position: absolute; top: 1.65rem; width: 0; height: 0; border: .3rem solid transparent; border-top-color: var(--c-accent-strong); transform: translateX(-50%); pointer-events: none; }
  .axis-drag { position: absolute; inset: 0; cursor: ew-resize; touch-action: none; }
  .axis-drag:focus-visible { outline: 2px solid var(--c-accent); outline-offset: 2px; }
  .group { margin-bottom: 1.4rem; }
  .group h2 { display: flex; align-items: baseline; gap: .6rem; margin: 0 0 .35rem; padding: .4rem .85rem; color: var(--c-text-strong); font: 600 1.18rem/1.3 var(--c-serif); }
  .group h2 small { color: var(--c-text-dim); font: 500 var(--c-text-small)/1.3 var(--c-sans); }
  .group-box { overflow: hidden; border: 1px solid var(--c-line); border-radius: var(--c-radius); background: var(--c-surface-1); }
  ul { list-style: none; margin: 0; padding: 0; }
  li { min-width: 0; padding: .68rem .85rem; border-bottom: 1px solid var(--c-line); }
  li:last-child { border-bottom: 0; }
  li.fit { background: var(--c-surface-2); box-shadow: inset 3px 0 var(--c-accent); }
  .place-name, .track, .detail { min-width: 0; }
  .place-name { text-wrap: balance; }
  .place-name :global(.entity-link img) { width: 3.5rem; height: 2.2rem; object-fit: cover; vertical-align: middle; }
  .track { position: relative; height: .48rem; border-radius: 1rem; background: var(--c-surface-sunken); box-shadow: inset 0 0 0 1px var(--c-line); }
  .tick-line { position: absolute; top: -.25rem; bottom: -.25rem; width: 1px; background: var(--c-line-strong); opacity: .6; }
  .fill { position: absolute; top: 0; bottom: 0; border-radius: 1rem; background: var(--c-accent); }
  .marker { position: absolute; z-index: 1; top: -.22rem; bottom: -.22rem; width: 2px; background: var(--c-text-strong); transform: translateX(-50%); }
  .range-text { white-space: nowrap; color: var(--c-text-strong); font-size: var(--c-text-small); font-variant-numeric: tabular-nums; }
  .unknown, .detail { color: var(--c-text-dim); font-size: var(--c-text-small); }
  .unknown { grid-column: 2 / 4; }
  .detail { grid-column: 4; }
  .map-link { grid-column: 5; justify-self: end; color: var(--c-accent); font-size: var(--c-text-small); white-space: nowrap; text-underline-offset: .17em; }
  .map-short { display: none; }
  @media (max-width: 800px) {
    .axis, li { grid-template-columns: minmax(0, 1fr) 3.8rem 2.4rem; gap: .35rem .5rem; }
    .axis-track { grid-column: 1; }
    .place-name { grid-column: 1 / -1; grid-row: 1; }
    .track { grid-column: 1; grid-row: 2; }
    .range-text { grid-column: 2; grid-row: 2; justify-self: start; }
    .unknown { grid-column: 1 / 3; grid-row: 2; }
    .detail { grid-column: 1 / -1; grid-row: 3; }
    .map-link { grid-column: 3; grid-row: 2; }
    .map-long { display: none; }
    .map-short { display: inline; }
  }
  @media (max-width: 520px) {
    .intro { align-items: flex-start; flex-direction: column; gap: .8rem; }
    li { padding-top: .8rem; padding-bottom: .8rem; }
    .place-name :global(.entity-link img) { width: 3.15rem; height: 2rem; }
  }
</style>
