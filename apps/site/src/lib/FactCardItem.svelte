<script lang="ts">
  import { base } from '$app/paths';
  import type { PublicItem, PublicKindEntry } from '@afallon/contracts/public';
  import ContainerTable from './ContainerTable.svelte';
  import DropTable from './DropTable.svelte';
  import EntityLink from './EntityLink.svelte';
  import FactCardFrame from './FactCardFrame.svelte';
  import GatherTable from './GatherTable.svelte';
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
  $: hasSources = document.droppedBy.length > 0 || document.soldBy.length > 0 || document.gatheredFrom.length > 0 || document.inContainers.length > 0 || document.rewardedBy.length > 0 || document.givenBy.length > 0 || document.craftedBy.length > 0;
  $: damage = facts.minDamage === undefined && facts.maxDamage === undefined ? null : facts.minDamage === facts.maxDamage || facts.maxDamage === undefined ? String(facts.minDamage) : `${facts.minDamage ?? 0}–${facts.maxDamage}`;
</script>

<FactCardFrame name={document.ref.name} description={document.description} art={document.art.icon ?? document.ref.icon} fallbackIcon={registry.find((entry) => entry.kind === 'items')?.icon} {compact}>
  <dl class="facts">
    {#if facts.rarity}<div><dt>Rarity</dt><dd>{facts.rarity}</dd></div>{/if}
    {#if facts.itemType}<div><dt>Item type</dt><dd>{facts.itemType}</dd></div>{/if}
    {#if facts.weaponType && facts.weaponSlot}<div><dt>Weapon slot</dt><dd>{facts.weaponSlot}</dd></div>{:else if facts.slot}<div><dt>Slot</dt><dd>{facts.slot}</dd></div>{/if}
    {#if facts.weaponType || facts.armorType}<div><dt>Weapon or armor</dt><dd>{facts.weaponType ?? facts.armorType}</dd></div>{/if}
    {#if damage}<div><dt>Damage</dt><dd>{damage}</dd></div>{/if}
    {#if facts.attackSpeed !== undefined}<div><dt>Attack speed</dt><dd>{facts.attackSpeed}</dd></div>{/if}
    {#if facts.levelRequirement !== undefined}<div><dt>Level requirement</dt><dd>{facts.levelRequirement}</dd></div>{/if}
    <div><dt>Stack limit</dt><dd>{facts.stackLimit}</dd></div>
    {#if facts.stats.length}<div><dt>Stats</dt><dd>{#each facts.stats as stat}<span class="line"><EntityLink ref={stat.stat} {registry} /> {stat.amount}{stat.isPercent ? '%' : ''}</span>{/each}</dd></div>{/if}
    {#if facts.randomStats.length}<div><dt>Random stats</dt><dd>{#each facts.randomStats as stat}<span class="line"><EntityLink ref={stat.stat} {registry} /> {stat.min}–{stat.max}{stat.isPercent ? '%' : ''}{stat.whole ? ' whole' : ''}{#if stat.chance !== undefined} · {stat.chance}%{/if}</span>{/each}<span class="line">Up to {facts.randomStatsMax}</span></dd></div>{/if}
    {#if facts.sockets.length}<div><dt>Sockets</dt><dd>{facts.sockets.map((socket) => socket.socketType ?? socket.gemType ?? 'Any').join(', ')}</dd></div>{/if}
    {#if facts.gem}<div><dt>Gem</dt><dd>{facts.gem.gemType ?? 'Gem'}{#each facts.gem.stats as stat}<span class="line"><EntityLink ref={stat.stat} {registry} /> {stat.amount}{stat.isPercent ? '%' : ''}</span>{/each}</dd></div>{/if}
    {#if facts.enchantment}<div><dt>Enchantment</dt><dd><EntityLink ref={facts.enchantment} {registry} /></dd></div>{/if}
    {#if facts.requirements.length}<div><dt>Requirements</dt><dd><Requirements requirements={facts.requirements} {registry} /></dd></div>{/if}
    {#if facts.sellPrice}<div><dt>Sell price</dt><dd>{facts.sellPrice.amount} <EntityLink ref={facts.sellPrice.currency} {registry} /></dd></div>{/if}
    {#if facts.buyPrice}<div><dt>Buy price</dt><dd>{facts.buyPrice.amount} <EntityLink ref={facts.buyPrice.currency} {registry} /></dd></div>{/if}
    {#if facts.questDropOnly}<div><dt>Quest drop only</dt><dd>Yes</dd></div>{/if}
    {#if facts.corruptionToken}<div><dt>Corruption token</dt><dd>Yes</dd></div>{/if}
    <div><dt>Atlas</dt><dd>{#if hasSources}<a href={`${base}/?item=${encodeURIComponent(document.ref.key)}`}>View source locations</a>{:else}<MissingValue explanation="No source location is published" />{/if}</dd></div>
  </dl>
  {#if showRelations}
    <DropTable rows={document.droppedBy} {registry} heading="Dropped by" counterpartLabel="Source" {limit} />
    <VendorTable rows={document.soldBy} {registry} heading="Sold by" counterpartLabel="Vendor" {limit} />
    <GatherTable rows={document.gatheredFrom} {registry} itemKey={document.ref.key} {limit} />
    <ContainerTable rows={document.inContainers} {registry} heading="Found in containers" itemKey={document.ref.key} {limit} />
    <QuestTable rows={[...document.rewardedBy, ...document.givenBy, ...document.usedInQuests]} {registry} heading="Quests" {limit} />
    <RecipeTable rows={document.craftedBy} {registry} heading="Crafted by" counterpartLabel="Recipe" {limit} />
    <RecipeTable rows={document.usedInRecipes} {registry} heading="Used in recipes" counterpartLabel="Recipe" {limit} />
  {/if}
</FactCardFrame>

<style>.line { display: block; } .line + .line { margin-top: .2rem; } a { color: #d9bd79; text-underline-offset: .18em; }</style>
