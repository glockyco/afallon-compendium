<script lang="ts">
  import { base } from '$app/paths';
  import type { PublicItem, PublicKindEntry } from '@afallon/contracts/public';
  import EntityLink from '../../EntityLink.svelte';
  import ItemTooltip from '../../ItemTooltip.svelte';
  import MissingValue from '../../MissingValue.svelte';
  import Price from '../../Price.svelte';
  import { formatNumber, rarityTone } from '../../format';
  import { itemOnMap } from '../../map-links';
  import FactList from '../FactList.svelte';
  import FactRow from '../FactRow.svelte';
  import Hero from '../Hero.svelte';
  import { itemSourceLines, itemUseLines, lineHref } from '../item-sources';
  import { itemQuestSourceRows, itemQuestUseRows } from '../quest-rows';
  import ContainerSection from '../sections/ContainerSection.svelte';
  import DroppedBySection from '../sections/DroppedBySection.svelte';
  import GatherSection from '../sections/GatherSection.svelte';
  import Section from '../Section.svelte';
  import QuestRowsSection from '../sections/QuestRowsSection.svelte';
  import RecipeRowsSection from '../sections/RecipeRowsSection.svelte';
  import VendorSection from '../sections/VendorSection.svelte';
  import SummaryValue from '../SummaryValue.svelte';
  import TitleBlock from '../TitleBlock.svelte';
  import Sections from '../Sections.svelte';

  export let document: PublicItem;
  export let registry: PublicKindEntry[];
  /** The product of the recipe that the item teaches, for its tooltip. */
  export let product: PublicItem | undefined = undefined;

  $: facts = document.facts;
  $: tone = rarityTone(facts.rarity);
  $: sources = itemSourceLines(document);
  $: uses = itemUseLines(document);
  // The map shows the resources, containers, and objects that give the item. Creatures and vendors have their own pages.
  $: onMap = [...document.gatheredFrom, ...document.inContainers, ...document.collectedFrom].some((row) => row.placementCount > 0);
</script>

<article class="detail-page" data-rarity={tone}>
  <TitleBlock name={document.ref.name} rarity={tone} mapHref={onMap ? itemOnMap(document.ref.key) : undefined} {registry} />

  <Hero view="wide">
    <div slot="view" class="c-game-frame">
      <ItemTooltip {document} {registry}>
        <svelte:fragment slot="ref" let:ref let:rankIndex><EntityLink {ref} {rankIndex} {registry} /></svelte:fragment>
      </ItemTooltip>
    </div>
    {#if document.description}<p class="c-prose">{document.description}</p>{/if}
    {#if sources.length}
      <FactList title="How to get it">
        {#each sources as entry}<FactRow label={entry.label} href={lineHref(entry, registry, base)}><SummaryValue {entry} {registry} /></FactRow>{/each}
      </FactList>
    {:else}
      <FactList title="How to get it"><svelte:fragment slot="note"><MissingValue explanation="No source is published" />No way to get this item is known for this build.</svelte:fragment></FactList>
    {/if}
    {#if uses.length}
      <FactList title="Used for">
        {#each uses as entry}<FactRow label={entry.label} href={`#${entry.id}`}><SummaryValue {entry} {registry} /></FactRow>{/each}
      </FactList>
    {/if}
    {#if facts.buyPrice || facts.stackLimit > 1}
      <FactList>
        {#if facts.buyPrice}<FactRow label="Buy price"><Price price={facts.buyPrice} showName /></FactRow>{/if}
        {#if facts.stackLimit > 1}<FactRow label="Stack size">{formatNumber(facts.stackLimit)}</FactRow>{/if}
      </FactList>
    {/if}
  </Hero>

  <Sections>
    {#if facts.teaches}
      <Section id="teaches" title="Teaches" icon="teach">
        <p class="teaches">Using this item teaches the recipe <EntityLink ref={facts.teaches.recipe} {registry} />{#if facts.teaches.product}, which makes <EntityLink ref={facts.teaches.product} {registry} />{/if}.</p>
        {#if product}
          <div class="c-game-frame product">
            <ItemTooltip document={product} {registry}>
              <svelte:fragment slot="ref" let:ref let:rankIndex><EntityLink {ref} {rankIndex} {registry} /></svelte:fragment>
            </ItemTooltip>
          </div>
        {/if}
      </Section>
    {/if}
    <DroppedBySection rows={document.droppedBy} {registry} />
    <VendorSection id="sold-by" title="Sold by" counterpartLabel="Vendor" rows={document.soldBy} sort={{ id: 'price', dir: 'asc' }} {registry} />
    <ContainerSection id="found-in-containers" title="Found in containers" counterpartLabel="Container" icon="container" noun="container" rows={document.inContainers} itemKey={document.ref.key} {registry} />
    <GatherSection rows={document.gatheredFrom} itemKey={document.ref.key} {registry} />
    <ContainerSection id="collected-from" title="Collected from" counterpartLabel="Object" icon="object" noun="object" rows={document.collectedFrom} itemKey={document.ref.key} {registry} />
    <QuestRowsSection id="from-quests" title="From quests" roleLabel="Given as" rows={itemQuestSourceRows(document.rewardedBy, document.givenBy)} {registry} />
    <RecipeRowsSection id="crafted-from" title="Crafted from" counterpartLabel="Recipe" quantityLabel="Makes" assumedQuantity={1} rows={document.craftedBy} {registry} />
    <RecipeRowsSection id="used-in-recipes" title="Used in recipes" counterpartLabel="Recipe" quantityLabel="Needs" rows={document.usedInRecipes} {registry} />
    <QuestRowsSection id="needed-for-quests" title="Needed for quests" roleLabel="Objective" rows={itemQuestUseRows(document.usedInQuests)} {registry} />
  </Sections>
</article>

<style>
  .teaches { margin: 0 0 .8rem; line-height: 1.55; }
  .product { max-width: 24rem; }
</style>
