<script lang="ts">
  import type { CharacterProgression, PublicKindEntry, TalentPoints } from '@afallon/contracts/public';
  import EntityLink from '../../EntityLink.svelte';
  import { formatNumber, npcLevelText, rangeText, signedAmount } from '../../format';
  import DetailsDisclosure from '../DetailsDisclosure.svelte';
  import FactList from '../FactList.svelte';
  import FactRow from '../FactRow.svelte';
  import GuideSteps from '../GuideSteps.svelte';
  import Hero from '../Hero.svelte';
  import KillCalculator from '../KillCalculator.svelte';
  import Section from '../Section.svelte';
  import Sections from '../Sections.svelte';
  import TitleBlock from '../TitleBlock.svelte';
  import { ruleNumbers } from '../rule-numbers';
  import LevelCurve from '../sections/LevelCurve.svelte';
  import MechanicsRules from '../sections/MechanicsRules.svelte';

  export let document: CharacterProgression;
  export let registry: PublicKindEntry[];

  // Readers come for the level curve first. The calculator applies the level difference table, so it follows that table.
  // The curve and the calculator share the character level, which starts at the lowest level of the default creature.
  const calculator = document.killCalculator;
  let characterLevel = calculator.groups.flatMap((group) => group.creatures)
    .find((entry) => entry.creature.key === calculator.defaultCreature.key && entry.creature.variant === calculator.defaultCreature.variant)!.level.min;

  $: numbers = ruleNumbers(document.rules);
  $: sources = document.sources;
  $: cap = document.curve.cap;
  // The level modifier rows count the same creatures as the sources, so the rest have no modifier.
  $: withoutModifier = sources.fixedCreatures.count + sources.scalingCreatures.count - sources.levelModifiers.reduce((sum, row) => sum + row.creatures, 0);
  const modifierText = (value: number) => value === 0 ? 'No change' : signedAmount(value, true);

  function pointText(points: TalentPoints, single: boolean): string {
    const name = single ? points.name.toLocaleLowerCase('en-US') : points.name;
    const noun = (count: number) => count === 1 ? name.replace(/s$/i, '') : name;
    const perLevel = points.gains.reduce((sum, gain) => sum + gain.amount, 0);
    const total = points.start + perLevel * (cap - 1);
    // Without game modifiers, a character at the cap has its start amount and one gain for each level below the cap.
    return [
      `A character starts with ${formatNumber(points.start)} ${noun(points.start)} and gains ${formatNumber(perLevel)} at each level-up.`,
      total <= points.max
        ? `That makes ${formatNumber(total)} at level ${formatNumber(cap)}, below the limit of ${formatNumber(points.max)}.`
        : `The limit of ${formatNumber(points.max)} stops the gains before level ${formatNumber(cap)}.`,
      'Game modifiers can change the gain and the limit.',
    ].join(' ');
  }
</script>

<article class="detail-page">
  <TitleBlock name={document.ref.name} {registry} />
  <Hero><p class="c-prose">{document.overview}</p></Hero>
  <Sections>
    <Section id="level-curve" title="Level curve" line={`Character level cap: ${formatNumber(cap)}.`}>
      <LevelCurve curve={document.curve} bind:level={characterLevel} />
    </Section>
    <GuideSteps steps={document.steps} ruleNumbers={numbers} />
    <Section id="talent-points" title="Talent points">
      {#each document.talentPoints as points}
        <div class="point-group">
          {#if document.talentPoints.length > 1}<h3>{points.name}</h3>{/if}
          <p>{pointText(points, document.talentPoints.length === 1)}</p>
        </div>
      {/each}
    </Section>
    <Section id="experience-sources" title="Experience sources">
      <FactList>
        <FactRow label="Creatures at a fixed level">{formatNumber(sources.fixedCreatures.count)}, levels {rangeText(sources.fixedCreatures.minLevel, sources.fixedCreatures.maxLevel)}</FactRow>
        <FactRow label="Creatures that scale with the player">{formatNumber(sources.scalingCreatures.count)}, each within the level range of its zone</FactRow>
        <FactRow label="Quests with experience">{formatNumber(sources.quests.count)}, quest levels up to {formatNumber(sources.quests.maxLevel)}{#if sources.quests.withoutRange}, and {formatNumber(sources.quests.withoutRange)} without a level range{/if}</FactRow>
        {#if sources.quests.maxRequirement !== undefined}<FactRow label="Highest quest level requirement">{formatNumber(sources.quests.maxRequirement)}</FactRow>{/if}
      </FactList>
      {#if sources.scalingCreatures.aboveFixed.length}
        <div class="above-fixed">
          <DetailsDisclosure id="above-fixed-level" title={`Creatures that can spawn above level ${formatNumber(sources.fixedCreatures.maxLevel)}`} summary={`${formatNumber(sources.scalingCreatures.aboveFixed.length)} creatures that scale with the player`}>
            <ul>{#each sources.scalingCreatures.aboveFixed as entry}<li><EntityLink ref={entry.creature} {registry} /> <span class="level">Level {npcLevelText({ ...entry.level, scales: false })}</span></li>{/each}</ul>
          </DetailsDisclosure>
        </div>
      {/if}
      <p class="note">These are the highest levels of these sources. Characters still gain experience at higher levels.</p>
    </Section>
    <Section id="level-difference" title="Level difference">
      <p class="table-intro">Kill experience changes when the creature's level differs from the player's level. Equal levels change nothing.</p>
      <div class="table-scroll"><table>
        <thead><tr><th scope="col">Creatures</th><th scope="col">Creature above the player</th><th scope="col">Creature below the player</th></tr></thead>
        <tbody>
          {#each sources.levelModifiers as row}<tr><td>{formatNumber(row.creatures)}</td><td>{modifierText(row.higher)}</td><td>{modifierText(row.lower)}</td></tr>{/each}
          {#if withoutModifier > 0}<tr><td>{formatNumber(withoutModifier)}</td><td>No change</td><td>No change</td></tr>{/if}
        </tbody>
      </table></div>
    </Section>
    <Section id="try-it-on-a-creature" title="Try it on a creature">
      <KillCalculator guide={document} {registry} bind:characterLevel />
    </Section>
    <Section id="rules-reference" title="Rules reference">
      <MechanicsRules rules={document.rules} {registry} />
    </Section>
  </Sections>
</article>

<style>
  .point-group p, .table-intro { margin: 0 0 .75rem; line-height: 1.55; }
  .point-group p:last-child { margin-bottom: 0; }
  .point-group + .point-group { margin-top: .9rem; }
  /* The facts, the disclosure, and the note are separate blocks, so each starts a block apart from the one above. */
  .above-fixed, .note { margin: 1rem 0 0; }
  .note { color: var(--c-text-dim); line-height: 1.55; }
  ul { margin: 0; padding-left: 1.4rem; line-height: 1.8; }
  .level { color: var(--c-text-dim); }
  h3 { margin: 0 0 .35rem; color: var(--c-text-strong); font: 600 var(--c-text-lead)/1.3 var(--c-serif); }
  .table-scroll { max-width: 100%; overflow-x: auto; }
  table { width: 100%; border-collapse: collapse; text-align: left; font-variant-numeric: tabular-nums; }
  th, td { padding: .55rem .7rem; border-bottom: 1px solid var(--c-line); }
  th { color: var(--c-text-dim); font-weight: 600; }
  td:not(:first-child) { white-space: nowrap; }
</style>
