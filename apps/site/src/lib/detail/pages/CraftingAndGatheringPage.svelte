<script lang="ts">
  import { base } from '$app/paths';
  import type { CraftingAndGathering, PublicKindEntry } from '@afallon/contracts/public';
  import EntityLink from '../../EntityLink.svelte';
  import { formatNumber } from '../../format';
  import FactList from '../FactList.svelte';
  import FactRow from '../FactRow.svelte';
  import Hero from '../Hero.svelte';
  import GuideSteps from '../GuideSteps.svelte';
  import Section from '../Section.svelte';
  import Sections from '../Sections.svelte';
  import TitleBlock from '../TitleBlock.svelte';
  import MechanicsRules from '../sections/MechanicsRules.svelte';

  export let document: CraftingAndGathering;
  export let registry: PublicKindEntry[];

  $: nodes = registry.find((entry) => entry.kind === 'gatheringNodes' && entry.pages);
  const bandNames: Record<string, string> = { firstFull: 'First full', secondFull: 'Second full', half: 'Half', none: 'None' };
  import { ruleNumbers } from '../rule-numbers';
  $: numbers = ruleNumbers(document.rules);
  const percent = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 });
</script>

<article class="detail-page">
  <TitleBlock name={document.ref.name} {registry} />
  <Hero>
    <p class="c-prose">{document.overview}</p>
    <FactList>
      {#if nodes}<FactRow label="Gathering nodes"><a class="c-link" href={`${base}/${nodes.route}/`}>All gathering nodes</a></FactRow>{/if}
      <FactRow label="Related mechanics"><a class="c-link" href={`${base}/mechanics/character-progression/`}>Character Progression</a></FactRow>
    </FactList>
  </Hero>
  <Sections>
    <GuideSteps steps={document.steps} ruleNumbers={numbers} />
    <Section id="worked-example" title="Worked example">
      <h3>Craft Runeweave Regalia</h3>
      <p><EntityLink ref={document.example.craft.product} {registry} /> needs <EntityLink ref={document.example.craft.skill} {registry} /> level {formatNumber(document.example.craft.rank.requiredLevel)}. The recipe rank gives {formatNumber(document.example.craft.rank.baseExperience)} base experience before skill modifiers.</p>
      {#if document.example.craft.rank.bands.length}
        <div class="table-scroll"><table>
          <thead><tr><th scope="col">Experience band</th><th scope="col">Skill levels</th><th scope="col">Base experience</th></tr></thead>
          <tbody>{#each document.example.craft.rank.bands as band}<tr><th scope="row">{bandNames[band.band]}</th><td>{formatNumber(band.from)}{band.to === undefined ? '+' : `–${formatNumber(band.to)}`}</td><td>{formatNumber(band.experience)}</td></tr>{/each}</tbody>
        </table></div>
      {/if}
      <h3 class="gather-title">Gather Small Iron Vein</h3>
      <p><EntityLink ref={document.example.gather.node} {registry} /> uses <EntityLink ref={document.example.gather.skill} {registry} />. Each listed chance is the chance for one extra item after the loot roll.</p>
      <div class="table-scroll"><table>
        <thead><tr><th scope="col">Skill level</th><th scope="col">Extra item chance</th></tr></thead>
        <tbody>{#each document.example.gather.levelChances as row}<tr><td>{formatNumber(row.level)}</td><td>{percent.format(row.chance)}%</td></tr>{/each}</tbody>
      </table></div>
    </Section>
    <Section id="spawner-examples" title="Spawner examples">
      {#each document.spawnerExamples as example}
        <div class="example">
          <h3>{#if example.skill}<EntityLink ref={example.skill} {registry} />{:else}Spawner{/if} example</h3>
          <p class="table-intro">The most common {example.skill && 'name' in example.skill ? example.skill.name : ''} spawner options serve {formatNumber(example.spawners)} {example.spawners === 1 ? 'spawner' : 'spawners'}. Each weight moves in a straight line from level 1 to level {formatNumber(example.skillCap)}.</p>
          <div class="table-scroll"><table>
            <thead><tr><th scope="col">Node</th><th scope="col">Weight at level 1</th><th scope="col">Weight at level {formatNumber(example.skillCap)}</th><th scope="col">Minimum weight</th></tr></thead>
            <tbody>{#each example.options as option}<tr><td><EntityLink ref={option.node} {registry} /></td><td>{formatNumber(option.lowSkillWeight)}</td><td>{formatNumber(option.highSkillWeight)}</td><td>{formatNumber(option.teaserWeight)}</td></tr>{/each}</tbody>
          </table></div>
        </div>
      {/each}
    </Section>
    <Section id="rules-reference" title="Rules reference">
      <MechanicsRules rules={document.rules} {registry} />
    </Section>
  </Sections>
</article>

<style>
  h3 { margin: 0 0 .35rem; color: var(--c-text-strong); font: 600 var(--c-text-lead)/1.3 var(--c-serif); }
  /* Section text only: the overview paragraph keeps the shared prose style. */
  :global(.c-sections) p { margin: 0 0 .6rem; line-height: 1.55; }
  .example + .example, .gather-title { margin-top: 1.2rem; }
  .table-intro { color: var(--c-text-dim); }
  .table-scroll { max-width: 100%; overflow-x: auto; margin: .4rem 0 1rem; }
  table { width: 100%; border-collapse: collapse; text-align: left; font-variant-numeric: tabular-nums; }
  th, td { padding: .5rem .7rem; border-bottom: 1px solid var(--c-line); }
  th { color: var(--c-text-dim); font-weight: 600; }
  td:not(:first-child), th:not(:first-child) { text-align: right; white-space: nowrap; }
</style>
