<script lang="ts">
  import type { PublicKindEntry, PublicRecipe } from '@afallon/contracts/public';
  import EntityHeader, { type HeaderFact } from './EntityHeader.svelte';
  import RecipeTable from './RecipeTable.svelte';

  export let document: PublicRecipe;
  export let registry: PublicKindEntry[];
  export let showRelations = false;
  export let limit: number | undefined = undefined;

  $: facts = document.facts;
  $: headerFacts = [
    ...(facts.station && facts.station.key !== null ? [{ label: 'Station', value: facts.station.name }] : []),
    ...(facts.skill && facts.skill.key !== null ? [{ label: 'Skill', value: facts.skill.name }] : []),
    ...(facts.rank !== undefined ? [{ label: 'Rank', value: String(facts.rank) }] : []),
  ] satisfies HeaderFact[];
</script>

<article class="document">
  <EntityHeader
    name={document.ref.name}
    art={document.art.icon ?? document.ref.icon}
    fallbackIcon={registry.find((entry) => entry.kind === 'recipes')?.icon}
    facts={headerFacts}
    description={document.description}
  />

  <div class="c-stack">
    {#if showRelations}
      {#if document.product}<RecipeTable rows={[document.product]} {registry} heading="Produces" counterpartLabel="Item" {limit} />{/if}
      <RecipeTable rows={document.materials} {registry} heading="Materials" counterpartLabel="Item" {limit} />
    {/if}
  </div>
</article>
