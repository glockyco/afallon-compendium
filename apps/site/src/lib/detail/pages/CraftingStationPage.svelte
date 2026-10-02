<script lang="ts">
  import { base } from '$app/paths';
  import type { PublicCraftingStation, PublicKindEntry, StationRecipeRow } from '@afallon/contracts/public';
  import EntityLink from '../../EntityLink.svelte';
  import { formatNumber, nameOf } from '../../format';
  import { entityOnMap, entityPlaceOnMap } from '../../map-links';
  import AnswerCard from '../AnswerCard.svelte';
  import DetailFrame from '../DetailFrame.svelte';
  import FactRow from '../FactRow.svelte';
  import FactsCard from '../FactsCard.svelte';
  import PlacesList from '../PlacesList.svelte';
  import { planColumns, type RelationColumn } from '../relation-table';
  import RelationTable from '../RelationTable.svelte';
  import Section from '../Section.svelte';
  import Sections from '../Sections.svelte';
  import TitleBlock from '../TitleBlock.svelte';

  export let document: PublicCraftingStation;
  export let registry: PublicKindEntry[];

  $: icon = document.art.icon ?? document.ref.icon;
  $: spots = document.places.reduce((sum, place) => sum + place.spotCount, 0);
  $: sideFacts = [
    ...(document.recipes.length ? [{ label: 'Recipes', value: formatNumber(document.recipes.length), href: '#recipes' }] : []),
    ...(spots ? [{ label: 'Map spots', value: formatNumber(spots), href: '#where-to-find' }] : []),
    ...(document.places.length ? [{ label: 'Areas', value: formatNumber(document.places.length), href: '#where-to-find' }] : []),
  ];
  $: places = document.places.map((place) => ({
    place: { key: null, label: place.label } as const, spotCount: place.spotCount, nameHref: entityPlaceOnMap(document.ref.key, place),
  }));
  // The station's recipes share one skill, so a Skill column names it only when they do not.
  $: oneSkill = document.skills.length <= 1;
  const columns: RelationColumn<StationRecipeRow>[] = [
    { id: 'recipe', label: 'Product or recipe', value: (row) => nameOf(row.product ?? row.recipe), sort: (row) => nameOf(row.product ?? row.recipe) },
    { id: 'skill', label: 'Skill', value: (row) => row.skill ? nameOf(row.skill) : undefined },
    { id: 'level', label: 'Required level', numeric: true, value: (row) => row.requiredLevel, sort: (row) => row.requiredLevel },
  ];
  $: plan = planColumns(oneSkill ? columns.filter((column) => column.id !== 'skill') : columns, document.recipes);
</script>

<article class="detail-page">
  <DetailFrame>
    <div slot="head">
      <TitleBlock name={document.ref.name} imageUrl={icon ? `${base}/data/${icon.url}` : undefined} typeLine="Crafting station"
        mapHref={spots ? entityOnMap(document.ref.key) : undefined} {registry} />
    </div>

    <div slot="answer">
      <AnswerCard title="Where to find it" id="where-to-find">
        {#if document.description}<p class="description">{document.description}</p>{/if}
        {#if document.places.length}<PlacesList {places} {registry} />{:else}<p>No location of this station is published.</p>{/if}
      </AnswerCard>
    </div>

    <svelte:fragment slot="side">
      <FactsCard facts={sideFacts} title="At a glance">
        {#if document.skills.length}<FactRow label={document.skills.length === 1 ? 'Skill' : 'Skills'}>{#each document.skills as skill, index}{index ? ', ' : ''}<EntityLink ref={skill} {registry} />{/each}</FactRow>{/if}
      </FactsCard>
    </svelte:fragment>
    <Sections>
      {#if document.recipes.length}
        <Section id="recipes" title="Recipes" count={document.recipes.length}>
          <RelationTable columns={plan.columns} rows={document.recipes} label="Recipes" sort={{ id: 'level', dir: 'asc' }}>
            <svelte:fragment slot="cell" let:row let:column>
              {#if column === 'recipe'}<EntityLink ref={row.product ?? row.recipe} {registry} />
              {:else if column === 'skill' && row.skill}<EntityLink ref={row.skill} {registry} />
              {:else if column === 'level' && row.requiredLevel !== undefined}{formatNumber(row.requiredLevel)}{/if}
            </svelte:fragment>
          </RelationTable>
        </Section>
      {/if}
    </Sections>
  </DetailFrame>
</article>

<style>
  .description { color: var(--c-text-dim); line-height: 1.5; }
</style>
