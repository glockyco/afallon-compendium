<script lang="ts">
  import type { PublicItem, PublicKindEntry, PublicRecipe } from '@afallon/contracts/public';
  import EntityLink from '../../EntityLink.svelte';
  import ItemTooltip from '../../ItemTooltip.svelte';
  import FactList from '../FactList.svelte';
  import FactRow from '../FactRow.svelte';
  import Hero from '../Hero.svelte';
  import RecipeRowsSection from '../sections/RecipeRowsSection.svelte';
  import TitleBlock, { type TitleFact } from '../TitleBlock.svelte';
  import Sections from '../Sections.svelte';

  export let document: PublicRecipe;
  export let product: PublicItem | undefined;
  export let registry: PublicKindEntry[];

  $: facts = [
    ...(document.facts.station ? [{ label: 'Station', refs: [document.facts.station] }] : []),
    ...(document.facts.skill ? [{ label: 'Skill', refs: [document.facts.skill] }] : []),
    ...(document.facts.rank !== undefined && document.facts.rank > 0 ? [{ text: `Rank ${document.facts.rank}` }] : []),
  ] satisfies TitleFact[];
</script>

<article class="detail-page">
  <TitleBlock name={document.ref.name} {facts} {registry} />

  {#if product || document.description || document.product}
    <Hero view={product ? 'wide' : undefined}>
      <div slot="view" class="c-game-frame">
        {#if product}
          <ItemTooltip document={product} {registry}>
            <svelte:fragment slot="ref" let:ref let:rankIndex><EntityLink {ref} {rankIndex} {registry} /></svelte:fragment>
          </ItemTooltip>
        {/if}
      </div>
      {#if document.description}<p class="c-prose">{document.description}</p>{/if}
      {#if document.product && (!product || document.product.count > 1)}
        <FactList><FactRow label="Makes">{#if !product}<EntityLink ref={document.product.counterpart} {registry} />{#if document.product.count > 1} × {document.product.count}{/if}{:else}{document.product.count}{/if}</FactRow></FactList>
      {/if}
    </Hero>
  {/if}

  <Sections>
    <RecipeRowsSection id="materials" title="Materials" counterpartLabel="Material" quantityLabel="Quantity" rows={document.materials} {registry} />
  </Sections>
</article>
