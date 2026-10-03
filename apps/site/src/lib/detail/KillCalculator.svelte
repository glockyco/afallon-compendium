<script lang="ts">
  import type { CharacterProgression, PublicKindEntry } from '@afallon/contracts/public';
  import EntityLink from '../EntityLink.svelte';
  import { formatNumber, npcLevelText, signedAmount } from '../format';
  import DetailsDisclosure from './DetailsDisclosure.svelte';
  import { calculateKillAward, creatureLevels, killsToNextLevel, nearestCreatureLevel } from './kill-calculator';
  import LevelControl from './LevelControl.svelte';

  export let guide: CharacterProgression;
  export let registry: PublicKindEntry[];
  /** The page shares the character level with the level curve. */
  export let characterLevel: number;

  // Each option is one creature at one place, because a creature can spawn at different levels in different places.
  const options = guide.killCalculator.groups.flatMap((group, groupIndex) => group.creatures.map((entry, index) => ({ value: `${groupIndex}:${index}`, group, entry })));
  const first = guide.killCalculator.defaultCreature;
  let selected = options.find(({ entry }) => entry.creature.key === first.key && entry.creature.variant === first.variant)!.value;
  let creatureLevel = 1;
  let heroic = false;
  let followers = 0;
  let experienceBonus = 0;

  $: choice = options.find((option) => option.value === selected)!;
  $: entry = choice.entry;
  $: place = choice.group;
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
  <div class="result">
    <div class="result-heading">
      <h3>Experience per kill</h3>
      <p class="selected-creature"><EntityLink ref={entry.creature} {registry} /> in {#if place.place}<EntityLink ref={place.place} {registry} />{:else}{place.name}{/if} at <span class="no-break">level&nbsp;{formatNumber(creatureLevel)}</span>.</p>
    </div>
    <div aria-live="polite" aria-atomic="true">
      <p class="award">{toNext === undefined ? 'Level cap' : `${range(result.award.low, result.award.high)} experience`}</p>
      <p class="kills">
        {#if toNext === undefined}Level&nbsp;{formatNumber(characterLevel)} is the level cap, so kills give no more experience.
        {:else if kills === null}With these settings, a kill gives no experience.
        {:else}{killCount} {kills.low === 1 && kills.high === 1 ? 'kill' : 'kills'} from level&nbsp;{formatNumber(characterLevel)} to level&nbsp;{formatNumber(characterLevel + 1)}, which needs {formatNumber(toNext)} experience.{/if}
      </p>
    </div>
    <p class="note">This leaves out world effects and some other game effects.{#if experienceBonus > 0}{' '}The game may round the final amount.{/if}</p>
    <DetailsDisclosure title="How the kill award adds up">
      <table class="c-table c-table--calculator" aria-label="Experience calculation">
        <thead><tr><th scope="col">Step</th><th scope="col" class="c-num">Experience</th></tr></thead>
        <tbody>{#each result.steps as step}<tr><th scope="row">{step.label}</th><td class="c-num">{range(step.low, step.high)}</td></tr>{/each}</tbody>
      </table>
    </DetailsDisclosure>
  </div>
  <div class="settings">
    <h3>Adjust the kill</h3>
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
    <div class="setting-fields">
      {#if levels.length > 1}
        <LevelControl id="kill-creature-level" label="Creature level" min={levels[0]!} max={levels[levels.length - 1]!} bind:level={creatureLevel} />
      {/if}
      <div class="numbers">
        <LevelControl id="kill-followers" label="Living followers" min={0} max={10} bind:level={followers} />
        <LevelControl id="kill-bonus" label="Experience bonus" min={0} max={Number.MAX_SAFE_INTEGER} sliderMax={100} bind:level={experienceBonus} allowFraction suffix="%" />
      </div>
      {#if guide.killCalculator.heroicMultiplier !== undefined}
        <label class="check"><input type="checkbox" bind:checked={heroic} /><span>Heroic creature</span><span class="dim">If eligible · ×{format(guide.killCalculator.heroicMultiplier)} experience</span></label>
      {/if}
    </div>
  </div>
  <div class="source-facts">
    <DetailsDisclosure title="Creature experience details">
      <dl class="facts">
        <div><dt>Creature</dt><dd><EntityLink ref={entry.creature} {registry} /></dd></div>
        <div><dt>Level</dt><dd>{npcLevelText(entry.level)}</dd></div>
        <div><dt>Base roll</dt><dd>{range(entry.minExperience, entry.maxExperience)}</dd></div>
        <div><dt>Experience per level</dt><dd>{entry.experiencePerLevel === 0 ? 'None' : `+${format(entry.experiencePerLevel)}`}</dd></div>
        <div><dt>Creature above the player</dt><dd>{modifierText(entry.higherModifier)}</dd></div>
        <div><dt>Creature below the player</dt><dd>{modifierText(entry.lowerModifier)}</dd></div>
      </dl>
    </DetailsDisclosure>
  </div>
</div>

<style>
  .calculator { container: kill-calculator / inline-size; min-width: 0; display: grid; gap: 1rem; }
  .picker { display: grid; align-content: start; gap: .35rem; min-width: 0; }
  .picker label, .check { color: var(--c-text-strong); font-weight: 600; }
  select { box-sizing: border-box; min-height: 2.75rem; border: 1px solid var(--c-frame); border-radius: var(--c-radius-sm); background: var(--c-surface-sunken); color: var(--c-text); font: inherit; font-weight: 400; }
  .picker select { width: 100%; padding: .4rem .6rem; }
  .facts { display: flex; flex-wrap: wrap; align-items: baseline; gap: .35rem 1.5rem; margin: .75rem 0 1.25rem; }
  .facts div { display: flex; align-items: baseline; gap: .45rem; }
  .facts dt { color: var(--c-text-dim); }
  .facts dd { margin: 0; color: var(--c-text); font-variant-numeric: tabular-nums; }
  .settings, .result { box-sizing: border-box; min-width: 0; padding: 1rem; border: 1px solid var(--c-line); border-radius: var(--c-radius-sm); background: var(--c-surface-1); }
  .settings, .setting-fields { display: grid; align-content: start; gap: .7rem; }
  .numbers { display: flex; flex-wrap: wrap; gap: 1rem 1.5rem; }
  .numbers :global(.level-control) { flex: 1 1 12rem; }
  .check { display: grid; grid-template-columns: 1.3rem minmax(0, 1fr); align-items: start; column-gap: .55rem; row-gap: .2rem; }
  .check input { width: 1.3rem; height: 1.3rem; margin: .15rem 0 0; accent-color: var(--c-accent); }
  .check .dim { grid-column: 2; color: var(--c-text-dim); font-weight: 400; }
  .result { display: grid; align-content: start; gap: .7rem; }
  h3 { margin: 0; color: var(--c-text-strong); font: 600 var(--c-text-lead)/1.3 var(--c-serif); }
  .selected-creature { margin: .25rem 0 0; color: var(--c-text-dim); }
  .selected-creature :global(.entity-link), .no-break { white-space: nowrap; }
  .award { margin: 0; color: var(--c-text-strong); font: 600 1.7rem/1.25 var(--c-serif); font-variant-numeric: tabular-nums; }
  .kills { margin: .35rem 0 0; line-height: 1.5; }
  .note { margin: 0; color: var(--c-text-dim); font-size: var(--c-text-small); line-height: 1.5; }
  @media (min-width: 900px) {
    .calculator { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1rem 1.5rem; }
    .settings { grid-column: 1; grid-row: 1; }
    .result { grid-column: 2; grid-row: 1; }
    .source-facts { grid-column: 1 / -1; grid-row: 2; }
  }
</style>
