<script lang="ts">
  import type { PublicKindEntry, PublicRecipe } from '@afallon/contracts/public';
  import EntityLink from './EntityLink.svelte';
  import FactCardFrame from './FactCardFrame.svelte';
  import MissingValue from './MissingValue.svelte';
  import RecipeTable from './RecipeTable.svelte';

  export let document: PublicRecipe;
  export let registry: PublicKindEntry[];
  export let compact = false;
  export let showRelations = false;
  export let limit: number | undefined = undefined;
  $: facts = document.facts;
</script>

<FactCardFrame name={document.ref.name} description={document.description} art={document.art.icon ?? document.ref.icon} fallbackIcon={registry.find((entry) => entry.kind === 'recipes')?.icon} {compact}>
  <dl class="facts">
    <div><dt>Station</dt><dd>{#if facts.station}<EntityLink ref={facts.station} {registry} />{:else}<MissingValue explanation="No crafting station is published" />{/if}</dd></div>
    <div><dt>Skill</dt><dd>{#if facts.skill}<EntityLink ref={facts.skill} {registry} />{:else}<MissingValue explanation="No crafting skill is published" />{/if}</dd></div>
    <div><dt>Rank</dt><dd>{#if facts.rank !== undefined}{facts.rank}{:else}<MissingValue explanation="No rank is published" />{/if}</dd></div>
  </dl>
  {#if showRelations}
    {#if document.product}<RecipeTable rows={[document.product]} {registry} heading="Product" counterpartLabel="Item" {limit} />{/if}
    <RecipeTable rows={document.materials} {registry} heading="Materials" counterpartLabel="Item" {limit} />
  {/if}
</FactCardFrame>
