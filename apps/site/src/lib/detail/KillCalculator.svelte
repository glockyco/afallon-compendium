<script lang="ts">
  import type { CharacterProgression, PublicKindEntry } from '@afallon/contracts/public';
  import EntityLink from '../EntityLink.svelte';
  import { formatNumber, npcLevelText, signedAmount } from '../format';
  import LevelSlider from './LevelSlider.svelte';
  import { calculateKillAward, creatureLevels, killsToNextLevel, nearestCreatureLevel } from './kill-calculator';

  export let guide: CharacterProgression;
  export let registry: PublicKindEntry[];
  /** The page shares the character level with the level curve. */
  export let characterLevel: number;

  // Each option is one creature at one place, because a creature can spawn at different levels in different places.
  const options = guide.killCalculator.groups.flatMap((group, groupIndex) => group.creatures.map((entry, index) => ({ value: `${groupIndex}:${index}`, entry })));
  const first = guide.killCalculator.defaultCreature;
  let selected = options.find(({ entry }) => entry.creature.key === first.key && entry.creature.variant === first.variant)!.value;
  let creatureLevel = 1;
  let heroic = false;
  let followers = 0;
  let experienceBonus = 0;

  $: entry = options.find((option) => option.value === selected)!.entry;
  $: levels = creatureLevels(entry.level, guide.curve.cap);
  // Another creature or character level resets the creature level, so a creature that scales follows the character.
  $: creatureLevel = nearestCreatureLevel(entry.level, characterLevel, guide.curve.cap);
  $: result = calculateKillAward(entry, creatureLevel, characterLevel, heroic ? guide.killCalculator.heroicMultiplier : undefined, followers, experienceBonus);
  $: toNext = guide.curve.rows.find((row) => row.level === characterLevel)?.toNext;
  $: kills = toNext === undefined ? null : killsToNextLevel(toNext, result.award);

  function navigate(event: KeyboardEvent): void {
    if (!['ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) return;
    const select = event.currentTarget as HTMLSelectElement;
    const index = event.key === 'Home' ? 0 : event.key === 'End' ? select.options.length - 1
      : Math.max(0, Math.min(select.options.length - 1, select.selectedIndex + (event.key === 'ArrowDown' ? 1 : -1)));
    const option = select.options.item(index);
    if (option) { event.preventDefault(); select.selectedIndex = index; selected = option.value; }
  }
  // The bonus stage keeps fractions, because the game converts the award to a whole number only after world modifiers.
  const format = (value: number): string => Number(value.toPrecision(12)).toLocaleString('en-US', { maximumFractionDigits: 4 });
  const range = (low: number, high: number): string => low === high ? format(low) : `${format(low)}–${format(high)}`;
  const modifierText = (value: number): string => value === 0 ? 'No change' : signedAmount(value, true);
  $: killCount = kills === null ? '' : kills.high === null ? `At least ${format(kills.low)}` : kills.low === kills.high ? format(kills.low) : `${format(kills.low)}–${format(kills.high)}`;
</script>

<div class="calculator">
  <div class="picker">
    <label for="kill-creature">Creature</label>
    <select id="kill-creature" bind:value={selected} on:keydown={navigate}>
      {#each guide.killCalculator.groups as group, groupIndex}
        <optgroup label={group.name}>
          {#each group.creatures as option, index}<option value={`${groupIndex}:${index}`}>{option.creature.name}, level {npcLevelText({ ...option.level, scales: false })}</option>{/each}
        </optgroup>
      {/each}
    </select>
  </div>
  <dl class="facts">
    <div><dt class="hidden-label">Creature page</dt><dd><EntityLink ref={entry.creature} {registry} /></dd></div>
    <div><dt>Level</dt><dd>{npcLevelText(entry.level)}</dd></div>
    <div><dt>Base roll</dt><dd>{range(entry.minExperience, entry.maxExperience)}</dd></div>
    <div><dt>Experience per level</dt><dd>{entry.experiencePerLevel === 0 ? 'None' : `+${format(entry.experiencePerLevel)}`}</dd></div>
    <div><dt>Creature above the player</dt><dd>{modifierText(entry.higherModifier)}</dd></div>
    <div><dt>Creature below the player</dt><dd>{modifierText(entry.lowerModifier)}</dd></div>
  </dl>
  <div class="body">
    <div class="settings">
      <LevelSlider id="kill-character-level" label="Character level" min={1} max={guide.curve.cap} bind:level={characterLevel} />
      {#if levels.length > 1}
        <label class="field">Creature level
          <select bind:value={creatureLevel}>{#each levels as level}<option value={level}>{formatNumber(level)}</option>{/each}</select>
        </label>
      {/if}
      <div class="numbers">
        <label class="field">Living followers
          <input type="number" min="0" max="10" step="1" value={followers} on:change={(event) => { const value = event.currentTarget.valueAsNumber; followers = Number.isFinite(value) ? Math.min(10, Math.max(0, Math.trunc(value))) : 0; event.currentTarget.value = String(followers); }} />
        </label>
        <label class="field">Experience Bonus
          <span class="suffixed"><input type="number" min="0" step="any" value={experienceBonus} on:change={(event) => { const value = event.currentTarget.valueAsNumber; experienceBonus = Number.isFinite(value) ? Math.max(0, value) : 0; event.currentTarget.value = String(experienceBonus); }} /><span>%</span></span>
        </label>
      </div>
      {#if guide.killCalculator.heroicMultiplier !== undefined}
        <label class="check"><input type="checkbox" bind:checked={heroic} /> Heroic creature <span class="dim">×{format(guide.killCalculator.heroicMultiplier)} experience</span></label>
      {/if}
    </div>
    <div class="result">
      <h3>Experience per kill</h3>
      <div aria-live="polite" aria-atomic="true">
        <p class="award">{range(result.award.low, result.award.high)}</p>
        <p class="kills">
          {#if toNext === undefined}Level {formatNumber(characterLevel)} is the level cap. The character keeps no experience from kills.
          {:else if kills === null}With these settings, a kill gives no experience.
          {:else}{killCount} {kills.low === 1 && kills.high === 1 ? 'kill' : 'kills'} from level {formatNumber(characterLevel)} to level {formatNumber(characterLevel + 1)}, which needs {formatNumber(toNext)} experience.{/if}
        </p>
      </div>
      <table class="steps">
        <caption>How it adds up</caption>
        <thead><tr><th scope="col">Step</th><th scope="col">Experience</th></tr></thead>
        <tbody>{#each result.steps as step}<tr><th scope="row">{step.label}</th><td>{range(step.low, step.high)}</td></tr>{/each}</tbody>
      </table>
      <p class="note">World modifiers and some game modifiers are not included.{#if experienceBonus > 0} The game may round the final amount.{/if}</p>
    </div>
  </div>
</div>

<style>
  .calculator { container: kill-calculator / inline-size; min-width: 0; }
  .picker { display: grid; gap: .35rem; max-width: 30rem; }
  .picker label, .field, .check { color: var(--c-text-strong); font-weight: 600; }
  select, input[type='number'] { box-sizing: border-box; min-height: 2.75rem; border: 1px solid var(--c-frame); border-radius: var(--c-radius-sm); background: var(--c-surface-sunken); color: var(--c-text); font: inherit; font-weight: 400; }
  .picker select { width: 100%; padding: .4rem .6rem; }
  .facts { display: flex; flex-wrap: wrap; align-items: baseline; gap: .35rem 1.5rem; margin: .75rem 0 1.25rem; }
  .facts div { display: flex; align-items: baseline; gap: .45rem; }
  .facts dt { color: var(--c-text-dim); }
  .facts dd { margin: 0; color: var(--c-text); font-variant-numeric: tabular-nums; }
  .hidden-label { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
  .body { display: grid; gap: 1.25rem; min-width: 0; }
  .settings { display: grid; align-content: start; gap: 1rem; min-width: 0; }
  .field { display: grid; justify-items: start; gap: .35rem; }
  /* The settings fields match the number box of the level slider above them. */
  .field select, .numbers input { width: 6rem; min-height: 2.3rem; padding: .35rem .5rem; }
  .numbers { display: flex; flex-wrap: wrap; gap: 1rem 1.5rem; }
  .suffixed { display: inline-flex; align-items: center; gap: .45rem; color: var(--c-text); font-weight: 400; }
  .check { display: flex; flex-wrap: wrap; align-items: center; gap: .5rem; min-height: 2.75rem; }
  .check input { width: 1.3rem; height: 1.3rem; margin: 0; accent-color: var(--c-accent); }
  .dim { color: var(--c-text-dim); font-weight: 400; }
  .result { box-sizing: border-box; min-width: 0; padding: .8rem; border: 1px solid var(--c-line); border-radius: var(--c-radius-sm); }
  h3 { margin: 0 0 .45rem; color: var(--c-text-strong); font: 600 var(--c-text-lead)/1.3 var(--c-serif); }
  .award { margin: 0; color: var(--c-text-strong); font: 700 1.75rem/1.2 var(--c-serif); font-variant-numeric: tabular-nums; overflow-wrap: anywhere; }
  .kills { margin: .35rem 0 0; line-height: 1.5; }
  .steps { width: 100%; margin-top: .9rem; table-layout: fixed; border-collapse: collapse; font-size: .875rem; font-variant-numeric: tabular-nums; }
  .steps caption { margin: 0 0 .45rem; text-align: left; color: var(--c-text-strong); font-size: 1rem; font-weight: 600; }
  .steps th, .steps td { padding: .25rem .375rem; border-bottom: 1px solid var(--c-line-soft); }
  .steps th { color: var(--c-text-dim); font-weight: 500; text-align: left; overflow-wrap: anywhere; }
  .steps :is(td, thead th:last-child) { width: 7rem; text-align: right; white-space: nowrap; }
  .steps td { color: var(--c-text); }
  .note { margin: .75rem 0 0; color: var(--c-text-dim); font-size: .875rem; line-height: 1.5; }
  @container kill-calculator (min-width: 46rem) {
    .body { grid-template-columns: repeat(2, minmax(0, 1fr)); align-items: start; gap: 1.5rem; }
  }
</style>
