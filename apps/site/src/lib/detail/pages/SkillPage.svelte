<script lang="ts">
  import type { PublicKindEntry, PublicSkill, SkillRecipeRow } from '@afallon/contracts/public';
  import EntityLink from '../../EntityLink.svelte';
  import { nameOf } from '../../format';
  import ExperienceSection from '../sections/ExperienceSection.svelte';
  import FactList from '../FactList.svelte';
  import FactRow from '../FactRow.svelte';
  import Hero from '../Hero.svelte';
  import { planColumns, type RelationColumn } from '../relation-table';
  import RelationTable from '../RelationTable.svelte';
  import Section from '../Section.svelte';
  import TitleBlock from '../TitleBlock.svelte';
  import Sections from '../Sections.svelte';

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
</script>

<article class="detail-page">
  <TitleBlock name={document.ref.name} {registry} />

  <Hero>
    {#if document.description}<p class="c-prose">{document.description}</p>{/if}
    <FactList>
      {#if facts.highestLevel !== undefined}<FactRow label="Highest level" href={document.experience.length ? '#experience' : undefined}>{facts.highestLevel}</FactRow>{/if}
      <FactRow label="Learned">{facts.automatic ? 'Automatically' : 'Not automatically'}</FactRow>
      {#if document.recipes.length}<FactRow label="Recipes" href="#recipes">{document.recipes.length}</FactRow>{/if}
    </FactList>
  </Hero>

  <Sections>
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
    <ExperienceSection rows={document.experience} />
  </Sections>
</article>
