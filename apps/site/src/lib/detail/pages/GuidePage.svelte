<script lang="ts">
  import type { AdventurersGuide, FactionsGuide, LootGuide, PublicKindEntry, TravelGuide, WorldQuestsGuide } from '@afallon/contracts/public';
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
   * A guide whose page is its overview and its rule sections. The Adventurers guide adds its roster and its gear to their
   * sections, the Factions guide adds a new character's standings and the count of what changes standing, and the World
   * Quests guide links the Heroic Tier guide from its rewards, and the Travel guide adds its flight networks.
   */
  export let document: LootGuide | AdventurersGuide | FactionsGuide | TravelGuide | WorldQuestsGuide;
  export let registry: PublicKindEntry[];
</script>

<article class="detail-page">
  <TitleBlock name={document.ref.name} {registry} />
  <Hero><p class="c-prose">{document.overview}</p></Hero>
  <Sections>
    {#each document.sections as section (section.id)}
      <GuideSection {section} {registry}>{#if document.topic === 'adventurers' && section.id === 'roster'}<AdventurerRoster roster={document.roster} {registry} />{:else if document.topic === 'adventurers' && section.id === 'gear-upgrades'}<AdventurerGearTables gear={document.gear} {registry} />{:else if document.topic === 'factions' && section.id === 'new-character-standing'}<FactionStandings rows={document.standings} {registry} />{:else if document.topic === 'factions' && section.id === 'changing-standing'}<p>{document.standingChanges ? `${formatNumber(document.standingChanges)} creatures, quests, and items on this site change your standing.` : 'No creature, quest, or item on this site changes your standing.'}</p>{:else if document.topic === 'world-quests' && section.id === 'rewards'}<HowItWorks guide={{ key: 'mechanics:heroic-tier', kind: 'mechanics', name: 'Heroic Tier', slug: 'heroic-tier' }} section="settings" label="About the Heroic Tier" />{:else if document.topic === 'travel' && section.id === 'network'}<FlightNetworkSection networks={document.networks} />{/if}</GuideSection>
    {/each}
  </Sections>
</article>
