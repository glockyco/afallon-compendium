<script lang="ts">
  // Throwaway: equipment places grouped as the game groups them, each with its item and that item's own changes.
  import { base } from '$app/paths';
  import { rarityTone } from '$lib/format';
  import type { PlannerMock } from '../data.server';

  export let slots: PlannerMock['slots'];
  export let selected: string | undefined = undefined;
  export let editable = false;

  $: groups = (['Weapons', 'Armor', 'Jewelry'] as const).map((group) => ({ group, slots: slots.filter((slot) => slot.group === group) }));
  const changes = (slot: PlannerMock['slots'][number]) => {
    const tags: { text: string; tone?: string }[] = [];
    if (slot.heroic) tags.push({ text: 'Heroic', tone: 'accent' });
    if (slot.corruption) tags.push({ text: `Corruption ${slot.corruption}` });
    if (slot.enchant) tags.push({ text: slot.enchant.ref.name });
    return tags;
  };
</script>

<div class="slot-list" class:editable>
  {#each groups as { group, slots: entries }}
    <div class="group" role="group" aria-label={group}>
      <h3>{group}</h3>
      {#each entries as slot}
        <div class="slot" class:selected={slot.placement === selected} class:empty={!slot.document}>
          <span class="place">{slot.label}</span>
          {#if slot.document}
            <img class="icon" src={`${base}/data/${(slot.document.art.icon ?? slot.document.ref.icon)?.url}`} alt="" />
            <span class="item">
              <a class="name" data-rarity={rarityTone(slot.document.facts.rarity)} href={`${base}/items/${slot.document.ref.slug}/`}>{slot.document.ref.name}</a>
              <span class="sub">{slot.document.facts.armorType ? `${slot.document.facts.armorType[0]}${slot.document.facts.armorType.slice(1).toLowerCase()} · ` : slot.document.facts.weaponType ? `${slot.document.facts.weaponType[0]}${slot.document.facts.weaponType.slice(1).toLowerCase()} · ` : ''}Level {slot.document.facts.levelRequirement}</span>
            </span>
            <span class="pm-tags changes">{#each changes(slot) as tag}<span class="pm-tag" class:accent={tag.tone === 'accent'}>{tag.text}</span>{/each}{#if slot.collected}<span class="pm-tag ok">Collected</span>{/if}{#if slot.gems.length}<span class="sockets" aria-label={`Gems: ${slot.gems.filter((socket) => socket.gem).length} of ${slot.gems.length}`}>{#each slot.gems as socket}<span class="socket" class:filled={Boolean(socket.gem)} data-colour={socket.colour.toLowerCase()}></span>{/each}</span>{/if}</span>
          {:else}
            <span class="icon placeholder" aria-hidden="true"></span>
            <span class="item"><span class="none">{slot.note ?? 'Empty'}</span></span>
            {#if editable && !slot.note}<span class="changes"><button class="c-action">Choose Item</button></span>{/if}
          {/if}
        </div>
        {#if slot.placement === selected && $$slots.expanded}<div class="inline phone-only"><slot name="expanded" /></div>{/if}
      {/each}
      {#if group === 'Jewelry'}<p class="pm-note research">A second ring and trinket place isn’t verified yet.</p>{/if}
    </div>
  {/each}
</div>

<style>
  .slot-list { display: grid; gap: 1.1rem; }
  .group { display: grid; border: 1px solid var(--c-line-soft); border-radius: var(--c-radius); background: var(--c-surface-1); overflow: hidden; }
  h3 { margin: 0; padding: .45rem .9rem; border-bottom: 1px solid var(--c-line-soft); background: var(--c-surface-2); color: var(--c-text-dim); font-size: var(--c-text-small); font-weight: 600; }
  .slot { display: grid; grid-template-columns: 6.5rem 2.25rem minmax(0, 1fr) auto; align-items: center; gap: .75rem; min-height: 3.4rem; padding: .45rem .9rem; border-top: 1px solid var(--c-line-soft); }
  h3 + .slot { border-top: 0; }
  .editable .slot { cursor: pointer; }
  .editable .slot:hover { background: var(--c-tint-hover); }
  .slot.selected { background: var(--c-accent-surface); box-shadow: inset 3px 0 0 var(--c-accent); }
  .place { color: var(--c-text-dim); font-size: var(--c-text-small); }
  .icon { width: 2.25rem; height: 2.25rem; border: 1px solid var(--c-line); border-radius: var(--c-radius-sm); background: var(--c-surface-sunken); object-fit: contain; }
  .placeholder { display: block; box-sizing: border-box; border-style: dashed; background: transparent; }
  .item { display: grid; min-width: 0; line-height: 1.35; }
  .name { overflow: hidden; color: var(--c-rarity); font-weight: 600; text-decoration: none; text-overflow: ellipsis; white-space: nowrap; }
  .name:hover { text-decoration: underline; }
  .sub { color: var(--c-text-dim); font-size: var(--c-text-small); }
  .none { color: var(--c-text-mute); }
  .changes { justify-content: flex-end; align-items: center; }
  .sockets { display: inline-flex; gap: .3rem; padding: 0 .1rem; }
  .socket { --gem: var(--c-text-dim); width: .7rem; height: .7rem; box-sizing: border-box; border: 2px solid var(--gem); border-radius: 50%; }
  .socket.filled { background: var(--gem); }
  .socket[data-colour='blue'] { --gem: #6aa9e0; }
  .socket[data-colour='orange'] { --gem: #e2883f; }
  .socket[data-colour='green'] { --gem: #79c07a; }
  .socket[data-colour='yellow'] { --gem: #e0c341; }
  .socket[data-colour='red'] { --gem: #df7770; }
  .socket[data-colour='white'] { --gem: #e9e4d9; }
  .research { padding: .5rem .9rem; border-top: 1px solid var(--c-line-soft); }
  .inline { padding: .75rem; border-top: 1px dashed var(--c-line); background: var(--c-surface-2); }
  @media (max-width: 640px) {
    .slot { grid-template-columns: 2.25rem minmax(0, 1fr); grid-template-areas: 'icon place' 'icon item' '. changes'; row-gap: .1rem; padding: .55rem .75rem; }
    .place { grid-area: place; font-size: .8rem; }
    .icon { grid-area: icon; align-self: start; }
    .item { grid-area: item; }
    .changes { grid-area: changes; justify-content: flex-start; margin-top: .3rem; }
    .changes:empty { display: none; }
  }
</style>
