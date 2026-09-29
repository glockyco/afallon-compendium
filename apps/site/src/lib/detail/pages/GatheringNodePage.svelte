<script lang="ts">
  import { base } from '$app/paths';
  import type { MechanicsRule, NodeYieldRow, PublicGatheringNode, PublicKindEntry, SpawnerOption } from '@afallon/contracts/public';
  import EntityLink from '../../EntityLink.svelte';
  import LocationLinks from '../../LocationLinks.svelte';
  import MissingValue from '../../MissingValue.svelte';
  import Requirements from '../../Requirements.svelte';
  import { formatNumber, nameOf, rangeText } from '../../format';
  import FactList from '../FactList.svelte';
  import FactRow from '../FactRow.svelte';
  import Hero from '../Hero.svelte';
  import { planColumns, type RelationColumn } from '../relation-table';
  import RelationTable from '../RelationTable.svelte';
  import Section from '../Section.svelte';
  import Sections from '../Sections.svelte';
  import TitleBlock from '../TitleBlock.svelte';
  import MechanicsRules from '../sections/MechanicsRules.svelte';

  export let document: PublicGatheringNode;
  export let registry: PublicKindEntry[];

  $: facts = document.facts;
  $: placed = document.spawners.reduce((sum, group) => sum + group.placements.length, 0) + document.placed.reduce((sum, group) => sum + group.placements.length, 0);
  $: unplaced = document.spawners.reduce((sum, group) => sum + group.unplaced, 0) + document.placed.reduce((sum, group) => sum + group.unplaced, 0);
  const yieldColumns: RelationColumn<NodeYieldRow>[] = [
    { id: 'item', label: 'Item', value: (row) => nameOf(row.counterpart), sort: (row) => nameOf(row.counterpart) },
    { id: 'quantity', label: 'Quantity', hint: 'The authored count range of one kept item, before the gathering yield bonus.', numeric: true, value: (row) => rangeText(row.min, row.max) ?? undefined, sort: (row) => row.max ?? row.min },
    { id: 'chance', label: 'Chance', hint: 'The authored chance of the item\'s own roll.', numeric: true, value: (row) => row.chance, sort: (row) => row.chance },
  ];
  $: yieldPlan = planColumns(yieldColumns, document.yields);
  const ruleGroups = [
    { section: 'node-selection', title: 'Selection' }, { section: 'node-availability', title: 'Availability' },
    { section: 'node-rewards', title: 'Rewards' }, { section: 'attunement', title: 'Attunement' },
  ];
  const rulesFor = (rules: MechanicsRule[], section: string) => rules.filter((rule) => rule.section === section);
  const seconds = (value: number) => `${formatNumber(value)} ${value === 1 ? 'second' : 'seconds'}`;
  const isThisNode = (option: SpawnerOption) => option.node.key === document.ref.key;
</script>

<article class="detail-page">
  <TitleBlock name={document.ref.name} facts={facts.skill ? [{ label: 'Skill', refs: [facts.skill] }] : []} {registry} />

  <Hero>
    <FactList>
      <FactRow label="Required level">{facts.requiredLevel !== undefined ? formatNumber(facts.requiredLevel) : 'None'}</FactRow>
      {#if facts.requirements.length}<FactRow label="Requirements"><Requirements requirements={facts.requirements} {registry} kindLabels={false} /></FactRow>{/if}
      {#if facts.skillExperience !== undefined}<FactRow label="Skill experience">{formatNumber(facts.skillExperience)} per use</FactRow>{/if}
      {#if facts.characterExperience !== undefined}<FactRow label="Character experience">{formatNumber(facts.characterExperience)} per use</FactRow>{/if}
      <FactRow label="Locations" href={placed ? '#locations' : undefined}>{#if placed}{formatNumber(placed)}{:else}Unknown{/if}</FactRow>
      <FactRow label="Related mechanics"><a class="c-link" href={`${base}/mechanics/crafting-and-gathering/`}>Crafting and Gathering</a></FactRow>
    </FactList>
    {#if facts.variant}<p class="note">Another gathering node has this name but different requirements, experience, or loot. Each has its own page.</p>{/if}
  </Hero>

  <Sections>
    {#if document.yields.length}
      <Section id="yields" title="Yields" icon="loot" count={document.yields.length} line="One use rolls each item on its own.">
        <RelationTable columns={yieldPlan.columns} rows={document.yields} label="Yields" sort={{ id: 'chance', dir: 'desc' }}>
          <svelte:fragment slot="cell" let:row let:column>
            {#if column === 'item'}<EntityLink ref={row.counterpart} {registry} />
            {:else if column === 'quantity'}{rangeText(row.min, row.max) ?? ''}
            {:else if column === 'chance'}{#if row.chance === undefined}<MissingValue explanation="No chance is published for this build" />{:else}{formatNumber(row.chance)}%{/if}{/if}
          </svelte:fragment>
        </RelationTable>
      </Section>
    {/if}

    <Section id="locations" title="Locations" icon="location">
      {#if placed === 0 && unplaced > 0}<p class="note">No location of this node is published.</p>{/if}
      {#each document.spawners as group, index}
        <div class="group">
          <h3>{document.spawners.length > 1 ? `Spawners, group ${index + 1}` : 'Spawners'}</h3>
          <FactList>
            <FactRow label="Spawners">{formatNumber(group.spawners)}</FactRow>
            {#if group.skill}<FactRow label="Gathering skill"><EntityLink ref={group.skill} {registry} />, weights change up to level {formatNumber(group.skillCap)}</FactRow>{/if}
            <FactRow label="Respawn">{seconds(group.respawnSeconds)}, plus or minus up to {seconds(group.jitterSeconds)}</FactRow>
            <FactRow label="Removed after use">{seconds(group.despawnSeconds)}</FactRow>
            <FactRow label="Player range">{formatNumber(group.playerRange)}</FactRow>
            <FactRow label="Locations"><LocationLinks placements={group.placements} />{#if group.unplaced}<span class="unplaced">{formatNumber(group.unplaced)} without a published location</span>{/if}</FactRow>
          </FactList>
          <p class="table-intro">Each spawner picks one of these options by weight. A weight is not a chance.</p>
          <div class="table-scroll"><table>
            <thead><tr><th scope="col">Node</th><th scope="col">Weight at level 1</th><th scope="col">Weight at level {formatNumber(group.skillCap)}</th><th scope="col">Minimum weight</th></tr></thead>
            <tbody>{#each group.options as option}<tr class:current={isThisNode(option)}><td>{#if isThisNode(option)}{nameOf(option.node)}{:else}<EntityLink ref={option.node} {registry} />{/if}</td><td>{formatNumber(option.lowSkillWeight)}</td><td>{formatNumber(option.highSkillWeight)}</td><td>{formatNumber(option.teaserWeight)}</td></tr>{/each}</tbody>
          </table></div>
        </div>
      {/each}
      {#each document.placed as group}
        <div class="group">
          <h3>Placed in scenes</h3>
          <FactList>
            <FactRow label="Objects">{formatNumber(group.objects)}</FactRow>
            <FactRow label="Ready again after">{seconds(group.cooldownSeconds)}</FactRow>
            <FactRow label="Locations"><LocationLinks placements={group.placements} />{#if group.unplaced}<span class="unplaced">{formatNumber(group.unplaced)} without a published location</span>{/if}</FactRow>
          </FactList>
        </div>
      {/each}
    </Section>

    <Section id="rules" title="Rules" icon="text">
      {#each ruleGroups as group}
        {#if rulesFor(document.rules, group.section).length}
          <div class="rule-group">
            <h3>{group.title}</h3>
            <MechanicsRules rules={rulesFor(document.rules, group.section)} {registry} />
          </div>
        {/if}
      {/each}
    </Section>
  </Sections>
</article>

<style>
  .note, .table-intro { margin: .75rem 0 0; line-height: 1.55; color: var(--c-text-dim); }
  .group + .group { margin-top: 1.4rem; }
  h3 { margin: 0 0 .5rem; color: var(--c-text-strong); font: 600 var(--c-text-lead)/1.3 var(--c-serif); }
  .rule-group + .rule-group { margin-top: 1.1rem; }
  .unplaced { display: block; margin-top: .2rem; color: var(--c-text-dim); }
  .table-scroll { max-width: 100%; margin-top: .5rem; overflow-x: auto; }
  table { width: 100%; border-collapse: collapse; text-align: left; font-variant-numeric: tabular-nums; }
  th, td { padding: .5rem .7rem; border-bottom: 1px solid var(--c-line); }
  th { color: var(--c-text-dim); font-weight: 600; }
  td:not(:first-child), th:not(:first-child) { text-align: right; white-space: nowrap; }
  tr.current td { color: var(--c-text-strong); font-weight: 600; }
</style>
