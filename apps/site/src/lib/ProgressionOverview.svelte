<script lang="ts">
  import type { PublicKindEntry } from '@afallon/contracts/public';
  import EntityLink from './EntityLink.svelte';
  import { formatNumber } from './format';
  import { CHARACTER_LEVEL, clearReaderLevel, readerLevels, setReaderLevel } from './reader-levels';
  import { levelTicks, progressionAxis, progressionGroups, rangePosition, type ProgressionEntry } from './progression-overview';

  export let entries: ProgressionEntry[];
  export let registry: PublicKindEntry[];
  /** The same renderer can show a skill's gathering progression with its skill-level key. */
  export let levelId = CHARACTER_LEVEL;
  export let levelLabel = 'Your Level';
  export let description = 'Explore places by level. Ranges can overlap, so more than one destination may suit your character.';

  $: selectedLevel = $readerLevels[levelId];
  $: axisEnd = progressionAxis(entries, selectedLevel);
  $: groups = progressionGroups(entries);
  $: ticks = levelTicks(axisEnd);
  $: marker = selectedLevel === undefined ? null : levelPoint(selectedLevel, axisEnd);

  function levelPoint(level: number, end: number): number {
    return (level - 0.5) / end * 100;
  }

  function chooseLevel(event: Event): void {
    const value = (event.currentTarget as HTMLInputElement).value;
    if (!value) { clearReaderLevel(levelId); return; }
    const number = Number(value);
    if (Number.isInteger(number) && number >= 1) setReaderLevel(levelId, number);
  }
</script>

<div class="progression">
  <div class="intro">
    <p>{description}</p>
    <label class="level-control">{levelLabel}<input type="number" min="1" step="1" inputmode="numeric" placeholder="Any" aria-label={levelLabel} value={selectedLevel ?? ''} on:input={chooseLevel} /></label>
  </div>
  {#if groups.length}
    <div class="axis" aria-label={`Level axis from 1 to ${formatNumber(axisEnd)}`}>
      <span>Level</span><div class="scale">{#each ticks as tick (tick)}<span class="tick-label" style:left={`${levelPoint(tick, axisEnd)}%`}>{formatNumber(tick)}</span>{/each}{#if marker !== null}<span class="axis-marker" style:left={`${marker}%`} aria-hidden="true"></span>{/if}</div><span class="axis-detail">{selectedLevel === undefined ? 'Choose a level' : `${levelLabel} ${formatNumber(selectedLevel)}`}</span>
    </div>
    {#each groups as group (group.label)}
      <section class="group" aria-label={group.label}>
        <h2>{group.label} <small>{formatNumber(group.entries.length)}</small></h2>
        <ul>
          {#each group.entries as entry (entry.ref.key)}
            {@const fit = selectedLevel !== undefined && entry.range !== null && entry.range.min <= selectedLevel && selectedLevel <= entry.range.max}
            <li class:fit>
              <div class="place-name"><EntityLink ref={entry.artwork ? { ...entry.ref, icon: entry.artwork } : entry.ref} {registry} forceIcon /></div>
              {#if entry.range}
                {@const position = rangePosition(entry.range, axisEnd)}
                <div class="range"><div class="track" aria-hidden="true">{#each ticks as tick (tick)}<span class="tick-line" style:left={`${levelPoint(tick, axisEnd)}%`}></span>{/each}<span class="fill" style:left={`${position.left}%`} style:width={`${position.width}%`}></span>{#if marker !== null}<span class="marker" style:left={`${marker}%`}></span>{/if}</div><span class="range-text">{formatNumber(entry.range.min)}–{formatNumber(entry.range.max)}</span></div>
              {:else}<span class="unknown">Level Range Unknown</span>{/if}
              <div class="detail">{entry.detail ?? ''}</div>
              {#if entry.mapHref}<a class="map-link" href={entry.mapHref} aria-label={`View ${entry.ref.name} on Map`}><span class="map-long">View on Map</span><span class="map-short">Map</span></a>{/if}
            </li>
          {/each}
        </ul>
      </section>
    {/each}
  {:else}<p class="c-empty">No entries are available.</p>{/if}
</div>

<style>
  .progression { min-width: 0; }
  .intro { display: flex; align-items: center; justify-content: space-between; gap: 1rem; margin: 0 0 1.2rem; }
  .intro p { max-width: 44rem; margin: 0; color: var(--c-text-dim); line-height: 1.5; }
  .level-control { display: flex; flex: none; align-items: center; gap: .55rem; color: var(--c-text-strong); font-size: var(--c-text-small); font-weight: 700; }
  .level-control input { width: 5.1rem; min-height: 2.4rem; padding: .35rem .5rem; border: 1px solid var(--c-line-strong); border-radius: var(--c-radius-sm); background: var(--c-surface-sunken); color: var(--c-text); font: inherit; }
  .axis, li { display: grid; grid-template-columns: minmax(10rem, 1.3fr) minmax(9rem, 2fr) minmax(5.2rem, .55fr) minmax(5.8rem, .7fr); align-items: center; gap: .75rem; }
  .axis { padding: .55rem .9rem; color: var(--c-text-dim); font-size: var(--c-text-small); }
  .scale { position: relative; width: calc(100% - 5.15rem); height: 1.25rem; font-variant-numeric: tabular-nums; }
  .tick-label { position: absolute; transform: translateX(-50%); white-space: nowrap; }
  .axis-detail { grid-column: 3 / 5; text-align: right; color: var(--c-accent-strong); }
  .axis-marker { position: absolute; bottom: -.4rem; width: .5rem; height: .5rem; border-radius: 50%; background: var(--c-accent); transform: translateX(-50%); }
  .group { margin-bottom: 1.4rem; }
  .group h2 { display: flex; align-items: baseline; gap: .6rem; margin: 0; padding: .6rem .85rem; border-bottom: 1px solid var(--c-line-strong); color: var(--c-text-strong); font: 600 1.18rem/1.3 var(--c-serif); }
  .group h2 small { color: var(--c-text-dim); font: 500 var(--c-text-small)/1.3 var(--c-sans); }
  ul { list-style: none; margin: 0; padding: 0; border: 1px solid var(--c-line); border-top: 0; border-radius: 0 0 var(--c-radius) var(--c-radius); background: var(--c-surface-1); }
  li { min-width: 0; padding: .68rem .85rem; border-bottom: 1px solid var(--c-line); }
  li:last-child { border-bottom: 0; }
  li.fit { background: var(--c-surface-2); box-shadow: inset 3px 0 var(--c-accent); }
  .place-name, .range, .detail { min-width: 0; }
  .place-name { min-width: 0; }
  .place-name :global(.entity-link img) { width: 3.5rem; height: 2.2rem; object-fit: cover; vertical-align: middle; }
  .range { display: flex; align-items: center; gap: .65rem; }
  .track { position: relative; flex: 1 1 auto; min-width: 0; height: .48rem; border-radius: 1rem; background: var(--c-surface-sunken); box-shadow: inset 0 0 0 1px var(--c-line); }
  .tick-line { position: absolute; top: -.25rem; bottom: -.25rem; width: 1px; background: var(--c-line-strong); opacity: .6; }
  .fill { position: absolute; top: 0; bottom: 0; border-radius: 1rem; background: var(--c-accent); }
  .marker { position: absolute; z-index: 1; top: -.22rem; bottom: -.22rem; width: 2px; background: var(--c-text-strong); transform: translateX(-50%); }
  .range-text { flex: none; width: 4.5rem; text-align: right; white-space: nowrap; color: var(--c-text-strong); font-size: var(--c-text-small); font-variant-numeric: tabular-nums; }
  .unknown, .detail { color: var(--c-text-dim); font-size: var(--c-text-small); }
  .map-link { justify-self: end; color: var(--c-accent); font-size: var(--c-text-small); white-space: nowrap; text-underline-offset: .17em; }
  .map-short { display: none; }
  @media (max-width: 800px) {
    .axis, li { grid-template-columns: minmax(0, 1fr) minmax(0, 1.3fr); }
    .axis > span:first-child { display: block; }
    .axis-detail { grid-column: 1 / -1; grid-row: 2; text-align: right; }
    li { gap: .35rem .8rem; }
    .range, .unknown { grid-column: 2; grid-row: 1; }
    .detail { grid-column: 1; grid-row: 2; }
    .map-link { grid-column: 2; grid-row: 2; }
  }
  @media (max-width: 520px) {
    .intro { align-items: flex-start; flex-direction: column; gap: .8rem; }
    .axis { grid-template-columns: 1fr auto; }
    .axis > span:first-child { display: none; }
    .scale { grid-column: 1 / -1; }
    .axis-detail { grid-column: 1 / -1; grid-row: 2; }
    li { grid-template-columns: minmax(0, 1fr) auto; }
    .place-name { grid-column: 1 / -1; }
    .range, .unknown { grid-column: 1 / -1; grid-row: 2; }
    .range-text { width: auto; min-width: 4.6rem; }
    li { padding-top: .8rem; padding-bottom: .8rem; }
    .place-name :global(.entity-link img) { width: 3.15rem; height: 2rem; }
    .map-long { display: none; }
    .map-short { display: inline; }
    .detail { grid-column: 1; grid-row: 3; }
    .map-link { grid-column: 2; grid-row: 3; }
  }
</style>
