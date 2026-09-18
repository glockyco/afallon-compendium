<script lang="ts">
  import type { PublicKindEntry, PublicRecipe } from '@afallon/contracts/public';
  import EntityLink from './EntityLink.svelte';
  import FactCardFrame from './FactCardFrame.svelte';
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
    {#if facts.station}<div><dt>Station</dt><dd><EntityLink ref={facts.station} {registry} /></dd></div>{/if}
    {#if facts.skill}<div><dt>Skill</dt><dd><EntityLink ref={facts.skill} {registry} /></dd></div>{/if}
    {#if facts.rank !== undefined}<div><dt>Rank</dt><dd>{facts.rank}</dd></div>{/if}
  </dl>
  {#if showRelations}
    {#if document.product}<RecipeTable rows={[document.product]} {registry} heading="Product" counterpartLabel="Item" {limit} />{/if}
    <RecipeTable rows={document.materials} {registry} heading="Materials" counterpartLabel="Item" {limit} />
  {/if}
</FactCardFrame>
