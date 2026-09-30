<script lang="ts">
  import type { CharacterProgression, PublicKindEntry } from '@afallon/contracts/public';
  import EntityLink from '../../EntityLink.svelte';
  import { npcLevelText, rangeText } from '../../format';
  import Hero from '../Hero.svelte';
  import Section from '../Section.svelte';
  import Sections from '../Sections.svelte';
  import TitleBlock from '../TitleBlock.svelte';
  import LevelCurve from '../sections/LevelCurve.svelte';
  import MechanicsRules from '../sections/MechanicsRules.svelte';

  export let document: CharacterProgression;
  export let registry: PublicKindEntry[];

  const format = (value: number) => value.toLocaleString('en-US', { maximumFractionDigits: 4 });
  $: sources = document.sources;
  $: fixedText = `${format(sources.fixedCreatures.count)} fixed-level creatures with experience have authored levels ${rangeText(sources.fixedCreatures.minLevel, sources.fixedCreatures.maxLevel)}.`;
  $: scalingText = [`${format(sources.scalingCreatures.count)} creatures with experience scale with the player. The zone range of each spawner limits their level.`,
    sources.scalingCreatures.aboveFixed.length ? `These scaling creatures can spawn above level ${format(sources.fixedCreatures.maxLevel)}:` : ''].filter(Boolean).join(' ');
  $: questText = [`${format(sources.quests.count)} quests with experience have a highest quest level of ${format(sources.quests.maxLevel)}.`,
    sources.quests.maxRequirement === undefined ? '' : `The highest level requirement is ${format(sources.quests.maxRequirement)}.`,
    sources.quests.withoutRange ? `${format(sources.quests.withoutRange)} have no level range.` : ''].filter(Boolean).join(' ');
  function gainText(trigger: string): string {
    switch (trigger) {
      case 'characterLevelUp': return 'per character level-up';
      case 'skillLevelUp': return 'per skill level-up';
      case 'npcKilled': return 'per creature killed';
      case 'itemGained': return 'per item gained';
      case 'weaponTemplateLevelUp': return 'per weapon-template level-up';
      default: return 'per recorded event';
    }
  }
  import { ruleNumbers } from '../rule-numbers';
  $: numbers = ruleNumbers(document.rules);
</script>

<article class="detail-page">
  <TitleBlock name={document.ref.name} {registry} />
  <Hero><p class="c-prose">{document.overview}</p></Hero>
  <Sections>
    <div class="guide-flow">
    <Section id="steps" title="Steps">
      <ol class="steps">
        {#each document.steps as step}
          <li id={`step-${step.id}`}><h3>{step.title}</h3><p>{step.text}</p><p class="step-links">{step.rules.length > 1 ? 'Rules' : 'Rule'} {#each step.rules as id, index}{#if index > 0}{', '}{/if}<a class="c-link" href={`#rule-${id}`}>{numbers.get(id)}</a>{/each}</p></li>
        {/each}
      </ol>
    </Section>
    <Section id="worked-example" title="Worked example">
      {#if document.example}<p>A kill of <EntityLink ref={document.example.creature} {registry} /> at level {format(document.example.level)} gives {format(document.example.lowest)}–{format(document.example.highest)} base experience before modifiers.</p>{/if}
    </Section>
    </div>
    <Section id="level-curve" title="Level curve" line={`Character level cap: ${format(document.curve.cap)}.`}>
      <LevelCurve curve={document.curve} />
      <p>The curve shows the experience needed for each next level.</p>
    </Section>
    <Section id="experience-sources" title="Experience sources">
      <div class="prose">
        <p>{fixedText}</p>
        <p>{scalingText}</p>
        {#if document.sources.scalingCreatures.aboveFixed.length}
          <ul>{#each document.sources.scalingCreatures.aboveFixed as entry}<li><EntityLink ref={entry.creature} {registry} />: {npcLevelText(entry.level)}</li>{/each}</ul>
        {/if}
        <p>{questText}</p>
        <p>These are the highest levels of these experience sources, not a limit on earning experience at higher character levels.</p>
      </div>
    </Section>
    <Section id="talent-points" title="Talent points">
      {#each document.talentPoints as points}
        <div class="point-group">
          <h3>{points.name}</h3>
          <p>{[`Starts with ${format(points.start)}.`, ...points.gains.map((gain) => `Gains ${format(gain.amount)} ${gainText(gain.trigger)}.`), `The recorded maximum is ${format(points.max)}. This is a limit, not the points that every character has earned.`].join(' ')}</p>
        </div>
      {/each}
    </Section>
    <Section id="creature-level-modifiers" title="Creature level modifiers">
      <p class="table-intro">The percentages modify kill experience when the creature is lower or higher level than the character. Equal levels receive neither modifier.</p>
      <div class="table-scroll"><table>
        <thead><tr><th scope="col">Creatures</th><th scope="col">Lower-level creature</th><th scope="col">Higher-level creature</th></tr></thead>
        <tbody>{#each document.sources.levelModifiers as row}<tr><td>{format(row.creatures)}</td><td>{row.lower > 0 ? '+' : ''}{format(row.lower)}%</td><td>{row.higher > 0 ? '+' : ''}{format(row.higher)}%</td></tr>{/each}</tbody>
      </table></div>
    </Section>
    <Section id="rules-reference" title="Rules reference">
      <MechanicsRules rules={document.rules} {registry} />
    </Section>
  </Sections>
</article>

<style>
  .guide-flow { display: grid; min-width: 0; gap: 1rem; align-items: start; }
  .guide-flow :global(.section) { min-width: 0; }
  @media (min-width: 1024px) { .guide-flow { grid-template-columns: minmax(0, 1fr) minmax(16rem, .65fr); } }
  .steps li { scroll-margin-top: 2rem; }
  .steps { display: grid; gap: 1rem; margin: 0; padding-left: 1.5rem; }
  .steps li { padding-left: .25rem; }
  .steps h3 { margin: 0 0 .2rem; }
  .steps p { margin: 0; line-height: 1.55; }
  .step-links { margin-top: .25rem !important; color: var(--c-text-dim); font-size: var(--c-text-small); overflow-wrap: anywhere; }
  .prose p, .point-group p, .table-intro { margin: 0 0 .75rem; line-height: 1.55; }
  .prose p:last-child, .point-group p:last-child { margin-bottom: 0; }
  .prose ul { margin: 0 0 .75rem; padding-left: 1.4rem; line-height: 1.6; }
  .point-group + .point-group { margin-top: .9rem; }
  h3 { margin: 0 0 .35rem; color: var(--c-text-strong); font: 600 var(--c-text-lead)/1.3 var(--c-serif); }
  .table-scroll { max-width: 100%; overflow-x: auto; }
  table { width: 100%; border-collapse: collapse; text-align: left; font-variant-numeric: tabular-nums; }
  th, td { padding: .55rem .7rem; border-bottom: 1px solid var(--c-line); }
  th { color: var(--c-text-dim); font-weight: 600; }
  td:not(:first-child) { white-space: nowrap; }
</style>
