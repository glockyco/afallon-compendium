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
  import LevelSlider from './LevelSlider.svelte';
  import ReaderLevel from './ReaderLevel.svelte';

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
        else throw new Error('No published eligible creature encounter is available.');
      } catch (cause) { error = cause instanceof Error ? cause.message : String(cause); }
      finally { loading = false; }
    })();
  });
</script>

<div class="heroic-creature" class:loading>
  <p class="intro">Compare a creature at a place where Heroic Tier can be active. Empowerment and its rewards depend on the encounter.</p>
  {#if loading}<p role="status">Loading Creatures…</p>{:else if error}<p role="alert">{error}</p>{:else if chosen && progression && settings && strength}
    <div class="controls">
      <label class="picker">Creature And Place
        <select value={selected} on:change={(event) => selectCreature(event.currentTarget.value)}>
          {#each choices as choice}
            <option value={choice.id}>{choice.entry.creature.name}, {choice.place.name}, level {npcLevelText({ ...choice.entry.level, scales: false })}</option>
          {/each}
        </select>
      </label>
      <ReaderLevel id="heroic-character-level" readerId={CHARACTER_LEVEL} label="Your Character Level" min={1} max={progression.curve.cap} fallback={23} bind:level={characterLevel} />
      {#if spawnLevels.length > 1}<label class="picker short">Creature Level
        <select value={creatureLevel} on:change={(event) => { creatureLevel = Number(event.currentTarget.value); }}>
          {#each spawnLevels as level}<option value={level}>{formatNumber(level)}</option>{/each}
        </select>
      </label>{/if}
      <div class="score"><LevelSlider id="heroic-gear-score" label="Your Equipped Gear Score" min={0} max={1250} level={score} onSelect={setReaderGearScore} /></div>
    </div>
    <p class="source"><EntityLink ref={chosen.entry.creature} {registry} /> in <EntityLink ref={chosen.place} {registry} /> at level {formatNumber(creatureLevel)}.</p>
    <div class="cards" aria-live="polite" aria-atomic="true">
      <div class="card"><h4>Normal</h4><dl>
        <div><dt>Maximum Health</dt><dd>1×</dd></div><div><dt>Damage</dt><dd>1×</dd></div>
        <div><dt>Kill Experience</dt><dd>{characterLevel >= progression.curve.cap ? 'Level Cap' : normal ? xp(normal) : 'Unavailable'}</dd></div>
      </dl></div>
      <div class="card changed"><h4>If Empowered</h4><dl>
        <div><dt>Maximum Health</dt><dd>{exact.format(strength.health)}×</dd></div><div><dt>Damage</dt><dd>{exact.format(strength.damage)}×</dd></div>
        <div><dt>Kill Experience</dt><dd>{characterLevel >= progression.curve.cap ? 'Level Cap' : empowered ? xp(empowered) : 'Unavailable'}{characterLevel < progression.curve.cap && empowered ? ` (${exact.format(settings.killExperienceMultiplier)}×)` : ''}</dd></div>
      </dl><p><a class="c-link" href="#affixes">Affixes</a> may further change combat. Rare and Boss creatures always get at least one. With Essence points, empowered kills add <a class="c-link" href="#essence">Heroic Essence</a> toward your Heroic Ascension talents. If this creature drops eligible equipment, it may be <a class="c-link" href="#heroic-gear">Heroic gear</a>. No particular item is guaranteed.</p></div>
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
  .short select { max-width: 8rem; }
  .score { max-width: 28rem; min-width: 0; }
  .cards { display: grid; gap: 1rem; }
  .card { box-sizing: border-box; min-width: 0; padding: 1rem; border: 1px solid var(--c-line); border-radius: var(--c-radius-sm); background: var(--c-surface); }
  .changed { border-color: var(--c-frame); background: var(--c-surface-sunken); }
  h4 { margin: 0 0 .7rem; color: var(--c-text-strong); font: 600 var(--c-text-lead)/1.3 var(--c-serif); }
  dl { margin: 0; } dl div { display: flex; justify-content: space-between; align-items: baseline; gap: .7rem; padding: .45rem 0; border-bottom: 1px solid var(--c-line-soft); }
  dt { color: var(--c-text-dim); } dd { margin: 0; color: var(--c-text-strong); font-weight: 600; font-variant-numeric: tabular-nums; text-align: right; }
  .card p { margin: .8rem 0 0; line-height: 1.5; font-size: var(--c-text-small); }
  @media (min-width: 700px) { .controls { grid-template-columns: repeat(2, minmax(0, 1fr)); } .cards { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
  @media (max-width: 699px) { .heroic-creature.loading { min-height: 45rem; } }
</style>
