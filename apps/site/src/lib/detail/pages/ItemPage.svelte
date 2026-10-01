<script lang="ts">
  import { base } from '$app/paths';
  import { categoryLabel, type PublicItem, type PublicKindEntry } from '@afallon/contracts/public';
  import EntityLink from '../../EntityLink.svelte';
  import ItemTooltip from '../../ItemTooltip.svelte';
  import ObjectiveText from '../../ObjectiveText.svelte';
  import Price from '../../Price.svelte';
  import { formatNumber, rarityTone } from '../../format';
  import { itemOnMap, spotOnMap } from '../../map-links';
  import AnswerCard from '../AnswerCard.svelte';
  import DetailsDisclosure from '../DetailsDisclosure.svelte';
  import DetailFrame from '../DetailFrame.svelte';
  import HowItWorks from '../HowItWorks.svelte';
  import LevelSlider from '../LevelSlider.svelte';
  import MaterialsList from '../MaterialsList.svelte';
  import RecipeEquation from '../RecipeEquation.svelte';
  import { craftExperienceSentence, itemSourceLines, lineHref } from '../item-sources';
  import { planColumns, shownRowCount, type RelationColumn } from '../relation-table';
  import RelationTable from '../RelationTable.svelte';
  import { itemQuestSourceRows, itemQuestUseRows } from '../quest-rows';
  import CraftingSection from '../sections/CraftingSection.svelte';
  import ContainerSection from '../sections/ContainerSection.svelte';
  import DroppedBySection from '../sections/DroppedBySection.svelte';
  import GatherSection from '../sections/GatherSection.svelte';
  import QuestRowsSection from '../sections/QuestRowsSection.svelte';
  import VendorSection from '../sections/VendorSection.svelte';
  import Section from '../Section.svelte';
  import Sections from '../Sections.svelte';
  import SummaryValue from '../SummaryValue.svelte';
  import TitleBlock from '../TitleBlock.svelte';

  export let document: PublicItem;
  export let registry: PublicKindEntry[];

  let showAllRecipes = false;
  $: shownRecipes = shownRowCount(document.usedInRecipes.length, showAllRecipes);
  let corruptionLevel = 0;
  $: facts = document.facts;
  $: tone = rarityTone(facts.rarity);
  $: sources = itemSourceLines(document);
  $: craft = document.crafting;
  $: materials = craft?.materials.map((row) => ({ item: row.counterpart, quantity: row.count })) ?? [];
  $: experience = craft ? craftExperienceSentence(craft) : undefined;
  $: craftGuide = document.placedRules.find((rule) => rule.target === 'crafting');
  $: chestGuide = document.placedRules.find((rule) => rule.target === 'when-used' && rule.stepId === 'open-a-chest');
  $: packGuide = document.placedRules.find((rule) => rule.target === 'when-used' && rule.stepId !== 'open-a-chest');
  $: firstPack = document.whenUsed.packs[0];
  $: sharedPackPicks = firstPack && document.whenUsed.packs.every((pack) =>
    pack.minimumPicks === firstPack.minimumPicks && pack.maximumPicks === firstPack.maximumPicks
    && pack.bonusChance === firstPack.bonusChance && pack.worldShare === firstPack.worldShare) ? firstPack : undefined;
  $: corruptionGuide = document.placedRules.find((rule) => rule.target === 'corruption');
  $: dungeonGuide = document.placedRules.find((rule) => rule.target === 'corruption' || rule.target === 'corruption-token');
  $: tokenGuide = document.placedRules.find((rule) => rule.target === 'corruption-token');
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
  const chestColumns: RelationColumn<PublicItem['whenUsed']['chests'][number]['rows'][number]>[] = [
    { id: 'item', label: 'Item', value: (row) => 'name' in row.item ? row.item.name : row.item.label, sort: (row) => 'name' in row.item ? row.item.name : row.item.label },
    { id: 'quantity', label: 'Quantity', hint: 'How many of the item drop. Every amount in the range is equally likely.', numeric: true, value: (row) => `${row.min}–${row.max}`, sort: (row) => row.max },
    { id: 'chance', label: 'Chance', hint: 'Each item rolls this chance on its own when the chest opens.', numeric: true, value: (row) => row.chance, sort: (row) => row.chance },
  ];
  const packColumns: RelationColumn<PublicItem['whenUsed']['packs'][number]['entries'][number]>[] = [
    { id: 'item', label: 'Item', value: (row) => 'name' in row.item ? row.item.name : row.item.label, sort: (row) => 'name' in row.item ? row.item.name : row.item.label },
    { id: 'quantity', label: 'Quantity', hint: 'How many of the item you get when the pack gives it.', numeric: true, value: (row) => `${row.min}–${row.max}`, sort: (row) => row.max },
  ];
  const adventurerColumns: RelationColumn<PublicItem['adventurers'][number]>[] = [
    { id: 'relation', label: 'Adventurer gear', value: (row) => row.kind === 'kitUpgradeItem' ? ('name' in row.adventurer ? row.adventurer.name : row.adventurer.label) : row.kind },
  ];
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
                {:else if entry.id === 'dungeon-rewards' && facts.dungeonRewards}
                  {#if facts.dungeonRewards.every((reward) => reward.guaranteed)}
                    <p>Every timed dungeon run ends with a reward bag that holds one Corruption Token.</p>
                  {:else}
                    <p>This item has a chance to appear in a timed dungeon reward bag from these bosses:</p>
                  {/if}
                  <ul class="dungeon-list">
                    {#each facts.dungeonRewards as reward}
                      <li><EntityLink ref={reward.place} {registry} />{#if !reward.guaranteed && reward.bosses.length}{' · '}{#each reward.bosses as boss, index}{index ? ', ' : ''}<EntityLink ref={boss} {registry} />{/each}{/if}</li>
                    {/each}
                  </ul>
                  {#if dungeonGuide}<HowItWorks guide={dungeonGuide.guide} stepId="finish-the-timer" label="How dungeon rewards work" />{/if}
                {:else}
                  <p>{#if entry.id === 'dropped-by' && singleDropInAnswer && entry.text}{entry.text}{:else}<SummaryValue {entry} {registry} />{/if}{#if entry.detail}{' · '}{entry.detail}{/if}{#if entry.guaranteedYield}{' · '}{formatNumber(entry.guaranteedYield)} guaranteed{/if}</p>
                  {#if entry.id !== 'dropped-by' || !singleDropInAnswer}{#if entry.id !== 'starting-gear-of'}<a class="c-link route-more" href={lineHref(entry, registry, base)}>See full {entry.label.toLowerCase()} sources</a>{/if}{/if}
                {/if}
              </li>
            {/each}
          </ul>
        {:else if document.adventurers.length}<p>Only adventurers carry this item. <a class="c-link" href="#adventurers">See adventurer gear</a>.</p>
        {:else}<p>No known way to get this item.</p>{/if}
      </AnswerCard>
    </svelte:fragment>

    <svelte:fragment slot="side">
      <div class="c-game-frame"><ItemTooltip {document} {registry} {corruptionLevel}><svelte:fragment slot="ref" let:ref let:rankIndex><EntityLink {ref} {rankIndex} {registry} /></svelte:fragment></ItemTooltip></div>
      {#if facts.corruption}
        <div id="corruption" class="corruption-control">
          <LevelSlider id="corruption-level" label="Corruption level" min={0} max={facts.corruption.maxLevel} bind:level={corruptionLevel} readout={(level) => level === 0 ? 'None' : `+${level}`} valueText={(level) => level === 0 ? 'None' : `+${level}`} />
          {#if corruptionGuide}<HowItWorks guide={corruptionGuide.guide} stepId={corruptionGuide.stepId} label="How corruption works" />{/if}
          {#if facts.dungeonRewards?.length}<p>Can appear with corruption in the reward bags from {#each facts.dungeonRewards as source, index}{index ? (index === facts.dungeonRewards.length - 1 ? ' and ' : ', ') : ''}<EntityLink ref={source.place} {registry} />{/each}.</p>{/if}
          {#if corruptionLevel > 0 && facts.randomStats.length}<p>Random stats keep their rolled values.</p>{/if}
        </div>
      {/if}
      {#if document.description}<p class="description">{document.description}</p>{/if}
      {#if facts.buyPrice}<p class="side-fact">Buy price <Price price={facts.buyPrice} showName /></p>{/if}
      {#if facts.stackLimit > 1}<p class="side-fact">Stack size {formatNumber(facts.stackLimit)}</p>{/if}
    </svelte:fragment>

    <Sections>
    {#if facts.tokenInfo}
      <Section id="token-effect" title="Corruption token effects">
        <p>A token without a saved value has no affixes. A saved token's tooltip begins: “Use at a Corruption Altar to increase dungeon corruption by +N.” N is the token's saved value. It is separate from a gear level.</p>
        {#if facts.tokenInfo.mobStatBonuses?.length}
          <p><strong>NPC stat bonuses:</strong> {facts.tokenInfo.mobStatBonuses.map((bonus) => `+${formatNumber(bonus.amountPerLevel)}${bonus.isPercent ? '%' : ''} × N ${bonus.stat.key === null ? bonus.stat.label : bonus.stat.name}`).join(', ')}.</p>
        {/if}
        <p><strong>Dungeon affixes:</strong> The saved token lists its affix names and descriptions.{#if facts.tokenInfo.affixesPerToken !== undefined}{' '}A new token can roll up to {facts.tokenInfo.affixesPerToken} distinct eligible affixes.{/if}</p>
        {#if tokenGuide}<HowItWorks guide={tokenGuide.guide} stepId={tokenGuide.stepId} label="How tokens work" />{/if}
      </Section>
    {/if}
    {#if document.teaches}
      <Section id="teaches" title="Teaches"><CraftingSection craft={document.teaches} pageKey={document.ref.key} rules={document.placedRules.filter((entry) => entry.target === 'teaches')} {registry} /></Section>
    {/if}
    {#if document.whenUsed.chests.length || document.whenUsed.packs.length || document.whenUsed.itemChanges.length}
      <Section id="when-used" title="When used" count={document.whenUsed.chests.length + document.whenUsed.packs.length + document.whenUsed.itemChanges.length}>
        <div class="c-stack">
          {#if document.whenUsed.chests.length}
            <div class="c-groups">
              {#each document.whenUsed.chests as chest, index}
                <div class="c-stack">
                  {#if document.whenUsed.chests.length > 1}<h3>Chest {formatNumber(index + 1)}</h3>{/if}
                  {#if chest.chance < 100 || chest.maxDrops > 0}
                    <p>{#if chest.chance < 100}Using the item has a {formatNumber(chest.chance)}% chance to open this chest.{/if}{#if chest.maxDrops > 0}{' '}At most {formatNumber(chest.maxDrops)} {chest.maxDrops === 1 ? 'item drops' : 'items drop'}.{/if}</p>
                  {/if}
                  <RelationTable columns={chestColumns} rows={chest.rows} label="Chest contents" sort={{ id: 'chance', dir: 'desc' }}>
                    <svelte:fragment slot="cell" let:row let:column>
                      {#if column === 'item'}<EntityLink ref={row.item} {registry} />
                      {:else if column === 'quantity'}{formatNumber(row.min)}{#if row.max !== row.min}–{formatNumber(row.max)}{/if}
                      {:else}{formatNumber(row.chance)}%{/if}
                    </svelte:fragment>
                  </RelationTable>
                </div>
              {/each}
            </div>
            {#if chestGuide}<HowItWorks guide={chestGuide.guide} stepId={chestGuide.stepId} label="How bag contents work" />{/if}
          {/if}
          {#each document.whenUsed.itemChanges as change}
            <p>Using it {change.action === 'Remove' ? 'consumes' : 'gives'} {formatNumber(change.count)} <EntityLink ref={change.item} {registry} />.</p>
          {/each}
          {#if document.whenUsed.packs.length}
            {#if sharedPackPicks}<p>Gives {formatNumber(sharedPackPicks.minimumPicks)} {sharedPackPicks.minimumPicks === 1 ? 'item' : 'items'}{#if sharedPackPicks.bonusChance > 0}, with a {formatNumber(sharedPackPicks.bonusChance)}% chance of one more{/if}{#if sharedPackPicks.maximumPicks !== undefined && sharedPackPicks.maximumPicks < sharedPackPicks.minimumPicks + 1} (at most {formatNumber(sharedPackPicks.maximumPicks)}){/if}.{#if sharedPackPicks.worldShare > 0}{' '}Each item has a {formatNumber(sharedPackPicks.worldShare)}% chance to be world loot for your class and level instead.{/if}</p>{/if}
            {#if packGuide}<HowItWorks guide={packGuide.guide} stepId={packGuide.stepId} label="How supply packs work" />{/if}
            <div class="c-disclosures">
              {#each document.whenUsed.packs as pack, index}
                <DetailsDisclosure title={`${pack.classes.map((classRef) => 'name' in classRef ? classRef.name : classRef.label).join(', ') || 'All classes'} · ${pack.minLevel === undefined ? 'All levels' : `Levels ${formatNumber(pack.minLevel)}${pack.maxLevel === undefined ? ' and higher' : `–${formatNumber(pack.maxLevel)}`}`}`} id={`supply-pack-${index + 1}`}>
                  {#if !sharedPackPicks}<p>Gives {formatNumber(pack.minimumPicks)} {pack.minimumPicks === 1 ? 'item' : 'items'}{#if pack.bonusChance > 0}, with a {formatNumber(pack.bonusChance)}% chance of one more{/if}{#if pack.maximumPicks !== undefined && pack.maximumPicks < pack.minimumPicks + 1} (at most {formatNumber(pack.maximumPicks)}){/if}.{#if pack.worldShare > 0}{' '}Each item has a {formatNumber(pack.worldShare)}% chance to be world loot for your class and level instead.{/if}</p>{/if}
                  {#if pack.armorType || pack.stats.length}<p>World loot: {#if pack.armorType}{categoryLabel(pack.armorType)} armor{/if}{#if pack.stats.length}{pack.armorType ? ', ' : ''}{#each pack.stats as stat, statIndex}{#if statIndex}, {/if}<EntityLink ref={stat} {registry} />{/each}{/if}</p>{/if}
                  <RelationTable columns={packColumns} rows={pack.entries} label="Items in this class and level band">
                    <svelte:fragment slot="cell" let:row let:column>
                      {#if column === 'item'}<EntityLink ref={row.item} {registry} />
                      {:else}{formatNumber(row.min)}{#if row.max !== row.min}–{formatNumber(row.max)}{/if}{/if}
                    </svelte:fragment>
                  </RelationTable>
                </DetailsDisclosure>
              {/each}
            </div>
          {/if}
        </div>
      </Section>
    {/if}
    {#if document.usedInRecipes.length || questUses.length || document.challengeStoneUses?.length}
      <Section id="used-for" title="Used for" count={document.usedInRecipes.length + questUses.length + (document.challengeStoneUses?.length ?? 0)}>
        {#if document.usedInRecipes.length}<div id="used-in-recipes" class="used-recipes">
          {#each document.usedInRecipes as row, index}
            {#if index < shownRecipes}<div class="used-row"><RecipeEquation materials={[{ item: document.ref, quantity: row.count }]} product={row.counterpart} yieldCount={row.product?.count ?? 1} skill={row.skill} requiredLevel={row.requiredLevel} {registry} /></div>{/if}
          {/each}
          {#if shownRecipes < document.usedInRecipes.length}<button class="c-action" type="button" on:click={() => (showAllRecipes = true)}>Show {document.usedInRecipes.length - shownRecipes} more</button>{/if}
        </div>{/if}
        {#if questUses.length}<div id="needed-for-quests" class="used-quests">{#each questUses as row}<div class="used-quest"><EntityLink ref={row.quest} {registry} />{#if row.count && row.count > 1}<span>×{row.count}</span>{/if}{#each row.objectives as objective}<span><ObjectiveText {objective} /></span>{/each}</div>{/each}</div>{/if}
        {#if document.challengeStoneUses?.length}<div class="used-stones">
          {#each document.challengeStoneUses as row}
            <div class="used-quest">
              <span>{row.count} {document.ref.name} {row.count === 1 ? 'is' : 'are'} used at{' '}{#if row.spot}<a class="c-link" href={spotOnMap(row.spot.placementId)}>{row.stoneName ?? 'Challenge Stone'}{#if row.regionName}{' '}in {row.regionName}{/if}</a>{:else}{row.stoneName ?? 'Challenge Stone'}{#if row.regionName}{' '}in {row.regionName}{/if}{/if}{' '}to start{' '}{#each row.destinations as destination, index}{#if index}{', '}{/if}<EntityLink ref={destination} {registry} />{/each}{#each row.unlinkedDestinations ?? [] as destination, index}{#if index || row.destinations.length}{', '}{/if}{destination}{/each}.</span>
            </div>
          {/each}
        </div>{/if}
      </Section>
    {:else if !document.teaches && !document.buys.length}<Section id="used-for" title="Used for"><p>No known recipe or quest uses {document.ref.name}.</p></Section>{/if}
    {#if document.adventurers.length}
      <Section id="adventurers" title="Adventurers" count={document.adventurers.length}>
        <RelationTable columns={adventurerColumns} rows={document.adventurers} label="Adventurer gear">
          <svelte:fragment slot="cell" let:row>
            {#if row.kind === 'kitUpgradeItem'}Gear upgrade for <EntityLink ref={row.adventurer} {registry} />
            {:else if row.kind === 'equipmentBand'}Carried by adventurers of level {formatNumber(row.minimumContentLevel)} or higher
            {:else}Adventurer job reward: each finished job has a {formatNumber(row.chance)}% chance to give the adventurer one upgrade from the reward list{/if}
          </svelte:fragment>
        </RelationTable>
      </Section>
    {/if}
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
    </Sections>
  </DetailFrame>
</article>

<style>
  .routes { display: grid; gap: 0; padding: 0; list-style: none; }
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
  .route p, .description, .side-fact { line-height: 1.5; }
  .dungeon-list { display: grid; gap: .35rem; padding-left: 1.25rem; min-width: 0; line-height: 1.5; overflow-wrap: anywhere; }
  .corruption-control { display: grid; gap: .6rem; scroll-margin-top: 1rem; }
  .corruption-control p { color: var(--c-text-dim); line-height: 1.5; }
  .description { color: var(--c-text-dim); }
  .side-fact { display: flex; justify-content: space-between; gap: .75rem; }
  .used-recipes, .used-quests, .used-stones { display: grid; gap: .5rem; scroll-margin-top: 1rem; }
  .used-row, .used-quest { min-width: 0; padding: .55rem .7rem; border: 1px solid var(--c-line); border-radius: var(--c-radius); background: var(--c-surface-1); }
  .used-quest { display: flex; align-items: center; flex-wrap: wrap; gap: .35rem .75rem; }
</style>
