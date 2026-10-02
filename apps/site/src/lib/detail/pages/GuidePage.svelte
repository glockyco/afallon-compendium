<script lang="ts">
  import { MECHANICS_TOPIC_DETAILS, type AdventurersGuide, type CombatGuide, type FactionsGuide, type LootGuide, type PublicKindEntry, type TravelGuide, type WorldQuestsGuide } from '@afallon/contracts/public';
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
   * A guide whose page is its overview and its rule sections. The Adventurers guide adds its roster and its gear to their
   * sections, the Factions guide adds a new character's standings and the count of what changes standing, and the World
   * Quests guide links the Heroic Tier guide from its rewards, and the Travel guide adds its flight networks.
   */
  export let document: LootGuide | AdventurersGuide | FactionsGuide | TravelGuide | WorldQuestsGuide | CombatGuide;
  export let registry: PublicKindEntry[];
  const heroicTier = MECHANICS_TOPIC_DETAILS['heroic-tier'];
</script>

<article class="detail-page">
  <TitleBlock name={document.ref.name} {registry} />
  <Hero><p class="c-prose">{document.overview}</p></Hero>
  <Sections>
    {#each document.sections as section (section.id)}
      <GuideSection {section} {registry}>{#if document.topic === 'adventurers' && section.id === 'roster'}<AdventurerRoster roster={document.roster} {registry} />{:else if document.topic === 'adventurers' && section.id === 'gear-upgrades'}<AdventurerGearTables gear={document.gear} {registry} />{:else if document.topic === 'factions' && section.id === 'new-character-standing'}<FactionStandings rows={document.standings} {registry} />{:else if document.topic === 'factions' && section.id === 'changing-standing'}<p>{document.standingChanges ? `${formatNumber(document.standingChanges)} creatures, quests, and items on this site change your standing.` : 'No creature, quest, or item on this site changes your standing.'}</p>{:else if document.topic === 'world-quests' && section.id === 'rewards'}<HowItWorks guide={{ key: `mechanics:${heroicTier.id}`, kind: 'mechanics', name: heroicTier.name, slug: heroicTier.id }} section="settings" label="About the Heroic Tier" />{:else if document.topic === 'travel' && section.id === 'network'}<FlightNetworkSection networks={document.networks} />{:else if document.topic === 'combat' && section.id === 'recovery'}<div class="recovery-grid">{#each document.recovery as row}<div class="recovery-row"><EntityLink ref={row.stat} {registry} /><div>{#each row.entries as entry}<p>{entry.when === 'outside-combat' ? 'Outside Combat' : 'In Combat'}: {formatNumber(entry.amount)} Every {formatNumber(entry.interval)} Seconds</p>{/each}</div></div>{/each}</div>{/if}</GuideSection>
    {/each}
  </Sections>
</article>

<style>
  .recovery-grid { display: grid; gap: .75rem; margin-top: 1rem; }
  .recovery-row { display: flex; justify-content: space-between; align-items: baseline; gap: 1rem; border-top: 1px solid var(--c-line); padding-top: .65rem; }
  .recovery-row p { margin: 0; text-align: right; }
  @media (max-width: 600px) { .recovery-row { display: block; } .recovery-row p { text-align: left; } }
</style>
