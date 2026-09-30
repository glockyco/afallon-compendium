<script lang="ts">
  import { base } from '$app/paths';
  import type { PublicClass, PublicKindEntry, StartingItemRow } from '@afallon/contracts/public';
  import EntityLink from '../../EntityLink.svelte';
  import { nameOf } from '../../format';
  import { talentPointText } from '../../progression-format';
  import TalentTreeSection from '../sections/TalentTreeSection.svelte';
  import FactList from '../FactList.svelte';
  import FactRow from '../FactRow.svelte';
  import Hero from '../Hero.svelte';
  import { planColumns, type RelationColumn } from '../relation-table';
  import RelationTable from '../RelationTable.svelte';
  import Section from '../Section.svelte';
  import TitleBlock from '../TitleBlock.svelte';
  import Sections from '../Sections.svelte';

  export let document: PublicClass;
  export let registry: PublicKindEntry[];

  $: facts = document.facts;
  const gearColumns: RelationColumn<StartingItemRow>[] = [
    { id: 'item', label: 'Item', value: (row) => nameOf(row.item), sort: (row) => nameOf(row.item) },
    { id: 'count', label: 'Quantity', numeric: true, value: (row) => row.count, whenShared: (value) => value === 1 ? 'omit' : 'keep' },
    { id: 'equipped', label: 'Equipped', value: (row) => row.equipped ? 'Yes' : 'No' },
  ];
  $: gearPlan = planColumns(gearColumns, document.startingGear);
</script>

<article class="detail-page">
  <TitleBlock name={document.ref.name} {registry} />

  <Hero>
    {#if document.description}<p class="c-prose">{document.description}</p>{/if}
    <FactList>
      {#if facts.races.length}<FactRow label="Races">{facts.races.join(', ')}</FactRow>{/if}
      {#if facts.weapons.length}<FactRow label="Weapons">{facts.weapons.join(', ')}</FactRow>{/if}
      {#if facts.autoAttack}<FactRow label="Auto attack"><EntityLink ref={facts.autoAttack} {registry} /></FactRow>{/if}
      {#each facts.talentPoints as points}<FactRow label={points.name} rules={document.placedRules.filter((entry) => entry.target === 'talent-points')} {registry}>{talentPointText(points)}</FactRow>{/each}
      {#if facts.highestLevel !== undefined}<FactRow label="Highest level" href={`${base}/mechanics/character-progression/`}>{facts.highestLevel}</FactRow>{/if}
      <FactRow label="Related mechanics"><a class="c-link" href={`${base}/mechanics/character-progression/`}>Character Progression</a></FactRow>
    </FactList>
  </Hero>

  <Sections>
    {#each document.trees as tree (tree.anchor)}<TalentTreeSection {tree} {registry} />{/each}
    {#if document.startingGear.length}
      <Section id="starting-gear" title="Starting gear" icon="loot" count={document.startingGear.length}>
        <RelationTable columns={gearPlan.columns} rows={document.startingGear} label="Starting gear">
          <svelte:fragment slot="cell" let:row let:column>
            {#if column === 'item'}<EntityLink ref={row.item} {registry} />{:else if column === 'count'}{row.count}{:else}{row.equipped ? 'Yes' : 'No'}{/if}
          </svelte:fragment>
        </RelationTable>
      </Section>
    {/if}
  </Sections>
</article>
