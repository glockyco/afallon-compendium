<script lang="ts">
  import type { PublicItem, PublicKindEntry, StaticDocument } from '@afallon/contracts/public';
  import AbilityPage from './pages/AbilityPage.svelte';
  import CharacterProgressionPage from './pages/CharacterProgressionPage.svelte';
  import CraftingAndGatheringPage from './pages/CraftingAndGatheringPage.svelte';
  import GatheringNodePage from './pages/GatheringNodePage.svelte';
  import ClassPage from './pages/ClassPage.svelte';
  import HeroicTierPage from './pages/HeroicTierPage.svelte';
  import ItemPage from './pages/ItemPage.svelte';
  import NpcPage from './pages/NpcPage.svelte';
  import PlacePage from './pages/PlacePage.svelte';
  import PropertyPage from './pages/PropertyPage.svelte';
  import QuestPage from './pages/QuestPage.svelte';
  import RecipePage from './pages/RecipePage.svelte';
  import SkillPage from './pages/SkillPage.svelte';

  /** The published document with its kind, which selects the page of that kind. */
  export let page: StaticDocument;
  export let registry: PublicKindEntry[];
  /** The item that a recipe makes, for the recipe's hero, or the product of the recipe that an item teaches. */
  export let product: PublicItem | undefined = undefined;
</script>

{#if page.kind === 'items'}<ItemPage document={page.document} {product} {registry} />
{:else if page.kind === 'npcs'}<NpcPage document={page.document} {registry} />
{:else if page.kind === 'quests'}<QuestPage document={page.document} {registry} />
{:else if page.kind === 'places'}<PlacePage document={page.document} {registry} />
{:else if page.kind === 'properties'}<PropertyPage document={page.document} {registry} />
{:else if page.kind === 'abilities'}<AbilityPage document={page.document} {registry} />
{:else if page.kind === 'recipes'}<RecipePage document={page.document} {product} {registry} />
{:else if page.kind === 'classes'}<ClassPage document={page.document} {registry} />
{:else if page.kind === 'skills'}<SkillPage document={page.document} {registry} />
{:else if page.kind === 'mechanics' && page.document.topic === 'character-progression'}<CharacterProgressionPage document={page.document} {registry} />
{:else if page.kind === 'mechanics' && page.document.topic === 'heroic-tier'}<HeroicTierPage document={page.document} {registry} />
{:else if page.kind === 'mechanics' && page.document.topic === 'crafting-and-gathering'}<CraftingAndGatheringPage document={page.document} {registry} />
{:else if page.kind === 'gatheringNodes'}<GatheringNodePage document={page.document} {registry} />{/if}
