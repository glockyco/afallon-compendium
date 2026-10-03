<script lang="ts">
  import type { MechanicsTopic, PublicDocument, PublicDocumentOf, PublicKindEntry, PublicMechanics, PublicPageKind, StaticDocument } from '@afallon/contracts/public';
  import type { ItemPickerOption } from './item-picker-options';
  import type { Component } from 'svelte';
  import AbilityPage from './pages/AbilityPage.svelte';
  import CharacterProgressionPage from './pages/CharacterProgressionPage.svelte';
  import CombatPage from './pages/CombatPage.svelte';
  import CraftingAndGatheringPage from './pages/CraftingAndGatheringPage.svelte';
  import CorruptionPage from './pages/CorruptionPage.svelte';
  import GatheringNodePage from './pages/GatheringNodePage.svelte';
  import ClassPage from './pages/ClassPage.svelte';
  import CraftingStationPage from './pages/CraftingStationPage.svelte';
  import CurrencyPage from './pages/CurrencyPage.svelte';
  import FactionPage from './pages/FactionPage.svelte';
  import EffectPage from './pages/EffectPage.svelte';
  import GearSetPage from './pages/GearSetPage.svelte';
  import HeroicTierPage from './pages/HeroicTierPage.svelte';
  import ItemPage from './pages/ItemPage.svelte';
  import GuidePage from './pages/GuidePage.svelte';
  import LootPage from './pages/LootPage.svelte';
  import NpcPage from './pages/NpcPage.svelte';
  import PlacePage from './pages/PlacePage.svelte';
  import PropertyPage from './pages/PropertyPage.svelte';
  import QuestPage from './pages/QuestPage.svelte';
  import RacePage from './pages/RacePage.svelte';
  import StatPage from './pages/StatPage.svelte';
  import SkillPage from './pages/SkillPage.svelte';

  type DetailProps<Document> = { document: Document; registry: PublicKindEntry[] };
  const pages = {
    items: ItemPage, npcs: NpcPage, quests: QuestPage, places: PlacePage, properties: PropertyPage,
    abilities: AbilityPage, classes: ClassPage, skills: SkillPage, gatheringNodes: GatheringNodePage,
    gearSets: GearSetPage, currencies: CurrencyPage, craftingStations: CraftingStationPage,
    races: RacePage, factions: FactionPage, stats: StatPage, effects: EffectPage,
  } satisfies { [K in Exclude<PublicPageKind, 'mechanics'>]: Component<DetailProps<PublicDocumentOf<K>>> };
  const guidePages = {
    'character-progression': CharacterProgressionPage, 'heroic-tier': HeroicTierPage,
    'crafting-and-gathering': CraftingAndGatheringPage, corruption: CorruptionPage,
    loot: LootPage, adventurers: GuidePage, factions: GuidePage, 'world-quests': GuidePage,
    travel: GuidePage, combat: CombatPage,
  } satisfies { [K in MechanicsTopic]: Component<DetailProps<Extract<PublicMechanics, { topic: K }>>> };

  /** The published document with its kind, which selects the page of that kind. */
  export let page: StaticDocument;
  export let registry: PublicKindEntry[];
  export let inlineItem: Extract<StaticDocument, { kind: 'items' }>['document'] | undefined = undefined;
  export let heroicItems: ItemPickerOption[] | undefined = undefined;
  export let corruptionItems: ItemPickerOption[] | undefined = undefined;
  $: detail = page.kind === 'mechanics' ? null
    : pages[page.kind] as Component<DetailProps<PublicDocument>>;
  $: guide = page.kind === 'mechanics'
    ? guidePages[page.document.topic] as Component<DetailProps<PublicMechanics> & { inlineItem?: typeof inlineItem; heroicItems?: ItemPickerOption[]; corruptionItems?: ItemPickerOption[] }>
    : null;
</script>

{#if page.kind === 'mechanics'}
  {#if guide}<svelte:component this={guide} document={page.document} {registry} {inlineItem} {heroicItems} {corruptionItems} />{/if}
{:else if page.kind === 'currencies'}
  <CurrencyPage document={page.document} {registry} {inlineItem} />
{:else if detail}
  <svelte:component this={detail} document={page.document} {registry} />
{/if}
