<script lang="ts">
  import { base } from '$app/paths';
  import { categoryLabel, type PublicItem, type PublicKindEntry } from '@afallon/contracts/public';
  import EntityLink from '../../EntityLink.svelte';
  import ItemTooltip from '../../ItemTooltip.svelte';
  import ObjectiveText from '../../ObjectiveText.svelte';
  import Price from '../../Price.svelte';
  import { formatNumber, nameOf, rarityTone } from '../../format';
  import { itemOnMap, spotOnMap } from '../../map-links';
  import AnswerCard from '../AnswerCard.svelte';
  import DetailFrame from '../DetailFrame.svelte';
  import HowItWorks from '../HowItWorks.svelte';
  import LevelSlider from '../LevelSlider.svelte';
  import RecipeEquation from '../RecipeEquation.svelte';
  import { levelRangeText, packBandText } from '../item-sources';
  import { planColumns, shownRowCount, type RelationColumn } from '../relation-table';
  import RelationTable from '../RelationTable.svelte';
  import { itemQuestSourceRows, itemQuestUseRows } from '../quest-rows';
  import CraftingSection from '../sections/CraftingSection.svelte';
  import SupplyPackBands from '../sections/SupplyPackBands.svelte';
  import ContainerSection from '../sections/ContainerSection.svelte';
  import DroppedBySection from '../sections/DroppedBySection.svelte';
  import GatherSection from '../sections/GatherSection.svelte';
  import PurchasesSection from '../sections/PurchasesSection.svelte';
  import QuestRowsSection from '../sections/QuestRowsSection.svelte';
  import ItemSourceRoutes from '../sections/ItemSourceRoutes.svelte';
  import VendorSection from '../sections/VendorSection.svelte';
  import Section from '../Section.svelte';
  import Sections from '../Sections.svelte';
  import TitleBlock from '../TitleBlock.svelte';

  import FactList from '../FactList.svelte';
  import FactRow from '../FactRow.svelte';
  export let document: PublicItem;
  export let registry: PublicKindEntry[];

  let showAllRecipes = false;
  $: shownRecipes = shownRowCount(document.usedInRecipes.length, showAllRecipes);
  let corruptionLevel = 0;
  let heroic = false;
  $: facts = document.facts;
  $: tone = rarityTone(facts.rarity);
  $: enchantingGuide = document.placedRules.find((rule) => rule.target === 'enchants');
  $: chestGuide = document.placedRules.find((rule) => rule.target === 'when-used' && rule.section === 'chests');
  $: packGuide = document.placedRules.find((rule) => rule.target === 'when-used' && rule.section === 'supply-packs');
  $: corruptionGuide = document.placedRules.find((rule) => rule.target === 'corruption');
  $: heroicGuide = document.placedRules.find((rule) => rule.target === 'heroic-gear');
  $: tokenGuide = document.placedRules.find((rule) => rule.target === 'corruption-token');
  $: questUses = itemQuestUseRows(document.usedInQuests);
  $: onlyDrop = document.droppedBy.length === 1 ? document.droppedBy[0] : undefined;
  $: singleDropInAnswer = Boolean(onlyDrop?.creatureLevel && !onlyDrop.requirements.length && (onlyDrop.min ?? 1) === 1 && (onlyDrop.max ?? 1) === 1 && onlyDrop.chance !== undefined);
  $: onMap = document.sourceSpotCount > 0;
  const chestColumns: RelationColumn<PublicItem['whenUsed']['chests'][number]['rows'][number]>[] = [
    { id: 'item', label: 'Item', value: (row) => 'name' in row.item ? row.item.name : row.item.label, sort: (row) => 'name' in row.item ? row.item.name : row.item.label },
    { id: 'quantity', label: 'Quantity', hint: 'How many of the item drop. Every amount in the range is equally likely.', numeric: true, value: (row) => `${row.min}–${row.max}`, sort: (row) => row.max },
    { id: 'chance', label: 'Chance', hint: 'Each item rolls this chance on its own when the chest opens.', numeric: true, value: (row) => row.chance, sort: (row) => row.chance },
  ];
  const fromItemColumns: RelationColumn<PublicItem['fromItems'][number]>[] = [
    { id: 'source', label: 'Item', value: (row) => row.source.name, sort: (row) => row.source.name },
    { id: 'quantity', label: 'Quantity', numeric: true, value: (row) => `${row.min}–${row.max}`, sort: (row) => row.max },
    { id: 'chance', label: 'Chance', hint: 'The chest rolls this chance for the item on its own.', numeric: true, value: (row) => row.kind === 'chest' ? row.chance : undefined, sort: (row) => row.kind === 'chest' ? row.chance : undefined },
    { id: 'band', label: 'Who can open it', value: (row) => row.kind === 'pack' ? packBandText(row) : undefined },
  ];
  $: fromItemPlan = planColumns(fromItemColumns, document.fromItems);
  $: clothGuide = document.placedRules.find((rule) => rule.target === 'cloth-loot');
  $: pickupGuide = document.placedRules.find((rule) => rule.target === 'quest-pickups');
  $: finderGuide = document.placedRules.find((rule) => rule.target === 'dungeon-finder');
  $: objectGuide = document.placedRules.find((rule) => rule.target === 'collected-from');
  const pickupColumns: RelationColumn<PublicItem['questPickups'][number]>[] = [
    { id: 'source', label: 'Where it appears', value: (row) => row.kind === 'creature' ? nameOf(row.counterpart) : row.places[0]?.label ?? 'Placed pickup', sort: (row) => row.kind === 'creature' ? nameOf(row.counterpart) : row.places[0]?.label ?? '' },
    { id: 'amount', label: 'Amount', hint: 'The most that one pickup gives. It never gives more than the quest still needs.', numeric: true, value: (row) => row.amount, sort: (row) => row.amount },
    { id: 'quest', label: 'Quest', value: (row) => row.quest ? nameOf(row.quest) : undefined, sort: (row) => row.quest ? nameOf(row.quest) : '' },
  ];
  $: pickupPlan = planColumns(pickupColumns, document.questPickups);
  const clothColumns: RelationColumn<NonNullable<PublicItem['clothDrop']>['levels'][number]>[] = [
    { id: 'level', label: 'Creature level', value: (row) => levelRangeText(row.minLevel, row.maxLevel), sort: (row) => row.minLevel },
    { id: 'chance', label: 'Chance per kill', hint: 'The chance that one kill drops this cloth. Inside a range of levels, it moves steadily from the first value to the second.', numeric: true, value: (row) => row.startChance, sort: (row) => row.startChance },
  ];
  // An item on the reward gear list can be picked from its band's level, or from level 1 without a band.
  $: rewardRow = document.adventurers.find((row) => row.kind === 'equipmentReward');
  $: rewardLevel = Math.max(1, document.adventurers.find((row) => row.kind === 'equipmentBand')?.minimumContentLevel ?? 1);
  $: kitRows = document.adventurers.flatMap((row) => row.kind === 'kitUpgradeItem' ? [row] : []);
  $: adventurerGuide = document.placedRules.find((rule) => rule.target === 'adventurers');
  $: typeLine = [facts.rarity, facts.armorType ?? facts.weaponType ?? facts.itemType, facts.slot].filter((entry): entry is string => Boolean(entry)).map(categoryLabel).join(' · ');
</script>

<article class="detail-page" data-rarity={tone}>
  <DetailFrame>
    <svelte:fragment slot="head"><TitleBlock name={document.ref.name} rarity={tone} imageUrl={document.art.icon || document.ref.icon ? `${base}/data/${(document.art.icon ?? document.ref.icon)!.url}` : undefined} {typeLine} mapHref={onMap ? itemOnMap(document.ref.key) : undefined} {registry} /></svelte:fragment>

    <svelte:fragment slot="answer">
      <AnswerCard title="How to get it">
        <ItemSourceRoutes {document} {registry} />
      </AnswerCard>
    </svelte:fragment>

    <svelte:fragment slot="side">
      <div class="c-game-frame"><ItemTooltip {document} {registry} {corruptionLevel} {heroic}><svelte:fragment slot="ref" let:ref let:rankIndex let:plain><EntityLink {ref} {rankIndex} {registry} {plain} /></svelte:fragment></ItemTooltip></div>
      {#if facts.heroic}
        <div class="heroic-control">
          <button type="button" class="c-action" aria-pressed={heroic} on:click={() => (heroic = !heroic)}>{heroic ? 'Showing Heroic Gear' : 'Show Heroic Gear'}</button>
          <p>Can drop Heroic while the Heroic tier is live. Random stat rolls keep their rolled values.</p>
          {#if heroicGuide}<HowItWorks guide={heroicGuide.guide} section={heroicGuide.section} label="How Heroic gear works" />{/if}
        </div>
      {/if}
      {#if facts.corruption}
        <div id="corruption" class="corruption-control">
          <LevelSlider id="corruption-level" label="Corruption level" min={0} max={facts.corruption.maxLevel} bind:level={corruptionLevel} readout={(level) => level === 0 ? 'None' : `+${level}`} valueText={(level) => level === 0 ? 'None' : `+${level}`} />
          {#if corruptionGuide}<HowItWorks guide={corruptionGuide.guide} section={corruptionGuide.section} label="How corruption works" />{/if}
          {#if facts.dungeonRewards?.length}<p>Can appear with corruption in the reward bags from {#each facts.dungeonRewards as source, index}{index ? (index === facts.dungeonRewards.length - 1 ? ' and ' : ', ') : ''}<EntityLink ref={source.place} {registry} />{/each}.</p>{/if}
          {#if corruptionLevel > 0 && facts.randomStats.length}<p>Random stats keep their rolled values.</p>{/if}
        </div>
      {/if}
      {#if document.description}<p class="description">{document.description}</p>{/if}
      {#if facts.itemType === 'ARMOR' || facts.itemType === 'WEAPON'}
        <p class="side-fact">Can be enchanted <a class="c-link" href={`${base}/mechanics/crafting-and-gathering/#enchanting`}>See enchanting items</a></p>
      {/if}
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
        {#if tokenGuide}<HowItWorks guide={tokenGuide.guide} section={tokenGuide.section} label="How tokens work" />{/if}
      </Section>
    {/if}
    {#if document.teaches}
      <Section id="teaches" title="Teaches"><CraftingSection craft={document.teaches} pageKey={document.ref.key} rules={document.placedRules.filter((entry) => entry.target === 'teaches')} {registry} /></Section>
    {/if}
    {#if facts.enchanting}
      <Section id="enchants" title="Enchants">
        <div class="c-stack">
          <FactList>
            <FactRow label="Fits">{facts.enchanting.fits.join(' and ')}</FactRow>
            {#each facts.enchanting.tiers as tier}
              <FactRow label={facts.enchanting.tiers.length > 1 ? `Tier ${tier.tier + 1} adds` : 'Adds'}>
                {#each tier.stats as stat, index}{index ? ', ' : ''}{stat.amount < 0 ? '' : '+'}{formatNumber(stat.amount)}{stat.isPercent ? '%' : ''} <EntityLink ref={stat.stat} {registry} />{/each}
              </FactRow>
              <FactRow label={facts.enchanting.tiers.length > 1 ? `Tier ${tier.tier + 1} chance` : 'Success chance'}>{formatNumber(tier.successRate)}%</FactRow>
              <FactRow label={facts.enchanting.tiers.length > 1 ? `Tier ${tier.tier + 1} time` : 'Time'}>{formatNumber(tier.seconds)} {tier.seconds === 1 ? 'second' : 'seconds'}</FactRow>
              {#if tier.currencyCosts.length || tier.itemCosts.length}
                <FactRow label="Additional cost">
                  {#each tier.currencyCosts as price, index}{index ? ', ' : ''}<Price {price} showName />{/each}
                  {#each tier.itemCosts as cost, index}{index || tier.currencyCosts.length ? ', ' : ''}{formatNumber(cost.count)} <EntityLink ref={cost.item} {registry} />{/each}
                </FactRow>
              {/if}
            {/each}
          </FactList>
          <p>Using this item uses it up. A successful enchantment replaces any different enchantment already on the gear.</p>
          {#if enchantingGuide}<HowItWorks guide={enchantingGuide.guide} section={enchantingGuide.section} label="How enchanting works" />{/if}
        </div>
      </Section>
    {/if}
    {#if document.whenUsed.chests.length || document.whenUsed.packs.length || document.whenUsed.itemChanges.length}
      <!-- Tabs choose the tables of a pack, so a section with pack tables shows no count. -->
      <Section id="when-used" title="When used" count={document.whenUsed.packs.length ? undefined : document.whenUsed.chests.length + document.whenUsed.itemChanges.length}>
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
            {#if chestGuide}<HowItWorks guide={chestGuide.guide} section={chestGuide.section} label="How bag contents work" />{/if}
          {/if}
          {#each document.whenUsed.itemChanges as change}
            <p>Using it {change.action === 'Remove' ? 'consumes' : 'gives'} {formatNumber(change.count)} <EntityLink ref={change.item} {registry} />.</p>
          {/each}
          {#if document.whenUsed.packs.length}<SupplyPackBands packs={document.whenUsed.packs} guide={packGuide} {registry} />{/if}
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
    {:else if !document.teaches && !document.buys.length && !facts.enchanting}<Section id="used-for" title="Used for"><p>No known recipe or quest uses {document.ref.name}.</p></Section>{/if}
    {#if document.adventurers.length}
      <Section id="adventurers" title="Adventurers">
        <div class="adventurer-gear">
          {#if rewardRow}<p>After a job, an adventurer has a {formatNumber(rewardRow.chance)}% chance to take an upgrade from the reward gear list. This item is on it for {rewardLevel > 1 ? `adventurers of level ${formatNumber(rewardLevel)} or higher` : 'every adventurer'}.</p>{/if}
          {#each kitRows as row}<p>Part of the gear kit of <EntityLink ref={row.adventurer} {registry} />.</p>{/each}
          {#if adventurerGuide}<HowItWorks guide={adventurerGuide.guide} section={adventurerGuide.section} label="How adventurer gear works" />{/if}
        </div>
      </Section>
    {/if}
    <GatherSection rows={document.gatheredFrom} itemKey={document.ref.key} {registry} />
    {#if document.buys.length}<PurchasesSection id="buys" title="Buys" rows={document.buys} {registry} />{/if}
    {#if document.droppedBy.length && !singleDropInAnswer}<DroppedBySection rows={document.droppedBy} {registry} />{/if}
    {#if document.clothDrop}
      <Section id="cloth-loot" title="Cloth loot">
        <div class="c-stack">
          <p>Killing a {document.clothDrop.creatureTypes.map(categoryLabel).join(' or ')} creature has a {formatNumber(document.clothDrop.chance)}% chance to drop {formatNumber(document.clothDrop.min)}–{formatNumber(document.clothDrop.max)} cloth. The creature's level decides which cloth it is.</p>
          {#if clothGuide}<HowItWorks guide={clothGuide.guide} section={clothGuide.section} label="How cloth loot works" />{/if}
          <RelationTable columns={clothColumns} rows={document.clothDrop.levels} label="Chance per kill by creature level">
            <svelte:fragment slot="cell" let:row let:column>
              {#if column === 'level'}{levelRangeText(row.minLevel, row.maxLevel)}
              {:else}{formatNumber(row.startChance)}%{#if row.endChance !== undefined}{' to '}{formatNumber(row.endChance)}%{/if}{/if}
            </svelte:fragment>
          </RelationTable>
        </div>
      </Section>
    {/if}
    <VendorSection id="sold-by" title="Sold by" counterpartLabel="Vendor" rows={document.soldBy} sort={{ id: 'price', dir: 'asc' }} {registry} />
    <ContainerSection id="collected-from" title="Found in objects" guide={objectGuide} guideLabel="How world object loot works" rows={document.collectedFrom} sourceAvailabilities={document.sourceAvailabilities} itemKey={document.ref.key} {registry} />
    <ContainerSection id="found-in-containers" title="Found in containers" rows={document.inContainers} sourceAvailabilities={document.sourceAvailabilities} itemKey={document.ref.key} {registry} />
    <QuestRowsSection id="from-quests" title="Quest rewards" roleLabel="Given as" rows={itemQuestSourceRows(document.rewardedBy, document.givenBy)} {registry} />
    {#if document.questPickups.length}
      <Section id="quest-pickups" title="Quest pickups" count={document.questPickups.length}>
        <div class="c-stack">
          <p>A quest pickup gives {document.ref.name} only while the quest's task to get it is open, and never more than the task still needs.</p>
          {#if pickupGuide}<HowItWorks guide={pickupGuide.guide} section={pickupGuide.section} label="How quest pickups work" />{/if}
          <RelationTable columns={pickupPlan.columns} rows={document.questPickups} label="Quest pickups">
            <svelte:fragment slot="cell" let:row let:column>
              {#if column === 'source'}{#if row.kind === 'creature'}Where <EntityLink ref={row.counterpart} {registry} /> dies{:else}{row.places[0]?.label ?? 'Placed pickup'}{#if row.placementCount > 1}{' '}({formatNumber(row.placementCount)} spots){/if}{#if row.singleUse}{' '}· once{/if}{/if}
              {:else if column === 'quest'}{#if row.quest}<EntityLink ref={row.quest} {registry} />{/if}
              {:else}{formatNumber(row.amount)}{/if}
            </svelte:fragment>
          </RelationTable>
        </div>
      </Section>
    {/if}
    {#if document.dungeonFinder}
      <Section id="dungeon-finder" title="Dungeon Finder">
        <div class="c-stack">
          <p>Each successful Random run of the Dungeon Finder gives one {document.ref.name}. The Dungeon Finder can send a Random run to these dungeons:</p>
          <ul class="dungeon-list">
            {#each document.dungeonFinder.dungeons as dungeon}<li><EntityLink ref={dungeon} {registry} /></li>{/each}
          </ul>
          {#if finderGuide}<HowItWorks guide={finderGuide.guide} section={finderGuide.section} label="How Dungeon Finder rewards work" />{/if}
        </div>
      </Section>
    {/if}
    {#if document.fromItems.length}
      <Section id="from-items" title="From items" count={document.fromItems.length}>
        <RelationTable columns={fromItemPlan.columns} rows={document.fromItems} label="From items">
          <svelte:fragment slot="cell" let:row let:column>
            {#if column === 'source'}<EntityLink ref={row.source} {registry} />
            {:else if column === 'band'}{#if row.kind === 'pack'}{packBandText(row)}{/if}
            {:else if column === 'quantity'}{row.min === row.max ? formatNumber(row.min) : `${formatNumber(row.min)}–${formatNumber(row.max)}`}
            {:else if column === 'chance'}{#if row.kind === 'chest'}{formatNumber(row.chance)}%{/if}{/if}
          </svelte:fragment>
        </RelationTable>
      </Section>
    {/if}
    </Sections>
  </DetailFrame>
</article>

<style>
  .description, .side-fact { line-height: 1.5; }
  .corruption-control { display: grid; gap: .6rem; scroll-margin-top: 1rem; }
  .corruption-control p { color: var(--c-text-dim); line-height: 1.5; }
  .heroic-control { display: grid; justify-items: start; gap: .5rem; }
  .heroic-control p { color: var(--c-text-dim); line-height: 1.5; }
  .description { color: var(--c-text-dim); }
  .side-fact { display: flex; justify-content: space-between; gap: .75rem; }
  .used-recipes, .used-quests, .used-stones { display: grid; gap: .5rem; scroll-margin-top: 1rem; }
  .adventurer-gear { display: grid; gap: .5rem; line-height: 1.55; }
  .used-row, .used-quest { min-width: 0; padding: .55rem .7rem; border: 1px solid var(--c-line); border-radius: var(--c-radius); background: var(--c-surface-1); }
  .used-quest { display: flex; align-items: center; flex-wrap: wrap; gap: .35rem .75rem; }
</style>
