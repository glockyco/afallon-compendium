<script lang="ts">
  import { base } from '$app/paths';
  import type { PublicClass, PublicKindEntry, StartingItemRow } from '@afallon/contracts/public';
  import EntityLink from '../../EntityLink.svelte';
  import { nameOf } from '../../format';
  import { talentPointText } from '../../progression-format';
  import AnswerCard from '../AnswerCard.svelte';
  import DetailFrame from '../DetailFrame.svelte';
  import { planColumns, type RelationColumn } from '../relation-table';
  import RelationTable from '../RelationTable.svelte';
  import Section from '../Section.svelte';
  import Sections from '../Sections.svelte';
  import StatStrip from '../StatStrip.svelte';
  import TabSet from '../TabSet.svelte';
  import TitleBlock from '../TitleBlock.svelte';
  import TalentTreeSection from '../sections/TalentTreeSection.svelte';

  export let document: PublicClass;
  export let registry: PublicKindEntry[];

  $: facts = document.facts;
  $: stats = [
    ...(facts.races.length ? [{ label: 'Races', value: facts.races.join(', ') }] : []),
    ...(facts.highestLevel ? [{ label: 'Highest level', value: String(facts.highestLevel), href: `${base}/mechanics/character-progression/` }] : []),
    ...(document.trees.length ? [{ label: 'Talent trees', value: String(document.trees.length) }] : []),
  ];
  $: tabs = document.trees.map((tree) => ({ key: tree.anchor, label: tree.name, anchors: [tree.anchor, ...tree.rows.map((row) => row.anchor)] }));
  const gearColumns: RelationColumn<StartingItemRow>[] = [
    { id: 'item', label: 'Item', value: (row) => nameOf(row.item), sort: (row) => nameOf(row.item) },
    { id: 'count', label: 'Quantity', numeric: true, value: (row) => row.count, whenShared: (value) => value === 1 ? 'omit' : 'keep' },
    { id: 'equipped', label: 'Equipped', value: (row) => row.equipped ? 'Yes' : 'No' },
  ];
  $: gearPlan = planColumns(gearColumns, document.startingGear);
</script>

<article class="detail-page">
  <DetailFrame>
    <div slot="head"><TitleBlock name={document.ref.name} imageUrl={document.art.icon ? `${base}/data/${document.art.icon.url}` : undefined} {registry}><StatStrip {stats} /></TitleBlock></div>
    <div slot="answer"><AnswerCard title="Playstyle">
      {#if document.description}<p class="description">{document.description}</p>{/if}
      {#if facts.autoAttack}<p>Auto attack: <EntityLink ref={facts.autoAttack} {registry} /></p>{/if}
    </AnswerCard></div>
    <div slot="side" class="side-facts">
      {#if facts.talentPoints.length}<section><h2>Talent points</h2>{#each facts.talentPoints as points}<p>{#if points.name.toLocaleLowerCase() !== 'talent points'}<strong>{points.name}: </strong>{/if}{talentPointText(points)}</p>{/each}</section>{/if}
      {#if facts.weapons.length}<section><h2>Weapons</h2><ul class="weapons">{#each facts.weapons as weapon}<li>{weapon}</li>{/each}</ul></section>{/if}
      <a class="c-link" href={`${base}/mechanics/character-progression/`}>Character Progression</a>
    </div>
    <Sections>
      {#if document.startingGear.length}
        <Section id="starting-gear" title="Starting gear" count={document.startingGear.length}>
          <RelationTable columns={gearPlan.columns} rows={document.startingGear} label="Starting gear">
            <svelte:fragment slot="cell" let:row let:column>
              {#if column === 'item'}<EntityLink ref={row.item} {registry} />{:else if column === 'count'}{row.count}{:else}{row.equipped ? 'Yes' : 'No'}{/if}
            </svelte:fragment>
          </RelationTable>
        </Section>
      {/if}
      {#if document.trees.length}
        <Section id="talent-trees" title="Talent trees">
          <TabSet {tabs} label="Talent trees" idPrefix="class-trees" let:key>
            {#each document.trees.filter((tree) => tree.anchor === key) as tree (tree.anchor)}<TalentTreeSection {tree} {registry} />{/each}
          </TabSet>
        </Section>
      {/if}
    </Sections>
  </DetailFrame>
</article>

<style>
  .description { white-space: pre-line; }
  .side-facts { display: grid; gap: 1rem; padding: 1rem; border: 1px solid var(--c-line-soft); border-radius: var(--c-radius); background: var(--c-surface-1); }
  h2 { margin-bottom: .75rem; color: var(--c-text-strong); font: 700 1.2rem/1.3 var(--c-serif); }
  .side-facts p { color: var(--c-text-dim); }
  .side-facts p + p { margin-top: .45rem; }
  .side-facts > a { width: fit-content; }
  .side-facts strong { color: var(--c-text-strong); }
  .weapons { display: flex; flex-wrap: wrap; gap: .4rem; padding: 0; list-style: none; }
  .weapons li { padding: .25rem .5rem; border: 1px solid var(--c-line-soft); border-radius: var(--c-radius-sm); color: var(--c-text-dim); font-size: .875rem; }
</style>
