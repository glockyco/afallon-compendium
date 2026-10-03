<script lang="ts">
  import { base } from '$app/paths';
  import { categoryLabel, type PublicItem, type PublicKindEntry } from '@afallon/contracts/public';
  import EntityLink from '../../EntityLink.svelte';
  import ItemTooltip from '../../ItemTooltip.svelte';
  import ObjectiveText from '../../ObjectiveText.svelte';
  import Price from '../../Price.svelte';
  import { formatNumber, intervalText, nameOf, rarityTone } from '../../format';
  import { itemOnMap, spotOnMap } from '../../map-links';
  import AnswerCard from '../AnswerCard.svelte';
  import DetailFrame from '../DetailFrame.svelte';
  import HowItWorks from '../HowItWorks.svelte';
  import LevelSlider from '../LevelSlider.svelte';
  import RecipeEquation from '../RecipeEquation.svelte';
  import { itemSourceLines, levelRangeText, packBandText } from '../item-sources';
  import { omitAlways, planColumns, shownRowCount, type RelationColumn } from '../relation-table';
  import RelationTable from '../RelationTable.svelte';
  import LinkGrid from '../LinkGrid.svelte';
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
  import SideCard from '../SideCard.svelte';
  import TitleBlock from '../TitleBlock.svelte';

  import FactList from '../FactList.svelte';
  import FactRow from '../FactRow.svelte';
  export let document: PublicItem;
  export let registry: PublicKindEntry[];

  let showAllRecipes = false;
  $: shownRecipes = shownRowCount(document.usedInRecipes.length, showAllRecipes);
  $: facts = document.facts;
  // The tooltip shows one version of the item at a time: as it usually drops, as Heroic gear, or corrupted. Corrupted gear
  // comes from the reward bags of timed dungeons, where the Heroic tier pauses, so no single item is both.
  type GearVersion = 'normal' | 'heroic' | 'corrupted';
  const GEAR_VERSIONS: ReadonlyArray<{ id: GearVersion; label: string }> = [
    { id: 'normal', label: 'Normal' }, { id: 'heroic', label: 'Heroic' }, { id: 'corrupted', label: 'Corrupted' },
  ];
  let version: GearVersion = 'normal';
  let corruptedLevel = 1;
  $: versions = GEAR_VERSIONS.filter((option) => option.id === 'normal' || (option.id === 'heroic' ? Boolean(facts.heroic) : Boolean(facts.corruption)));
  // Another item starts again as it usually drops, and a corrupted version starts at the highest corruption level.
  $: document, version = 'normal';
  $: corruptedLevel = facts.corruption?.maxLevel ?? 1;
  $: heroic = version === 'heroic';
  $: corruptionLevel = version === 'corrupted' ? corruptedLevel : 0;
  $: tone = rarityTone(facts.rarity);
  $: enchantingGuide = document.placedRules.find((rule) => rule.target === 'enchants');
  $: detailedEnchantStats = Boolean(document.description && facts.enchanting?.tiers.some((tier) => tier.stats.some((stat) => nameOf(stat.stat).length > 36)));
  $: chestGuide = document.placedRules.find((rule) => rule.target === 'when-used' && rule.section === 'chests');
  $: packGuide = document.placedRules.find((rule) => rule.target === 'when-used' && rule.section === 'supply-packs');
  $: corruptionGuide = document.placedRules.find((rule) => rule.target === 'corruption');
  $: heroicGuide = document.placedRules.find((rule) => rule.target === 'heroic-gear');
  $: tokenGuide = document.placedRules.find((rule) => rule.target === 'corruption-token');
  $: questUses = itemQuestUseRows(document.usedInQuests);
  $: hasSources = itemSourceLines(document).length > 0 || document.adventurers.length > 0;
  $: itemChanges = document.whenUsed.itemChanges.filter((change) => change.item.key !== document.ref.key);
  $: useEffects = document.appliesEffects.filter((row) => row.trigger === 'Use');
  $: hitEffects = document.appliesEffects.filter((row) => row.trigger !== 'Use');
  $: onlyDrop = document.droppedBy.length === 1 ? document.droppedBy[0] : undefined;
  $: singleDropInAnswer = Boolean(onlyDrop?.creatureLevel && !onlyDrop.requirements.length && (onlyDrop.min ?? 1) === 1 && (onlyDrop.max ?? 1) === 1 && onlyDrop.chance !== undefined);
  $: onMap = document.sourceSpotCount > 0;
  const chestColumns: RelationColumn<PublicItem['whenUsed']['chests'][number]['rows'][number]>[] = [
    { id: 'item', label: 'Item', value: (row) => 'name' in row.item ? row.item.name : row.item.label, sort: (row) => 'name' in row.item ? row.item.name : row.item.label },
    { id: 'quantity', label: 'Quantity', hint: 'How many of the item drop. Every amount in the range is equally likely.', numeric: true, value: (row) => `${row.min}–${row.max}`, sort: (row) => row.max },
    { id: 'chance', label: 'Chance per Open', hint: 'Each item rolls this chance on its own when the chest opens.', numeric: true, value: (row) => row.chance, sort: (row) => row.chance },
  ];
  const fromItemColumns: RelationColumn<PublicItem['fromItems'][number]>[] = [
    { id: 'source', label: 'Item', value: (row) => row.source.name, sort: (row) => row.source.name },
    { id: 'quantity', label: 'Quantity', numeric: true, value: (row) => `${row.min}–${row.max}`, sort: (row) => row.max },
    { id: 'chance', label: 'Chance per Open', hint: 'The chest rolls this chance for the item on its own.', numeric: true, value: (row) => row.kind === 'chest' ? row.chance : undefined, sort: (row) => row.kind === 'chest' ? row.chance : undefined },
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
    { id: 'chance', label: 'Base Rate', hint: 'The base cloth roll rate for this cloth before loot bonuses. Inside a range of levels, it changes steadily from the first value to the second. It is not your chance per kill.', numeric: true, value: (row) => row.startChance, sort: (row) => row.startChance },
  ];
  const effectColumns: RelationColumn<PublicItem['appliesEffects'][number]>[] = [
    { id: 'effect', label: 'Effect', value: (row) => nameOf(row.effect), sort: (row) => nameOf(row.effect) },
    { id: 'trigger', label: 'When', value: (row) => row.trigger, whenShared: omitAlways },
    { id: 'chance', label: 'Chance', hint: 'Direct item effects roll once per use. Effects from an activated ability roll each time it hits a target. On-hit effects roll only after their stat triggers.', numeric: true, value: (row) => row.chance, sort: (row) => row.chance },
    { id: 'duration', label: 'Duration', numeric: true, value: (row) => row.durationSeconds, sort: (row) => row.durationSeconds },
  ];
  $: useEffectPlan = planColumns(effectColumns, useEffects);
  $: hitEffectPlan = planColumns(effectColumns, hitEffects);
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
      {#if hasSources}
        <AnswerCard title="How to get it"><ItemSourceRoutes {document} {registry} /></AnswerCard>
      {:else if document.description || useEffects.length}
        <AnswerCard title="What it does">
          {#if document.description}<p>{document.description}</p>{/if}
          {#if useEffects.length}<p>Using it applies {#each useEffects as row, index}{index ? ', ' : ''}<EntityLink ref={row.effect} {registry} />{#if row.chance}{' '}({formatNumber(row.chance)}% per use for a direct item effect, or per hit for an activated ability){/if}{#if row.durationSeconds}{' '}for {intervalText(row.durationSeconds)}{/if}{/each}.</p>{/if}
          <p class="unknown-source">No known way to get this item.</p>
        </AnswerCard>
      {:else}<p class="unknown-source">No known way to get this item.</p>{/if}
    </svelte:fragment>

    <svelte:fragment slot="side">
      <div class="c-game-frame"><ItemTooltip {document} {registry} {corruptionLevel} {heroic}><svelte:fragment slot="ref" let:ref let:rankIndex let:plain><EntityLink {ref} {rankIndex} {registry} {plain} /></svelte:fragment></ItemTooltip></div>
      {#if facts.enchanting}
        <SideCard title="What it does" id="enchants">
          {#if document.description}<p>{document.description}</p>{/if}
          <p>Applying it consumes the item. A successful enchantment replaces any different enchantment on the gear.</p>
          <FactList>
            <FactRow label="Fits">{facts.enchanting.fits.join(' or ')}</FactRow>
            {#each facts.enchanting.tiers as tier}
              {#if facts.enchanting.tiers.length > 1}<FactRow label="Tier">{formatNumber(tier.tier + 1)}</FactRow>{/if}
              {#if !detailedEnchantStats}<FactRow label="Adds">{#each tier.stats as stat, index}{index ? ', ' : ''}{stat.amount < 0 ? '' : '+'}{formatNumber(stat.amount)}{stat.isPercent ? '%' : ''} <EntityLink ref={stat.stat} {registry} />{/each}</FactRow>{/if}
              <FactRow label="Success">{formatNumber(tier.successRate)}%</FactRow>
              <FactRow label="Time">{formatNumber(tier.seconds)} {tier.seconds === 1 ? 'second' : 'seconds'}</FactRow>
              {#if tier.currencyCosts.length || tier.itemCosts.length}
                <FactRow label="Extra cost">{#each tier.currencyCosts as price, index}{index ? ', ' : ''}<Price {price} showName />{/each}{#each tier.itemCosts as cost, index}{index || tier.currencyCosts.length ? ', ' : ''}{formatNumber(cost.count)} <EntityLink ref={cost.item} {registry} />{/each}</FactRow>
              {/if}
            {/each}
          </FactList>
          {#if detailedEnchantStats}
            <details class="enchant-stats"><summary>Stat details</summary><FactList>
              {#each facts.enchanting.tiers as tier}
                <FactRow label={facts.enchanting.tiers.length > 1 ? `Tier ${tier.tier + 1} adds` : 'Adds'}>{#each tier.stats as stat, index}{index ? ', ' : ''}{stat.amount < 0 ? '' : '+'}{formatNumber(stat.amount)}{stat.isPercent ? '%' : ''} <EntityLink ref={stat.stat} {registry} />{/each}</FactRow>
              {/each}
            </FactList></details>
          {/if}
          {#if enchantingGuide}<HowItWorks guide={enchantingGuide.guide} section={enchantingGuide.section} label="How enchanting works" />{/if}
        </SideCard>
      {/if}
      {#if versions.length > 1 || facts.heroicPausedIn?.length || facts.itemType === 'ARMOR' || facts.itemType === 'WEAPON'}
        <SideCard title="Gear options">
          {#if versions.length > 1}
            <div class="versions" role="radiogroup" aria-label="Version shown in the tooltip" id={facts.corruption ? 'corruption' : undefined}>
              {#each versions as option (option.id)}
                <label class="c-action version"><input type="radio" name="gear-version" value={option.id} bind:group={version} />{option.label}</label>
              {/each}
            </div>
          {/if}
          {#if version === 'heroic'}
            <p>Creatures drop it as Heroic gear while the Heroic tier is live, with {formatNumber(facts.heroic?.statBonusPercent ?? 0)}% higher fixed stats{facts.itemType === 'WEAPON' ? ' and weapon damage' : ''}.</p>
            {#if heroicGuide}<HowItWorks guide={heroicGuide.guide} section={heroicGuide.section} label="How Heroic gear works" />{/if}
          {:else if version === 'corrupted' && facts.corruption}
            <LevelSlider id="corruption-level" label="Corruption level" min={1} max={facts.corruption.maxLevel} bind:level={corruptedLevel} readout={(level) => `+${level}`} valueText={(level) => `+${level}`} />
            {#if facts.dungeonRewards?.length}<p>From the reward bags of {#each facts.dungeonRewards as source, index}{index ? (index === facts.dungeonRewards.length - 1 ? ' and ' : ', ') : ''}<EntityLink ref={source.place} {registry} />{/each}.</p>{/if}
            {#if corruptionGuide}<HowItWorks guide={corruptionGuide.guide} section={corruptionGuide.section} label="How corruption works" />{/if}
          {/if}
          {#if version !== 'normal' && facts.randomStats.length}<p>Random stats keep their rolled values.</p>{/if}
          {#if facts.heroicPausedIn?.length}<p>Never drops as Heroic gear. It drops only in {#each facts.heroicPausedIn as place, index}{index ? (index === facts.heroicPausedIn.length - 1 ? ' and ' : ', ') : ''}<EntityLink ref={place} {registry} />{/each}, where the Heroic tier pauses.</p>{/if}
          {#if facts.itemType === 'ARMOR' || facts.itemType === 'WEAPON'}
            <p>Can be <a class="c-link" href={`${base}/mechanics/crafting-and-gathering/#enchanting`}>enchanted</a>.</p>
          {/if}
        </SideCard>
      {/if}
      {#if !facts.enchanting && hasSources && (document.description || facts.buyPrice)}
        <SideCard title="About this item">
          {#if document.description}<p>{document.description}</p>{/if}
          {#if facts.buyPrice}<FactList><FactRow label="Buy price"><Price price={facts.buyPrice} showName /></FactRow></FactList>{/if}
        </SideCard>
      {/if}
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
    {#if document.whenUsed.chests.length || document.whenUsed.packs.length || itemChanges.length || useEffects.length}
      <!-- Tabs choose the tables of a pack, so a section with pack tables shows no count. -->
      <Section id="when-used" title="When used" count={document.whenUsed.packs.length ? undefined : document.whenUsed.chests.length + itemChanges.length + useEffects.length}>
        <div class="c-stack">
          {#if document.whenUsed.chests.length}
            <div class="c-groups">
              {#each document.whenUsed.chests as chest, index}
                <div class="c-stack">
                  {#if document.whenUsed.chests.length > 1}<h3>Chest {formatNumber(index + 1)}</h3>{/if}
                  {#if (chest.chance > 0 && chest.chance < 100) || chest.maxDrops > 0}
                    <p>{#if chest.chance > 0 && chest.chance < 100}Using the item has a {formatNumber(chest.chance)}% chance per use to open this chest.{/if}{#if chest.maxDrops > 0}{' '}At most {formatNumber(chest.maxDrops)} {chest.maxDrops === 1 ? 'item drops' : 'items drop'}. Successful item rolls beyond this limit are not received.{/if}</p>
                  {/if}
                  <RelationTable columns={chestColumns} rows={chest.rows} label="Chest contents" sort={{ id: 'chance', dir: 'desc' }}>
                    <svelte:fragment slot="cell" let:row let:column>
                      {#if column === 'item'}<EntityLink ref={row.item} {registry} />
                      {:else if column === 'quantity'}{formatNumber(row.min)}{#if row.max !== row.min}–{formatNumber(row.max)}{/if}
                      {:else}{formatNumber(row.chance)}% per open{/if}
                    </svelte:fragment>
                  </RelationTable>
                </div>
              {/each}
            </div>
            {#if chestGuide}<HowItWorks guide={chestGuide.guide} section={chestGuide.section} label="How bag contents work" />{/if}
          {/if}
          {#if useEffects.length}
            <RelationTable columns={useEffectPlan.columns} rows={useEffects} label="Effects when used">
              <svelte:fragment slot="cell" let:row let:column>
                {#if column === 'effect'}<EntityLink ref={row.effect} {registry} />
                {:else if column === 'chance'}{row.chance === undefined ? '' : `${formatNumber(row.chance)}%`}
                {:else}{row.durationSeconds === undefined ? '' : intervalText(row.durationSeconds)}{/if}
              </svelte:fragment>
            </RelationTable>
          {/if}
          {#each itemChanges as change}
            <p>Using it {change.action === 'Remove' ? 'consumes' : 'gives'} {formatNumber(change.count)} <EntityLink ref={change.item} {registry} />.</p>
          {/each}
          {#if document.whenUsed.packs.length}<SupplyPackBands packs={document.whenUsed.packs} guide={packGuide} {registry} />{/if}
        </div>
      </Section>
    {/if}
    {#if hitEffects.length}
      <Section id="on-hit-effects" title="On-hit effects" count={hitEffects.length} line="When you hit, the linked stat's value is its chance to trigger. Each chance below is rolled only after it triggers.">
        <RelationTable columns={hitEffectPlan.columns} rows={hitEffects} label="Effects on hit">
          <svelte:fragment slot="cell" let:row let:column>
            {#if column === 'effect'}<EntityLink ref={row.effect} {registry} />
            {:else if column === 'trigger'}{row.trigger}
            {:else if column === 'chance'}{row.chance === undefined ? '' : `${formatNumber(row.chance)}%`}
            {:else}{row.durationSeconds === undefined ? '' : intervalText(row.durationSeconds)}{/if}
          </svelte:fragment>
        </RelationTable>
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
    {/if}
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
    {#if document.buys.length}<PurchasesSection id="buys" title="Buys" rows={document.buys} subjectCurrency={facts.currency} {registry} />{/if}
    {#if document.droppedBy.length && !singleDropInAnswer}<DroppedBySection rows={document.droppedBy} guide={document.placedRules.find((rule) => rule.target === 'dropped-by')} {registry} />{/if}
    {#if document.clothDrop}
      <Section id="cloth-loot" title="Cloth loot">
        <div class="c-stack">
          <p>Each kill of a {document.clothDrop.creatureTypes.map(categoryLabel).join(' or ')} creature rolls for cloth at a base rate of {formatNumber(document.clothDrop.chance)}% before loot bonuses. A successful roll gives {document.clothDrop.min === document.clothDrop.max ? formatNumber(document.clothDrop.min) : `${formatNumber(document.clothDrop.min)} to ${formatNumber(document.clothDrop.max)}`} {document.clothDrop.max === 1 ? 'piece' : 'pieces'}. The creature's level decides which cloth it is.</p>
          {#if clothGuide}<HowItWorks guide={clothGuide.guide} section={clothGuide.section} label="How cloth loot works" />{/if}
          <RelationTable columns={clothColumns} rows={document.clothDrop.levels} label="Base cloth rate by creature level">
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
          <p>Each successful Random run of the Dungeon Finder gives one {document.ref.name}. A Random run goes to one of these dungeons.</p>
          <LinkGrid refs={document.dungeonFinder.dungeons} {registry} />
          {#if finderGuide}<HowItWorks guide={finderGuide.guide} section={finderGuide.section} label="How Dungeon Finder rewards work" />{/if}
        </div>
      </Section>
    {/if}
    {#if document.startingGearOfAdventurers.length}
      <Section id="adventurer-starting-gear" title="Adventurer Starting Gear" count={document.startingGearOfAdventurers.length}>
        <p>These adventurers begin with {document.ref.name}.</p>
        <LinkGrid refs={document.startingGearOfAdventurers} {registry} />
      </Section>
    {/if}
    {#if document.gainedFromItems.length}
      <Section id="gained-from-items" title="Using Items" count={document.gainedFromItems.length}>
        <p>Using these items gives {document.ref.name}.</p>
        <LinkGrid refs={document.gainedFromItems} {registry} />
      </Section>
    {/if}
    {#if document.lootTables.length}
      <Section id="loot-tables" title="Loot Tables" count={document.lootTables.length}>
        <div class="c-stack">
          {#each document.lootTables as table}
            <p>{table.name}: {#if table.source}Dropped by <EntityLink ref={table.source} {registry} />.{:else if table.world}World loot.{:else}No source for this loot table is known.{/if}</p>
          {/each}
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
            {:else if column === 'chance'}{#if row.kind === 'chest'}{formatNumber(row.chance)}% per open{/if}{/if}
          </svelte:fragment>
        </RelationTable>
      </Section>
    {/if}
    </Sections>
  </DetailFrame>
</article>

<style>
  /* The versions are actions in one row; the chosen one takes the accent frame. Each radio stays in the tab order and the
     arrow keys move between them, while the label is what a reader sees and clicks. */
  .versions { display: flex; flex-wrap: wrap; gap: .35rem; scroll-margin-top: 1rem; }
  .version { position: relative; cursor: pointer; }
  .version input { position: absolute; inset: 0; margin: 0; opacity: 0; cursor: pointer; }
  .version:has(input:checked) { border-color: var(--c-accent); background: color-mix(in srgb, var(--c-accent) 16%, var(--c-surface-2)); color: var(--c-text-strong); }
  .version:has(input:focus-visible) { outline: 2px solid var(--c-accent); outline-offset: 2px; }
  .enchant-stats { border-top: 1px solid var(--c-line-soft); padding-top: .55rem; }
  .enchant-stats summary { cursor: pointer; color: var(--c-accent); font-weight: 600; }
  .enchant-stats :global(.fact-list) { margin-top: .6rem; }
  .used-recipes, .used-quests, .used-stones { display: grid; gap: .5rem; scroll-margin-top: 1rem; }
  .adventurer-gear { display: grid; gap: .5rem; line-height: 1.55; }
  .used-row, .used-quest { min-width: 0; padding: .55rem .7rem; border: 1px solid var(--c-line); border-radius: var(--c-radius); background: var(--c-surface-1); }
  .used-quest { display: flex; align-items: center; flex-wrap: wrap; gap: .35rem .75rem; }
</style>
