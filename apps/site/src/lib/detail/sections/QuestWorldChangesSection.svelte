<script lang="ts">
  import type { PublicKindEntry, QuestWorldChange } from '@afallon/contracts/public';
  import Availability from '../../Availability.svelte';
  import EntityLink from '../../EntityLink.svelte';
  import LocationLinks from '../../LocationLinks.svelte';
  import { formatNumber, nameOf } from '../../format';
  import { planColumns, type RelationColumn } from '../relation-table';
  import RelationTable from '../RelationTable.svelte';
  import DetailsDisclosure from '../DetailsDisclosure.svelte';

  export let changes: QuestWorldChange[];
  export let registry: PublicKindEntry[];

  const kinds: Record<QuestWorldChange['sourceKind'], string> = {
    creature: 'Creature', object: 'Object', container: 'Container', resource: 'Resource',
    craftingStation: 'Crafting station', worldZone: 'World quest zone',
  };
  const columns: RelationColumn<QuestWorldChange>[] = [
    { id: 'source', label: 'Source', value: (change) => [change.label, ...change.subjects.map(nameOf)].filter(Boolean).join(', ') || kinds[change.sourceKind] },
    { id: 'kind', label: 'Kind', value: (change) => kinds[change.sourceKind] },
    { id: 'condition', label: 'Condition', value: (change) => JSON.stringify(change.availability) },
    { id: 'spots', label: 'Map spots', value: (change) => change.placements.map((spot) => spot.label).join(', ') || undefined },
  ];
  $: plan = planColumns(columns, changes);
</script>

<DetailsDisclosure id="world-changes" title="World changes" summary={`${formatNumber(changes.length)} ${changes.length === 1 ? 'change' : 'changes'}`}>
  <RelationTable columns={plan.columns} rows={changes} label="Quest world changes">
    <svelte:fragment slot="cell" let:row let:column>
      {#if column === 'source'}
        {#if row.label}<div>{row.label}</div>{/if}
        {#each row.subjects as subject}<div><EntityLink ref={subject} {registry} /></div>{/each}
        {#if !row.label && !row.subjects.length}{kinds[row.sourceKind]}{/if}
      {:else if column === 'kind'}{kinds[row.sourceKind]}
      {:else if column === 'condition'}<Availability rules={row.availability} {registry} />
      {:else if column === 'spots'}<LocationLinks placements={row.placements} />{/if}
    </svelte:fragment>
  </RelationTable>
</DetailsDisclosure>
