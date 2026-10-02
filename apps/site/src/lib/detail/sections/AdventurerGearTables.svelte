<script lang="ts">
  import type { AdventurerGear, PublicKindEntry } from '@afallon/contracts/public';
  import EntityLink from '../../EntityLink.svelte';
  import { nameOf } from '../../format';
  import type { RelationColumn } from '../relation-table';
  import RelationTable from '../RelationTable.svelte';

  /** The reward gear of all adventurers and the gear kits of single adventurers. */
  export let gear: AdventurerGear;
  export let registry: PublicKindEntry[];

  type Row = AdventurerGear['rewards'][number] | AdventurerGear['kits'][number]['items'][number];
  const item: RelationColumn<Row> = { id: 'item', label: 'Item', value: (row) => nameOf(row.item), sort: (row) => nameOf(row.item) };
  const type: RelationColumn<Row> = { id: 'type', label: 'Type', value: (row) => row.type, sort: (row) => row.type };
  const level: RelationColumn<Row> = { id: 'level', label: 'Adventurer level', numeric: true, value: (row) => 'level' in row ? row.level : undefined,
    sort: (row) => 'level' in row ? row.level : undefined };
</script>

{#if gear.rewards.length}
  <h3>Reward gear <span>{gear.rewards.length}</span></h3>
  <RelationTable columns={[item, type, level]} rows={gear.rewards} label="Reward gear" sort={{ id: 'level', dir: 'asc' }}>
    <svelte:fragment slot="cell" let:row let:column>
      {#if column === 'item'}<EntityLink ref={row.item} {registry} />{:else if column === 'type'}{row.type ?? ''}{:else if 'level' in row}{row.level}{/if}
    </svelte:fragment>
  </RelationTable>
{/if}
{#each gear.kits as kit (kit.adventurer.key)}
  <h3>Kit of <EntityLink ref={kit.adventurer} {registry} /> <span>{kit.items.length}</span></h3>
  <RelationTable columns={[item, type]} rows={kit.items} label={`Kit of ${nameOf(kit.adventurer)}`}>
    <svelte:fragment slot="cell" let:row let:column>
      {#if column === 'item'}<EntityLink ref={row.item} {registry} />{:else}{row.type ?? ''}{/if}
    </svelte:fragment>
  </RelationTable>
{/each}

<style>
  h3 { margin: 1.25rem 0 .5rem; color: var(--c-text-strong); font-size: 1rem; font-weight: 700; }
  h3 span { margin-left: .25rem; color: var(--c-text-mute); font-size: .875rem; font-weight: 500; }
</style>
