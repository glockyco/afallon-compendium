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
  export let description = 'Ranges can overlap, so several places may suit your level.';

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
    {#each groups as group, index (group.label)}
      <section class="group" aria-label={group.label}>
        <h2>{group.label} <small>{formatNumber(group.entries.length)}</small></h2>
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
                  {#if index === 0}<span class="reader-flag" class:near-start={selectedLevel !== undefined && selectedLevel <= 3} class:near-end={selectedLevel !== undefined && selectedLevel >= axisEnd - 2} style:left={`${marker}%`}>You {formatNumber(selectedLevel!)}</span>{/if}
                {/if}
              </div>
              {#if !ticks.includes(axisEnd)}<span class="axis-end">Max {formatNumber(axisEnd)}</span>{/if}
            </div>
          {/if}
          <ul>
            {#each group.entries as entry (entry.ref.key)}
              {@const fit = selectedLevel !== undefined && entry.range !== null && entry.range.min <= selectedLevel && selectedLevel <= entry.range.max}
              <li class:fit>
                <div class="place-name"><EntityLink ref={entry.artwork ? { ...entry.ref, icon: entry.artwork } : entry.ref} {registry} forceIcon /></div>
                {#if entry.range}
                  {@const position = rangePosition(entry.range, axisEnd)}
                  <div class="track" aria-hidden="true">{#each ticks as tick (tick)}<span class="tick-line" style:left={`${levelPoint(tick, axisEnd)}%`}></span>{/each}<span class="fill" style:left={`${position.left}%`} style:width={`${position.width}%`}></span>{#if marker !== null}<span class="marker" style:left={`${marker}%`}></span>{/if}</div>
                  <span class="range-text">{formatNumber(entry.range.min)}–{formatNumber(entry.range.max)}</span>
                {:else}<span class="unknown">Level Range Unknown</span>{/if}
                <div class="detail">{entry.detail ?? ''}</div>
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
  .level-control { display: flex; flex: none; align-items: center; gap: .55rem; color: var(--c-text-strong); font-size: var(--c-text-small); font-weight: 700; }
  .level-control input { width: 5.1rem; min-height: 2.4rem; padding: .35rem .5rem; border: 1px solid var(--c-line-strong); border-radius: var(--c-radius-sm); background: var(--c-surface-sunken); color: var(--c-text); font: inherit; }
  .axis, li { display: grid; grid-template-columns: minmax(13rem, 1.65fr) minmax(9rem, 2fr) 4.5rem minmax(4rem, .55fr) minmax(5.8rem, .7fr); align-items: center; gap: .65rem; }
  .axis { min-height: 3.5rem; padding: .35rem .85rem .2rem; border-bottom: 1px solid var(--c-line-strong); color: var(--c-text-dim); font-size: var(--c-text-small); }
  .axis-track { position: relative; grid-column: 2; align-self: stretch; min-width: 0; font-variant-numeric: tabular-nums; }
  .baseline { position: absolute; top: 2.65rem; left: 0; right: 0; border-top: 1px solid var(--c-line-strong); }
  .axis-tick { position: absolute; top: 1.3rem; height: 1.55rem; border-left: 1px solid var(--c-line-strong); }
  .axis-tick span { position: absolute; top: 0; left: 0; transform: translateX(-50%); white-space: nowrap; }
  .axis-reader { position: absolute; top: 1.22rem; bottom: .35rem; width: 2px; background: var(--c-accent); transform: translateX(-50%); }
  .reader-flag { position: absolute; top: -.25rem; padding: .05rem .25rem; border: 1px solid var(--c-frame); border-radius: var(--c-radius-sm); background: var(--c-accent-surface); color: var(--c-accent-strong); font-size: var(--c-text-small); white-space: nowrap; transform: translateX(-50%); }
  .reader-flag.near-start { transform: none; }
  .reader-flag.near-end { transform: translateX(-100%); }
  .axis-end { grid-column: 3; align-self: end; padding-bottom: .35rem; white-space: nowrap; font-variant-numeric: tabular-nums; }
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
  .map-link { justify-self: end; color: var(--c-accent); font-size: var(--c-text-small); white-space: nowrap; text-underline-offset: .17em; }
  .map-short { display: none; }
  @media (max-width: 800px) {
    .axis, li { grid-template-columns: minmax(0, 1fr) 4.5rem; gap: .35rem .7rem; }
    .axis-track { grid-column: 1; }
    .axis-end { grid-column: 2; }
    .place-name { grid-column: 1 / -1; grid-row: 1; }
    .track { grid-column: 1; grid-row: 2; }
    .range-text { grid-column: 2; grid-row: 2; justify-self: start; }
    .unknown { grid-column: 1 / -1; grid-row: 2; }
    .detail { grid-column: 1; grid-row: 3; }
    .map-link { grid-column: 2; grid-row: 3; }
  }
  @media (max-width: 520px) {
    .intro { align-items: flex-start; flex-direction: column; gap: .8rem; }
    li { padding-top: .8rem; padding-bottom: .8rem; }
    .place-name :global(.entity-link img) { width: 3.15rem; height: 2rem; }
    .map-long { display: none; }
    .map-short { display: inline; }
  }
</style>
