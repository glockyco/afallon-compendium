<script lang="ts">
  import type { PublicGearSet, PublicItem, PublicKindEntry } from '@afallon/contracts/public';
  import EntityHeader, { type HeaderBadge, type HeaderFact } from './EntityHeader.svelte';
  import EntityReference from './EntityReference.svelte';
  import NativeText from './NativeText.svelte';
  import Price from './Price.svelte';
  import Requirements from './Requirements.svelte';
  import { formatNumber, labelOf, rangeText, rarityTone, signedAmount } from './format';

  export let document: PublicItem;
  export let registry: PublicKindEntry[];
  export let gearSet: PublicGearSet | null = null;

  $: facts = document.facts;
  $: damage = rangeText(facts.minDamage, facts.maxDamage);
  $: gearType = facts.weaponType ?? facts.armorType;
  $: slot = facts.weaponType && facts.weaponSlot ? facts.weaponSlot : facts.slot;
  $: badges = facts.rarity ? [{ label: facts.rarity, tone: 'rarity' as const }] satisfies HeaderBadge[] : [];
  $: headerFacts = [
    ...(slot ? [{ label: 'Slot', value: labelOf(slot) }] : []),
    ...(gearType ? [{ label: 'Type', value: labelOf(gearType) }] : facts.itemType ? [{ label: 'Type', value: labelOf(facts.itemType) }] : []),
  ] satisfies HeaderFact[];
</script>

<article class="item-tooltip" data-rarity={rarityTone(facts.rarity)}>
  <EntityHeader
    name={document.ref.name}
    art={document.art.icon ?? document.ref.icon}
    fallbackIcon={registry.find((entry) => entry.kind === 'items')?.icon}
    rarity={rarityTone(facts.rarity)}
    {badges}
    facts={headerFacts}
    compact
  />

  <div class="tooltip-facts">
    {#if facts.itemPower !== undefined}<p class="item-power">Item power <strong>{formatNumber(facts.itemPower)}</strong></p>{/if}
    {#if damage}<p><strong>{damage}</strong> Damage</p>{/if}
    {#if facts.attackSpeed !== undefined}<p><strong>{formatNumber(facts.attackSpeed)}</strong> Attack speed</p>{/if}
    {#if facts.damagePerSecond !== undefined}<p><strong>{facts.damagePerSecond.toFixed(1)}</strong> Damage per second</p>{/if}

    {#each facts.stats as stat}<p class="stat">{signedAmount(stat.amount, stat.isPercent)} {stat.stat.key === null ? stat.stat.label : stat.stat.name}</p>{/each}
    {#each facts.randomStats as stat}<p class="stat">+{rangeText(stat.min, stat.max)}{stat.isPercent ? '%' : ''} {stat.stat.key === null ? stat.stat.label : stat.stat.name}</p>{/each}

    {#if facts.useLines.length}<NativeText lines={facts.useLines} />{/if}

    {#each facts.sockets as socket}<p class="socket">Empty {labelOf(socket.socketType ?? socket.gemType ?? 'socket')}</p>{/each}
    {#if facts.gem}
      {#each facts.gem.stats as stat}<p class="stat">{signedAmount(stat.amount, stat.isPercent)} {stat.stat.key === null ? stat.stat.label : stat.stat.name}</p>{/each}
    {/if}

    {#if gearSet}
      <section class="gear-set" aria-label={gearSet.ref.name}>
        <h4>{gearSet.ref.name}</h4>
        <ul class="set-members">{#each gearSet.members as member}<li class:active={member.key === document.ref.key}><EntityReference ref={member} {registry} /></li>{/each}</ul>
        <ul class="set-tiers">{#each gearSet.tiers as tier}<li class:active={tier.equipped <= 1}><span>({tier.equipped})</span> {#each tier.stats as stat, index}{index > 0 ? ', ' : ''}{signedAmount(stat.amount, stat.isPercent)} {stat.stat.key === null ? stat.stat.label : stat.stat.name}{/each}</li>{/each}</ul>
      </section>
    {/if}

    {#if facts.equipmentRequirements.length}<Requirements requirements={facts.equipmentRequirements} fulfilled />{/if}
    {#if facts.sellPrice}<p class="sell-price"><span>Sell price</span> <Price price={facts.sellPrice} showName /></p>{/if}
  </div>
</article>

<style>
  .tooltip-facts { display: grid; gap: .32rem; font-size: .84rem; }
  p { margin: 0; }
  strong { color: #f1ecdf; font-weight: 650; }
  .item-power { color: var(--c-currency); }
  .stat, .set-members .active, .set-tiers .active { color: #72c875; }
  .socket { color: var(--c-text-dim); }
  .gear-set { display: grid; gap: .28rem; margin-top: .18rem; }
  h4 { margin: 0; color: var(--c-rarity-gold); font: 600 .86rem/1.3 var(--c-serif); }
  ul { display: grid; gap: .2rem; margin: 0; padding: 0; list-style: none; }
  .set-members li:not(.active), .set-tiers li:not(.active) { color: var(--c-text-mute); }
  .set-members li:not(.active) :global(.entity-reference) { color: inherit; }
  .set-tiers span { color: inherit; }
  .sell-price { display: flex; align-items: center; justify-content: space-between; gap: .75rem; padding-top: .35rem; border-top: 1px solid var(--c-line-soft); color: var(--c-text-dim); }
</style>
