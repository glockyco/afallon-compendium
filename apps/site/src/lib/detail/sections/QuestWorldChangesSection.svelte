<script lang="ts">
  import type { PublicKindEntry, QuestWorldChange } from '@afallon/contracts/public';
  import Availability from '../../Availability.svelte';
  import EntityLink from '../../EntityLink.svelte';
  import { spotOnMap } from '../../map-links';
  import { formatNumber, nameOf } from '../../format';
  import { planColumns, type RelationColumn } from '../relation-table';
  import RelationTable from '../RelationTable.svelte';
  import DetailsDisclosure from '../DetailsDisclosure.svelte';

  export let changes: QuestWorldChange[];
  export let registry: PublicKindEntry[];

  const kinds: Record<QuestWorldChange['sourceKind'], string> = {
    creature: 'NPC', object: 'Object', container: 'Container', resource: 'Resource',
    craftingStation: 'Crafting station', worldZone: 'World quest zone',
  };
  const columns: RelationColumn<QuestWorldChange>[] = [
    { id: 'source', label: 'Source', value: (change) => [change.label, ...change.subjects.map(nameOf)].filter(Boolean).join(', ') || kinds[change.sourceKind] },
    { id: 'kind', label: 'Kind', value: (change) => kinds[change.sourceKind], whenShared: () => changes.length === 1 ? 'omit' : 'keep' },
    { id: 'condition', label: 'Condition', value: (change) => JSON.stringify(change.availability) },
    { id: 'spots', label: 'Map spots', value: (change) => change.placements.length || undefined },
  ];
  $: plan = planColumns(columns, changes);
</script>

<DetailsDisclosure id="world-changes" title="World changes" summary={changes.length === 1 ? `1 ${kinds[changes[0]!.sourceKind].toLowerCase()} change` : `${formatNumber(changes.length)} changes`}>
  <RelationTable columns={plan.columns} rows={changes} label="Quest world changes">
    <svelte:fragment slot="cell" let:row let:column>
      {#if column === 'source'}
        {#if row.label}<div>{row.label}</div>{/if}
        {#each row.subjects as subject}<div class="source"><EntityLink ref={subject} {registry} /></div>{/each}
        {#if !row.label && !row.subjects.length}{kinds[row.sourceKind]}{/if}
      {:else if column === 'kind'}{kinds[row.sourceKind]}
      {:else if column === 'condition'}<Availability rules={row.availability} {registry} />
      {:else if column === 'spots'}
        {#if row.placements.length}
          <a class="c-link" href={spotOnMap(row.placements[0]!.placementId)}>{row.placements.length === 1 ? 'Show on map' : 'Spot 1'}</a>
          {#if row.placements.length > 1}
            <details class="more-spots"><summary>Show {formatNumber(row.placements.length - 1)} more</summary>
              <div class="spot-list">{#each row.placements.slice(1) as spot, index}<a class="c-link" href={spotOnMap(spot.placementId)} aria-label={`Show map spot ${index + 2}`}>{index + 2}</a>{/each}</div>
            </details>
          {/if}
        {/if}
      {/if}
    </svelte:fragment>
  </RelationTable>
</DetailsDisclosure>

<style>
  .more-spots { display: inline-block; margin-left: .5rem; font-size: var(--c-text-small); }
  .more-spots summary { cursor: pointer; color: var(--c-accent); }
  .spot-list { display: flex; flex-wrap: wrap; gap: .35rem; padding-top: .3rem; }
  @media (min-width: 641px) { .source :global(.entity-link) { white-space: nowrap; } }
</style>
