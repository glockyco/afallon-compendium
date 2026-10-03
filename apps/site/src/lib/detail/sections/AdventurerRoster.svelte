<script lang="ts">
  import type { AdventurerRole, AdventurerRosterRow, PublicKindEntry } from '@afallon/contracts/public';
  import EntityLink from '../../EntityLink.svelte';
  import { formatNumber, joinText, nameOf } from '../../format';
  import type { RelationColumn } from '../relation-table';
  import RelationTable from '../RelationTable.svelte';
  import TabSet from '../TabSet.svelte';

  /** The adventurers of the world roster, one tab for each party role. */
  export let roster: AdventurerRosterRow[];
  export let registry: PublicKindEntry[];

  const ROLES: AdventurerRole[] = ['Tank', 'Healer', 'Damage'];
  const columns: RelationColumn<AdventurerRosterRow>[] = [
    { id: 'adventurer', label: 'Adventurer', value: (row) => nameOf(row.adventurer), sort: (row) => nameOf(row.adventurer) },
    { id: 'class', label: 'Class', value: (row) => nameOf(row.class), sort: (row) => nameOf(row.class) },
    { id: 'race', label: 'Race', value: (row) => row.race && nameOf(row.race), sort: (row) => row.race && nameOf(row.race) },
    { id: 'tree', label: 'Preferred Tree', value: (row) => row.preferredTree && nameOf(row.preferredTree), sort: (row) => row.preferredTree && nameOf(row.preferredTree) },
    { id: 'level', label: 'Starting Level', numeric: true, value: (row) => row.startingLevel, sort: (row) => row.startingLevel },
    { id: 'joins', label: 'Joins', value: (row) => joinText(row.joinAfterHours), sort: (row) => row.joinAfterHours },
  ];
  $: tabs = ROLES.map((role) => ({ role, rows: roster.filter((row) => row.role === role) })).filter((tab) => tab.rows.length > 0)
    .map((tab) => ({ ...tab, key: tab.role.toLowerCase(), label: `${tab.role} (${tab.rows.length})` }));
</script>

<!-- One tab for each party role that the Dungeon Finder fills. -->
<TabSet {tabs} label="Adventurers by Party Role" idPrefix="adventurer-roster" param="role" let:key>
  {#each tabs.filter((tab) => tab.key === key) as tab (tab.key)}
    <RelationTable {columns} rows={tab.rows} label={`${tab.role} adventurers`} sort={{ id: 'adventurer', dir: 'asc' }}>
      <svelte:fragment slot="cell" let:row let:column>
        {#if column === 'adventurer'}<EntityLink ref={row.adventurer} {registry} />
        {:else if column === 'class'}<EntityLink ref={row.class} {registry} />
        {:else if column === 'race'}{#if row.race}<EntityLink ref={row.race} {registry} />{/if}
        {:else if column === 'tree'}{#if row.preferredTree}<EntityLink ref={row.preferredTree} {registry} tooltip={false} />{/if}
        {:else if column === 'level'}{formatNumber(row.startingLevel)}
        {:else}{joinText(row.joinAfterHours)}{/if}
      </svelte:fragment>
    </RelationTable>
  {/each}
</TabSet>
