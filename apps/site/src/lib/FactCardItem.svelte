<script lang="ts">
  import { base } from '$app/paths';
  import type { PublicItem, PublicKindEntry } from '@afallon/contracts/public';
  import Card from './Card.svelte';
  import ChipGrid, { type Chip } from './ChipGrid.svelte';
  import ContainerTable from './ContainerTable.svelte';
  import DropTable from './DropTable.svelte';
  import EntityHeader, { type HeaderBadge, type HeaderFact } from './EntityHeader.svelte';
  import EntityLink from './EntityLink.svelte';
  import Fact from './Fact.svelte';
  import FactGrid from './FactGrid.svelte';
  import GatherTable from './GatherTable.svelte';
  import Price from './Price.svelte';
  import QuestTable from './QuestTable.svelte';
  import RecipeTable from './RecipeTable.svelte';
  import Requirements from './Requirements.svelte';
  import VendorTable from './VendorTable.svelte';
  import { formatNumber, labelOf, rangeText, rarityTone, signedAmount } from './format';

  export let document: PublicItem;
  export let registry: PublicKindEntry[];
  export let compact = false;
  export let showRelations = false;
  export let limit: number | undefined = undefined;

  $: facts = document.facts;
  $: hasSources = document.droppedBy.length > 0 || document.soldBy.length > 0 || document.gatheredFrom.length > 0 || document.inContainers.length > 0 || document.rewardedBy.length > 0 || document.givenBy.length > 0 || document.craftedBy.length > 0;
  $: damage = rangeText(facts.minDamage, facts.maxDamage);
  $: gearType = facts.weaponType ?? facts.armorType;
  $: slot = facts.weaponType && facts.weaponSlot ? facts.weaponSlot : facts.slot;
  $: badges = [
    ...(facts.rarity ? [{ label: facts.rarity, tone: 'rarity' as const }] : []),
    ...(facts.questDropOnly ? [{ label: 'Quest item' }] : []),
    ...(facts.corruptionToken ? [{ label: 'Corruption token' }] : []),
  ] satisfies HeaderBadge[];
  // The game names the slot and the gear type on one line above everything else.
  $: headerFacts = [
    ...(slot ? [{ label: 'Slot', value: labelOf(slot) }] : []),
    ...(gearType ? [{ label: 'Type', value: labelOf(gearType) }] : facts.itemType ? [{ label: 'Type', value: labelOf(facts.itemType) }] : []),
    ...(facts.levelRequirement !== undefined ? [{ label: 'Requires level', value: String(facts.levelRequirement) }] : []),
  ] satisfies HeaderFact[];
  $: statChips = facts.stats.map((stat) => ({
    label: stat.stat.key === null ? stat.stat.label : stat.stat.name,
    value: signedAmount(stat.amount, stat.isPercent),
  })) satisfies Chip[];
  $: randomChips = facts.randomStats.map((stat) => ({
    label: `${stat.stat.key === null ? stat.stat.label : stat.stat.name}${stat.chance === undefined ? '' : ` (${formatNumber(stat.chance)}%)`}`,
    value: `+${rangeText(stat.min, stat.max)}${stat.isPercent ? '%' : ''}`,
  })) satisfies Chip[];
  $: socketChips = facts.sockets.map((socket) => ({ label: labelOf(socket.socketType ?? socket.gemType ?? 'Any socket'), value: 'Empty' })) satisfies Chip[];
  $: gemChips = (facts.gem?.stats ?? []).map((stat) => ({
    label: stat.stat.key === null ? stat.stat.label : stat.stat.name,
    value: signedAmount(stat.amount, stat.isPercent),
  })) satisfies Chip[];
  $: coreFactCount = [damage !== null, facts.attackSpeed !== undefined, facts.damagePerSecond !== undefined,
    facts.itemType !== undefined && !compact, facts.stackLimit > 1, facts.enchantment !== undefined,
    facts.gearSet !== undefined, facts.sellPrice !== undefined, facts.buyPrice !== undefined].filter(Boolean).length;
  $: hasCoreFacts = facts.itemPower !== undefined || damage !== null || facts.attackSpeed !== undefined || facts.stackLimit > 1
    || facts.enchantment !== undefined || facts.gearSet !== undefined || facts.sellPrice !== undefined || facts.buyPrice !== undefined
    || (!compact && facts.itemType !== undefined);
</script>

<article class="document" class:c-compact={compact} data-rarity={rarityTone(facts.rarity)}>
  <EntityHeader
    name={document.ref.name}
    art={document.art.icon ?? document.ref.icon}
    fallbackIcon={registry.find((entry) => entry.kind === 'items')?.icon}
    rarity={rarityTone(facts.rarity)}
    {badges}
    facts={headerFacts}
    description={document.description}
    atlasHref={hasSources && !compact ? `${base}/?item=${encodeURIComponent(document.ref.key)}` : undefined}
    atlasLabel="View sources on the atlas"
    {compact}
  />

  <div class="c-stack">
    <div class="c-card-grid">
      {#if hasCoreFacts}
      <Card title="Facts" wide={coreFactCount > 2}>
        {#if facts.itemPower !== undefined}<p class="item-power">Item power <strong>{formatNumber(facts.itemPower)}</strong></p>{/if}
        <FactGrid wide={!compact}>
          {#if damage}<Fact label="Damage">{damage}</Fact>{/if}
          {#if facts.attackSpeed !== undefined}<Fact label="Attack speed">{formatNumber(facts.attackSpeed)}</Fact>{/if}
          {#if facts.damagePerSecond !== undefined}<Fact label="Damage per second">{facts.damagePerSecond.toFixed(1)}</Fact>{/if}
          {#if facts.itemType && !compact}<Fact label="Item type">{labelOf(facts.itemType)}</Fact>{/if}
          {#if facts.stackLimit > 1}<Fact label="Stack limit">{formatNumber(facts.stackLimit)}</Fact>{/if}
          {#if facts.enchantment}<Fact label="Enchantment"><EntityLink ref={facts.enchantment} {registry} /></Fact>{/if}
          {#if facts.gearSet}<Fact label="Gear set"><EntityLink ref={facts.gearSet} {registry} /></Fact>{/if}
          {#if facts.sellPrice}<Fact label="Sell price"><Price price={facts.sellPrice} showName /></Fact>{/if}
          {#if facts.buyPrice}<Fact label="Buy price"><Price price={facts.buyPrice} showName /></Fact>{/if}
        </FactGrid>
      </Card>
      {/if}
      {#if statChips.length}<Card title="Stats" count={statChips.length}><ChipGrid chips={statChips} /></Card>{/if}
      {#if randomChips.length}
        <Card title="Random stats" count={randomChips.length}>
          <ChipGrid chips={randomChips} />
          {#if facts.randomStatsMax > 0}<p class="note">Up to {facts.randomStatsMax} of these roll on one item.</p>{/if}
        </Card>
      {/if}
      {#if socketChips.length}<Card title="Sockets" count={socketChips.length}><ChipGrid chips={socketChips} /></Card>{/if}
      {#if facts.gem}
        <Card title={labelOf(facts.gem.gemType ?? 'Gem')}>
          {#if gemChips.length}<ChipGrid chips={gemChips} />{:else}<p class="note">This gem grants no published stat.</p>{/if}
        </Card>
      {/if}
      {#if facts.requirements.length}<Card title="Requirements"><Requirements requirements={facts.requirements} {registry} /></Card>{/if}
    </div>

    {#if showRelations}
      <DropTable rows={document.droppedBy} {registry} heading="Dropped by" counterpartLabel="Source" {limit} />
      <VendorTable rows={document.soldBy} {registry} heading="Sold by" counterpartLabel="Vendor" {limit} />
      <GatherTable rows={document.gatheredFrom} {registry} itemKey={document.ref.key} {limit} />
      <ContainerTable rows={document.inContainers} {registry} itemKey={document.ref.key} {limit} />
      <QuestTable rows={[...document.rewardedBy, ...document.givenBy, ...document.usedInQuests]} {registry} heading="Quests" {limit} />
      <RecipeTable rows={document.craftedBy} {registry} heading="Crafted by" counterpartLabel="Recipe" {limit} />
      <RecipeTable rows={document.usedInRecipes} {registry} heading="Used in recipes" counterpartLabel="Recipe" {limit} />
    {/if}
  </div>
</article>

<style>
  .item-power { margin: 0 0 .75rem; color: var(--c-currency); font-size: .9rem; letter-spacing: .02em; }
  .item-power strong { font-size: 1.1rem; }
  .note { margin: .6rem 0 0; color: var(--c-text-mute); font-size: .76rem; }
</style>
