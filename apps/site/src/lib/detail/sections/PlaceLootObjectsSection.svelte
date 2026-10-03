<script lang="ts">
  import type { PlaceLootObject, PublicKindEntry } from '@afallon/contracts/public';
  import Availability from '../../Availability.svelte';
  import EntityLink from '../../EntityLink.svelte';
  import LinkGrid from '../LinkGrid.svelte';
  import { formatNumber } from '../../format';
  import { spotOnMap } from '../../map-links';
  import Section from '../Section.svelte';
  import StaticMore from '../StaticMore.svelte';

  /** The objects of a place that give items, with what using them takes and the items they can give. */
  export let rows: PlaceLootObject[];
  export let registry: PublicKindEntry[];

  // Objects with one name form one group, such as the locked chests of each level range. A variant shows a short item
  // list at once and a long one on request, because the item pages list the chances.
  const SHORT_LIST = 10;
  $: groups = [...rows.reduce((map, row) => map.set(row.label, [...(map.get(row.label) ?? []), row]), new Map<string, PlaceLootObject[]>())]
    .map(([label, variants]) => ({ label, variants: [...variants].sort(byConditions), spots: new Set(variants.flatMap((row) => row.placements.map((placement) => placement.placementId))).size }));
  // Variants can share spots, such as the level ranges of one chest, so the object counts each spot once.
  // Variants of one object run from the lowest required level up, and then by the text of their conditions.
  const requirements = (row: PlaceLootObject) => row.availability.flatMap((rule) => rule.requirements.flatMap((group) => group.requirements));
  const lowestLevel = (row: PlaceLootObject) => Math.min(...requirements(row).filter((requirement) => requirement.type.name === 'Level')
    .map((requirement) => Number(/\d+/.exec(requirement.label)?.[0] ?? Number.POSITIVE_INFINITY)));
  const conditionText = (row: PlaceLootObject) => requirements(row).map((requirement) => requirement.label).join(' ');
  function byConditions(left: PlaceLootObject, right: PlaceLootObject): number {
    const [a, b] = [lowestLevel(left), lowestLevel(right)];
    return (a === b ? 0 : a < b ? -1 : 1) || conditionText(left).localeCompare(conditionText(right));
  }
  let open = new Set<PlaceLootObject>();
  const toggle = (row: PlaceLootObject) => { open = open.has(row) ? new Set([...open].filter((entry) => entry !== row)) : new Set([...open, row]); };
  const spots = (count: number) => `${formatNumber(count)} ${count === 1 ? 'spot' : 'spots'}`;
</script>

{#if groups.length}
  <Section id="loot-objects" title="Objects with Loot" count={groups.length}>
    <div class="objects">
      {#each groups as group (group.label)}
        <article class="object">
          <header><h3>{group.label}</h3>{#if group.spots}<span class="spots">{spots(group.spots)}</span>{/if}</header>
          {#each group.variants as row}
            <div class="variant">
              <div class="variant-head">
                <div class="conditions">
                  {#if row.choiceLabel}<span class="choice">{row.choiceLabel}</span>{/if}
                  {#if row.cost}<span>Pay {formatNumber(row.cost.amount)} <EntityLink ref={row.cost.currency} {registry} /></span>{/if}
                  {#if row.availability.length}<Availability rules={row.availability} {registry} />{/if}
                  {#if !row.choiceLabel && !row.cost && !row.availability.length}<span>No requirements</span>{/if}
                </div>
                <div class="meta">
                  {#if group.variants.length > 1 && row.placements.length}{#if row.placements.length === 1}<a class="c-link" href={spotOnMap(row.placements[0]!.placementId)}>1 spot</a>{:else}<span>{spots(row.placements.length)}</span>{/if}{:else if row.placements.length === 1}<a class="c-link" href={spotOnMap(row.placements[0]!.placementId)}>Show on Map</a>{/if}
                  {#if row.items.length > SHORT_LIST}
                    <StaticMore count={row.items.length}>
                      <button slot="control" type="button" class="c-action" aria-expanded={open.has(row)} on:click={() => toggle(row)}>{open.has(row) ? 'Hide Items' : `Show ${formatNumber(row.items.length)} Items`}</button>
                      <LinkGrid refs={row.items} {registry} expanded />
                    </StaticMore>
                  {/if}
                </div>
              </div>
              {#if row.items.length <= SHORT_LIST || open.has(row)}
                <LinkGrid refs={row.items} {registry} expanded />
              {/if}
            </div>
          {/each}
        </article>
      {/each}
    </div>
  </Section>
{/if}

<style>
  .objects { display: grid; gap: .75rem; }
  .object { min-width: 0; border: 1px solid var(--c-line-soft); border-radius: var(--c-radius); background: var(--c-surface-1); overflow: hidden; }
  header { display: flex; justify-content: space-between; align-items: baseline; gap: .75rem; padding: .65rem .85rem; border-bottom: 1px solid var(--c-line-soft); }
  h3 { margin: 0; color: var(--c-text-strong); font: 600 var(--c-text-lead)/1.3 var(--c-serif); overflow-wrap: anywhere; }
  .spots, .meta span { color: var(--c-text-dim); font-size: var(--c-text-small); white-space: nowrap; font-variant-numeric: tabular-nums; }
  .variant { display: grid; gap: .55rem; padding: .6rem .85rem; }
  .variant + .variant { border-top: 1px solid var(--c-line-soft); }
  .variant-head { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: .4rem 1rem; }
  .conditions { display: flex; flex-wrap: wrap; gap: .25rem .6rem; min-width: 0; color: var(--c-text-dim); font-size: var(--c-text-small); }
  .conditions :global(.availability li) { font-size: var(--c-text-small); }
  .choice { color: var(--c-text-strong); font-weight: 600; }
  .meta { display: flex; align-items: center; gap: .75rem; font-size: var(--c-text-small); }
  .meta:has(:global(details.static-more[open])) { flex: 1 0 100%; flex-wrap: wrap; }
  .meta :global(details.static-more[open]) { flex-basis: 100%; }
</style>
