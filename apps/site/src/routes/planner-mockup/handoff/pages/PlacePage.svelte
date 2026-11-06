<!-- Throwaway copy of PlacePage for the planner hand-off mockup. -->
<script lang="ts">
  import type { PublicKindEntry, PublicPlace } from '@afallon/contracts/public';
  import { categoryLabel } from '@afallon/contracts/public';
  import { base } from '$app/paths';
  import EntityLink from '$lib/EntityLink.svelte';
  import ActiveCharacterContext from '$lib/planner/ActiveCharacterContext.svelte';
  import { formatNumber, levelText, listText } from '$lib/format';
  import { placeOnMap } from '$lib/map-links';
  import AnswerCard from '$lib/detail/AnswerCard.svelte';
  import DetailFrame from '$lib/detail/DetailFrame.svelte';
  import { placeCreatureRows } from '$lib/detail/place-rows';
  import { placeQuestRows } from '$lib/detail/quest-rows';
  import LinkSection from '$lib/detail/sections/LinkSection.svelte';
  import PlaceCreaturesSection from '$lib/detail/sections/PlaceCreaturesSection.svelte';
  import PlaceLootObjectsSection from '$lib/detail/sections/PlaceLootObjectsSection.svelte';
  import PlaceSideCards from '$lib/detail/sections/PlaceSideCards.svelte';
  import PlacesToEnterSection from '$lib/detail/sections/PlacesToEnterSection.svelte';
  import PointsOfInterestSection from '$lib/detail/sections/PointsOfInterestSection.svelte';
  import QuestRowsSection from '$lib/detail/sections/QuestRowsSection.svelte';
  import TitleBlock from '$lib/detail/TitleBlock.svelte';
  import Sections from '$lib/detail/Sections.svelte';

  export let document: PublicPlace;
  export let registry: PublicKindEntry[];

  $: facts = document.facts;
  $: artwork = document.art.artwork;
  $: inhabitants = placeCreatureRows(document.bosses, document.creatures);
  $: quests = placeQuestRows(document.quests, document.questObjectives);
  $: hasSide = document.startingRaces.length > 0 || document.challengeStoneStart !== undefined || document.entrances.length > 0
    || document.dungeonFinder !== undefined || document.timedDungeon !== undefined || document.services.length > 0 || Boolean(document.heroicConsoles?.length);
  $: identity = [
    ...(facts.levelRange ? [{ label: 'Levels', text: levelText(facts.levelRange) }] : []),
    ...(facts.guideIncluded ? [{ text: 'In the Adventure Guide' }] : []),
  ];
  $: summary = [
    ...(inhabitants.bosses.length ? [`${formatNumber(inhabitants.bosses.length)} ${inhabitants.bosses.length === 1 ? 'boss' : 'bosses'}`] : []),
    ...(inhabitants.creatures.length ? [`${formatNumber(inhabitants.creatures.length)} ${inhabitants.creatures.length === 1 ? 'creature' : 'creatures'}`] : []),
    ...(quests.length ? [`${formatNumber(quests.length)} ${quests.length === 1 ? 'quest' : 'quests'}`] : []),
    ...(document.placesToEnter.length ? [`${formatNumber(document.placesToEnter.length)} ${document.placesToEnter.length === 1 ? 'place to enter' : 'places to enter'}`] : []),
  ];
</script>

<!-- On phones the playable contents follow the artwork; desktop keeps the description before the contents. -->
<DetailFrame side={hasSide} answer={Boolean(artwork || document.description || summary.length || document.variantOf || !document.space)}>
  <svelte:fragment slot="head"><TitleBlock name={document.ref.name} typeLine={categoryLabel(facts.placeType)} facts={identity} mapHref={document.space ? placeOnMap(document.ref.key, document.variantOf ? 'all' : undefined) : undefined} {registry} /></svelte:fragment>
  <svelte:fragment slot="answer">
    {#if artwork || document.description || summary.length || document.variantOf}
      <AnswerCard title="Explore this place">
        {#if artwork}<img class="artwork" src={`${base}/data/${artwork.url}`} width={artwork.width} height={artwork.height} alt={`${document.ref.name} artwork`} />{/if}
        {#if document.variantOf}<p>A challenge version of <EntityLink ref={document.variantOf} {registry} />. It also contains copies of overworld content.</p>{/if}
        {#if summary.length}
          <div class="place-contents">
            <p>Find {listText(summary)} here.</p>
            <nav class="answer-links" aria-label="Explore this place">
              {#if document.placesToEnter.length}<a class="c-link" href="#places-to-enter">Places to Enter</a>{/if}
              {#if inhabitants.bosses.length}<a class="c-link" href="#bosses">Bosses</a>{/if}
              {#if inhabitants.creatures.length}<a class="c-link" href="#creatures">Creatures</a>{/if}
              {#if quests.length}<a class="c-link" href="#quests">Quests</a>{/if}
              {#if document.resources.length || document.containers.length}<a class="c-link" href="#points-of-interest">Gathering and Objects</a>{/if}
            </nav>
          </div>
        {/if}
        {#if document.description}<p class="description">{document.description}</p>{/if}
        {#if !summary.length && !document.space}<p class="unmapped">This place has no mapped location or known points of interest.</p>{/if}
      </AnswerCard>
    {:else}<p class="unmapped">No location or points of interest are available for this place.</p>{/if}
  </svelte:fragment>
  <svelte:fragment slot="side"><slot name="handoff" /><PlaceSideCards {document} {registry} /></svelte:fragment>
  <Sections>
    <PlacesToEnterSection rows={document.placesToEnter} {registry} />
    <PlaceCreaturesSection id="bosses" title="Bosses" rows={inhabitants.bosses} {registry} />
    <PlaceCreaturesSection id="creatures" title="Creatures" rows={inhabitants.creatures} {registry} />
    <PlaceCreaturesSection id="npcs" title="NPCs" rows={document.npcs} {registry} />
    <PointsOfInterestSection id="points-of-interest" title="Gathering and Objects" rows={[...document.resources, ...document.containers]} placeKey={document.ref.key} hasSpace={document.space !== null} />
    <PlaceLootObjectsSection rows={document.lootObjects} {registry} />
    <QuestRowsSection id="quests" title="Quests" roleLabel="Role" rows={quests} {registry} />
    <LinkSection id="properties" title="Properties" refs={document.properties} {registry} />
    <LinkSection id="areas" title="Areas" refs={document.regions} {registry} />
  </Sections>
</DetailFrame>

<style>
  /* The artwork keeps its wide shape at every width and stops at a banner's height, so the place's contents stay near. */
  .artwork { display: block; width: 100%; height: auto; max-height: 15rem; object-fit: cover; border: 1px solid var(--c-frame-strong); border-radius: var(--c-radius); background: var(--c-surface-sunken); }
  .description { white-space: pre-line; order: 1; }
  .place-contents { display: grid; gap: .5rem; order: 2; }
  .unmapped { margin: 0; color: var(--c-text-dim); }
  .answer-links { display: flex; flex-wrap: wrap; gap: .35rem 1rem; font-size: var(--c-text-small); }
  @media (max-width: 1023px) {
    .place-contents, .description { order: 0; }
  }
</style>
