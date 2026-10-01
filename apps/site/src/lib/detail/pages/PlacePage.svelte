<script lang="ts">
  import { base } from '$app/paths';
  import type { PublicKindEntry, PublicPlace } from '@afallon/contracts/public';
  import { categoryLabel } from '@afallon/contracts/public';
  import EntityLink from '../../EntityLink.svelte';
  import { formatNumber, levelText } from '../../format';
  import { placeOnMap } from '../../map-links';
  import AnswerCard from '../AnswerCard.svelte';
  import DetailFrame from '../DetailFrame.svelte';
  import { placeCreatureRows } from '../place-rows';
  import { placeQuestRows } from '../quest-rows';
  import ConnectionsSection from '../sections/ConnectionsSection.svelte';
  import LinkSection from '../sections/LinkSection.svelte';
  import PlaceCreaturesSection from '../sections/PlaceCreaturesSection.svelte';
  import PointsOfInterestSection from '../sections/PointsOfInterestSection.svelte';
  import QuestRowsSection from '../sections/QuestRowsSection.svelte';
  import StatStrip, { type Stat } from '../StatStrip.svelte';
  import TitleBlock from '../TitleBlock.svelte';
  import Sections from '../Sections.svelte';

  export let document: PublicPlace;
  export let registry: PublicKindEntry[];

  $: facts = document.facts;
  $: inhabitants = placeCreatureRows(document.bosses, document.creatures);
  $: quests = placeQuestRows(document.quests, document.questObjectives);
  $: stats = [
    { label: 'Type', value: categoryLabel(facts.placeType) },
    ...(facts.levelRange ? [{ label: 'Level range', value: levelText(facts.levelRange) }] : []),
    ...(inhabitants.bosses.length ? [{ label: 'Bosses', value: formatNumber(inhabitants.bosses.length) }] : []),
  ] satisfies Stat[];
</script>

<DetailFrame>
  <svelte:fragment slot="head"><TitleBlock name={document.ref.name} typeLine={facts.guideIncluded ? 'In the Adventure Guide' : undefined} {registry}><StatStrip {stats} /></TitleBlock></svelte:fragment>
  <svelte:fragment slot="answer">
    <AnswerCard title="Explore this place">
      {#if document.art.artwork}<img class="artwork" src={`${base}/data/${document.art.artwork.url}`} width={document.art.artwork.width} height={document.art.artwork.height} alt={`${document.ref.name} artwork`} />{/if}
      {#if document.description}<p class="description">{document.description}</p>{/if}
      {#if document.variantOf}<p class="description">A Challenge Version Of <EntityLink ref={document.variantOf} {registry} />; It Also Contains Copies Of Overworld Content.</p>{/if}
      {#if document.space}<a class="c-action" href={placeOnMap(document.ref.key, document.variantOf ? 'all' : undefined)}>Show On Map</a>{/if}
    </AnswerCard>
  </svelte:fragment>
  <svelte:fragment slot="side">
    {#if document.parent}<div class="side-card"><h2>Part of</h2><EntityLink ref={document.parent} {registry} /></div>{/if}
    <ConnectionsSection connections={document.connections} {registry} compact />
  </svelte:fragment>
  <Sections>
    <PlaceCreaturesSection id="bosses" title="Bosses" rows={inhabitants.bosses} {registry} />
    <PlaceCreaturesSection id="creatures" title="Creatures" rows={inhabitants.creatures} {registry} />
    <PlaceCreaturesSection id="npcs" title="NPCs and services" rows={document.npcs} services={document.services} placeKey={document.space ? document.ref.key : undefined} {registry} />
    <PointsOfInterestSection id="points-of-interest" title="Gathering and objects" rows={[...document.resources, ...document.containers]} placeKey={document.ref.key} hasSpace={document.space !== null} />
    <QuestRowsSection id="quests" title="Quests" roleLabel="Role" rows={quests} {registry} />
    <LinkSection id="properties" title="Properties" refs={document.properties} {registry} />
    <LinkSection id="areas" title="Areas" refs={document.regions} {registry} />
  </Sections>
</DetailFrame>

<style>
  .artwork { display: block; width: 100%; height: auto; margin-bottom: 1rem; border: 1px solid var(--c-frame-strong); border-radius: var(--c-radius); background: var(--c-surface-sunken); }
  .description { margin: 0 0 1rem; line-height: 1.5; white-space: pre-line; }
  .side-card { margin-bottom: 1rem; padding: 1rem; border: 1px solid var(--c-line-soft); border-radius: var(--c-radius); background: var(--c-surface-1); }
  h2 { margin: 0 0 .5rem; font-size: 1rem; }
</style>
