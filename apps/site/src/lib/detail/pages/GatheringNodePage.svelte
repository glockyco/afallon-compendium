<script lang="ts">
  import { base } from '$app/paths';
  import { spawnerChances, type NodeYieldRow, type PublicGatheringNode, type PublicKindEntry } from '@afallon/contracts/public';
  import EntityLink from '../../EntityLink.svelte';
  import MissingValue from '../../MissingValue.svelte';
  import Requirements from '../../Requirements.svelte';
  import { formatNumber, nameOf, rangeText } from '../../format';
  import { nodeOnMap, entityPlaceOnMap } from '../../map-links';
  import { skillLevelId } from '../../reader-levels';
  import AnswerCard from '../AnswerCard.svelte';
  import AttunementToggles from '../AttunementToggles.svelte';
  import DetailFrame from '../DetailFrame.svelte';
  import FactsCard from '../FactsCard.svelte';
  import DetailsDisclosure from '../DetailsDisclosure.svelte';
  import HowItWorks from '../HowItWorks.svelte';
  import { attunementBoosts, interpolateChance } from '../gathering-odds';
  import PlacesList from '../PlacesList.svelte';
  import ReaderLevel from '../ReaderLevel.svelte';
  import { planColumns, type RelationColumn } from '../relation-table';
  import RelationTable from '../RelationTable.svelte';
  import Section from '../Section.svelte';
  import SideCard from '../SideCard.svelte';
  import Sections from '../Sections.svelte';
  import SpawnerOdds from '../SpawnerOdds.svelte';
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
  $: selectionGuide = document.placedRules.find((rule) => rule.section === 'node-selection');
  $: attunementGuide = document.placedRules.find((rule) => rule.section === 'attunement');
  $: timerGuide = document.placedRules.find((rule) => rule.section === 'node-availability');
  $: skillName = document.facts.skill ? nameOf(document.facts.skill) : undefined;
  $: additionalRequirements = document.facts.requirements.some((group) => group.mode !== 'all' || group.checkCount || group.requirements.some((requirement) =>
    !skillName || !requirement.label.toLocaleLowerCase().startsWith(`${skillName.toLocaleLowerCase()} `)));
  $: spots = document.places.reduce((sum, place) => sum + place.spotCount, 0);
  $: firstSpot = document.places.flatMap((place) => place.placementIds)[0];
  $: spawnerTotal = document.spawners.reduce((sum, group) => sum + group.spawners, 0);
  $: placedTotal = document.placed.reduce((sum, group) => sum + group.objects, 0);
  $: respawnValues = [...new Set([...document.spawners.map((group) => group.respawnSeconds), ...document.placed.map((group) => group.cooldownSeconds)].filter((seconds) => seconds > 0))];
  $: stats = [
    ...(document.facts.skillExperience ? [{ label: 'Skill experience', value: formatNumber(document.facts.skillExperience), note: 'Per use' }] : []),
    ...(document.facts.characterExperience ? [{ label: 'Character experience', value: formatNumber(document.facts.characterExperience), note: 'Per use' }] : []),
    ...(respawnValues.length ? [{ label: 'Respawn', value: respawnValues.length === 1 ? summaryDuration(respawnValues[0]!) : 'Varies', href: '#timers' }] : []),
    ...(spots ? [{ label: 'Spots', value: formatNumber(spots), href: '#locations' }] : []),
    ...(!spawnerTotal && placedTotal && placedTotal !== spots ? [{ label: 'Placed nodes', value: formatNumber(placedTotal) }] : []),
  ];
  $: places = document.places.map((place) => ({
    place: { key: null, label: place.label } as const,
    spotCount: place.spotCount,
    nameHref: place.placementIds.length ? entityPlaceOnMap(document.ref.key, place) : undefined,
  }));

  const bonusPercent = new Intl.NumberFormat('en-US', { maximumFractionDigits: 4 });
  const duration = (seconds: number) => {
    if (seconds < 60) return `${formatNumber(seconds)} ${seconds === 1 ? 'second' : 'seconds'}`;
    const hours = Math.floor(seconds / 3600), minutes = Math.floor(seconds % 3600 / 60), remainder = seconds % 60;
    return [
      hours && `${formatNumber(hours)} ${hours === 1 ? 'hour' : 'hours'}`,
      minutes && `${formatNumber(minutes)} ${minutes === 1 ? 'minute' : 'minutes'}`,
      remainder && `${formatNumber(remainder)} ${remainder === 1 ? 'second' : 'seconds'}`,
    ].filter(Boolean).join(' ');
  };
  const summaryDuration = (seconds: number) => {
    if (seconds <= 3600) return duration(seconds);
    const minutes = Math.round(seconds / 60), hours = Math.floor(minutes / 60), remaining = minutes % 60;
    return `${seconds % 60 ? 'About ' : ''}${formatNumber(hours)} ${hours === 1 ? 'hour' : 'hours'}${remaining ? ` ${remaining} ${remaining === 1 ? 'minute' : 'minutes'}` : ''}`;
  };
  // The reader's skill level and attunements decide the odds. The side card shows this node's chance in each spawner
  // group, and Spawn odds shows every option of those groups at the same level.
  let level = 1;
  let active: string[] = [];
  // Weights stop changing at the spawners' cap, but the skill and the extra-item chance go on to the skill's highest level.
  $: skillCap = Math.max(1, ...document.spawners.map((group) => group.skillCap), ...(bonus?.levelChances?.map((point) => point.level) ?? []));
  $: oddsGroups = document.spawners.filter((group) => group.oddsVerified);
  $: groupChances = oddsGroups.map((group) => {
    const index = group.options.findIndex((option) => option.node.key === document.ref.key);
    const chances = spawnerChances(group.options, level, group.skillCap, attunementBoosts(group.options, document.attunements, active));
    return { group, percent: index < 0 ? undefined : chances[index]!.percent };
  });
  // The extra-item chance grows evenly with the skill level between the published levels.
  $: bonusAtLevel = bonus?.levelChances ? interpolateChance(bonus.levelChances, level) : undefined;
</script>

<article class="detail-page">
  <DetailFrame>
    <div slot="head">
      <TitleBlock name={document.ref.name} imageUrl={document.art.icon ?? document.ref.icon ? `${base}/data/${(document.art.icon ?? document.ref.icon)!.url}` : undefined} typeRef={document.facts.skill} typeLine={[document.facts.skill ? 'node' : 'Gathering node', document.facts.requiredLevel === undefined ? undefined : `Requires level ${formatNumber(document.facts.requiredLevel)}`].filter(Boolean).join(' · ')} mapHref={firstSpot ? nodeOnMap(document.ref.key) : undefined} {registry} />
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
          <p class="bonus">Each item can yield one extra: {#if document.facts.requiredLevel !== undefined && level < document.facts.requiredLevel}you can gather it from {skillName ?? 'skill'} level {formatNumber(document.facts.requiredLevel)}, above your level of {formatNumber(level)}{:else}<strong>{bonusPercent.format(bonusAtLevel ?? 0)}%</strong> at your {skillName ?? 'skill'} level of {formatNumber(level)}{/if} ({#each bonus.levelChances as endpoint, index}{index ? (index === bonus.levelChances.length - 1 ? ' and ' : ', ') : ''}{bonusPercent.format(endpoint.chance)}% at level {formatNumber(endpoint.level)}{/each}). <HowItWorks guide={bonus.guide} section={bonus.section} label="How gathering works" /></p>
        {/if}
      </AnswerCard>
    </div>

    <div slot="side" class="side-content">
      <FactsCard facts={stats} title="At a glance" />
      {#if additionalRequirements}<SideCard title="To gather">
        <Requirements requirements={document.facts.requirements} {registry} kindLabels={false} />
      </SideCard>{/if}
      {#if spawnerTotal}<SideCard title="Spawns">
        <dl class="spawn-facts">
          {#if spawnerTotal}<div><dt>Spawners</dt><dd>{formatNumber(spawnerTotal)}</dd></div>{/if}
          {#if placedTotal}<div><dt>Placed nodes</dt><dd>{formatNumber(placedTotal)}</dd></div>{/if}
        </dl>
        {#if oddsGroups.length}
          <div class="odds">
            <ReaderLevel id="node-skill-level" readerId={skillLevelId(document.facts.skill ?? { key: null, label: 'gathering' })} label={`${skillName ?? 'Skill'} level`} max={skillCap} fallback={1} bind:level />
            <dl class="spawn-facts">
              {#each groupChances as row, index}<div><dt>{groupChances.length > 1 ? `Chance in group ${index + 1}, ${formatNumber(row.group.spawners)} spawners` : 'Chance that a spawner picks it'}</dt><dd>{row.percent === undefined ? '' : `${bonusPercent.format(Math.round(row.percent * 10) / 10)}%`}</dd></div>{/each}
            </dl>
            <AttunementToggles attunements={document.attunements.filter((attunement) => attunement.nodes.some((node) => node.key === document.ref.key))} {registry} compact bind:active />
            <a class="c-link" href="#spawn-odds">Every node these spawners choose from</a>
          </div>
        {:else if spawnerTotal}
          <p class="explanation">The chance of choosing this node is unknown for these spawners.</p>
        {/if}
      </SideCard>{/if}
      {#if document.facts.variant}<p class="explanation">Another node shares this name but has different requirements, experience, or yields.</p>{/if}
    </div>

    <Sections>
    <Section id="locations" title="Where to find" count={document.places.length}>
      {#if document.places.length}<PlacesList {places} {registry} />{:else}<p>No location of this node is published.</p>{/if}
      {#if document.spawners.some((group) => group.unplaced) || document.placed.some((group) => group.unplaced)}<p class="footnote">Some spawners or placed nodes have no published location.</p>{/if}
    </Section>

    {#if document.spawners.length || document.placed.length}
    <div class="c-disclosures">
    {#if document.spawners.length}
      <DetailsDisclosure title="Spawn odds" id="spawn-odds" summary="Weights and chances by skill level">
        <p class="intro">Each spawner picks one of its options. The weights and chances below use the {skillName ?? 'skill'} level and attunements that you chose{#if oddsGroups.length < document.spawners.length}, and a group without verified odds shows its weights only{/if}.</p>
        {#if oddsGroups.length}<ReaderLevel id="spawn-odds-level" readerId={skillLevelId(document.facts.skill ?? { key: null, label: 'gathering' })} label={`${skillName ?? 'Skill'} level`} max={skillCap} fallback={1} />{/if}
        <AttunementToggles attunements={document.attunements} {registry} bind:active />
        {#if selectionGuide || attunementGuide}<div class="guides">{#if selectionGuide}<HowItWorks guide={selectionGuide.guide} section={selectionGuide.section} label="How spawners choose nodes" />{/if}{#if attunementGuide}<HowItWorks guide={attunementGuide.guide} section={attunementGuide.section} label="How attunement changes the odds" />{/if}</div>{/if}
        <div class="c-groups">
          {#each document.spawners as group, index}
            <div class="c-stack">
              <h3>{group.skill ? nameOf(group.skill) : 'Spawner'}{document.spawners.length > 1 ? ` · Group ${index + 1}` : ''} · {formatNumber(group.spawners)} {group.spawners === 1 ? 'spawner' : 'spawners'}</h3>
              <SpawnerOdds options={group.options} skillCap={group.skillCap} {level} boosts={attunementBoosts(group.options, document.attunements, active)} oddsVerified={group.oddsVerified} current={document.ref.key} {registry} label={`Spawn odds, group ${index + 1}`} />
            </div>
          {/each}
        </div>
      </DetailsDisclosure>
    {/if}
      <DetailsDisclosure title="Timers and ranges" id="timers">
        {#if timerGuide}<HowItWorks guide={timerGuide.guide} section={timerGuide.section} label="How node timers work" />{/if}
        <div class="c-groups">
          {#each document.spawners as group, index}
            <div class="c-stack">
              <h3>{document.spawners.length > 1 ? `Spawner group ${index + 1}` : 'Spawners'}</h3>
              <dl class="timer-facts"><div><dt>Respawn</dt><dd>{duration(group.respawnSeconds)}, plus or minus up to {duration(group.jitterSeconds)}</dd></div><div><dt>Removed after use</dt><dd>{duration(group.despawnSeconds)}</dd></div><div><dt>Player range</dt><dd>{formatNumber(group.playerRange)}</dd></div></dl>
            </div>
          {/each}
          {#each document.placed as group, index}
            <div class="c-stack">
              <h3>{document.placed.length > 1 ? `Placed node group ${index + 1}` : 'Placed nodes'}</h3>
              <dl class="timer-facts"><div><dt>Objects</dt><dd>{formatNumber(group.objects)}</dd></div><div><dt>Ready again after</dt><dd>{duration(group.cooldownSeconds)}</dd></div></dl>
            </div>
          {/each}
        </div>
      </DetailsDisclosure>
    </div>
    {/if}
    </Sections>
  </DetailFrame>
</article>

<style>
  .intro, .footnote, .explanation { color: var(--c-text-dim); line-height: 1.5; }
  .bonus { line-height: 1.5; }
  .guides { display: flex; flex-wrap: wrap; gap: .4rem 1.25rem; }
  .bonus strong { color: var(--c-text-strong); }
  .side-content { display: grid; align-content: start; gap: 1rem; min-width: 0; }
  h3 { color: var(--c-text-strong); font: 600 1rem/1.4 var(--c-serif); }
  .spawn-facts div, .timer-facts div { display: flex; flex-wrap: wrap; justify-content: space-between; gap: .2rem .6rem; padding: .35rem 0; }
  .spawn-facts dt, .timer-facts dt { color: var(--c-text-dim); }
  .spawn-facts dd, .timer-facts dd { color: var(--c-text-strong); font-variant-numeric: tabular-nums; }
  .odds { display: grid; gap: .85rem; margin-top: .75rem; }
  .odds > a { width: fit-content; font-size: var(--c-text-small); }
</style>
