<script lang="ts">
  import { base } from '$app/paths';
  import type { EntityRef, FactionStanding, PublicKindEntry } from '@afallon/contracts/public';
  import EntityLink from '../../EntityLink.svelte';
  import { alignmentLabel, formatNumber } from '../../format';
  import { planColumns, type RelationColumn } from '../relation-table';
  import RelationTable from '../RelationTable.svelte';

  type Row = { faction: EntityRef; standing: FactionStanding; members: number };
  /** A new character's standing with each faction, with the number of NPCs of each faction. */
  export let rows: Row[];
  export let registry: PublicKindEntry[];

  const npcRoute = registry.find((entry) => entry.kind === 'npcs')?.route;
  const columns: RelationColumn<Row>[] = [
    { id: 'faction', label: 'Faction', value: (row) => row.faction.name, sort: (row) => row.faction.name },
    { id: 'stance', label: 'Stance', value: (row) => row.standing.stance, sort: (row) => row.standing.stance },
    { id: 'alignment', label: 'Alignment', value: (row) => alignmentLabel(row.standing.alignment) },
    { id: 'points', label: 'Points', numeric: true, value: (row) => row.standing.points, sort: (row) => row.standing.points },
    { id: 'members', label: 'NPCs', numeric: true, value: (row) => row.members, sort: (row) => row.members },
  ];
  $: plan = planColumns(columns, rows);
</script>

<RelationTable columns={plan.columns} {rows} label="Standing of a new character">
  <svelte:fragment slot="cell" let:row let:column>
    {#if column === 'faction'}<EntityLink ref={row.faction} {registry} />
    {:else if column === 'stance'}{row.standing.stance}
    {:else if column === 'alignment'}{alignmentLabel(row.standing.alignment)}
    {:else if column === 'points'}{formatNumber(row.standing.points)}
    {:else if column === 'members'}{#if npcRoute && row.members}<a class="c-link" href={`${base}/${npcRoute}/?faction=${encodeURIComponent(row.faction.name)}`}>{formatNumber(row.members)}</a>{:else}{formatNumber(row.members)}{/if}{/if}
  </svelte:fragment>
</RelationTable>
