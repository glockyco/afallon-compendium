<script lang="ts">
  import { base } from '$app/paths';
  import type { PublicKindEntry, PublicSkill, SkillGatheringNodeRow, SkillRecipeRow } from '@afallon/contracts/public';
  import EntityLink from '../../EntityLink.svelte';
  import Requirements from '../../Requirements.svelte';
  import { formatNumber, nameOf } from '../../format';
  import FactList from '../FactList.svelte';
  import FactRow from '../FactRow.svelte';
  import Hero from '../Hero.svelte';
  import { planColumns, type RelationColumn } from '../relation-table';
  import RelationTable from '../RelationTable.svelte';
  import Section from '../Section.svelte';
  import TitleBlock from '../TitleBlock.svelte';
  import Sections from '../Sections.svelte';
  import LevelCurve from '../sections/LevelCurve.svelte';

  export let document: PublicSkill;
  export let registry: PublicKindEntry[];

  $: facts = document.facts;
  // Stations appear only in the recipe rows, because the catalog records no station entities.
  const columns: RelationColumn<SkillRecipeRow>[] = [
    { id: 'recipe', label: 'Recipe', value: (row) => nameOf(row.recipe), sort: (row) => nameOf(row.recipe) },
    { id: 'product', label: 'Makes', value: (row) => row.product ? nameOf(row.product) : undefined, sort: (row) => row.product ? nameOf(row.product) : '' },
    { id: 'station', label: 'Station', value: (row) => row.station ? nameOf(row.station) : undefined, sort: (row) => row.station ? nameOf(row.station) : '' },
  ];
  $: plan = planColumns(columns, document.recipes);
  const nodeColumns: RelationColumn<SkillGatheringNodeRow>[] = [
    { id: 'node', label: 'Gathering node', value: (row) => nameOf(row.node), sort: (row) => nameOf(row.node) },
    { id: 'requirements', label: 'Requirements', value: (row) => row.requirements.length ? row.requirements.flatMap((group) => group.requirements.map((requirement) => requirement.label)).join(', ') : undefined },
    { id: 'experience', label: 'Skill experience', numeric: true, value: (row) => row.experience, sort: (row) => row.experience },
  ];
  $: nodePlan = planColumns(nodeColumns, document.gatheringNodes);
  $: experience = document.experience;
  $: hasSource = experience.autoAttack !== undefined || experience.crafting || experience.gathering;
</script>

<article class="detail-page">
  <TitleBlock name={document.ref.name} {registry} />

  <Hero>
    {#if document.description}<p class="c-prose">{document.description}</p>{/if}
    <FactList>
      {#if facts.highestLevel !== undefined}<FactRow label="Highest level" href={document.curve ? '#levels' : undefined}>{facts.highestLevel}</FactRow>{/if}
      <FactRow label="Learned">{facts.automatic ? 'Automatically' : 'Not automatically'}</FactRow>
      <FactRow label="Related mechanics"><a class="c-link" href={`${base}/mechanics/character-progression/`}>Character Progression</a></FactRow>
      {#if document.recipes.length}<FactRow label="Recipes" href="#recipes">{document.recipes.length}</FactRow>{/if}
      {#if document.gatheringNodes.length}<FactRow label="Gathering nodes" href="#gathering-nodes">{document.gatheringNodes.length}</FactRow>{/if}
    </FactList>
  </Hero>

  <Sections>
    {#if document.curve}
      <Section id="levels" title="Levels" icon="talent">
        <LevelCurve curve={document.curve} subject={document.ref.name} />
      </Section>
    {/if}
    {#if document.recipes.length}
      <Section id="recipes" title="Recipes" icon="recipe" count={document.recipes.length}>
        <RelationTable columns={plan.columns} rows={document.recipes} label="Recipes">
          <svelte:fragment slot="cell" let:row let:column>
            {#if column === 'recipe'}<EntityLink ref={row.recipe} {registry} />
            {:else if column === 'product' && row.product}<EntityLink ref={row.product} {registry} />
            {:else if column === 'station' && row.station}<EntityLink ref={row.station} {registry} />{/if}
          </svelte:fragment>
        </RelationTable>
      </Section>
    {/if}
    {#if document.gatheringNodes.length}
      <Section id="gathering-nodes" title="Gathering nodes" icon="gather" count={document.gatheringNodes.length}>
        <RelationTable columns={nodePlan.columns} rows={document.gatheringNodes} label="Gathering nodes">
          <svelte:fragment slot="cell" let:row let:column>
            {#if column === 'node'}<EntityLink ref={row.node} {registry} />
            {:else if column === 'requirements'}<Requirements requirements={row.requirements} {registry} kindLabels={false} />
            {:else if column === 'experience'}{row.experience === undefined ? '' : formatNumber(row.experience)}{/if}
          </svelte:fragment>
        </RelationTable>
      </Section>
    {/if}
    <Section id="experience" title="How to gain experience" icon="text">
      <ul class="sources">
        {#if experience.autoAttack}<li>Each auto-attack hit with a weapon of this type gives {formatNumber(experience.autoAttack.perHit)} experience while the skill is below its highest level.</li>{/if}
        {#if experience.crafting}<li>A craft of one of its recipes gives base experience that depends on the skill level. Each recipe page shows its bands.</li>{/if}
        {#if experience.gathering}<li>Each use of one of its gathering nodes gives that node's skill experience, at every skill level.</li>{/if}
        {#if !hasSource}<li>This build has no verified way to give this skill experience.</li>{/if}
      </ul>
      <p class="note">Each award then passes through the skill experience rules of <a class="c-link" href={`${base}/mechanics/character-progression/`}>Character Progression</a>. <a class="c-link" href={`${base}/mechanics/crafting-and-gathering/`}>Crafting and Gathering</a> explains crafts and nodes.</p>
    </Section>
  </Sections>
</article>

<style>
  .sources { margin: 0; padding-left: 1.3rem; display: grid; gap: .5rem; line-height: 1.55; }
  .note { margin: .8rem 0 0; line-height: 1.55; color: var(--c-text-dim); }
</style>
