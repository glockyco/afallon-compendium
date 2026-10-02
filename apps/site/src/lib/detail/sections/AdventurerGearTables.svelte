<script lang="ts">
  import type { AdventurerGear, PublicKindEntry } from '@afallon/contracts/public';
  import EntityLink from '../../EntityLink.svelte';
  import { nameOf } from '../../format';
  import type { RelationColumn } from '../relation-table';
  import RelationTable from '../RelationTable.svelte';
  import TabSet from '../TabSet.svelte';

  /** The reward gear of all adventurers and the gear kits of single adventurers. */
  export let gear: AdventurerGear;
  export let registry: PublicKindEntry[];

  type Row = AdventurerGear['rewards'][number] | AdventurerGear['kits'][number]['items'][number];
  const item: RelationColumn<Row> = { id: 'item', label: 'Item', value: (row) => nameOf(row.item), sort: (row) => nameOf(row.item) };
  const type: RelationColumn<Row> = { id: 'type', label: 'Type', value: (row) => row.type, sort: (row) => row.type };
  const level: RelationColumn<Row> = { id: 'level', label: 'Adventurer level', numeric: true, value: (row) => 'level' in row ? row.level : undefined,
    sort: (row) => 'level' in row ? row.level : undefined };
  $: tabs = [
    ...(gear.rewards.length ? [{ key: 'rewards', label: `Reward gear (${gear.rewards.length})` }] : []),
    ...gear.kits.map((kit, index) => ({ key: `kit-${index + 1}`, label: `${nameOf(kit.adventurer)}'s kit (${kit.items.length})` })),
  ];
</script>

<!-- One tab per list: the shared reward gear first, then each adventurer's kit. -->
<TabSet {tabs} label="Adventurer gear" idPrefix="adventurer-gear" param="gear" let:key>
  {#if key === 'rewards'}
    <RelationTable columns={[item, type, level]} rows={gear.rewards} label="Reward gear" sort={{ id: 'level', dir: 'asc' }}>
      <svelte:fragment slot="cell" let:row let:column>
        {#if column === 'item'}<EntityLink ref={row.item} {registry} />{:else if column === 'type'}{row.type ?? ''}{:else if 'level' in row}{row.level}{/if}
      </svelte:fragment>
    </RelationTable>
  {/if}
  {#each gear.kits.filter((_, index) => key === `kit-${index + 1}`) as kit}
    <p class="owner">The gear kit of <EntityLink ref={kit.adventurer} {registry} />.</p>
    <RelationTable columns={[item, type]} rows={kit.items} label={`Kit of ${nameOf(kit.adventurer)}`}>
      <svelte:fragment slot="cell" let:row let:column>
        {#if column === 'item'}<EntityLink ref={row.item} {registry} />{:else}{row.type ?? ''}{/if}
      </svelte:fragment>
    </RelationTable>
  {/each}
</TabSet>

<style>
  .owner { margin-bottom: .75rem; }
</style>
