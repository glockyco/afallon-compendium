<script lang="ts">
  import { base } from '$app/paths';
  import type { PublicKindEntry, PublicPlace } from '@afallon/contracts/public';
  import { labelOf, levelText } from '../../format';
  import { placeOnMap } from '../../map-links';
  import Hero from '../Hero.svelte';
  import { placeCreatureRows, placePointsOfInterest } from '../place-rows';
  import { placeQuestRows } from '../quest-rows';
  import ConnectionsSection from '../sections/ConnectionsSection.svelte';
  import LinkSection from '../sections/LinkSection.svelte';
  import PlaceCreaturesSection from '../sections/PlaceCreaturesSection.svelte';
  import PointsOfInterestSection from '../sections/PointsOfInterestSection.svelte';
  import QuestRowsSection from '../sections/QuestRowsSection.svelte';
  import TitleBlock, { type TitleFact } from '../TitleBlock.svelte';

  export let document: PublicPlace;
  export let registry: PublicKindEntry[];

  $: facts = document.facts;
  $: titleFacts = [
    ...(facts.placeType ? [{ text: labelOf(facts.placeType) }] : []),
    ...(facts.levelRange ? [{ label: 'Level', text: levelText(facts.levelRange) }] : []),
    ...(document.parent ? [{ label: 'Part of', refs: [document.parent] }] : []),
    ...(facts.guideIncluded ? [{ text: 'In the Adventure Guide' }] : []),
  ] satisfies TitleFact[];
  $: inhabitants = placeCreatureRows(document.bosses, document.creatures);
  $: pointsOfInterest = placePointsOfInterest([...document.services, ...document.resources, ...document.containers], [...document.creatures, ...document.npcs]);
  $: quests = placeQuestRows(document.quests, document.questObjectives);
</script>

<article class="detail-page">
  <TitleBlock name={document.ref.name} facts={titleFacts} mapHref={document.space ? placeOnMap(document.ref.key) : undefined} {registry} />

  {#if document.art.artwork || document.description}
    <Hero view={document.art.artwork ? 'wide' : undefined}>
      <svelte:fragment slot="view">
        {#if document.art.artwork}<img class="artwork" src={`${base}/data/${document.art.artwork.url}`} width={document.art.artwork.width} height={document.art.artwork.height} alt={`${document.ref.name} artwork`} />{/if}
      </svelte:fragment>
      {#if document.description}<p class="c-prose">{document.description}</p>{/if}
    </Hero>
  {/if}

  <div class="c-sections">
    <PlaceCreaturesSection id="bosses" title="Bosses" icon="boss" rows={inhabitants.bosses} {registry} />
    <PlaceCreaturesSection id="creatures" title="Creatures" icon="beast" rows={inhabitants.creatures} {registry} />
    <PlaceCreaturesSection id="npcs" title="NPCs" icon="people" rows={document.npcs} {registry} />
    <PointsOfInterestSection rows={pointsOfInterest} placeKey={document.ref.key} hasSpace={document.space !== null} />
    <QuestRowsSection id="quests" title="Quests" roleLabel="Role" rows={quests} {registry} />
    <LinkSection id="properties" title="Properties" icon="property" refs={document.properties} {registry} />
    <ConnectionsSection connections={document.connections} {registry} />
    <LinkSection id="areas" title="Areas" icon="area" refs={document.regions} {registry} />
  </div>
</article>

<style>
  .artwork { display: block; width: 100%; height: auto; border: 1px solid #74684e; border-radius: var(--c-radius); background: #141514; }
</style>
