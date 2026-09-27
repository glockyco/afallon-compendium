<script lang="ts">
  import { base } from '$app/paths';
  import type { PublicItem, PublicKindEntry } from '@afallon/contracts/public';
  import Card from './Card.svelte';
  import ContainerTable from './ContainerTable.svelte';
  import DropTable from './DropTable.svelte';
  import EntityHeader from './EntityHeader.svelte';
  import EntityLink from './EntityLink.svelte';
  import GatherTable from './GatherTable.svelte';
  import ItemTooltip from './ItemTooltip.svelte';
  import MissingValue from './MissingValue.svelte';
  import Price from './Price.svelte';
  import QuestTable from './QuestTable.svelte';
  import RecipeTable from './RecipeTable.svelte';
  import VendorTable from './VendorTable.svelte';
  import { creatureLevelText, formatNumber, rarityTone } from './format';

  export let document: PublicItem;
  export let registry: PublicKindEntry[];
  export let showRelations = false;
  export let limit: number | undefined = undefined;

  const plural = (count: number, one: string, many: string) => `${formatNumber(count)} ${count === 1 ? one : many}`;

  $: facts = document.facts;
  $: questRows = [...document.rewardedBy, ...document.givenBy];
  $: worldDrops = document.droppedBy.flatMap((row) => row.creatureLevel ? [row.creatureLevel] : []);
  $: worldLevels = [...new Set(worldDrops.map(creatureLevelText))];
  // How to get the item, in the order of the sections below. Each entry links its section.
  $: sources = [
    { id: 'dropped-by', count: document.droppedBy.length - worldDrops.length, text: (n: number) => `Dropped by ${plural(n, 'creature', 'creatures')}` },
    { id: 'dropped-by', count: worldDrops.length, text: () => worldLevels.includes('Any') ? 'World drop from any creature' : `World drop from creatures of level ${worldLevels.join(' or ')}` },
    { id: 'sold-by', count: document.soldBy.length, text: (n: number) => `Sold by ${plural(n, 'vendor', 'vendors')}` },
    { id: 'gathered-from', count: document.gatheredFrom.length, text: (n: number) => `Gathered from ${plural(n, 'resource', 'resources')}` },
    { id: 'in-containers', count: document.inContainers.length, text: (n: number) => `Found in ${plural(n, 'container', 'containers')}` },
    { id: 'collected-from', count: document.collectedFrom.length, text: (n: number) => `Collected from ${plural(n, 'object', 'objects')}` },
    { id: 'from-quests', count: questRows.length, text: (n: number) => `Given by ${plural(n, 'quest', 'quests')}` },
    { id: 'crafted-by', count: document.craftedBy.length, text: (n: number) => `Crafted from ${plural(n, 'recipe', 'recipes')}` },
  ].filter((source) => source.count > 0);
  $: uses = [
    { id: 'used-in-recipes', count: document.usedInRecipes.length, text: (n: number) => `Material in ${plural(n, 'recipe', 'recipes')}` },
    { id: 'quest-objectives', count: document.usedInQuests.length, text: (n: number) => `Needed by ${plural(n, 'quest', 'quests')}` },
  ].filter((use) => use.count > 0);
  // Map placements come from gathering, containers, and objects. Creatures and vendors have their own pages.
  $: onMap = document.gatheredFrom.length > 0 || document.inContainers.length > 0 || document.collectedFrom.length > 0;
</script>

<article class="document" data-rarity={rarityTone(facts.rarity)}>
  <EntityHeader name={document.ref.name} rarity={rarityTone(facts.rarity)} description={document.description} />

  <div class="overview" class:full={showRelations}>
    <div class="aside">
      <section class="tooltip-card" aria-label="In-game tooltip">
        <ItemTooltip {document} {registry}>
          <svelte:fragment slot="ref" let:ref let:rankIndex><EntityLink {ref} {rankIndex} {registry} /></svelte:fragment>
        </ItemTooltip>
      </section>
      {#if facts.stackLimit > 1 || facts.buyPrice || onMap}
        <dl class="extra">
          {#if facts.stackLimit > 1}<dt>Stack size</dt><dd>{formatNumber(facts.stackLimit)}</dd>{/if}
          {#if facts.buyPrice}<dt>Buy price</dt><dd><Price price={facts.buyPrice} showName /></dd>{/if}
          {#if onMap}<dt>Map</dt><dd><a class="c-link" href={`${base}/?item=${encodeURIComponent(document.ref.key)}`}>Show every place</a></dd>{/if}
        </dl>
      {/if}
    </div>

    {#if showRelations}
      <!-- The source sections themselves sit beside the tooltip, so the page has no separate summary to repeat them. -->
      <div class="c-stack sources">
        {#if !sources.length}<Card title="How to get it"><p class="c-empty"><MissingValue explanation="No source is published" /> No way to get this item is known for this build.</p></Card>{/if}
        <div id="dropped-by"><DropTable rows={document.droppedBy} {registry} heading="Dropped by" counterpartLabel="Creature" {limit} /></div>
        <div id="sold-by"><VendorTable rows={document.soldBy} {registry} heading="Sold by" counterpartLabel="Vendor" {limit} /></div>
        <div id="gathered-from"><GatherTable rows={document.gatheredFrom} {registry} itemKey={document.ref.key} {limit} /></div>
        <div id="in-containers"><ContainerTable rows={document.inContainers} {registry} itemKey={document.ref.key} {limit} /></div>
        <div id="collected-from"><ContainerTable rows={document.collectedFrom} {registry} heading="Collected from" counterpartLabel="Object" itemKey={document.ref.key} {limit} /></div>
        <div id="from-quests"><QuestTable rows={questRows} {registry} heading="Given by quests" counterpartLabel="Quest" {limit} /></div>
        <div id="crafted-by"><RecipeTable rows={document.craftedBy} {registry} heading="Crafted from" counterpartLabel="Recipe" {limit} /></div>
        <div id="used-in-recipes"><RecipeTable rows={document.usedInRecipes} {registry} heading="Material in recipes" counterpartLabel="Recipe" {limit} /></div>
        <div id="quest-objectives"><QuestTable rows={document.usedInQuests} {registry} heading="Needed by quests" counterpartLabel="Quest" {limit} /></div>
      </div>
    {:else}
      <Card title="How to get it">
        {#if sources.length}
          <ul class="summary">{#each sources as source}<li>{source.text(source.count)}</li>{/each}</ul>
        {:else}
          <p class="c-empty"><MissingValue explanation="No source is published" /> No way to get this item is known for this build.</p>
        {/if}
        {#if uses.length}
          <h3>Used for</h3>
          <ul class="summary">{#each uses as use}<li>{use.text(use.count)}</li>{/each}</ul>
        {/if}
      </Card>
    {/if}
  </div>
</article>

<style>
  .overview { display: grid; grid-template-columns: minmax(0, 24rem) minmax(0, 1fr); gap: 1rem; align-items: start; margin-bottom: 1rem; }
  .aside { display: grid; gap: .75rem; }
  .overview.full .aside { position: sticky; top: 5rem; }
  .tooltip-card { padding: .85rem; border: 1px solid #74684e; border-radius: var(--c-radius); background: var(--c-surface-1); box-shadow: 0 6px 20px #0006; }
  .summary { display: grid; gap: .4rem; margin: 0; padding: 0; list-style: none; font-size: .88rem; }
  h3 { margin: 1rem 0 .45rem; color: var(--c-text-dim); font-size: .72rem; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; }
  .extra { display: grid; grid-template-columns: auto 1fr; gap: .3rem 1rem; margin: 0; padding: .7rem .85rem; border: 1px solid var(--c-line); border-radius: var(--c-radius); background: var(--c-surface-1); font-size: .86rem; }
  dt { color: var(--c-text-dim); }
  dd { margin: 0; justify-self: end; }
  [id] { scroll-margin-top: 5rem; }
  .sources > div:empty { display: none; }
  @media (max-width: 760px) { .overview { grid-template-columns: 1fr; } .overview.full .aside { position: static; } }
</style>
