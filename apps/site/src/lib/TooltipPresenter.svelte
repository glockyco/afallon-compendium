<script lang="ts">
  import type { PublicKindEntry, StaticDocument } from '@afallon/contracts/public';
  import AbilityTooltip from './AbilityTooltip.svelte';
  import ClassTooltip from './ClassTooltip.svelte';
  import ItemSourceSummary from './ItemSourceSummary.svelte';
  import ItemTooltip from './ItemTooltip.svelte';
  import NpcTooltip from './NpcTooltip.svelte';
  import PlaceTooltip from './PlaceTooltip.svelte';
  import PropertyTooltip from './PropertyTooltip.svelte';
  import QuestTooltip from './QuestTooltip.svelte';
  import RecipeTooltip from './RecipeTooltip.svelte';
  import SkillTooltip from './SkillTooltip.svelte';

  /** The published document with its kind, which selects the tooltip of that kind. */
  export let page: StaticDocument;
  export let registry: PublicKindEntry[];
  export let mapSpaceLabels: Readonly<Record<string, string>> = {};
  export let rankIndex: number | undefined = undefined;
  /** The variant or version anchor of the reference that opened the tooltip. */
  export let variant: string | undefined = undefined;
</script>

{#if page.kind === 'items'}<ItemTooltip document={page.document} {registry} /><ItemSourceSummary document={page.document} />
{:else if page.kind === 'abilities'}<AbilityTooltip document={page.document} {rankIndex} {variant} />
{:else if page.kind === 'recipes'}<RecipeTooltip document={page.document} {registry} />
{:else if page.kind === 'quests'}<QuestTooltip document={page.document} {registry} />
{:else if page.kind === 'npcs'}<NpcTooltip document={page.document} {registry} {variant} />
{:else if page.kind === 'places'}<PlaceTooltip document={page.document} {registry} {mapSpaceLabels} />
{:else if page.kind === 'properties'}<PropertyTooltip document={page.document} />
{:else if page.kind === 'classes'}<ClassTooltip document={page.document} {registry} {variant} />
{:else if page.kind === 'skills'}<SkillTooltip document={page.document} />{/if}
