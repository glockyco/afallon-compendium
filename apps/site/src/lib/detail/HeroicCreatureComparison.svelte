<script lang="ts">
  import { onMount } from 'svelte';
  import type { CharacterProgression, EntityRef, HeroicTier, PublicKindEntry } from '@afallon/contracts/public';
  import EntityLink from '../EntityLink.svelte';
  import { clientMapLoader } from '../client-publication';
  import { formatNumber, npcLevelText } from '../format';
  import { readerGearScore, setReaderGearScore } from '../reader-gear-score';
  import { CHARACTER_LEVEL } from '../reader-levels';
  import { empoweredStrength } from './heroic-strength';
  import { calculateKillAward, creatureLevels, nearestCreatureLevel } from './kill-calculator';
  import LevelControl from './LevelControl.svelte';

  export let guide: HeroicTier;
  export let registry: PublicKindEntry[];
  type Group = CharacterProgression['killCalculator']['groups'][number];
  type Choice = { id: string; group: Group; place: EntityRef; entry: Group['creatures'][number] };
  let progression: CharacterProgression | undefined;
  let choices: Choice[] = [];
  let selected = '';
  let characterLevel = 23;
  let creatureLevel = 23;
  let loading = true;
  let error = '';
  const excluded = guide.sections.flatMap((section) => section.rules)
    .find((rule) => rule.id === 'heroic-tier-excluded-areas' && rule.status === 'verified')?.links ?? [];
  const excludedKeys = new Set(excluded.map((place) => place.key));
  $: chosen = choices.find((choice) => choice.id === selected);
  $: spawnLevels = chosen && progression ? creatureLevels(chosen.entry.level, progression.curve.cap) : [];
  $: score = $readerGearScore;
  $: settings = 'unavailable' in guide.settings ? undefined : guide.settings;
  $: strength = settings && empoweredStrength(settings, score);
  $: normal = chosen ? calculateKillAward(chosen.entry, creatureLevel, characterLevel, undefined, 0, 0).award : undefined;
  $: empowered = chosen && settings ? calculateKillAward(chosen.entry, creatureLevel, characterLevel, settings.killExperienceMultiplier, 0, 0).award : undefined;
  const exact = new Intl.NumberFormat('en-US', { maximumFractionDigits: 4 });
  const xp = (range: { low: number; high: number }): string => range.low === range.high ? formatNumber(range.low) : `${formatNumber(range.low)}–${formatNumber(range.high)}`;
  function selectCreature(id: string): void {
    selected = id;
    const choice = choices.find((option) => option.id === id);
    if (choice && progression) creatureLevel = nearestCreatureLevel(choice.entry.level, characterLevel, progression.curve.cap);
  }
  onMount(() => {
    void (async () => {
      try {
        const loader = clientMapLoader();
        const [page, placeList] = await Promise.all([loader?.loadDocument('mechanics', 'character-progression'), loader?.loadList('places')]);
        if (!page || page.kind !== 'mechanics' || page.document.topic !== 'character-progression' || !placeList) throw new Error('Creature experience is not available.');
        progression = page.document;
        const placesByName = new Map(placeList.rows.map((row) => [row.ref.name, row.ref]));
        choices = progression.killCalculator.groups.flatMap((group, index) => {
          const place = group.place ?? placesByName.get(group.name);
          return place && !excludedKeys.has(place.key) ? group.creatures.map((entry, entryIndex) => ({ id: `${index}:${entryIndex}`, group, place, entry })) : [];
        });
        const first = choices.find((choice) => choice.entry.creature.name === 'Fangchill' && choice.place.name === 'Chillwind Heights') ?? choices[0];
        if (first) selectCreature(first.id);
        else throw new Error('No eligible creature encounter is available.');
      } catch (cause) { error = cause instanceof Error ? cause.message : String(cause); }
      finally { loading = false; }
    })();
  });
</script>

<div class="heroic-creature" class:loading>
  <p class="intro">Compare a creature at a place where Heroic Tier can be active. Only some creatures become Heroic while the tier is on.</p>
  {#if loading}<p role="status">Loading creatures…</p>{:else if error}<p role="alert">{error}</p>{:else if chosen && progression && settings && strength}
    <div class="controls">
      <label class="picker">Creature and place
        <select value={selected} on:change={(event) => selectCreature(event.currentTarget.value)}>
          {#each choices as choice}
            <option value={choice.id}>{choice.entry.creature.name}, {choice.place.name}, level {npcLevelText({ ...choice.entry.level, scales: false })}</option>
          {/each}
        </select>
      </label>
      <div class="character-control"><LevelControl id="heroic-character-level" readerId={CHARACTER_LEVEL} label="Character level" min={1} max={progression.curve.cap} fallback={23} bind:level={characterLevel} /></div>
      {#if spawnLevels.length > 1}<label class="picker">Creature level
        <select value={creatureLevel} on:change={(event) => { creatureLevel = Number(event.currentTarget.value); }}>
          {#each spawnLevels as level}<option value={level}>{formatNumber(level)}</option>{/each}
        </select>
      </label>{/if}
      <div class="score"><LevelControl id="heroic-gear-score" label="Equipped gear score" min={0} max={1250} level={score} onSelect={(value) => { if (value !== undefined) setReaderGearScore(value); }} /></div>
    </div>
    <p class="source"><EntityLink ref={chosen.entry.creature} {registry} /> in <EntityLink ref={chosen.place} {registry} /> at level&nbsp;{formatNumber(creatureLevel)}.</p>
    <div class="comparison-card" aria-live="polite" aria-atomic="true">
      <div class="c-table-scroll"><table class="c-table c-table--calculator" aria-label="Normal and Heroic creature comparison">
        <colgroup><col style="width: 45%" /><col style="width: 27.5%" /><col style="width: 27.5%" /></colgroup>
        <thead><tr><th scope="col">Comparison</th><th scope="col" class="c-num">Normal</th><th scope="col" class="c-num">Heroic</th></tr></thead>
        <tbody>
          <tr><th scope="row">Kill experience</th>
            <td class="c-num">{#if characterLevel >= progression.curve.cap}Level cap{:else if normal}<span class="no-break">{xp(normal)}</span>{:else}Unavailable{/if}</td>
            <td class="c-num">{#if characterLevel >= progression.curve.cap}Level cap{:else if empowered}<span class="no-break">{xp(empowered)}</span> <span class="no-break">({exact.format(settings.killExperienceMultiplier)}×)</span>{:else}Unavailable{/if}</td>
          </tr>
          <tr><th scope="row">Maximum health</th><td class="c-num">—</td><td class="c-num">{formatNumber(strength.health)}×</td></tr>
          <tr><th scope="row">Damage</th><td class="c-num">—</td><td class="c-num">{formatNumber(strength.damage)}×</td></tr>
        </tbody>
      </table></div>
      <p>Heroic health and damage are relative to the normal creature. <a class="c-link" href="#affixes">Affixes</a> may further change combat. Rare and Boss creatures always get at least one. With Essence points, Heroic kills add <a class="c-link" href="#essence">Heroic Essence</a> toward your Heroic Ascension talents. If this creature drops eligible equipment, it may be <a class="c-link" href="#heroic-gear">Heroic gear</a>. No particular item is guaranteed.</p>
    </div>
    <p class="note">Experience assumes no living followers or Experience Bonus and excludes world and other game modifiers. Quest experience does not gain the kill multiplier. The tier pauses in {#each excluded as place, index}{index ? ', ' : ''}<EntityLink ref={place} {registry} />{/each} and in dungeons with a timer or corruption, then resumes when you leave.</p>
  {/if}
</div>

<style>
  .heroic-creature { min-width: 0; }
  .heroic-creature.loading { min-height: 24rem; }
  .intro, .source, .note { margin: 0 0 1rem; line-height: 1.55; }
  .note { margin-top: 1rem; color: var(--c-text-dim); font-size: var(--c-text-small); }
  .controls { display: grid; gap: 1rem; margin: 1rem 0; }
  .picker { display: grid; align-content: start; gap: .35rem; color: var(--c-text-strong); font-weight: 600; min-width: 0; }
  .picker select { box-sizing: border-box; width: 100%; min-height: 2.75rem; padding: .4rem .6rem; border: 1px solid var(--c-frame); border-radius: var(--c-radius-sm); background: var(--c-surface-sunken); color: var(--c-text); font: inherit; font-weight: 400; }
  .character-control, .score { min-width: 0; }
  .character-control :global(.level-control), .score :global(.level-control) { max-width: none; }
  .comparison-card { box-sizing: border-box; min-width: 0; padding: 1rem; border: 1px solid var(--c-frame); border-radius: var(--c-radius-sm); background: var(--c-surface-1); }
  .comparison-card :global(.c-table td.c-num) { white-space: normal; }
  .no-break { white-space: nowrap; }
  .comparison-card p { margin: .8rem 0 0; line-height: 1.5; font-size: var(--c-text-small); }
  @media (min-width: 700px) {
    .controls { grid-template-columns: repeat(2, minmax(0, 1fr)); grid-auto-rows: 1.5rem 2.75rem 2rem; gap: .35rem 1rem; }
    .picker, .character-control, .score { display: grid; grid-row: span 3; grid-template-rows: subgrid; gap: .35rem; }
    .picker::after { content: ''; grid-row: 3; }
    .picker select { grid-row: 2; height: 2.75rem; }
    .character-control :global(.level-control), .score :global(.level-control) { grid-row: span 3; grid-template-rows: subgrid; gap: .35rem; }
    .controls :global(.level-control .stepper button) { min-height: 2.75rem; }
  }
  @media (max-width: 699px) {
    .heroic-creature.loading { min-height: 45rem; }
    .picker select { min-height: 2.875rem; }
  }
</style>
