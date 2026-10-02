<script lang="ts">
  import { base } from '$app/paths';
  import type { FactionRelation, FactionStance, PublicFaction, PublicKindEntry } from '@afallon/contracts/public';
  import EntityLink from '../../EntityLink.svelte';
  import { alignmentLabel, formatNumber, nameOf } from '../../format';
  import AnswerCard from '../AnswerCard.svelte';
  import DetailFrame from '../DetailFrame.svelte';
  import HowItWorks from '../HowItWorks.svelte';
  import { planColumns, type RelationColumn } from '../relation-table';
  import RelationTable from '../RelationTable.svelte';
  import Section from '../Section.svelte';
  import Sections from '../Sections.svelte';
  import StatStrip from '../StatStrip.svelte';
  import TitleBlock from '../TitleBlock.svelte';

  export let document: PublicFaction;
  export let registry: PublicKindEntry[];

  $: npcRoute = registry.find((entry) => entry.kind === 'npcs')?.route;
  $: membersHref = npcRoute && document.members ? `${base}/${npcRoute}/?faction=${encodeURIComponent(document.ref.name)}` : undefined;
  $: standing = document.newCharacter;
  $: icon = document.art.icon ?? document.ref.icon;
  $: stats = [
    ...(standing ? [{ label: 'New character stance', value: standing.stance, note: alignmentLabel(standing.alignment), href: '#standing' }] : []),
    { label: 'NPCs', value: formatNumber(document.members), href: membersHref },
    { label: 'Reputation panel', value: document.shownInReputation ? 'Shown' : 'Not shown' },
  ];
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
  $: stancePlan = planColumns(stanceColumns, document.stances);
  $: relationPlan = planColumns(relationColumns, document.relations);
</script>

<article class="detail-page">
  <DetailFrame>
    <div slot="head">
      <TitleBlock name={document.ref.name} imageUrl={icon ? `${base}/data/${icon.url}` : undefined} typeLine="Faction" {registry}><StatStrip {stats} /></TitleBlock>
    </div>

    <div slot="answer">
      <AnswerCard title="Your standing" id="standing">
        {#if document.description}<p class="description">{document.description}</p>{/if}
        {#if standing}
          <p>A new character starts <strong>{standing.stance}</strong> with {document.ref.name}{#if standing.points}, with {formatNumber(standing.points)} points toward the next stance{/if}. {standing.stance} is {standing.alignment === 'ally' ? 'an Ally' : standing.alignment === 'enemy' ? 'an Enemy' : 'a Neutral'} alignment.</p>
        {/if}
        <p>Points fill your current stance, and a full stance moves you to the next one.</p>
        <RelationTable columns={stancePlan.columns} rows={document.stances} label="Stances">
          <svelte:fragment slot="cell" let:row let:column>
            {#if column === 'stance'}{row.name}
            {:else if column === 'alignment'}{alignmentLabel(row.alignment)}
            {:else if column === 'points'}{formatNumber(row.points)}{/if}
          </svelte:fragment>
        </RelationTable>
        {#if membersHref}<p><a class="c-link" href={membersHref}>See the {formatNumber(document.members)} {document.members === 1 ? 'NPC' : 'NPCs'} of {document.ref.name} in the NPC list</a>.</p>{/if}
        {#if document.guide}<p class="guide"><HowItWorks guide={document.guide} section="standing-and-stances" /></p>{/if}
      </AnswerCard>
    </div>

    <Sections>
      {#if document.relations.length}
        <Section id="relations" title="Stance toward each faction" count={document.relations.length} line={`The stance that ${document.ref.name} starts with toward each faction.`}>
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
