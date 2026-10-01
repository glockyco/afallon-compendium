<script lang="ts">
  import type { CharacterProgression, EntityRef, PublicKindEntry } from '@afallon/contracts/public';
  import EntityLink from '../EntityLink.svelte';
  import LevelSlider from './LevelSlider.svelte';
  import { calculateKillAward, killsToNextLevel } from './kill-calculator';

  export let guide: CharacterProgression;
  export let registry: PublicKindEntry[];
  export let playerLevel: number;

  const identity = (ref: EntityRef): string => JSON.stringify([ref.key, ref.variant ?? '']);
  let selectedKey = identity(guide.killCalculator.defaultCreature);
  let selected = guide.killCalculator.groups.flatMap((group) => group.creatures).find((entry) => identity(entry.creature) === selectedKey)!;
  let heroic = false;
  let followers = 0;
  let experienceBonus = 0;

  $: selected = guide.killCalculator.groups.flatMap((group) => group.creatures).find((entry) => identity(entry.creature) === selectedKey)!;
  $: result = calculateKillAward(selected, playerLevel, heroic ? guide.killCalculator.heroicMultiplier : undefined, followers, experienceBonus);
  $: toNext = guide.curve.rows.find((row) => row.level === playerLevel)?.toNext;
  $: kills = toNext === undefined ? null : killsToNextLevel(toNext, result.award);

  function choose(key: string): void {
    const creature = guide.killCalculator.groups.flatMap((group) => group.creatures).find((entry) => identity(entry.creature) === key);
    if (!creature) return;
    selectedKey = key;
    playerLevel = creature.level;
  }
  function navigate(event: KeyboardEvent): void {
    if (!['ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) return;
    const select = event.currentTarget as HTMLSelectElement;
    const index = event.key === 'Home' ? 0 : event.key === 'End' ? select.options.length - 1
      : Math.max(0, Math.min(select.options.length - 1, select.selectedIndex + (event.key === 'ArrowDown' ? 1 : -1)));
    const option = select.options.item(index);
    if (option) { event.preventDefault(); select.selectedIndex = index; choose(option.value); }
  }
  const format = (value: number): string => Number(value.toPrecision(12)).toLocaleString('en-US', { maximumFractionDigits: 10 });
  const range = (low: number, high: number): string => low === high ? format(low) : `${format(low)}–${format(high)}`;
  const signed = (value: number): string => `${value > 0 ? '+' : ''}${format(value)}%`;
</script>

<div class="calculator">
  <div class="controls">
    <div class="picker">
      <label for="kill-creature">Creature</label>
      <select id="kill-creature" value={selectedKey} on:change={(event) => choose(event.currentTarget.value)} on:keydown={navigate}>
        {#each guide.killCalculator.groups as group}
          <optgroup label={group.name}>
            {#each group.creatures as entry}<option value={identity(entry.creature)}>{entry.creature.name}</option>{/each}
          </optgroup>
        {/each}
      </select>
    </div>
    <LevelSlider id="kill-player-level" label="Player level" min={1} max={guide.curve.cap} bind:level={playerLevel} />
    <div class="extra-controls">
      {#if guide.killCalculator.heroicMultiplier !== undefined}
        <label class="heroic"><input type="checkbox" bind:checked={heroic} /> Heroic creature</label>
      {/if}
      <label class="numeric">Living followers <input type="number" min="0" max="10" step="1" value={followers} on:change={(event) => { const value = event.currentTarget.valueAsNumber; followers = Number.isFinite(value) ? Math.min(10, Math.max(0, Math.trunc(value))) : 0; event.currentTarget.value = String(followers); }} /></label>
      <label class="numeric">Experience Bonus % <input type="number" min="0" step="any" value={experienceBonus} on:change={(event) => { const value = event.currentTarget.valueAsNumber; experienceBonus = Number.isFinite(value) ? Math.max(0, value) : 0; event.currentTarget.value = String(experienceBonus); }} /></label>
    </div>
  </div>
  <div class="panels">
    <div class="result-card" aria-live="polite" aria-atomic="true">
      <h3>Experience per kill</h3>
      <p class="award">{range(result.award.low, result.award.high)}</p>
      {#if toNext !== undefined}
        <p class="next">Kills to next level from 0 experience ({format(toNext)} needed):
          {#if kills}{format(kills.low)}–{kills.high === null ? 'no finite maximum' : format(kills.high)}{:else}No finite number of kills{/if}
        </p>
      {/if}
      <table class="breakdown">
        <caption>How the range changes</caption>
        <thead><tr><th scope="col">Step</th><th scope="col">Running range</th></tr></thead>
        <tbody>{#each result.steps as step}<tr><th scope="row">{step.label}</th><td>{range(step.low, step.high)}</td></tr>{/each}</tbody>
      </table>
      {#if experienceBonus > 0}<p class="uncertainty">The game may round the final amount.</p>{/if}
    </div>
    <div class="creature-card">
      <h3>Creature facts</h3>
      <dl>
        <div><dt>Creature</dt><dd><EntityLink ref={selected.creature} {registry} /></dd></div>
        <div><dt>Level</dt><dd>{format(selected.level)}</dd></div>
        <div><dt>Base roll</dt><dd>{range(selected.minExperience, selected.maxExperience === selected.minExperience ? selected.minExperience : selected.maxExperience - 1)}</dd></div>
        <div><dt>Creature below the player</dt><dd>{signed(selected.lowerModifier)}</dd></div>
        <div><dt>Creature above the player</dt><dd>{signed(selected.higherModifier)}</dd></div>
      </dl>
    </div>
  </div>
  <p class="exclusion">World modifiers and some game modifiers are not included.</p>
</div>

<style>
  .calculator { container: kill-calculator / inline-size; min-width: 0; }
  .controls { display: grid; gap: 1rem; margin-bottom: 1.2rem; }
  .picker { display: grid; gap: .35rem; min-width: 0; }
  .picker label { color: var(--c-text-strong); font-weight: 600; }
  select, .numeric input { box-sizing: border-box; min-height: 2.75rem; border: 1px solid var(--c-frame); border-radius: var(--c-radius-sm); background: var(--c-surface-sunken); color: var(--c-text); font: inherit; }
  select { width: 100%; padding: .4rem .6rem; }
  .extra-controls { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .75rem; }
  .heroic { display: flex; grid-column: 1 / -1; align-items: center; gap: .45rem; min-height: 2.75rem; }
  .heroic input { width: 1.3rem; height: 1.3rem; accent-color: var(--c-accent); }
  .numeric { display: grid; gap: .35rem; color: var(--c-text-strong); font-weight: 600; }
  .numeric input { width: 7rem; padding: .35rem .5rem; font-weight: 400; }
  .panels { display: grid; gap: 1rem; min-width: 0; }
  .result-card, .creature-card { box-sizing: border-box; min-width: 0; padding: 1rem; border: 1px solid var(--c-line); border-radius: var(--c-radius-sm); }
  h3 { margin: 0 0 .55rem; color: var(--c-text-strong); font: 600 var(--c-text-lead)/1.3 var(--c-serif); }
  .award { margin: 0; color: var(--c-text-strong); font: 700 clamp(1.5rem, 3vw, 2rem)/1.2 var(--c-serif); font-variant-numeric: tabular-nums; overflow-wrap: anywhere; }
  .next { margin: .75rem 0; line-height: 1.5; }
  .breakdown { width: 100%; table-layout: fixed; border-collapse: collapse; font-size: .875rem; font-variant-numeric: tabular-nums; }
  .breakdown caption { margin: .65rem 0 .35rem; text-align: left; color: var(--c-text-strong); font-size: 1rem; font-weight: 600; }
  .breakdown :is(th, td) { padding: .45rem .25rem; border-bottom: 1px solid var(--c-line-soft); }
  .breakdown th { text-align: left; font-weight: 500; overflow-wrap: anywhere; }
  .breakdown thead th { color: var(--c-text-dim); font-weight: 600; }
  .breakdown :is(th:last-child, td) { width: 8.5rem; text-align: right; }
  .breakdown td { white-space: nowrap; }
  .uncertainty, .exclusion { margin: .8rem 0 0; color: var(--c-text-dim); line-height: 1.5; }
  dl { margin: 0; }
  dl div { display: flex; justify-content: space-between; gap: 1rem; padding: .5rem 0; border-bottom: 1px solid var(--c-line-soft); }
  dt { color: var(--c-text-dim); }
  dd { margin: 0; text-align: right; font-variant-numeric: tabular-nums; }
  @container kill-calculator (min-width: 46rem) {
    .controls { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); align-items: end; }
    .extra-controls { display: flex; grid-column: 1 / -1; flex-wrap: wrap; align-items: end; gap: .75rem 1.2rem; }
    .panels { grid-template-columns: minmax(0, 1.35fr) minmax(0, 1fr); align-items: start; }
  }
</style>
