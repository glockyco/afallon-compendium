<script lang="ts">
  import type { CharacterProgression, MechanicsRule, PublicKindEntry } from '@afallon/contracts/public';
  import EntityLink from '../../EntityLink.svelte';
  import { rangeText } from '../../format';
  import Hero from '../Hero.svelte';
  import Section from '../Section.svelte';
  import Sections from '../Sections.svelte';
  import TitleBlock from '../TitleBlock.svelte';
  import LevelCurve from '../sections/LevelCurve.svelte';
  import MechanicsRules from '../sections/MechanicsRules.svelte';

  export let document: CharacterProgression;
  export let registry: PublicKindEntry[];

  const format = (value: number) => value.toLocaleString('en-US', { maximumFractionDigits: 4 });
  const ruleSections = [
    { id: 'all-experience', title: 'All experience' },
    { id: 'kill-experience', title: 'Kill experience' },
    { id: 'quest-experience', title: 'Quest experience' },
    { id: 'skill-experience', title: 'Skill experience' },
  ];
  function rulesFor(section: string): MechanicsRule[] {
    return document.rules.filter((rule) => rule.section === section);
  }
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
</script>

<article class="detail-page">
  <TitleBlock name={document.ref.name} {registry} />
  {#if document.description}<Hero><p class="c-prose">{document.description}</p></Hero>{/if}
  <Sections>
    <Section id="level-curve" title="Level curve" icon="talent" line={`Character level cap: ${format(document.curve.cap)}.`}>
      <LevelCurve curve={document.curve} />
      <MechanicsRules rules={rulesFor('level-curve')} {registry} />
    </Section>
    <Section id="experience-sources" title="Experience sources" icon="creature">
      <div class="prose">
        <p>{format(document.sources.fixedCreatures.count)} fixed-level creatures with experience have authored levels {rangeText(document.sources.fixedCreatures.minLevel, document.sources.fixedCreatures.maxLevel)}. The highest authored fixed-creature level is {format(document.sources.fixedCreatures.maxLevel)}.</p>
        <p>{format(document.sources.scalingCreatures.count)} creatures with experience scale with the player. They are separate from the fixed-level range.</p>
        {#if document.sources.scalingCreatures.aboveFixed.length}
          <p>Scaling creatures whose authored range exceeds the fixed-level maximum:</p>
          <ul>{#each document.sources.scalingCreatures.aboveFixed as entry}<li><EntityLink ref={entry.creature} {registry} />: authored levels {rangeText(entry.minLevel, entry.maxLevel)}</li>{/each}</ul>
        {/if}
        <p>{format(document.sources.quests.count)} quests with experience have a highest authored quest level of {format(document.sources.quests.maxLevel)}{#if document.sources.quests.maxRequirement !== undefined} and a highest level requirement of {format(document.sources.quests.maxRequirement)}{/if}. {#if document.sources.quests.withoutRange}{format(document.sources.quests.withoutRange)} have no authored level range.{/if}</p>
        <p>These are the highest authored levels of these experience sources, not a limit on earning experience at higher character levels.</p>
      </div>
    </Section>
    {#each ruleSections as group}
      <Section id={group.id} title={group.title} icon="text">
        <MechanicsRules rules={rulesFor(group.id)} {registry} />
      </Section>
    {/each}
    <Section id="talent-points" title="Talent points" icon="talent">
      {#each document.talentPoints as points}
        <div class="point-group">
          <h3>{points.name}</h3>
          <p>Starts with {format(points.start)}. {#each points.gains as gain}{format(gain.amount)} {gainText(gain.trigger)}. {/each}The recorded maximum is {format(points.max)}. This is a limit, not the points that every character has earned.</p>
        </div>
      {/each}
      <MechanicsRules rules={rulesFor('talent-points')} {registry} />
    </Section>
    <Section id="creature-level-modifiers" title="Creature level modifiers" icon="creature">
      <p class="table-intro">The percentages modify kill experience when the creature is lower or higher level than the character. Equal levels receive neither modifier.</p>
      <div class="table-scroll"><table>
        <thead><tr><th scope="col">Creatures</th><th scope="col">Lower-level creature</th><th scope="col">Higher-level creature</th></tr></thead>
        <tbody>{#each document.sources.levelModifiers as row}<tr><td>{format(row.creatures)}</td><td>{row.lower > 0 ? '+' : ''}{format(row.lower)}%</td><td>{row.higher > 0 ? '+' : ''}{format(row.higher)}%</td></tr>{/each}</tbody>
      </table></div>
    </Section>
  </Sections>
</article>

<style>
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
