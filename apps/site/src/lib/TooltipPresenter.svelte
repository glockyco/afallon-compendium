<script lang="ts">
  import type { PublicKindEntry, StaticDocument } from '@afallon/contracts/public';
  import AbilityTooltip from './AbilityTooltip.svelte';
  import ClassTooltip from './ClassTooltip.svelte';
  import CraftingStationTooltip from './CraftingStationTooltip.svelte';
  import CurrencyTooltip from './CurrencyTooltip.svelte';
  import FactionTooltip from './FactionTooltip.svelte';
  import EffectTooltip from './EffectTooltip.svelte';
  import GatheringNodeTooltip from './GatheringNodeTooltip.svelte';
  import GearSetTooltip from './GearSetTooltip.svelte';
  import GuideTooltip from './GuideTooltip.svelte';
  import ItemTooltip from './ItemTooltip.svelte';
  import NpcTooltip from './NpcTooltip.svelte';
  import PlaceTooltip from './PlaceTooltip.svelte';
  import PropertyTooltip from './PropertyTooltip.svelte';
  import QuestTooltip from './QuestTooltip.svelte';
  import RaceTooltip from './RaceTooltip.svelte';
  import StatTooltip from './StatTooltip.svelte';
  import SkillTooltip from './SkillTooltip.svelte';
  import { itemSourceLines, summaryText } from './detail/item-sources';

  /** The published document with its kind, which selects the tooltip of that kind. */
  export let page: StaticDocument;
  export let registry: PublicKindEntry[];
  export let rankIndex: number | undefined = undefined;
  /** The variant or version anchor of the reference that opened the tooltip. */
  export let variant: string | undefined = undefined;
  /** The first acquisition route of the item page answer, so the hover card and the page never disagree. */
  $: source = page.kind === 'items' && !page.document.crafting ? itemSourceLines(page.document)[0] : undefined;
  $: crafted = page.kind === 'items' && page.document.crafting ? craftedText(page.document.crafting) : undefined;
  const nameOf = (ref: { key: unknown; label?: string; name?: string }) => (ref.key === null ? ref.label : ref.name) ?? '';
  function craftedText(craft: NonNullable<Extract<StaticDocument, { kind: 'items' }>['document']['crafting']>): string {
    const level = craft.ranks[0]?.requiredLevel;
    const skill = craft.skill ? ` with ${nameOf(craft.skill)}${level !== undefined ? ` Level ${level}` : ''}` : '';
    return `Crafted${skill}: ${craft.materials.map((row) => `${row.count}× ${nameOf(row.counterpart)}`).join(', ')}`;
  }
</script>

{#if page.kind === 'items'}<ItemTooltip document={page.document} {registry} />
  {#if crafted}<p class="context">{crafted}</p>
  {:else if source}<p class="context">{source.label}: {summaryText(source)}</p>{/if}
{:else if page.kind === 'abilities'}<AbilityTooltip document={page.document} {rankIndex} {variant} />
{:else if page.kind === 'quests'}<QuestTooltip document={page.document} />
{:else if page.kind === 'npcs'}<NpcTooltip document={page.document} {variant} />
{:else if page.kind === 'places'}<PlaceTooltip document={page.document} />
{:else if page.kind === 'properties'}<PropertyTooltip document={page.document} />
{:else if page.kind === 'classes'}<ClassTooltip document={page.document} {variant} />
{:else if page.kind === 'skills'}<SkillTooltip document={page.document} />
{:else if page.kind === 'gatheringNodes'}<GatheringNodeTooltip document={page.document} />
{:else if page.kind === 'mechanics'}<GuideTooltip document={page.document} />
{:else if page.kind === 'gearSets'}<GearSetTooltip document={page.document} />
{:else if page.kind === 'currencies'}<CurrencyTooltip document={page.document} />
{:else if page.kind === 'craftingStations'}<CraftingStationTooltip document={page.document} />
{:else if page.kind === 'races'}<RaceTooltip document={page.document} />
{:else if page.kind === 'factions'}<FactionTooltip document={page.document} />
{:else if page.kind === 'stats'}<StatTooltip document={page.document} {registry} />
{:else if page.kind === 'effects'}<EffectTooltip document={page.document} />{/if}

<style>.context { margin: .55rem 0 0; color: var(--c-text-dim); font-size: .875rem; line-height: 1.5; overflow-wrap: anywhere; }</style>
