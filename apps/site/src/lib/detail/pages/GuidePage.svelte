<script lang="ts">
  import { base } from '$app/paths';
  import { MECHANICS_TOPIC_DETAILS, type AdventurersGuide, type FactionsGuide, type PublicKindEntry, type TravelGuide, type WorldQuestsGuide } from '@afallon/contracts/public';
  import EntityLink from '../../EntityLink.svelte';
  import { formatNumber } from '../../format';
  import GuideSection from '../GuideSection.svelte';
  import HowItWorks from '../HowItWorks.svelte';
  import AdventurerGearTables from '../sections/AdventurerGearTables.svelte';
  import AdventurerRoster from '../sections/AdventurerRoster.svelte';
  import FactionStandings from '../sections/FactionStandings.svelte';
  import FlightNetworkSection from '../sections/FlightNetworkSection.svelte';
  import Hero from '../Hero.svelte';
  import Sections from '../Sections.svelte';
  import TitleBlock from '../TitleBlock.svelte';

  /**
   * A mechanics page presents its rule sections and, where applicable, roster, gear, faction standings,
   * or flight networks. World Quests also routes readers to the filtered quest catalog.
   */
  export let document: AdventurersGuide | FactionsGuide | TravelGuide | WorldQuestsGuide;
  export let registry: PublicKindEntry[];
  const heroicTier = MECHANICS_TOPIC_DETAILS['heroic-tier'];
</script>

<article class="detail-page">
  <TitleBlock name={document.ref.name} {registry} />
  <Hero>
    <p class="c-prose">{document.overview}</p>
    {#if document.topic === 'world-quests'}
      <nav class="quest-route" aria-label="World Quest pages">
        <strong>Find a World Quest</strong>
        <p>See where each quest starts, what you need to do, and what it rewards.</p>
        <a class="c-link" href={`${base}/quests/?questType=World+Quest`}>Browse{' '}{#if document.seeAlso?.length}{formatNumber(document.seeAlso.length)}{' '}{/if}World Quests</a>
        {#if document.seeAlso?.length}
          <ul aria-label="Example World Quests">{#each document.seeAlso.slice(0, 3) as example (example.ref.key)}<li><EntityLink ref={example.ref} {registry} /></li>{/each}</ul>
        {/if}
      </nav>
    {/if}
  </Hero>
  <Sections>
    {#each document.sections as section (section.id)}
      <GuideSection {section} {registry}>
        {#if document.topic === 'adventurers' && section.id === 'roster'}
          <AdventurerRoster roster={document.roster} {registry} />
        {:else if document.topic === 'adventurers' && section.id === 'gear-upgrades'}
          <AdventurerGearTables gear={document.gear} {registry} />
        {:else if document.topic === 'factions' && section.id === 'new-character-standing'}
          <FactionStandings rows={document.standings} {registry} />
        {:else if document.topic === 'factions' && section.id === 'changing-standing'}
          <p>{document.standingChanges ? `${formatNumber(document.standingChanges)} creatures, quests, and items on this site change your standing.` : 'No creature, quest, or item on this site changes your standing.'}</p>
        {:else if document.topic === 'world-quests' && section.id === 'rewards'}
          <HowItWorks guide={{ key: `mechanics:${heroicTier.id}`, kind: 'mechanics', name: heroicTier.name, slug: heroicTier.id }} section="settings" label="About the Heroic Tier" />
        {:else if document.topic === 'travel' && section.id === 'network'}
          <FlightNetworkSection networks={document.networks} />
        {/if}
      </GuideSection>
    {/each}
  </Sections>
</article>

<style>
  .quest-route { display: grid; gap: .35rem; padding-top: .85rem; border-top: 1px solid var(--c-line-soft); }
  .quest-route strong { color: var(--c-text-strong); }
  .quest-route p { margin: 0; }
  .quest-route a { justify-self: start; }
  .quest-route ul { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 12rem), 1fr)); gap: .35rem .8rem; list-style: none; margin: .5rem 0 0; padding: 0; }
  .quest-route li { min-width: 0; }
</style>
