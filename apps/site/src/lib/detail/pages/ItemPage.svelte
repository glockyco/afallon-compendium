<script lang="ts">
  import { base } from '$app/paths';
  import { categoryLabel, type PublicItem, type PublicKindEntry } from '@afallon/contracts/public';
  import EntityLink from '../../EntityLink.svelte';
  import ItemTooltip from '../../ItemTooltip.svelte';
  import ObjectiveText from '../../ObjectiveText.svelte';
  import Price from '../../Price.svelte';
  import { formatNumber, rarityTone } from '../../format';
  import { itemOnMap } from '../../map-links';
  import AnswerCard from '../AnswerCard.svelte';
  import DetailFrame from '../DetailFrame.svelte';
  import HowItWorks from '../HowItWorks.svelte';
  import MaterialsList from '../MaterialsList.svelte';
  import RecipeEquation from '../RecipeEquation.svelte';
  import { craftExperienceSentence, itemSourceLines, lineHref } from '../item-sources';
  import { planColumns, type RelationColumn } from '../relation-table';
  import RelationTable from '../RelationTable.svelte';
  import { itemQuestSourceRows, itemQuestUseRows } from '../quest-rows';
  import CraftingSection from '../sections/CraftingSection.svelte';
  import ContainerSection from '../sections/ContainerSection.svelte';
  import DroppedBySection from '../sections/DroppedBySection.svelte';
  import GatherSection from '../sections/GatherSection.svelte';
  import QuestRowsSection from '../sections/QuestRowsSection.svelte';
  import VendorSection from '../sections/VendorSection.svelte';
  import Section from '../Section.svelte';
  import SummaryValue from '../SummaryValue.svelte';
  import TitleBlock from '../TitleBlock.svelte';

  export let document: PublicItem;
  export let registry: PublicKindEntry[];

  let showAllRecipes = false;
  $: facts = document.facts;
  $: tone = rarityTone(facts.rarity);
  $: sources = itemSourceLines(document);
  $: craft = document.crafting;
  $: materials = craft?.materials.map((row) => ({ item: row.counterpart, quantity: row.count })) ?? [];
  $: experience = craft ? craftExperienceSentence(craft) : undefined;
  $: craftGuide = document.placedRules.find((rule) => rule.target === 'crafting');
  $: questUses = itemQuestUseRows(document.usedInQuests);
  $: onlyDrop = document.droppedBy.length === 1 ? document.droppedBy[0] : undefined;
  $: singleDropInAnswer = Boolean(onlyDrop?.creatureLevel && !onlyDrop.requirements.length && (onlyDrop.min ?? 1) === 1 && (onlyDrop.max ?? 1) === 1 && onlyDrop.chance !== undefined);
  $: onMap = document.sourceSpotCount > 0;
  const buyColumns: RelationColumn<PublicItem['buys'][number]>[] = [
    { id: 'item', label: 'Item', value: (row) => 'name' in row.item ? row.item.name : row.item.label, sort: (row) => 'name' in row.item ? row.item.name : row.item.label },
    { id: 'cost', label: 'Cost', value: (row) => row.price.amount, sort: (row) => row.price.amount },
    { id: 'sold-by', label: 'Sold by', value: (row) => row.soldBy.map((seller) => 'name' in seller ? seller.name : seller.label).join(', ') },
  ];
  $: buyPlan = planColumns(buyColumns, document.buys);
  $: typeLine = [facts.rarity, facts.armorType ?? facts.weaponType ?? facts.itemType, facts.slot].filter((entry): entry is string => Boolean(entry)).map(categoryLabel).join(' · ');
</script>

<article class="detail-page" data-rarity={tone}>
  <DetailFrame>
    <svelte:fragment slot="head"><TitleBlock name={document.ref.name} rarity={tone} imageUrl={document.art.icon || document.ref.icon ? `${base}/data/${(document.art.icon ?? document.ref.icon)!.url}` : undefined} {typeLine} mapHref={onMap ? itemOnMap(document.ref.key) : undefined} {registry} /></svelte:fragment>

    <svelte:fragment slot="answer">
      <AnswerCard title="How to get it">
        {#if sources.length}
          <ul class="routes">
            {#each sources as entry}
              <li class="route" class:primary={entry === sources[0]} id={entry.id === 'crafting' || (entry.id === 'dropped-by' && singleDropInAnswer) ? entry.id : undefined}>
                {#if entry.id !== 'crafting' || sources.length > 1}<div class="route-head"><strong class="route-label">{entry.label}</strong>{#if entry.spotCount}<span class="route-count">{formatNumber(entry.spotCount)} map spots</span>{/if}</div>{/if}
                {#if entry.id === 'crafting' && craft}
                  <p class="craft-title">{#if craft.skill}Crafted with <EntityLink ref={craft.skill} {registry} />{#if craft.ranks[0]}{' '}{formatNumber(craft.ranks[0].requiredLevel)}{/if}{:else}Crafted from the materials below{/if}{#if craft.station}{' at a '}{'name' in craft.station ? craft.station.name : craft.station.label} station{/if}</p>
                  {#if craft.recipe.name !== document.ref.name}<p class="recipe-name">Recipe: {craft.recipe.name}</p>{/if}
                  {#if materials.length}<MaterialsList {materials} {registry} />{/if}
                  {#if craft.product && craft.product.count > 1}<p>Makes {formatNumber(craft.product.count)} per craft.</p>{/if}
                  {#if craft.taughtBy.length}<p>Learn the recipe from {#each craft.taughtBy as teacher, index}{index > 0 ? ', ' : ''}<EntityLink ref={teacher} {registry} />{/each}.</p>{:else if craft.learnedByDefault}<p>Learned by default.</p>{/if}
                  {#if experience}<p>{experience} <span class="qualification">Base experience before skill modifiers.</span></p>{/if}
                  {#if craftGuide}<HowItWorks guide={craftGuide.guide} stepId={craftGuide.stepId} label="How crafting experience works" />{/if}
                {:else}
                  <p>{#if entry.id === 'dropped-by' && singleDropInAnswer && entry.text}{entry.text}{:else}<SummaryValue {entry} {registry} />{/if}{#if entry.detail}{' · '}{entry.detail}{/if}{#if entry.guaranteedYield}{' · '}{formatNumber(entry.guaranteedYield)} guaranteed{/if}</p>
                  {#if entry.id !== 'dropped-by' || !singleDropInAnswer}{#if entry.id !== 'starting-gear-of'}<a class="c-link route-more" href={lineHref(entry, registry, base)}>See full {entry.label.toLowerCase()} sources</a>{/if}{/if}
                {/if}
              </li>
            {/each}
          </ul>
        {:else}<p>No way to get this item is known for this build.</p>{/if}
      </AnswerCard>
    </svelte:fragment>

    <svelte:fragment slot="side">
      <div class="c-game-frame"><ItemTooltip {document} {registry}><svelte:fragment slot="ref" let:ref let:rankIndex><EntityLink {ref} {rankIndex} {registry} /></svelte:fragment></ItemTooltip></div>
      {#if document.description}<p class="description">{document.description}</p>{/if}
      {#if facts.buyPrice}<p class="side-fact">Buy price <Price price={facts.buyPrice} showName /></p>{/if}
      {#if facts.stackLimit > 1}<p class="side-fact">Stack size {formatNumber(facts.stackLimit)}</p>{/if}
    </svelte:fragment>

    {#if document.teaches}
      <Section id="teaches" title="Teaches"><CraftingSection craft={document.teaches} pageKey={document.ref.key} rules={document.placedRules.filter((entry) => entry.target === 'teaches')} {registry} /></Section>
    {/if}
    {#if document.usedInRecipes.length || questUses.length}
      <Section id="used-for" title="Used for" count={document.usedInRecipes.length + questUses.length}>
        {#if document.usedInRecipes.length}<div id="used-in-recipes" class="used-recipes">
          {#each document.usedInRecipes as row, index}
            {#if showAllRecipes || index < 8}<div class="used-row"><RecipeEquation materials={[{ item: document.ref, quantity: row.count }]} product={row.counterpart} yieldCount={row.product?.count ?? 1} skill={row.skill} requiredLevel={row.requiredLevel} {registry} /></div>{/if}
          {/each}
          {#if !showAllRecipes && document.usedInRecipes.length > 8}<button class="c-action" type="button" on:click={() => (showAllRecipes = true)}>Show {document.usedInRecipes.length - 8} more</button>{/if}
        </div>{/if}
        {#if questUses.length}<div id="needed-for-quests" class="used-quests">{#each questUses as row}<div class="used-quest"><EntityLink ref={row.quest} {registry} />{#if row.count && row.count > 1}<span>×{row.count}</span>{/if}{#each row.objectives as objective}<span><ObjectiveText {objective} /></span>{/each}</div>{/each}</div>{/if}
      </Section>
    {:else if !document.teaches && !document.buys.length}<Section id="used-for" title="Used for"><p>Nothing in this build uses {document.ref.name} as a material or quest item.</p></Section>{/if}
    <GatherSection rows={document.gatheredFrom} itemKey={document.ref.key} {registry} />
    {#if document.buys.length}
      <Section id="buys" title="Buys" count={document.buys.length}>
        <RelationTable columns={buyPlan.columns} rows={document.buys} label="Buys">
          <svelte:fragment slot="cell" let:row let:column>
            {#if column === 'item'}<EntityLink ref={row.item} {registry} />
            {:else if column === 'cost'}<Price price={row.price} showName />
            {:else}{#each row.soldBy as seller, index}{#if index}, {/if}<EntityLink ref={seller} {registry} />{/each}{/if}
          </svelte:fragment>
        </RelationTable>
      </Section>
    {/if}
    {#if document.droppedBy.length && !singleDropInAnswer}<DroppedBySection rows={document.droppedBy} {registry} />{/if}
    <VendorSection id="sold-by" title="Sold by" counterpartLabel="Vendor" rows={document.soldBy} sort={{ id: 'price', dir: 'asc' }} {registry} />
    <ContainerSection id="collected-from" title="Found in objects" rows={document.collectedFrom} sourceAvailabilities={document.sourceAvailabilities} itemKey={document.ref.key} {registry} />
    <ContainerSection id="found-in-containers" title="Found in containers" rows={document.inContainers} sourceAvailabilities={document.sourceAvailabilities} itemKey={document.ref.key} {registry} />
    <QuestRowsSection id="from-quests" title="Quest rewards" roleLabel="Given as" rows={itemQuestSourceRows(document.rewardedBy, document.givenBy)} {registry} />
  </DetailFrame>
</article>

<style>
  .routes { display: grid; gap: 0; margin: 0; padding: 0; list-style: none; }
  .route { display: grid; gap: .6rem; min-width: 0; padding: .9rem 0; border-top: 1px solid var(--c-line); scroll-margin-top: 1rem; }
  .route:first-child { border-top: 0; padding-top: 0; }
  .route:last-child { padding-bottom: 0; }
  .route-head { display: flex; justify-content: space-between; gap: .75rem; align-items: baseline; }
  .route-label, .craft-title { font-weight: 700; color: var(--c-text-strong); }
  .route.primary .route-label { color: var(--c-accent); }
  .craft-title { font-size: 1.15rem; }
  .recipe-name { color: var(--c-text-dim); }
  .route-count, .qualification { color: var(--c-text-dim); font-size: var(--c-text-small); }
  .route-more { justify-self: start; font-size: var(--c-text-small); min-height: 1.5rem; }
  .route p, .description, .side-fact { margin: 0; line-height: 1.5; }
  .description { margin-top: 1rem; color: var(--c-text-dim); }
  .side-fact { display: flex; justify-content: space-between; gap: .75rem; margin-top: .75rem; }
  .used-recipes, .used-quests { display: grid; gap: .5rem; scroll-margin-top: 1rem; }
  .used-quests { margin-top: .75rem; }
  .used-row, .used-quest { min-width: 0; padding: .55rem .7rem; border: 1px solid var(--c-line); border-radius: var(--c-radius); background: var(--c-surface-1); }
  .used-quest { display: flex; align-items: center; flex-wrap: wrap; gap: .35rem .75rem; }
  :global(.detail-frame .rest > .section + .section) { margin-top: 2rem; }
</style>
