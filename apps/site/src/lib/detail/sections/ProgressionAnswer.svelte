<script lang="ts">
  import type { CharacterProgression, PublicKindEntry } from '@afallon/contracts/public';
  import EntityLink from '../../EntityLink.svelte';
  import { formatNumber } from '../../format';
  import { CHARACTER_LEVEL } from '../../reader-levels';
  import AnswerCard from '../AnswerCard.svelte';
  import DetailsDisclosure from '../DetailsDisclosure.svelte';
  import LevelControl from '../LevelControl.svelte';
  import { progressionExample } from '../kill-calculator';
  import { cumulativeExperience, journeyShares } from '../level-curve';
  import LevelCurve from './LevelCurve.svelte';

  export let guide: CharacterProgression;
  export let registry: PublicKindEntry[];
  export let level: number;
  export let fallback: number;

  $: example = progressionExample(guide, level);
  $: journey = journeyShares(guide.curve, level);
  $: totals = cumulativeExperience(guide.curve);
  const percent = (share: number) => `${(share * 100).toLocaleString('en-US', { maximumFractionDigits: share < .01 ? 3 : 1 })}%`;
  const count = (low: number, high: number | null) => high === null ? `At least ${formatNumber(low)}` : low === high ? formatNumber(low) : `${formatNumber(low)}–${formatNumber(high)}`;
  const award = (low: number, high: number) => low === high ? formatNumber(low) : `${formatNumber(low)}–${formatNumber(high)}`;
</script>

<div class="progression-answer">
  <AnswerCard title="At Your Level">
    <LevelControl id="progression-character-level" readerId={CHARACTER_LEVEL} label="Character level" min={1} max={guide.curve.cap} {fallback} bind:level />
    <div aria-live="polite" aria-atomic="true" class="answer">
      {#if example.toNext === undefined}
        <p class="amount">Level&nbsp;{formatNumber(level)} is the cap</p>
        <p>You have reached the last level on this curve. There is no next-level experience requirement.</p>
      {:else}
        <p class="amount">{formatNumber(example.toNext)} experience</p>
        <p>To reach level&nbsp;{formatNumber(level + 1)} from level&nbsp;{formatNumber(level)}.</p>
        {#if example.kills}
          <p class="kill-estimate">About {count(example.kills.low, example.kills.high)} kills of <EntityLink ref={example.entry.creature} {registry} /> <span class="no-break">at creature level&nbsp;{formatNumber(example.creatureLevel)}</span>, for {award(example.award.low, example.award.high)} experience per kill.</p>
        {/if}
      {/if}
    </div>
    {#if example.kills}<p class="place">{#if example.group.place}In <EntityLink ref={example.group.place} {registry} />{:else}In {example.group.name}{/if}. This compares repeated normal kills with no living followers or Experience Bonus. Other game and world effects can change your actual experience.</p>{/if}
  </AnswerCard>
  <div class="curve-panel">
    <p>Experience from each level to the next. Each grid line is ten times the one below it.</p>
    <LevelCurve curve={guide.curve} {level} chartOnly />
  </div>
</div>
<div class="journey">
  <h3>Experience Across the Journey</h3>
  <p>You have earned {percent(journey.earned)} of all experience: {formatNumber(totals[level] ?? 0)} of {formatNumber(journey.total)}. {percent(journey.remaining)} remains to level&nbsp;{formatNumber(guide.curve.cap)}.</p>
  <div class="journey-track" role="img" aria-label={`${percent(journey.earned)} of total experience earned by level ${level}`}><span style:width={`${journey.earned * 100}%`}></span></div>
  <p class="journey-note">Levels {formatNumber(Math.max(1, guide.curve.cap - 10))} to {formatNumber(guide.curve.cap)} hold {percent(journey.finalTen)} of all experience. This is how experience is distributed, not an estimate of time played.</p>
</div>

<DetailsDisclosure id="full-level-curve" title="All Levels and Experience Amounts" summary="Every level and its experience breakpoint">
  <div class="c-table-scroll"><table class="c-table c-table--reference" aria-label="Experience breakpoints">
    <thead><tr><th scope="col">From Level</th><th scope="col" class="c-num">To Next Level</th><th scope="col" class="c-num">Total to Reach Level</th></tr></thead>
    <tbody>{#each guide.curve.rows as row}<tr><th scope="row">{formatNumber(row.level)}</th><td class="c-num">{formatNumber(row.toNext)}</td><td class="c-num">{formatNumber(totals[row.level] ?? 0)}</td></tr>{/each}</tbody>
  </table></div>
</DetailsDisclosure>

<style>
  .progression-answer { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1rem; align-items: stretch; }
  .journey p { margin: .55rem 0; }
  .journey, .curve-panel { min-width: 0; padding: 1.25rem 1.35rem; border: 1px solid var(--c-frame); border-radius: .625rem; background: var(--c-surface-1); }
  h3 { margin: 0; color: var(--c-text-strong); font: 600 var(--c-text-lead)/1.3 var(--c-serif); }
  .journey { margin-top: 1rem; }
  .curve-panel p { margin: 0 0 .9rem; color: var(--c-text-dim); line-height: 1.5; }
  .amount { margin: .3rem 0 0; color: var(--c-text-strong); font: 600 1.7rem/1.25 var(--c-serif); font-variant-numeric: tabular-nums; }
  .answer p:not(.amount) { margin: .5rem 0 0; }
  .kill-estimate { border-left: 2px solid var(--c-accent); padding-left: .8rem; line-height: 1.5; }
  .kill-estimate :global(.entity-link), .no-break { white-space: nowrap; }
  .place, .journey-note { color: var(--c-text-dim); font-size: .9rem; line-height: 1.55; }
  .journey-track { height: .9rem; border: 1px solid var(--c-frame); border-radius: 999px; background: var(--c-surface-sunken); overflow: hidden; }
  .journey-track span { display: block; height: 100%; background: var(--c-accent); }
  @media (max-width: 800px) { .progression-answer { grid-template-columns: minmax(0, 1fr); } }
  @media (max-width: 640px) { .journey, .curve-panel { padding: 1rem; } }
</style>
