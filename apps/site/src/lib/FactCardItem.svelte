<script lang="ts">
  import type { PublicItem, PublicKindEntry } from '@afallon/contracts/public';
  import ContainerTable from './ContainerTable.svelte';
  import DropTable from './DropTable.svelte';
  import EntityLink from './EntityLink.svelte';
  import FactCardFrame from './FactCardFrame.svelte';
  import GatherTable from './GatherTable.svelte';
  import LocationList from './LocationList.svelte';
  import MissingValue from './MissingValue.svelte';
  import QuestTable from './QuestTable.svelte';
  import RecipeTable from './RecipeTable.svelte';
  import Requirements from './Requirements.svelte';
  import VendorTable from './VendorTable.svelte';

  export let document: PublicItem;
  export let registry: PublicKindEntry[];
  export let compact = false;
  export let showRelations = false;
  export let limit: number | undefined = undefined;

  $: facts = document.facts;
  $: damage = facts.minDamage === undefined && facts.maxDamage === undefined ? null : facts.minDamage === facts.maxDamage || facts.maxDamage === undefined ? String(facts.minDamage) : `${facts.minDamage ?? 0}–${facts.maxDamage}`;
</script>

<FactCardFrame name={document.ref.name} description={document.description} art={document.art.icon ?? document.ref.icon} fallbackIcon={registry.find((entry) => entry.kind === 'items')?.icon} {compact}>
  <dl class="facts">
    <div><dt>Rarity</dt><dd>{#if facts.rarity}{facts.rarity}{:else}<MissingValue explanation="No rarity is published" />{/if}</dd></div>
    <div><dt>Item type</dt><dd>{#if facts.itemType}{facts.itemType}{:else}<MissingValue explanation="No item type is published" />{/if}</dd></div>
    <div><dt>Slot</dt><dd>{#if facts.slot}{facts.slot}{:else}<MissingValue explanation="No equipment slot is published" />{/if}</dd></div>
    <div><dt>Weapon or armor</dt><dd>{#if facts.weaponType || facts.armorType || facts.weaponSlot}{facts.weaponType ?? facts.armorType ?? facts.weaponSlot}{:else}<MissingValue explanation="No weapon or armor type is published" />{/if}</dd></div>
    <div><dt>Damage</dt><dd>{#if damage}{damage}{:else}<MissingValue explanation="No damage is published" />{/if}</dd></div>
    <div><dt>Attack speed</dt><dd>{#if facts.attackSpeed !== undefined}{facts.attackSpeed}{:else}<MissingValue explanation="No attack speed is published" />{/if}</dd></div>
    <div><dt>Level requirement</dt><dd>{#if facts.levelRequirement !== undefined}{facts.levelRequirement}{:else}<MissingValue explanation="No level requirement is published" />{/if}</dd></div>
    <div><dt>Stack limit</dt><dd>{facts.stackLimit}</dd></div>
    <div><dt>Stats</dt><dd>{#if facts.stats.length}{#each facts.stats as stat}<span class="line"><EntityLink ref={stat.stat} {registry} /> {stat.amount}{stat.isPercent ? '%' : ''}</span>{/each}{:else}None{/if}</dd></div>
    <div><dt>Random stats</dt><dd>{#if facts.randomStats.length}{#each facts.randomStats as stat}<span class="line"><EntityLink ref={stat.stat} {registry} /> {stat.min}–{stat.max}{stat.isPercent ? '%' : ''}{stat.whole ? ' whole' : ''}{#if stat.chance !== undefined} · {stat.chance}%{/if}</span>{/each}<span class="line">Up to {facts.randomStatsMax}</span>{:else}None{/if}</dd></div>
    <div><dt>Sockets</dt><dd>{facts.sockets.length ? facts.sockets.map((socket) => socket.socketType ?? socket.gemType ?? 'Any').join(', ') : 'None'}</dd></div>
    <div><dt>Gem</dt><dd>{#if facts.gem}{facts.gem.gemType ?? 'Gem'}{#each facts.gem.stats as stat}<span class="line"><EntityLink ref={stat.stat} {registry} /> {stat.amount}{stat.isPercent ? '%' : ''}</span>{/each}{:else}No{/if}</dd></div>
    <div><dt>Enchantment</dt><dd>{#if facts.enchantment}<EntityLink ref={facts.enchantment} {registry} />{:else}None{/if}</dd></div>
    <div><dt>Requirements</dt><dd><Requirements requirements={facts.requirements} {registry} /></dd></div>
    <div><dt>Sell price</dt><dd>{#if facts.sellPrice}{facts.sellPrice.amount} <EntityLink ref={facts.sellPrice.currency} {registry} />{:else}<MissingValue explanation="No sell price is published" />{/if}</dd></div>
    <div><dt>Buy price</dt><dd>{#if facts.buyPrice}{facts.buyPrice.amount} <EntityLink ref={facts.buyPrice.currency} {registry} />{:else}<MissingValue explanation="No buy price is published" />{/if}</dd></div>
    <div><dt>Quest drop only</dt><dd>{facts.questDropOnly ? 'Yes' : 'No'}</dd></div>
    <div><dt>Corruption token</dt><dd>{facts.corruptionToken ? 'Yes' : 'No'}</dd></div>
  </dl>
  {#if showRelations}
    <DropTable rows={document.droppedBy} {registry} heading="Dropped by" counterpartLabel="Source" {limit} />
    <VendorTable rows={document.soldBy} {registry} heading="Sold by" counterpartLabel="Vendor" {limit} />
    <GatherTable rows={document.gatheredFrom} {registry} itemKey={document.ref.key} {limit} />
    <ContainerTable rows={document.inContainers} {registry} heading="Found in containers" itemKey={document.ref.key} {limit} />
    <QuestTable rows={[...document.rewardedBy, ...document.givenBy, ...document.usedInQuests]} {registry} heading="Quests" {limit} />
    <RecipeTable rows={document.craftedBy} {registry} heading="Crafted by" counterpartLabel="Recipe" {limit} />
    <RecipeTable rows={document.usedInRecipes} {registry} heading="Used in recipes" counterpartLabel="Recipe" {limit} />
    <LocationList locations={document.locations} entityKey={document.ref.key} item {limit} />
  {/if}
</FactCardFrame>

<style>.line { display: block; } .line + .line { margin-top: .2rem; }</style>
