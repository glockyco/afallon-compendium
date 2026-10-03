<script lang="ts">
  import { base } from '$app/paths';
  import type { PublicItem, PublicKindEntry } from '@afallon/contracts/public';
  import EntityLink from '../../EntityLink.svelte';
  import Hint from '../../Hint.svelte';
  import { dropRateText, formatNumber, itemDropText, LISTED_RATE_HINT } from '../../format';
  import CraftExperience from '../CraftExperience.svelte';
  import HowItWorks from '../HowItWorks.svelte';
  import LootChanceHint from '../LootChanceHint.svelte';
  import { itemSourceLines, lineHref, type SummaryLine } from '../item-sources';
  import MaterialsList from '../MaterialsList.svelte';
  import SummaryValue from '../SummaryValue.svelte';
  import { itemQuestSourceRows } from '../quest-rows';

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
  $: dropGuide = document.placedRules.find((rule) => rule.target === 'dropped-by');
  $: onlyDrop = document.droppedBy.length === 1 ? document.droppedBy[0] : undefined;
  $: singleDropInAnswer = Boolean(onlyDrop && !onlyDrop.requirements.length && (onlyDrop.min ?? 1) === 1 && (onlyDrop.max ?? 1) === 1 && (onlyDrop.chance !== undefined || onlyDrop.killChance !== undefined));
  $: questRows = itemQuestSourceRows(document.rewardedBy, document.givenBy);
  $: onlyQuest = questRows.length === 1 ? questRows[0] : undefined;
  function routeHref(entry: SummaryLine): string | undefined {
    const href = lineHref(entry, registry, base);
    return href?.startsWith('#') && itemHref ? `${itemHref}${href}` : href;
  }
</script>

{#if sources.length}
  <ul class="routes">
    {#each sources as entry}
      {@const rate = entry.drop && dropRateText(entry.drop)}
      <li class="route" class:primary={entry === sources[0]} id={entry.id === 'crafting' || (entry.id === 'dropped-by' && singleDropInAnswer) || (entry.id === 'from-quests' && onlyQuest) ? entry.id : undefined}>
        {#if entry.id !== 'crafting' || sources.length > 1}<div class="route-head"><strong class="route-label">{entry.label}</strong>{#if entry.spotCount}<span class="route-count">{formatNumber(entry.spotCount)} map spots</span>{/if}</div>{/if}
        {#if entry.id === 'crafting' && craft}
          <p class="craft-title">{#if craft.skill && firstRank}Craft it with <EntityLink ref={craft.skill} {registry} /> level {formatNumber(firstRank.requiredLevel)}{:else if craft.skill}Craft it with <EntityLink ref={craft.skill} {registry} />{:else}Craft it from the materials below{/if}{#if craft.station}{' at a '}{'name' in craft.station ? craft.station.name : craft.station.label} station{/if}.</p>
          {#if craft.recipe.name !== document.ref.name}<p class="recipe-name">Recipe: {craft.recipe.name}</p>{/if}
          {#if materials.length}<div class="materials"><span>Materials</span><MaterialsList {materials} {registry} /></div>{/if}
          {#if craft.product && craft.product.count > 1}<p>Makes {formatNumber(craft.product.count)} per craft.</p>{/if}
          {#if craft.taughtBy.length}<p>Learn the recipe from {#each craft.taughtBy as teacher, index}{index > 0 ? ', ' : ''}<EntityLink ref={teacher} {registry} />{/each}.</p>{:else if craft.learnedByDefault}<p>The recipe is known by default.</p>{/if}
          {#if firstRank?.bands.length}
            <p>Base experience: {formatNumber(firstRank.baseExperience)} per craft before skill modifiers.</p>
            <details class="experience"><summary>Experience by Skill Level</summary><CraftExperience rank={firstRank} skill={craft.skill} id="crafting-level" />{#if craftGuide}<HowItWorks guide={craftGuide.guide} section={craftGuide.section} label={craftGuide.section === 'crafting-experience' ? 'How crafting experience works' : 'How crafting works'} />{/if}</details>
          {:else if craftGuide}<HowItWorks guide={craftGuide.guide} section={craftGuide.section} label="How crafting works" />{/if}
        {:else if entry.id === 'dungeon-rewards' && facts.dungeonRewards}
          {#if facts.dungeonRewards.every((reward) => reward.guaranteed)}
            <p>Every timed dungeon run ends with a reward bag that holds one Corruption Token.</p>
          {:else}
            <p>Timed dungeon reward bags can contain this item at:</p>
          {/if}
          <ul class="dungeon-list">
            {#each facts.dungeonRewards as reward}
              {@const additionalBosses = reward.bosses.filter((boss) => !document.droppedBy.some((drop) => drop.counterpart.key === boss.key && drop.counterpart.name === boss.name))}
              <li><EntityLink ref={reward.place} {registry} />{#if !reward.guaranteed && additionalBosses.length}{' with '}{#each additionalBosses as boss, index}{index ? ', ' : ''}<EntityLink ref={boss} {registry} />{/each}{/if}</li>
            {/each}
          </ul>
          {#if dungeonGuide}<HowItWorks guide={dungeonGuide.guide} section={dungeonGuide.section} label="How dungeon rewards work" />{/if}
        {:else}
          <p>
            {#if entry.id === 'dropped-by' && singleDropInAnswer && entry.text}{entry.text}{:else}<SummaryValue {entry} {registry} href={routeHref(entry)} stackPrice={entry.id === 'sold-by'} suffix={entry.id === 'dropped-by' && !entry.text && (rate || entry.detail) ? ':' : undefined} />{/if}
            {#if entry.id === 'from-quests' && onlyQuest}<span class="source-separator">{' · '}</span><span class="source-meta">{onlyQuest.roles.join(' and ')}{#if onlyQuest.count && onlyQuest.count > 1}{', '}{formatNumber(onlyQuest.count)} items{/if}</span>{/if}
            {#if entry.id === 'dropped-by' && (rate || entry.detail)}
              {entry.text && !entry.text.endsWith('.') ? ': ' : ' '}
            {/if}
            {#if rate && entry.drop}
              {#if entry.drop.killChance === undefined}
                {rate} <Hint text={`${LISTED_RATE_HINT}${entry.drop.oddsUnavailable ? ` ${entry.drop.oddsUnavailable}` : ''}`}>listed rate</Hint>.
              {:else}
                {rate.startsWith('About ') ? rate : `${rate} per kill`}{' '}<LootChanceHint trailing="." />
              {/if}
            {/if}
            {#if entry.detail}
              {#if entry.id === 'from-items'}<span class="source-separator">{' · '}</span><span class="source-meta">{entry.detail.replace(' · ', ', ')}</span>
              {:else}{#if entry.id === 'dropped-by'}{rate || entry.text?.endsWith('.') ? ' ' : ''}
                {:else if entry.id === 'cloth-loot'}{' '}
                {:else if entry.id === 'gathered-from'}{'. '}
                {:else}{' · '}{/if}{entry.detail}{/if}
            {/if}
            {#if entry.id === 'dropped-by' && singleDropInAnswer && onlyDrop}<span class="drop-rule">{itemDropText(onlyDrop)}</span>{/if}
            {#if entry.guaranteedYield}{' · '}{formatNumber(entry.guaranteedYield)} guaranteed{/if}
          </p>
          {#if entry.id === 'dropped-by' && singleDropInAnswer && dropGuide}<HowItWorks guide={dropGuide.guide} section={dropGuide.section} label="How creature drops work" />{/if}
          {#if (entry.id !== 'dropped-by' || !singleDropInAnswer) && (entry.id !== 'from-quests' || !onlyQuest)}{#if entry.id !== 'starting-gear-of'}<a class="c-link route-more" href={routeHref(entry)}>{entry.linkText ?? 'See full details'}</a>{/if}{/if}
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
  .drop-rule { display: block; }
  .route :global(.tooltip-anchor), .route :global(.entity-link) { display: inline-block; max-width: 100%; vertical-align: middle; }
  @media (max-width: 640px) {
    .source-separator { display: none; }
    .source-meta { display: block; }
  }
  .dungeon-list { display: grid; gap: .35rem; padding-left: 1.25rem; min-width: 0; line-height: 1.5; overflow-wrap: anywhere; }
</style>
