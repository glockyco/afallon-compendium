<script lang="ts">
  import type { NpcLocation, PublicKindEntry, PublicNpc } from '@afallon/contracts/public';
  import Availability from './Availability.svelte';
  import Card from './Card.svelte';
  import DataTable, { type TableColumn } from './DataTable.svelte';
  import EntityLink from './EntityLink.svelte';
  import LocationLinks from './LocationLinks.svelte';
  import MissingValue from './MissingValue.svelte';
  import NpcLevel from './NpcLevel.svelte';
  import VariantLinks from './VariantLinks.svelte';
  import { alternativeText, roleLabel } from './format';

  export let document: PublicNpc;
  export let registry: PublicKindEntry[];
  /** The page shows a variants table, which holds the variant anchors. Otherwise this table holds them. */
  export let variantTable: boolean;

  const same = (values: readonly unknown[]) => new Set(values.map((value) => JSON.stringify(value))).size <= 1;

  $: locations = document.locations;
  $: grouped = document.variants.length > 1;
  $: variantsByAnchor = new Map(document.variants.map((variant) => [variant.anchor, variant]));
  $: showLevel = !same(locations.map((location) => location.level ?? null));
  $: showWhen = locations.some((location) => location.availability.length > 0 || location.alternative);
  $: showRoles = !same(locations.map((location) => location.roles));
  $: showQuests = locations.some((location) => location.quests.length > 0);
  $: columns = [
    { id: 'place', label: 'Place' },
    ...(grouped ? [{ id: 'variant', label: 'Variant' }] : []),
    ...(showLevel ? [{ id: 'level', label: 'Level' }] : []),
    ...(showWhen ? [{ id: 'when', label: 'When' }] : []),
    ...(showRoles ? [{ id: 'roles', label: 'Role' }] : []),
    ...(showQuests ? [{ id: 'quests', label: 'Quests' }] : []),
  ] satisfies TableColumn[];
  // Without a variants table, the first label of each variant in this table carries its anchor, so a reference to one
  // variant opens where and when it appears. Variants without a location are listed below the table.
  $: anchorRows = new Map(document.variants.map((variant) => [variant.anchor, locations.findIndex((location) => location.variants.includes(variant.anchor))]));
  $: unplaced = grouped && !variantTable ? document.variants.filter((variant) => anchorRows.get(variant.anchor) === -1) : [];

  function alternative(location: NpcLocation): string | null {
    return location.alternative ? alternativeText(location.alternative.chance, location.alternative.options) : null;
  }

  function quests(location: NpcLocation) {
    return [...new Map(location.quests.map(({ counterpart }) => [counterpart.key === null ? counterpart.label : counterpart.key, counterpart])).values()];
  }
</script>

<Card title="Where to find" count={locations.length > 0 ? locations.length : undefined}>
  {#if locations.length > 0}
    <DataTable {columns}>
      {#each locations as location, index}
        <tr>
          <td><LocationLinks placements={location.placements} /></td>
          {#if grouped}
            <td>
              {#if variantTable}<VariantLinks anchors={location.variants} variants={document.variants} />
              {:else}
                <span class="variants">{#each location.variants as anchor}<span class="variant" id={anchorRows.get(anchor) === index ? anchor : undefined} title={variantsByAnchor.get(anchor)?.key}>{variantsByAnchor.get(anchor)?.label ?? anchor}</span>{/each}</span>
              {/if}
            </td>
          {/if}
          {#if showLevel}<td><NpcLevel level={location.level} /></td>{/if}
          {#if showWhen}
            <td>
              {#if location.availability.length}<Availability rules={location.availability} {registry} />{/if}
              {#if alternative(location)}<p class="alternative">{alternative(location)}</p>{/if}
              {#if !location.availability.length && !location.alternative}Always{/if}
            </td>
          {/if}
          {#if showRoles}<td>{location.roles.map(roleLabel).join(', ')}</td>{/if}
          {#if showQuests}<td><ul class="quests">{#each quests(location) as quest}<li><EntityLink ref={quest} {registry} /></li>{/each}</ul></td>{/if}
        </tr>
      {/each}
    </DataTable>
  {:else}
    <p class="c-empty"><MissingValue explanation="No location is published" /> No location is published for this build.</p>
  {/if}
  {#if unplaced.length}
    <p class="unplaced">Without a published location: <span class="variants">{#each unplaced as variant}<span class="variant" id={variant.anchor} title={variant.key}>{variant.label}</span>{/each}</span></p>
  {/if}
</Card>

<style>
  .alternative { margin: 0; font-size: .85rem; }
  .quests { display: grid; gap: .3rem; margin: 0; padding: 0; list-style: none; }
  .variants { display: inline-flex; flex-wrap: wrap; gap: .2rem .6rem; }
  .variant { scroll-margin-top: 5rem; }
  .variant:target { color: var(--c-accent-strong); font-weight: 600; }
  tr:has(.variant:target) td { background: color-mix(in srgb, var(--c-accent) 12%, transparent); }
  .unplaced { margin: .75rem 0 0; color: var(--c-text-dim); font-size: .85rem; }
</style>
