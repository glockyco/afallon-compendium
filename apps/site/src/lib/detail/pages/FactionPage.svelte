<script lang="ts">
  import { base } from '$app/paths';
  import type { FactionRelation, FactionStance, PublicFaction, PublicKindEntry } from '@afallon/contracts/public';
  import EntityLink from '../../EntityLink.svelte';
  import { alignmentLabel, formatNumber, nameOf } from '../../format';
  import AnswerCard from '../AnswerCard.svelte';
  import DetailFrame from '../DetailFrame.svelte';
  import FactsCard from '../FactsCard.svelte';
  import HowItWorks from '../HowItWorks.svelte';
  import { planColumns, type RelationColumn } from '../relation-table';
  import RelationTable from '../RelationTable.svelte';
  import Section from '../Section.svelte';
  import Sections from '../Sections.svelte';
  import TitleBlock from '../TitleBlock.svelte';

  export let document: PublicFaction;
  export let registry: PublicKindEntry[];

  $: npcRoute = registry.find((entry) => entry.kind === 'npcs')?.route;
  $: membersHref = npcRoute && document.members ? `${base}/${npcRoute}/?faction=${encodeURIComponent(document.ref.name)}` : undefined;
  $: standing = document.newCharacter;
  $: icon = document.art.icon ?? document.ref.icon;
  $: sideFacts = [
    ...(document.members ? [{ label: 'NPCs', value: formatNumber(document.members), href: membersHref }] : []),
    ...(document.stances.length ? [{ label: 'Stances', value: formatNumber(document.stances.length), href: '#standing' }] : []),
    ...(document.relations.length ? [{ label: 'Other factions', value: formatNumber(document.relations.length), href: '#relations' }] : []),
  ];
  $: sharedStancePoints = document.stances.length && document.stances.every((row) => row.points === document.stances[0]!.points) ? document.stances[0]!.points : undefined;
  $: allStartingPointsZero = document.relations.every((row) => row.startingPoints === 0);
  const stanceColumns: RelationColumn<FactionStance>[] = [
    { id: 'stance', label: 'Stance', value: (row) => row.name },
    { id: 'alignment', label: 'Alignment', value: (row) => alignmentLabel(row.alignment) },
    { id: 'points', label: 'Points to fill', numeric: true, value: (row) => row.points },
  ];
  const relationColumns: RelationColumn<FactionRelation>[] = [
    { id: 'faction', label: 'Toward', value: (row) => nameOf(row.faction), sort: (row) => nameOf(row.faction) },
    { id: 'stance', label: 'Stance', value: (row) => row.stance, sort: (row) => row.stance ?? '' },
    { id: 'points', label: 'Starting points', numeric: true, value: (row) => row.startingPoints, sort: (row) => row.startingPoints },
  ];
  $: stancePlan = planColumns(sharedStancePoints !== undefined ? stanceColumns.filter((column) => column.id !== 'points') : stanceColumns, document.stances);
  $: relationPlan = planColumns(allStartingPointsZero ? relationColumns.filter((column) => column.id !== 'points') : relationColumns, document.relations);
</script>

<article class="detail-page">
  <DetailFrame>
    <div slot="head">
      <TitleBlock name={document.ref.name} imageUrl={icon ? `${base}/data/${icon.url}` : undefined} typeLine="Faction" {registry} />
    </div>

    <div slot="answer">
      <AnswerCard title="Your standing" id="standing">
        {#if document.description}<p class="description">{document.description}</p>{/if}
        {#if standing}
          <p>A new character starts {standing.stance}{#if standing.points}, with {formatNumber(standing.points)} points toward the next stance{/if}. At this stance, {standing.alignment === 'ally' ? 'members are allies' : standing.alignment === 'enemy' ? 'members are enemies' : 'members are neutral'}.</p>
        {#if document.ref.name === 'Humans'}<p>Every playable race belongs to this faction.</p>{/if}
        {/if}
        {#if sharedStancePoints !== undefined}<p>Each stance takes {formatNumber(sharedStancePoints)} points to fill.</p>{/if}
        <p>Filling a stance moves you to the next one.</p>
        <p>No known way to earn faction points is available.</p>
        <RelationTable columns={stancePlan.columns} rows={document.stances} label="Stances">
          <svelte:fragment slot="cell" let:row let:column>
            {#if column === 'stance'}{row.name}
            {:else if column === 'alignment'}{alignmentLabel(row.alignment)}
            {:else if column === 'points'}{formatNumber(row.points)}{/if}
          </svelte:fragment>
        </RelationTable>
        {#if document.guide}<p class="guide"><HowItWorks guide={document.guide} section="standing-and-stances" /></p>{/if}
      </AnswerCard>
    </div>

    <svelte:fragment slot="side">
      <FactsCard facts={sideFacts} title="At a glance" />
    </svelte:fragment>
    <Sections>
      {#if document.relations.length}
        <Section id="relations" title="Stance toward each faction" count={document.relations.length} line={allStartingPointsZero ? `How ${document.ref.name} starts toward each faction, with no points toward the next stance.` : `How ${document.ref.name} starts toward each faction.`}>
          <RelationTable columns={relationPlan.columns} rows={document.relations} label="Stance toward each faction">
            <svelte:fragment slot="cell" let:row let:column>
              {#if column === 'faction'}<EntityLink ref={row.faction} {registry} />
              {:else if column === 'stance' && row.stance}{row.stance}
              {:else if column === 'points'}{formatNumber(row.startingPoints)}{/if}
            </svelte:fragment>
          </RelationTable>
        </Section>
      {/if}
    </Sections>
  </DetailFrame>
</article>

<style>
  .description { color: var(--c-text-dim); line-height: 1.5; }
  .guide { margin: 0; }
</style>
