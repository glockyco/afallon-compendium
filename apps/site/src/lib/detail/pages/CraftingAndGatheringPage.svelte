<script lang="ts">
  import { base } from '$app/paths';
  import type { CraftingAndGathering, MechanicsRule, PublicKindEntry } from '@afallon/contracts/public';
  import EntityLink from '../../EntityLink.svelte';
  import { formatNumber } from '../../format';
  import FactList from '../FactList.svelte';
  import FactRow from '../FactRow.svelte';
  import Hero from '../Hero.svelte';
  import Section from '../Section.svelte';
  import Sections from '../Sections.svelte';
  import TitleBlock from '../TitleBlock.svelte';
  import MechanicsRules from '../sections/MechanicsRules.svelte';

  export let document: CraftingAndGathering;
  export let registry: PublicKindEntry[];

  const ruleSections = [
    { id: 'crafting', title: 'Crafting' },
    { id: 'crafting-experience', title: 'Crafting experience' },
    { id: 'node-selection', title: 'Node selection' },
    { id: 'node-availability', title: 'Node availability' },
    { id: 'node-rewards', title: 'Node rewards' },
    { id: 'attunement', title: 'Attunement' },
    { id: 'skill-experience', title: 'Skill experience' },
  ];
  $: nodes = registry.find((entry) => entry.kind === 'gatheringNodes' && entry.pages);
  function rulesFor(section: string): MechanicsRule[] {
    return document.rules.filter((rule) => rule.section === section);
  }
</script>

<article class="detail-page">
  <TitleBlock name={document.ref.name} {registry} />
  <Hero>
    {#if document.description}<p class="c-prose">{document.description}</p>{/if}
    <FactList>
      {#if nodes}<FactRow label="Gathering nodes"><a class="c-link" href={`${base}/${nodes.route}/`}>All gathering nodes</a></FactRow>{/if}
      <FactRow label="Related mechanics"><a class="c-link" href={`${base}/mechanics/character-progression/`}>Character Progression</a></FactRow>
    </FactList>
  </Hero>
  <Sections>
    {#each ruleSections as group}
      {#if rulesFor(group.id).length}
        <Section id={group.id} title={group.title} icon="text">
          <MechanicsRules rules={rulesFor(group.id)} {registry} />
          {#if group.id === 'node-selection'}
            {#each document.spawnerExamples as example}
              <div class="example">
                <h3>{#if example.skill}<EntityLink ref={example.skill} {registry} />{:else}Spawner{/if} example</h3>
                <p class="table-intro">The most common {example.skill && 'name' in example.skill ? example.skill.name : ''} spawner options, used by {formatNumber(example.spawners)} {example.spawners === 1 ? 'spawner' : 'spawners'}. Each weight moves in a straight line from level 1 to level {formatNumber(example.skillCap)}.</p>
                <div class="table-scroll"><table>
                  <thead><tr><th scope="col">Node</th><th scope="col">Weight at level 1</th><th scope="col">Weight at level {formatNumber(example.skillCap)}</th><th scope="col">Minimum weight</th></tr></thead>
                  <tbody>{#each example.options as option}<tr><td><EntityLink ref={option.node} {registry} /></td><td>{formatNumber(option.lowSkillWeight)}</td><td>{formatNumber(option.highSkillWeight)}</td><td>{formatNumber(option.teaserWeight)}</td></tr>{/each}</tbody>
                </table></div>
              </div>
            {/each}
          {/if}
        </Section>
      {/if}
    {/each}
  </Sections>
</article>

<style>
  .example { margin-top: 1.2rem; }
  h3 { margin: 0 0 .35rem; color: var(--c-text-strong); font: 600 var(--c-text-lead)/1.3 var(--c-serif); }
  .table-intro { margin: 0 0 .5rem; line-height: 1.55; color: var(--c-text-dim); }
  .table-scroll { max-width: 100%; overflow-x: auto; }
  table { width: 100%; border-collapse: collapse; text-align: left; font-variant-numeric: tabular-nums; }
  th, td { padding: .5rem .7rem; border-bottom: 1px solid var(--c-line); }
  th { color: var(--c-text-dim); font-weight: 600; }
  td:not(:first-child), th:not(:first-child) { text-align: right; white-space: nowrap; }
</style>
