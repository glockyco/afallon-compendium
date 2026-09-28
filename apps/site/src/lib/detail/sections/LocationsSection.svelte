<script lang="ts">
  import type { NpcLocation, PublicKindEntry, PublicNpc } from '@afallon/contracts/public';
  import Availability from '../../Availability.svelte';
  import EntityLink from '../../EntityLink.svelte';
  import LocationLinks from '../../LocationLinks.svelte';
  import MissingValue from '../../MissingValue.svelte';
  import NpcLevel from '../../NpcLevel.svelte';
  import VariantLinks from '../../VariantLinks.svelte';
  import { alternativeText, levelText, nameOf, roleLabel } from '../../format';
  import { omitAlways, planColumns, type RelationColumn } from '../relation-table';
  import RelationTable from '../RelationTable.svelte';
  import Section from '../Section.svelte';

  export let document: PublicNpc;
  export let registry: PublicKindEntry[];
  /** The page shows a Variants section, which holds the variant anchors. Otherwise the rows here hold them. */
  export let variantTable: boolean;

  const labels = (location: NpcLocation) => [...new Set(location.placements.map((placement) => placement.label))].join(', ');
  const quests = (location: NpcLocation) => [...new Map(location.quests.map(({ counterpart }) => [counterpart.key ?? counterpart.label, counterpart])).values()];

  const columns: RelationColumn<NpcLocation>[] = [
    { id: 'place', label: 'Place', value: labels, sort: labels },
    { id: 'variant', label: 'Variant', value: (location) => variantTable ? location.variants.join(' ') : undefined },
    // The title block shows the level and the roles that every location shares.
    { id: 'level', label: 'Level', value: (location) => location.level ? levelText(location.level) + (location.level.scales ? '*' : '') : undefined, sort: (location) => location.level?.min, whenShared: omitAlways },
    { id: 'when', label: 'When', hint: 'The NPC stands here only while these conditions hold. A random spot is one of several spots that the game picks from.',
      value: (location) => location.availability.length || location.alternative ? JSON.stringify([location.availability, location.alternative ?? null]) : undefined },
    { id: 'roles', label: 'Role', value: (location) => location.roles.map(roleLabel).join(', ') || undefined, whenShared: omitAlways },
    { id: 'quests', label: 'Quests', value: (location) => quests(location).map(nameOf).join(', ') || undefined },
  ];

  $: locations = document.locations;
  $: plan = planColumns(columns, locations);
  // Without a Variants section, the first row of each variant holds its anchor, so a link to one variant opens where
  // it stands. Variants without a location keep their anchors in the list below the table.
  $: firstRow = new Map(document.variants.map((variant) => [variant.anchor, locations.findIndex((location) => location.variants.includes(variant.anchor))]));
  $: rowAnchors = (location: NpcLocation) => variantTable ? [] : location.variants.filter((anchor) => firstRow.get(anchor) === locations.indexOf(location));
  $: unplaced = document.variants.length > 1 && !variantTable ? document.variants.filter((variant) => firstRow.get(variant.anchor) === -1) : [];
</script>

<Section id="where-to-find" title="Where to find" icon="location" count={locations.length || undefined}>
  {#if locations.length}
    <RelationTable columns={plan.columns} rows={locations} label="Where to find" {rowAnchors}>
      <svelte:fragment slot="cell" let:row let:column>
        {#if column === 'place'}<LocationLinks placements={row.placements} />
        {:else if column === 'variant'}<VariantLinks anchors={row.variants} variants={document.variants} />
        {:else if column === 'level'}<NpcLevel level={row.level} />
        {:else if column === 'when'}
          {#if row.availability.length}<Availability rules={row.availability} {registry} />{/if}
          {#if row.alternative}<span class="alternative">{alternativeText(row.alternative.chance, row.alternative.options)}</span>{/if}
          {#if !row.availability.length && !row.alternative}Always{/if}
        {:else if column === 'roles'}{row.roles.map(roleLabel).join(', ')}
        {:else if column === 'quests'}<span class="quests">{#each quests(row) as quest}<EntityLink ref={quest} {registry} />{/each}</span>{/if}
      </svelte:fragment>
    </RelationTable>
  {:else}
    <p class="c-empty"><MissingValue explanation="No location is published" /> No location is published for this build.</p>
  {/if}
  {#if unplaced.length}
    <p class="unplaced">Without a published location: {#each unplaced as variant, index}{index > 0 ? ', ' : ''}<span class="variant" id={variant.anchor}>{variant.label}</span>{/each}</p>
  {/if}
</Section>

<style>
  .alternative { display: block; }
  .quests { display: grid; gap: .3rem; }
  .unplaced { margin: .75rem 0 0; color: var(--c-text-dim); font-size: var(--c-text-body); }
  .variant { scroll-margin-top: 6rem; }
  .variant:target { color: var(--c-accent-strong); font-weight: 600; }
</style>
