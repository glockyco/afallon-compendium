<script lang="ts">
  import type { PublicAbility, PublicDocument, PublicGearSet, PublicItem, PublicKindEntry, PublicNpc, PublicPlace, PublicProperty, PublicQuest, PublicRecipe } from '@afallon/contracts/public';
  import FactCardAbility from './FactCardAbility.svelte';
  import FactCardGearSet from './FactCardGearSet.svelte';
  import FactCardItem from './FactCardItem.svelte';
  import FactCardNpc from './FactCardNpc.svelte';
  import FactCardPlace from './FactCardPlace.svelte';
  import FactCardProperty from './FactCardProperty.svelte';
  import FactCardQuest from './FactCardQuest.svelte';
  import FactCardRecipe from './FactCardRecipe.svelte';

  export let document: PublicDocument;
  export let registry: PublicKindEntry[];
  export let mapSpaceLabels: Readonly<Record<string, string>> = {};
  export let compact = false;
  export let showRelations = false;
  export let limit: number | undefined = undefined;
</script>

{#if document.ref.kind === 'items'}<FactCardItem document={document as PublicItem} {registry} {compact} {showRelations} {limit} />
{:else if document.ref.kind === 'npcs'}<FactCardNpc document={document as PublicNpc} {registry} {compact} {showRelations} {limit} />
{:else if document.ref.kind === 'quests'}<FactCardQuest document={document as PublicQuest} {registry} {compact} {showRelations} {limit} />
{:else if document.ref.kind === 'places'}<FactCardPlace document={document as PublicPlace} {registry} {mapSpaceLabels} {compact} {showRelations} {limit} />
{:else if document.ref.kind === 'properties'}<FactCardProperty document={document as PublicProperty} {registry} {compact} {showRelations} {limit} />
{:else if document.ref.kind === 'abilities'}<FactCardAbility document={document as PublicAbility} {registry} {compact} {showRelations} {limit} />
{:else if document.ref.kind === 'recipes'}<FactCardRecipe document={document as PublicRecipe} {registry} {compact} {showRelations} {limit} />
{:else if document.ref.kind === 'gearSets'}<FactCardGearSet document={document as PublicGearSet} {registry} {compact} {showRelations} {limit} />{/if}
