<script lang="ts">
  import { base } from '$app/paths';
  import type { NodeYieldRow, PublicGatheringNode, PublicKindEntry, SpawnerOption } from '@afallon/contracts/public';
  import EntityLink from '../../EntityLink.svelte';
  import MissingValue from '../../MissingValue.svelte';
  import Requirements from '../../Requirements.svelte';
  import { formatNumber, nameOf, rangeText, sentenceStart } from '../../format';
  import { nodeOnMap, nodePlaceOnMap } from '../../map-links';
  import AnswerCard from '../AnswerCard.svelte';
  import DetailFrame from '../DetailFrame.svelte';
  import DetailsDisclosure from '../DetailsDisclosure.svelte';
  import HowItWorks from '../HowItWorks.svelte';
  import PlacesList from '../PlacesList.svelte';
  import { planColumns, type RelationColumn } from '../relation-table';
  import RelationTable from '../RelationTable.svelte';
  import Section from '../Section.svelte';
  import Sections from '../Sections.svelte';
  import StatStrip from '../StatStrip.svelte';
  import TitleBlock from '../TitleBlock.svelte';

  export let document: PublicGatheringNode;
  export let registry: PublicKindEntry[];

  const yieldColumns: RelationColumn<NodeYieldRow>[] = [
    { id: 'item', label: 'Item', value: (row) => nameOf(row.counterpart), sort: (row) => nameOf(row.counterpart) },
    { id: 'quantity', label: 'Quantity', numeric: true, value: (row) => rangeText(row.min, row.max) ?? undefined, sort: (row) => row.max ?? row.min },
    { id: 'chance', label: 'Chance per use', numeric: true, value: (row) => row.chance, sort: (row) => row.chance },
  ];
  $: yieldPlan = planColumns(yieldColumns, document.yields);
  $: bonus = document.placedRules.find((rule) => rule.levelChances?.length);
  $: skillName = document.facts.skill ? nameOf(document.facts.skill) : undefined;
  $: titleRequirements = document.facts.requirements.filter((group) => group.mode === 'all' && !group.checkCount).flatMap((group) => group.requirements)
    .filter((requirement) => !skillName || !requirement.label.toLocaleLowerCase().startsWith(`${skillName.toLocaleLowerCase()} `))
    .map((requirement) => sentenceStart(requirement.spans.map((span) => 'ref' in span ? nameOf(span.ref) : span.text).join('')));
  $: spots = document.places.reduce((sum, place) => sum + place.spotCount, 0);
  $: firstSpot = document.places.flatMap((place) => place.placementIds)[0];
  $: spawnerTotal = document.spawners.reduce((sum, group) => sum + group.spawners, 0);
  $: placedTotal = document.placed.reduce((sum, group) => sum + group.objects, 0);
  $: respawnValues = [...new Set([...document.spawners.map((group) => group.respawnSeconds), ...document.placed.map((group) => group.cooldownSeconds)].filter((seconds) => seconds > 0))];
  $: stats = [
    ...(document.facts.skillExperience ? [{ label: 'Skill experience', value: formatNumber(document.facts.skillExperience), note: 'Per use' }] : []),
    ...(document.facts.characterExperience ? [{ label: 'Character experience', value: formatNumber(document.facts.characterExperience), note: 'Per use' }] : []),
    ...(respawnValues.length ? [{ label: 'Respawn', value: respawnValues.length === 1 ? duration(respawnValues[0]!) : 'Varies', href: '#timers' }] : []),
    ...(spots ? [{ label: 'Spots', value: formatNumber(spots), href: '#locations' }] : []),
  ];
  $: places = document.places.map((place) => ({
    place: { key: null, label: place.label } as const,
    spotCount: place.spotCount,
    nameHref: place.placementIds.length ? nodePlaceOnMap(document.ref.key, place) : undefined,
  }));

  const bonusPercent = new Intl.NumberFormat('en-US', { maximumFractionDigits: 4 });
  const duration = (seconds: number) => seconds >= 60 && seconds % 60 === 0
    ? `${formatNumber(seconds / 60)} ${seconds === 60 ? 'minute' : 'minutes'}`
    : `${formatNumber(seconds)} ${seconds === 1 ? 'second' : 'seconds'}`;
  const isThisNode = (option: SpawnerOption) => option.node.key === document.ref.key;
  // One row per spawner group that can choose this node. A group without a supported share keeps its row, so the table
  // does not hide spawners; its chance cells stay empty.
  $: shareRows = document.spawners.flatMap((group) => group.options.filter(isThisNode).map((option) => ({
    spawners: group.spawners, options: group.options.length, shares: new Map((option.shares ?? []).map((share) => [share.skillLevel, share.percent])),
  })));
  $: shareLevels = [...new Set(shareRows.flatMap((row) => [...row.shares.keys()]))].sort((left, right) => left - right);
  $: missingShare = shareRows.some((row) => row.shares.size === 0);
</script>

<article class="detail-page">
  <DetailFrame>
    <div slot="head">
      <TitleBlock name={document.ref.name} imageUrl={document.art.icon ?? document.ref.icon ? `${base}/data/${(document.art.icon ?? document.ref.icon)!.url}` : undefined} typeRef={document.facts.skill} typeLine={[document.facts.skill ? 'node' : 'Gathering node', document.facts.requiredLevel === undefined ? undefined : `Requires level ${formatNumber(document.facts.requiredLevel)}`, ...titleRequirements].filter(Boolean).join(' · ')} mapHref={firstSpot ? nodeOnMap(document.ref.key) : undefined} {registry}>
        <StatStrip {stats} />
      </TitleBlock>
    </div>

    <div slot="answer">
      <AnswerCard title="Gives" id="yields">
        {#if document.yields.length}
          <p class="intro">Each item has its own chance per use. Quantity is the count before any yield bonus.</p>
          <RelationTable columns={yieldPlan.columns} rows={document.yields} label="Items gathered" sort={{ id: 'chance', dir: 'desc' }}>
            <svelte:fragment slot="cell" let:row let:column>
              {#if column === 'item'}<EntityLink ref={row.counterpart} {registry} />
              {:else if column === 'quantity'}{rangeText(row.min, row.max) ?? ''}
              {:else if column === 'chance'}{#if row.chance === undefined}<MissingValue explanation="No chance is published" />{:else}{formatNumber(row.chance)}%{/if}{/if}
            </svelte:fragment>
          </RelationTable>
        {:else}<p>No yields are published for this node.</p>{/if}
        {#if bonus?.levelChances}
          <p class="bonus">Each item can yield one extra at higher {document.facts.skill ? nameOf(document.facts.skill) : 'skill'} levels: {#each bonus.levelChances as endpoint, index}{index ? (index === bonus.levelChances.length - 1 ? ', and ' : ', ') : ''}<strong>{bonusPercent.format(endpoint.chance)}%</strong> at level {formatNumber(endpoint.level)}{/each}. <HowItWorks guide={bonus.guide} stepId={bonus.stepId} label="How gathering works" /></p>
        {/if}
      </AnswerCard>
    </div>

    <div slot="side" class="side-facts">
      {#if document.facts.requirements.length}
        <h2>To gather</h2>
        <Requirements requirements={document.facts.requirements} {registry} kindLabels={false} />
      {/if}
      {#if spawnerTotal || placedTotal}
        <h2>Spawns</h2>
        <dl class="spawn-facts">
          {#if spawnerTotal}<div><dt>Spawners</dt><dd>{formatNumber(spawnerTotal)}</dd></div>{/if}
          {#if placedTotal}<div><dt>Placed by scenes</dt><dd>{formatNumber(placedTotal)}</dd></div>{/if}
        </dl>
        {#if shareLevels.length}
          <table class="shares">
            <caption>Chance that a spawner chooses this node</caption>
            <thead><tr><th scope="col">Spawners</th><th scope="col">Options</th>{#each shareLevels as level}<th scope="col">Level {formatNumber(level)}</th>{/each}</tr></thead>
            <tbody>{#each shareRows as row}<tr><td>{formatNumber(row.spawners)}</td><td>{formatNumber(row.options)}</td>{#each shareLevels as level}<td>{#if row.shares.has(level)}{formatNumber(row.shares.get(level) ?? 0)}%{/if}</td>{/each}</tr>{/each}</tbody>
          </table>
          <p class="explanation">Each spawner picks one of its group's options. The chance depends on the {skillName ?? 'gathering'} level and does not include attunement.{#if missingShare} An empty cell means the chance is unknown.{/if}</p>
        {:else if spawnerTotal}
          <p class="explanation">The chance of choosing this node is unknown for these spawners.</p>
        {/if}
      {/if}
      {#if document.facts.variant}<p class="explanation">Another node shares this name but has different requirements, experience, or yields.</p>{/if}
    </div>

    <Sections>
    <Section id="locations" title="Where to find" count={document.places.length}>
      {#if document.places.length}<PlacesList {places} {registry} />{:else}<p>No location of this node is published.</p>{/if}
      {#if document.spawners.some((group) => group.unplaced) || document.placed.some((group) => group.unplaced)}<p class="footnote">Some spawners or placed nodes have no published location.</p>{/if}
    </Section>

    {#if document.spawners.length || document.placed.length}
    <!-- The disclosures share one row of the sections grid, so they sit closer to each other than to the sections. -->
    <div class="disclosures">
    {#if document.spawners.length}
      <DetailsDisclosure title="Spawn odds" id="spawn-odds" summary="Weights and chances by skill level">
        <p class="intro">Each spawner chooses among its options. Weights determine each option's chance. Some chances are unknown.</p>
        {#each document.spawners as group, index}
          <h3>{group.skill ? nameOf(group.skill) : 'Spawner'}{document.spawners.length > 1 ? ` · Group ${index + 1}` : ''} · {formatNumber(group.spawners)} {group.spawners === 1 ? 'spawner' : 'spawners'}</h3>
          <div class="table-scroll"><table>
            <thead><tr><th scope="col">Node</th><th scope="col">Weight at level 1</th><th scope="col">Weight at level {formatNumber(group.skillCap)}</th><th scope="col">Minimum weight</th></tr></thead>
            <tbody>{#each group.options as option}<tr class:current={isThisNode(option)}><td>{#if isThisNode(option)}{nameOf(option.node)}{:else}<EntityLink ref={option.node} {registry} />{/if}</td><td>{formatNumber(option.lowSkillWeight)}</td><td>{formatNumber(option.highSkillWeight)}</td><td>{formatNumber(option.teaserWeight)}</td></tr>{/each}</tbody>
          </table></div>
        {/each}
      </DetailsDisclosure>
    {/if}
      <DetailsDisclosure title="Timers and ranges" id="timers">
        {#each document.spawners as group, index}
          <h3>{document.spawners.length > 1 ? `Spawner group ${index + 1}` : 'Spawners'}</h3>
          <dl class="timer-facts"><div><dt>Respawn</dt><dd>{duration(group.respawnSeconds)}, plus or minus up to {duration(group.jitterSeconds)}</dd></div><div><dt>Removed after use</dt><dd>{duration(group.despawnSeconds)}</dd></div><div><dt>Player range</dt><dd>{formatNumber(group.playerRange)}</dd></div></dl>
        {/each}
        {#each document.placed as group, index}
          <h3>{document.placed.length > 1 ? `Placed node group ${index + 1}` : 'Placed nodes'}</h3>
          <dl class="timer-facts"><div><dt>Objects</dt><dd>{formatNumber(group.objects)}</dd></div><div><dt>Ready again after</dt><dd>{duration(group.cooldownSeconds)}</dd></div></dl>
        {/each}
      </DetailsDisclosure>
    </div>
    {/if}
    </Sections>
  </DetailFrame>
</article>

<style>
  .intro, .footnote, .explanation { color: var(--c-text-dim); line-height: 1.5; }
  .intro { margin: 0 0 1rem; }
  .bonus { margin: 1rem 0 0; line-height: 1.5; }
  .bonus strong { color: var(--c-text-strong); }
  .side-facts { border: 1px solid var(--c-line-soft); border-radius: var(--c-radius); padding: 1rem; background: var(--c-surface-1); }
  .disclosures { display: grid; gap: .5rem; }
  h2 { margin: 0 0 .75rem; color: var(--c-text-strong); font: 600 1.2rem/1.3 var(--c-serif); }
  h2:not(:first-child) { margin-top: 1.25rem; }
  h3 { margin: 1rem 0 .5rem; color: var(--c-text-strong); font: 600 1rem/1.4 var(--c-serif); }
  .side-facts > .explanation { margin: .75rem 0 0; }
  .spawn-facts, .timer-facts { margin: 0; }
  .spawn-facts div, .timer-facts div { display: flex; flex-wrap: wrap; justify-content: space-between; gap: .2rem .6rem; padding: .35rem 0; }
  .spawn-facts dt, .timer-facts dt { color: var(--c-text-dim); }
  .spawn-facts dd, .timer-facts dd { margin: 0; color: var(--c-text-strong); font-variant-numeric: tabular-nums; }
  .footnote { margin: .75rem 0 0; }
  .table-scroll { max-width: 100%; overflow-x: auto; }
  table { width: 100%; border-collapse: collapse; text-align: left; font-variant-numeric: tabular-nums; }
  th, td { padding: .5rem .7rem; border-bottom: 1px solid var(--c-line-soft); }
  th { color: var(--c-text-dim); font-weight: 600; }
  td:not(:first-child), th:not(:first-child) { text-align: right; white-space: nowrap; }
  /* The side column is narrow, so the share table uses tighter cells and right-aligns every number. */
  .shares { margin-top: .75rem; font-size: var(--c-text-small); }
  .shares caption { margin-bottom: .35rem; color: var(--c-text-strong); font-weight: 600; text-align: left; }
  .shares th, .shares td { padding: .4rem .35rem; text-align: right; }
  .shares th:first-child, .shares td:first-child { padding-left: 0; }
  .shares th:last-child, .shares td:last-child { padding-right: 0; }
  tr.current td { color: var(--c-text-strong); font-weight: 600; }
</style>
