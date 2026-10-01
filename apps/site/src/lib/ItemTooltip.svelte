<script lang="ts">
  import type { PublicItem, PublicKindEntry, Ref } from '@afallon/contracts/public';
  import { categoryLabel } from '@afallon/contracts/public';
  import { corruptionDisplay, tooltipStat } from './detail/corruption';
  import EntityHeader, { type HeaderFact } from './EntityHeader.svelte';
  import EntityReference from './EntityReference.svelte';
  import NativeText from './NativeText.svelte';
  import Price from './Price.svelte';
  import RequirementList from './RequirementList.svelte';
  import { formatNumber, rangeText, rarityTone, signedAmount } from './format';

  // The item as the game's own tooltip shows it. A page links the entities that it names through the `ref` slot.
  // A hover tooltip names them with EntityReference, because a link opens a tooltip of its own.
  export let document: PublicItem;
  export let registry: PublicKindEntry[];
  export let corruptionLevel = 0;

  $: facts = document.facts;
  // The weapon line is the damage range followed by the published label, which the 0.16.3 attack profile resolves.
  // A corruption preview changes only the range.
  $: calculated = corruptionLevel > 0 ? corruptionDisplay(facts, corruptionLevel) : undefined;
  $: minDamage = calculated?.minDamage ?? facts.minDamage;
  $: maxDamage = calculated?.maxDamage ?? facts.maxDamage;
  $: damage = facts.weaponDamageLabel && minDamage !== undefined && maxDamage !== undefined ? `${minDamage} - ${maxDamage} ${facts.weaponDamageLabel}` : undefined;
  $: attackSpeed = damage && facts.attackSpeed !== undefined && facts.attackSpeed > 0 ? facts.attackSpeed : undefined;
  $: gearType = facts.weaponType ?? facts.armorType;
  $: slot = facts.weaponType && facts.weaponSlot ? facts.weaponSlot : facts.slot;
  $: headerFacts = [
    ...(facts.rarity ? [{ value: facts.rarity }] : []),
    ...(slot ? [{ value: categoryLabel(slot) }] : []),
    ...(gearType ? [{ value: categoryLabel(gearType) }] : facts.itemType ? [{ value: categoryLabel(facts.itemType) }] : []),
  ] satisfies HeaderFact[];
  const statName = (row: { stat: Ref }) => row.stat.key === null ? row.stat.label : row.stat.name;
  $: set = facts.gearSet;
</script>

<article class="item-tooltip" data-rarity={rarityTone(facts.rarity)}>
  <EntityHeader name={document.ref.name} art={document.art.icon ?? document.ref.icon} rarity={rarityTone(facts.rarity)} facts={headerFacts} compact />

  <div class="lines">
    {#if facts.itemPower !== undefined}<p class="item-power">Item power <strong>{formatNumber(calculated?.itemPower ?? facts.itemPower)}</strong></p>{/if}
    {#if damage}<p><strong>{damage}</strong></p>{/if}
    {#if attackSpeed !== undefined}
      <p>Speed {attackSpeed.toFixed(2)}</p>
      {#if facts.damagePerSecond !== undefined}<p class="dim">({(calculated?.damagePerSecond ?? facts.damagePerSecond).toFixed(1)} damage per second)</p>{/if}
    {/if}
    {#if calculated}<p class="good">Corruption +{corruptionLevel}</p>{/if}

    {#each calculated?.stats ?? facts.stats as stat}<p class="good">{calculated ? `${stat.amount < 0 ? '-' : '+'}${tooltipStat(Math.abs(stat.amount))}${stat.isPercent ? '%' : ''}` : signedAmount(stat.amount, stat.isPercent)} {statName(stat)}</p>{/each}
    {#if facts.randomStats.length}
      <div class="group">
        <p class="dim">{facts.randomStatsMax > 0 ? `Up to ${facts.randomStatsMax} random stats` : 'Random stats'}</p>
        {#each facts.randomStats as stat}<p class="good">+{rangeText(stat.min, stat.max)}{stat.isPercent ? '%' : ''} {statName(stat)}{#if stat.chance !== undefined}{' '}<span class="dim">({formatNumber(stat.chance)}%)</span>{/if}</p>{/each}
      </div>
    {/if}

    {#if facts.useLines.length}<NativeText lines={facts.useLines} />{/if}
    {#if facts.actionAbilities.length}
      <ul class="plain">{#each facts.actionAbilities as reference}<li>Use: <slot name="ref" ref={reference.ability} rankIndex={reference.rankIndex}><EntityReference ref={reference.ability} {registry} /></slot>{#if reference.rankIndex !== undefined} <span class="dim">Rank {reference.rankIndex + 1}</span>{/if}</li>{/each}</ul>
    {/if}

    {#each facts.sockets as socket}<p class="dim">Empty {categoryLabel(socket.socketType ?? socket.gemType ?? 'socket')} socket</p>{/each}
    {#if facts.gem}{#each facts.gem.stats as stat}<p class="good">{signedAmount(stat.amount, stat.isPercent)} {statName(stat)}</p>{/each}{/if}
    {#if facts.enchantment}<p>Enchantment: <slot name="ref" ref={facts.enchantment} rankIndex={undefined}><EntityReference ref={facts.enchantment} {registry} /></slot></p>{/if}

    {#if set}
      <section class="gear-set" aria-label={set.name}>
        <h4>{set.name} <span class="dim">({set.members.length} pieces)</span></h4>
        <ul class="plain">{#each set.members as member}<li class:current={member.key === document.ref.key}><slot name="ref" ref={member} rankIndex={undefined}><EntityReference ref={member} {registry} /></slot></li>{/each}</ul>
        <ul class="plain tiers">{#each set.tiers as tier}<li><span class="dim">({tier.equipped})</span> {#each tier.stats as stat, index}{index > 0 ? ', ' : ''}{signedAmount(stat.amount, stat.isPercent)} {statName(stat)}{/each}</li>{/each}</ul>
      </section>
    {/if}

    {#if facts.equipmentRequirements.length}
      <div class="requirements"><RequirementList requirements={facts.equipmentRequirements} let:ref><slot name="ref" {ref} rankIndex={undefined}><EntityReference {ref} {registry} /></slot></RequirementList></div>
    {/if}
    {#if facts.useConditions.length}
      <div class="group"><p class="dim">Use requires</p><RequirementList requirements={facts.useConditions} let:ref><slot name="ref" {ref} rankIndex={undefined}><EntityReference {ref} {registry} /></slot></RequirementList></div>
    {/if}
    {#if facts.questDropOnly}<p class="dim">Quest item</p>{/if}
    {#if facts.corruptionToken}<p class="dim">Corruption token</p>{/if}
    {#if facts.sellPrice}<p class="sell-price"><span>Sell price</span> <Price price={facts.sellPrice} showName /></p>{/if}
  </div>
</article>

<style>
  .lines { display: grid; gap: .32rem; font-size: var(--c-text-body); }
  p { margin: 0; }
  strong { color: var(--c-text-strong); font-weight: 650; }
  .item-power { color: var(--c-currency); }
  .good { color: var(--c-positive); }
  .dim { color: var(--c-text-dim); }
  .group { display: grid; gap: .2rem; }
  .plain { display: grid; gap: .2rem; margin: 0; padding: 0; list-style: none; }
  .gear-set { display: grid; gap: .28rem; margin-top: .18rem; }
  h4 { margin: 0; color: var(--c-rarity-gold); font: 600 var(--c-text-body)/1.3 var(--c-serif); }
  /* Only the name dims. Opacity on the row would also dim the hover tooltip that the row holds, and a descendant rule
     would reach into that tooltip, so the rule takes the row's direct child only. */
  .gear-set li:not(.current) > :global(:is(.tooltip-anchor, .entity-link, .entity-text, .entity-reference)) { opacity: .75; }
  .tiers { color: var(--c-text-dim); }
  .requirements { color: var(--c-positive); }
  .requirements :global(.count) { color: inherit; }
  .sell-price { display: flex; align-items: center; justify-content: space-between; gap: .75rem; padding-top: .35rem; border-top: 1px solid var(--c-line-soft); color: var(--c-text-dim); }
</style>
