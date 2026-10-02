<script lang="ts">
  import type { PublicKindEntry, StaticDocument } from '@afallon/contracts/public';
  import AbilityPage from './pages/AbilityPage.svelte';
  import CharacterProgressionPage from './pages/CharacterProgressionPage.svelte';
  import CraftingAndGatheringPage from './pages/CraftingAndGatheringPage.svelte';
  import CorruptionPage from './pages/CorruptionPage.svelte';
  import GatheringNodePage from './pages/GatheringNodePage.svelte';
  import ClassPage from './pages/ClassPage.svelte';
  import CraftingStationPage from './pages/CraftingStationPage.svelte';
  import CurrencyPage from './pages/CurrencyPage.svelte';
  import FactionPage from './pages/FactionPage.svelte';
  import GearSetPage from './pages/GearSetPage.svelte';
  import HeroicTierPage from './pages/HeroicTierPage.svelte';
  import ItemPage from './pages/ItemPage.svelte';
  import GuidePage from './pages/GuidePage.svelte';
  import NpcPage from './pages/NpcPage.svelte';
  import PlacePage from './pages/PlacePage.svelte';
  import PropertyPage from './pages/PropertyPage.svelte';
  import QuestPage from './pages/QuestPage.svelte';
  import RacePage from './pages/RacePage.svelte';
  import SkillPage from './pages/SkillPage.svelte';

  /** The published document with its kind, which selects the page of that kind. */
  export let page: StaticDocument;
  export let registry: PublicKindEntry[];
  export let inlineItem: Extract<StaticDocument, { kind: 'items' }>['document'] | undefined = undefined;
</script>

{#if page.kind === 'items'}<ItemPage document={page.document} {registry} />
{:else if page.kind === 'npcs'}<NpcPage document={page.document} {registry} />
{:else if page.kind === 'quests'}<QuestPage document={page.document} {registry} />
{:else if page.kind === 'places'}<PlacePage document={page.document} {registry} />
{:else if page.kind === 'properties'}<PropertyPage document={page.document} {registry} />
{:else if page.kind === 'abilities'}<AbilityPage document={page.document} {registry} />
{:else if page.kind === 'classes'}<ClassPage document={page.document} {registry} />
{:else if page.kind === 'skills'}<SkillPage document={page.document} {registry} />
{:else if page.kind === 'mechanics' && page.document.topic === 'character-progression'}<CharacterProgressionPage document={page.document} {registry} />
{:else if page.kind === 'mechanics' && page.document.topic === 'heroic-tier'}<HeroicTierPage document={page.document} {registry} />
{:else if page.kind === 'mechanics' && page.document.topic === 'crafting-and-gathering'}<CraftingAndGatheringPage document={page.document} {registry} />
{:else if page.kind === 'mechanics' && page.document.topic === 'corruption'}<CorruptionPage document={page.document} {registry} {inlineItem} />
{:else if page.kind === 'mechanics' && (page.document.topic === 'loot' || page.document.topic === 'adventurers' || page.document.topic === 'factions' || page.document.topic === 'world-quests')}<GuidePage document={page.document} {registry} />
{:else if page.kind === 'gatheringNodes'}<GatheringNodePage document={page.document} {registry} />
{:else if page.kind === 'gearSets'}<GearSetPage document={page.document} {registry} />
{:else if page.kind === 'currencies'}<CurrencyPage document={page.document} {registry} />
{:else if page.kind === 'craftingStations'}<CraftingStationPage document={page.document} {registry} />
{:else if page.kind === 'races'}<RacePage document={page.document} {registry} />
{:else if page.kind === 'factions'}<FactionPage document={page.document} {registry} />{/if}
