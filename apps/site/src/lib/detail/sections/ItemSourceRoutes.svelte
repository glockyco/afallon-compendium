<script lang="ts">
  import { base } from '$app/paths';
  import type { PublicItem, PublicKindEntry } from '@afallon/contracts/public';
  import EntityLink from '../../EntityLink.svelte';
  import { formatNumber } from '../../format';
  import CraftExperience from '../CraftExperience.svelte';
  import HowItWorks from '../HowItWorks.svelte';
  import { itemSourceLines, lineHref, type SummaryLine } from '../item-sources';
  import MaterialsList from '../MaterialsList.svelte';
  import SummaryValue from '../SummaryValue.svelte';

  // Every way to get an item, one route each, as the item page's answer shows them. Another page that shows the item's
  // routes, such as its currency's page, sets `itemHref`, so each route's link opens the item page's section.
  export let document: PublicItem;
  export let registry: PublicKindEntry[];
  export let itemHref: string | undefined = undefined;

  $: facts = document.facts;
  $: sources = itemSourceLines(document);
  $: craft = document.crafting;
  $: materials = craft?.materials.map((row) => ({ item: row.counterpart, quantity: row.count })) ?? [];
  $: firstRank = craft?.ranks[0];
  $: craftGuide = document.placedRules.find((rule) => rule.target === 'crafting' && rule.section === 'crafting-experience')
    ?? document.placedRules.find((rule) => rule.target === 'crafting');
  $: dungeonGuide = document.placedRules.find((rule) => rule.target === 'dungeon-rewards');
  $: onlyDrop = document.droppedBy.length === 1 ? document.droppedBy[0] : undefined;
  $: singleDropInAnswer = Boolean(onlyDrop?.creatureLevel && !onlyDrop.requirements.length && (onlyDrop.min ?? 1) === 1 && (onlyDrop.max ?? 1) === 1 && onlyDrop.chance !== undefined);
  function routeHref(entry: SummaryLine): string | undefined {
    const href = lineHref(entry, registry, base);
    return href?.startsWith('#') && itemHref ? `${itemHref}${href}` : href;
  }
</script>

{#if sources.length}
  <ul class="routes">
    {#each sources as entry}
      <li class="route" class:primary={entry === sources[0]} id={entry.id === 'crafting' || (entry.id === 'dropped-by' && singleDropInAnswer) ? entry.id : undefined}>
        {#if entry.id !== 'crafting' || sources.length > 1}<div class="route-head"><strong class="route-label">{entry.label}</strong>{#if entry.spotCount}<span class="route-count">{formatNumber(entry.spotCount)} map spots</span>{/if}</div>{/if}
        {#if entry.id === 'crafting' && craft}
          <p class="craft-title">{#if craft.skill && firstRank}Craft it with <EntityLink ref={craft.skill} {registry} /> level {formatNumber(firstRank.requiredLevel)}{:else if craft.skill}Craft it with <EntityLink ref={craft.skill} {registry} />{:else}Craft it from the materials below{/if}{#if craft.station}{' at a '}{'name' in craft.station ? craft.station.name : craft.station.label} station{/if}.</p>
          {#if craft.recipe.name !== document.ref.name}<p class="recipe-name">Recipe: {craft.recipe.name}</p>{/if}
          {#if materials.length}<div class="materials"><span>Materials</span><MaterialsList {materials} {registry} /></div>{/if}
          {#if craft.product && craft.product.count > 1}<p>Makes {formatNumber(craft.product.count)} per craft.</p>{/if}
          {#if craft.taughtBy.length}<p>Learn the recipe from {#each craft.taughtBy as teacher, index}{index > 0 ? ', ' : ''}<EntityLink ref={teacher} {registry} />{/each}.</p>{:else if craft.learnedByDefault}<p>The recipe is known by default.</p>{/if}
          {#if firstRank?.bands.length}
            <p>Base experience: {formatNumber(firstRank.baseExperience)} per craft before skill modifiers.</p>
            <details class="experience"><summary>Experience by skill level</summary><CraftExperience rank={firstRank} skill={craft.skill} id="crafting-level" />{#if craftGuide}<HowItWorks guide={craftGuide.guide} section={craftGuide.section} label={craftGuide.section === 'crafting-experience' ? 'How crafting experience works' : 'How crafting works'} />{/if}</details>
          {:else if craftGuide}<HowItWorks guide={craftGuide.guide} section={craftGuide.section} label="How crafting works" />{/if}
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
          {#if dungeonGuide}<HowItWorks guide={dungeonGuide.guide} section={dungeonGuide.section} label="How dungeon rewards work" />{/if}
        {:else}
          <p>{#if entry.id === 'dropped-by' && singleDropInAnswer && entry.text}{entry.text}{:else}<SummaryValue {entry} {registry} href={routeHref(entry)} />{/if}{#if entry.detail}{' · '}{entry.detail}{/if}{#if entry.guaranteedYield}{' · '}{formatNumber(entry.guaranteedYield)} guaranteed{/if}</p>
          {#if entry.id !== 'dropped-by' || !singleDropInAnswer}{#if entry.id !== 'starting-gear-of'}<a class="c-link route-more" href={routeHref(entry)}>{entry.linkText ?? `See full ${entry.label.toLowerCase()} sources`}</a>{/if}{/if}
        {/if}
      </li>
    {/each}
  </ul>
{:else if document.adventurers.length}<p>Only adventurers can get this item. <a class="c-link" href="#adventurers">See adventurer gear</a>.</p>
{:else}<p>No known way to get this item.</p>{/if}

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
  .route-count { color: var(--c-text-dim); font-size: var(--c-text-small); }
  .materials { display: grid; gap: .25rem; }
  .materials > span { color: var(--c-text-dim); font-size: var(--c-text-small); }
  .experience { border-top: 1px solid var(--c-line-soft); padding-top: .55rem; }
  .experience summary { cursor: pointer; color: var(--c-accent); font-weight: 600; }
  .experience :global(.craft-experience) { margin-top: .75rem; }
  .route-more { justify-self: start; font-size: var(--c-text-small); min-height: 1.5rem; }
  .route p { line-height: 1.5; }
  .dungeon-list { display: grid; gap: .35rem; padding-left: 1.25rem; min-width: 0; line-height: 1.5; overflow-wrap: anywhere; }
</style>
