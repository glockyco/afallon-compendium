<script lang="ts">
  import { base } from '$app/paths';
  import type { PublicClass, PublicKindEntry, StartingItemRow } from '@afallon/contracts/public';
  import EntityLink from '../../EntityLink.svelte';
  import { formatNumber, nameOf } from '../../format';
  import { talentPointText } from '../../progression-format';
  import AnswerCard from '../AnswerCard.svelte';
  import DetailFrame from '../DetailFrame.svelte';
  import FactsCard from '../FactsCard.svelte';
  import FactRow from '../FactRow.svelte';
  import HowItWorks from '../HowItWorks.svelte';
  import { planColumns, type RelationColumn } from '../relation-table';
  import RelationTable from '../RelationTable.svelte';
  import Section from '../Section.svelte';
  import Sections from '../Sections.svelte';
  import SideCard from '../SideCard.svelte';
  import TabSet from '../TabSet.svelte';
  import TitleBlock from '../TitleBlock.svelte';
  import TalentTreeSection from '../sections/TalentTreeSection.svelte';
  import TalentWeb from '../sections/TalentWeb.svelte';

  export let document: PublicClass;
  export let registry: PublicKindEntry[];

  $: facts = document.facts;
  $: talentGuide = document.placedRules.find((rule) => rule.target === 'talent-points');
  $: classFacts = [
    ...(facts.highestLevel ? [{ label: 'Highest level', value: String(facts.highestLevel), href: `${base}/mechanics/character-progression/` }] : []),
  ];
  $: tabs = document.trees.map((tree) => ({ key: tree.anchor, label: tree.name, anchors: [tree.anchor, ...tree.rows.map((row) => row.anchor)] }));
  $: allAnchors = tabs.flatMap((tab) => tab.anchors);
  $: views = [{ key: 'web', label: 'Web', anchors: allAnchors }, { key: 'list', label: 'List', anchors: allAnchors }];
  // Most trees of a class spend Talent Points. A tree that spends other points, such as Heroic Essence, says so.
  $: pointCounts = document.trees.reduce((counts, tree) => counts.set(tree.points, (counts.get(tree.points) ?? 0) + 1), new Map<string | undefined, number>());
  $: commonPoints = [...pointCounts].sort((a, b) => b[1] - a[1])[0]?.[0];
  const gearColumns: RelationColumn<StartingItemRow>[] = [
    { id: 'item', label: 'Item', value: (row) => nameOf(row.item), sort: (row) => nameOf(row.item) },
    { id: 'count', label: 'Quantity', numeric: true, value: (row) => row.count, whenShared: (value) => value === 1 ? 'omit' : 'keep' },
    { id: 'equipped', label: 'Equipped', value: (row) => row.equipped ? 'Yes' : 'No', whenShared: (value) => value === 'Yes' ? 'heading' : 'keep' },
  ];
  $: gearPlan = planColumns(gearColumns, document.startingGear);
  // Weapons follow the class's weapon types, and the game sets no class rule for armor.
  $: gearHref = `${base}/items/?class=${encodeURIComponent(document.ref.name)}&itemType=WEAPON&itemType=ARMOR`;
</script>

<article class="detail-page">
  <DetailFrame>
    <div slot="head"><TitleBlock name={document.ref.name} imageUrl={document.art.icon ? `${base}/data/${document.art.icon.url}` : undefined} {registry} /></div>
    <div slot="answer"><AnswerCard title="Playstyle">
      {#if document.description}<p class="description">{document.description}</p>{/if}
      {#if facts.autoAttack}<p>Auto attack: <EntityLink ref={facts.autoAttack} {registry} /></p>{/if}
    </AnswerCard></div>
    <!-- The side stays in view beside the trees: the points that the class earns, what learning each tree in full costs,
         and the gear that it can use. -->
    <div slot="side" class="side-content">
      <FactsCard facts={classFacts} title="At a Glance">
        {#if facts.races.length}<FactRow label="Races"><span class="race-links">{#each facts.races as race}<EntityLink ref={race} {registry} />{/each}</span></FactRow>{/if}
      </FactsCard>
      {#if document.trees.length}<SideCard title="Talent Points">
        {#each facts.talentPoints as points}<p>{#if points.name !== commonPoints}<strong>{points.name}:</strong>{' '}{/if}{talentPointText(points)}</p>{/each}
        <h3>Points to learn every rank</h3>
        <ul class="tree-costs">{#each document.trees as tree (tree.anchor)}<li><a class="c-link" href={`#${tree.anchor}`}>{tree.name}</a><span>{formatNumber(tree.cost)}{#if tree.points && tree.points !== commonPoints}<small>{#if tree.pointsGuide}<a class="c-link" href={`${base}/mechanics/${tree.pointsGuide.guide.slug}/#${tree.pointsGuide.section}`}>{tree.points}</a>{:else}{tree.points}{/if}</small>{/if}</span></li>{/each}</ul>
        {#if talentGuide}<HowItWorks guide={talentGuide.guide} section={talentGuide.section} label="How Talent Points Work" />{/if}
      </SideCard>{/if}
      {#if facts.weapons.length}<SideCard title="Gear"><ul class="weapons">{#each facts.weapons as weapon}<li>{weapon}</li>{/each}</ul><a class="c-link gear" href={gearHref}>Weapons and Armor for {document.ref.name}</a></SideCard>{/if}
    </div>
    <Sections>
      {#if document.startingGear.length}
        <Section id="starting-gear" title="Starting Gear" count={document.startingGear.length} line={gearPlan.shared.some(({ column }) => column.id === 'equipped') ? 'Starts equipped.' : undefined}>
          <RelationTable columns={gearPlan.columns} rows={document.startingGear} label="Starting gear">
            <svelte:fragment slot="cell" let:row let:column>
              {#if column === 'item'}<EntityLink ref={row.item} {registry} />{:else if column === 'count'}{row.count}{:else}{row.equipped ? 'Yes' : 'No'}{/if}
            </svelte:fragment>
          </RelationTable>
        </Section>
      {/if}
      {#if document.trees.length}
        <Section id="talent-trees" title="Talent Trees">
          {#if document.web}
            <!-- The web shows the trees as the game's talent screen does, and the list shows each tree as a table. Both
                 views render every tree and talent anchor, so a link keeps the reader's view. -->
            <TabSet tabs={views} label="Talent Tree View" idPrefix="talent-view" param="view" let:key={view}>
              {#if view === 'web'}<TalentWeb web={document.web} trees={document.trees} {registry} />
              {:else}
                <TabSet {tabs} label="Talent Trees" idPrefix="class-trees" let:key>
                  {#each document.trees.filter((tree) => tree.anchor === key) as tree (tree.anchor)}<TalentTreeSection {tree} points={tree.points !== commonPoints ? tree.points : undefined} pointsGuide={tree.pointsGuide} {registry} />{/each}
                </TabSet>
              {/if}
            </TabSet>
          {:else}
            <TabSet {tabs} label="Talent Trees" idPrefix="class-trees" let:key>
              {#each document.trees.filter((tree) => tree.anchor === key) as tree (tree.anchor)}<TalentTreeSection {tree} points={tree.points !== commonPoints ? tree.points : undefined} pointsGuide={tree.pointsGuide} {registry} />{/each}
            </TabSet>
          {/if}
        </Section>
      {/if}
    </Sections>
  </DetailFrame>
</article>

<style>
  .description { white-space: pre-line; }
  .side-content { display: grid; align-content: start; gap: 1rem; }
  .side-content strong { color: var(--c-text-strong); }
  .race-links { display: flex; justify-content: flex-start; flex-wrap: wrap; gap: .3rem .6rem; }
  h3 { margin: 1rem 0 .4rem; color: var(--c-text-mute); font-size: var(--c-text-label); font-weight: 600; }
  .tree-costs { display: grid; gap: .3rem; margin-bottom: .75rem; padding: 0; list-style: none; }
  .tree-costs li { display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: baseline; gap: 1rem; }
  .tree-costs a { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .tree-costs span { color: var(--c-text-dim); font-variant-numeric: tabular-nums; text-align: right; }
  .tree-costs small { display: block; color: var(--c-text-mute); font-size: var(--c-text-small); }
  .weapons { display: flex; flex-wrap: wrap; gap: .4rem; padding: 0; list-style: none; }
  .gear { display: inline-block; margin-top: .65rem; }
  .weapons li { padding: .25rem .5rem; border: 1px solid var(--c-line-soft); border-radius: var(--c-radius-sm); color: var(--c-text-dim); font-size: .875rem; }
</style>
