<script lang="ts">
  import type { AvailabilityRule, ContainerRow, PlacedRule, PublicKindEntry } from '@afallon/contracts/public';
  import Availability from '../../Availability.svelte';
  import EntityLink from '../../EntityLink.svelte';
  import Hint from '../../Hint.svelte';
  import { eventChanceText, formatNumber, OPEN_CHANCE_HINT, rangeText } from '../../format';
  import { itemSourceOnMap } from '../../map-links';
  import { shownRowCount } from '../relation-table';
  import HowItWorks from '../HowItWorks.svelte';
  import Section from '../Section.svelte';

  export let id: string;
  export let title: string;
  export let rows: ContainerRow[];
  export let sourceAvailabilities: AvailabilityRule[][];
  export let itemKey: string;
  export let registry: PublicKindEntry[];
  /** The guide section that explains these rows, and the label of its link. */
  export let guide: PlacedRule | undefined = undefined;
  export let guideLabel = 'How it works';
  let expanded = false;
  $: ordered = [...rows].sort((a, b) => (b.openChance ?? b.chance ?? -1) - (a.openChance ?? a.chance ?? -1));
  $: rowIndices = new Map(rows.map((row, index) => [row, index]));
  $: shown = shownRowCount(rows.length, expanded);
  $: hasOpen = rows.some((row) => id === 'collected-from' ? row.openChance !== undefined : row.chance !== undefined);
  $: hasListed = id === 'collected-from' && rows.some((row) => row.openChance === undefined && row.chance !== undefined);
  $: sharedOpenLevel = rows.length > 0 && rows.every((row) => row.openChance !== undefined && row.openChanceLevel === rows[0]?.openChanceLevel)
    ? rows[0]?.openChanceLevel : undefined;
</script>

{#if rows.length}
  <Section {id} {title} count={rows.length}>
    <div class="source-list">
      {#if hasOpen || hasListed}
        <div class="source-heading">
          {#if hasOpen}<Hint text={OPEN_CHANCE_HINT}>Chance per Open</Hint>{#if sharedOpenLevel !== undefined}<span>At player level {formatNumber(sharedOpenLevel)}</span>{/if}{/if}
          {#if hasListed}<Hint text="The object's loot list gives this item's listed rate. A per-open chance needs the object's action and its full loot list.">Listed Rate</Hint>{/if}
        </div>
      {/if}
      {#each ordered as row, index}
        {#if index < shown}
          <div class="source-row">
            <div class="source-main"><strong>{row.label}</strong><div class="source-sub">
              {#if row.counterpart}<EntityLink ref={row.counterpart} {registry} />{:else if row.places[0]}{row.places[0].label}{/if}
              {#if row.cost}<span>Pay {formatNumber(row.cost.amount)} <EntityLink ref={row.cost.currency} {registry} /></span>{:else if row.choiceLabel}<span>Choose {row.choiceLabel}</span>{/if}
              {#if row.prefabChoices}<span>Opens 1 of {formatNumber(row.prefabChoices)} {row.pickOne ? 'sets' : 'chests'} at random</span>{/if}
              {#if row.pickOne}<span>You pick 1 of {formatNumber(row.pickOne)} items</span>{/if}
              {#if row.actionChance !== undefined}<span>Loot appears on {formatNumber(row.actionChance)}% of searches</span>{/if}
              {#if sourceAvailabilities[row.availabilityIndex]?.length}<Availability rules={sourceAvailabilities[row.availabilityIndex] ?? []} {registry} />{/if}
            </div></div>
            <div class="source-values">
              {#if row.min !== undefined}<span>×{rangeText(row.min, row.max)}</span>{/if}
              {#if row.openChance !== undefined}
                <span>{eventChanceText(row.openChance, 'open')}{#if row.openChanceLevel !== undefined && row.openChanceLevel !== sharedOpenLevel}<small>Player level {formatNumber(row.openChanceLevel)}</small>{/if}</span>
              {:else if row.chance !== undefined}
                {#if id === 'collected-from'}
                  <Hint text={`The object's full per-open chance is unavailable. ${row.oddsUnavailable ?? "The object's complete loot chance is unknown."}`}>{formatNumber(row.chance)}%</Hint>
                {:else}<span>{formatNumber(row.chance)}%</span>{/if}
              {/if}
            </div>
            {#if row.placementCount > 0}<a class="c-link spots" href={itemSourceOnMap(itemKey, id === 'collected-from' ? 'collectedFrom' : 'inContainers', rowIndices.get(row) ?? 0)}>{formatNumber(row.placementCount)} {row.placementCount === 1 ? 'spot' : 'spots'}</a>{/if}
          </div>
        {/if}
      {/each}
      {#if shown < rows.length}<button type="button" class="c-action show-more" on:click={() => (expanded = true)}>Show {rows.length - shown} more</button>{/if}
    </div>
    {#if guide}<HowItWorks guide={guide.guide} section={guide.section} label={guideLabel} />{/if}
  </Section>
{/if}

<style>
  .source-list { border: 1px solid var(--c-line-soft); border-radius: var(--c-radius); background: var(--c-surface-1); overflow: hidden; }
  .source-heading { display: flex; flex-wrap: wrap; gap: .35rem 1rem; padding: .4rem .8rem; border-bottom: 1px solid var(--c-line-soft); color: var(--c-text-dim); font-size: var(--c-text-small); }
  .source-heading + .source-row { border-top: 0; }
  .source-row { display: grid; grid-template-columns: minmax(0, 1fr) auto auto; align-items: center; gap: .5rem 1rem; min-width: 0; padding: .65rem .8rem; border-top: 1px solid var(--c-line-soft); }
  .source-row:first-child { border-top: 0; }
  .source-main { min-width: 0; }
  strong { color: var(--c-text-strong); font-weight: 600; overflow-wrap: anywhere; }
  .source-sub { display: flex; flex-wrap: wrap; gap: .25rem .6rem; margin-top: .2rem; color: var(--c-text-dim); font-size: var(--c-text-small); }
  .source-sub :global(.availability li) { font-size: var(--c-text-small); }
  .source-values { display: flex; flex-wrap: wrap; gap: .25rem .7rem; justify-content: flex-end; font-variant-numeric: tabular-nums; }
  .source-values small { display: block; color: var(--c-text-mute); font-size: var(--c-text-small); }
  .spots { min-height: 1.5rem; white-space: nowrap; font-variant-numeric: tabular-nums; }
  .show-more { margin: .5rem .8rem; }
  @media (max-width: 640px) { .source-row { grid-template-columns: minmax(0, 1fr) auto; } .source-main { grid-column: 1 / -1; } .source-values { grid-column: 1; grid-row: 2; justify-content: flex-start; white-space: normal; } .spots { grid-column: 2; grid-row: 2; } }
</style>
