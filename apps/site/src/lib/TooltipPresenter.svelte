<script lang="ts">
  import type { PublicAbility, PublicDocument, PublicGearSet, PublicItem, PublicKindEntry, PublicNpc, PublicPlace, PublicProperty, PublicQuest, PublicRecipe } from '@afallon/contracts/public';
  import AbilityTooltip from './AbilityTooltip.svelte';
  import GearSetTooltip from './GearSetTooltip.svelte';
  import ItemTooltip from './ItemTooltip.svelte';
  import NpcTooltip from './NpcTooltip.svelte';
  import PlaceTooltip from './PlaceTooltip.svelte';
  import PropertyTooltip from './PropertyTooltip.svelte';
  import QuestTooltip from './QuestTooltip.svelte';
  import RecipeTooltip from './RecipeTooltip.svelte';

  export let document: PublicDocument;
  export let registry: PublicKindEntry[];
  export let mapSpaceLabels: Readonly<Record<string, string>> = {};
  export let rankIndex: number | undefined = undefined;
  export let gearSet: PublicGearSet | null = null;
</script>

{#if document.ref.kind === 'items'}<ItemTooltip document={document as PublicItem} {registry} {gearSet} />
{:else if document.ref.kind === 'abilities'}<AbilityTooltip document={document as PublicAbility} {registry} {rankIndex} />
{:else if document.ref.kind === 'recipes'}<RecipeTooltip document={document as PublicRecipe} {registry} />
{:else if document.ref.kind === 'quests'}<QuestTooltip document={document as PublicQuest} {registry} />
{:else if document.ref.kind === 'gearSets'}<GearSetTooltip document={document as PublicGearSet} {registry} />
{:else if document.ref.kind === 'npcs'}<NpcTooltip document={document as PublicNpc} {registry} />
{:else if document.ref.kind === 'places'}<PlaceTooltip document={document as PublicPlace} {registry} {mapSpaceLabels} />
{:else if document.ref.kind === 'properties'}<PropertyTooltip document={document as PublicProperty} {registry} />{/if}
