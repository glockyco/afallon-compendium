<script lang="ts">
  import type { CreatureRow, PublicKindEntry } from '@afallon/contracts/public';
  import EntityLink from '../../EntityLink.svelte';
  import MissingValue from '../../MissingValue.svelte';
  import NpcLevel from '../../NpcLevel.svelte';
  import { levelText, nameOf, roleLabel } from '../../format';
  import { entityOnMap } from '../../map-links';
  import { planColumns, type RelationColumn } from '../relation-table';
  import RelationTable from '../RelationTable.svelte';
  import Section from '../Section.svelte';
  import type { SectionIcon } from '../section-icons';

  export let id: string;
  export let title: string;
  export let icon: SectionIcon;
  export let rows: CreatureRow[];
  export let registry: PublicKindEntry[];

  const columns: RelationColumn<CreatureRow>[] = [
    { id: 'name', label: 'Creature', value: (row) => nameOf(row.counterpart), sort: (row) => nameOf(row.counterpart) },
    { id: 'level', label: 'Level', numeric: true, value: (row) => row.level ? levelText(row.level) + (row.level.scales ? '*' : '') : undefined, sort: (row) => row.level?.min },
    { id: 'role', label: 'Role', value: (row) => row.roles.map(roleLabel).join(', ') || undefined },
    { id: 'spots', label: 'Map spots', numeric: true, value: (row) => row.placementCount, sort: (row) => row.placementCount },
  ];

  $: plan = planColumns(columns.filter((column) => id === 'bosses' ? column.id !== 'role' : id === 'npcs' ? column.id !== 'level' : true).map((column) => column.id === 'name' ? { ...column, label: id === 'bosses' ? 'Boss' : id === 'npcs' ? 'NPC' : 'Creature' } : column), rows);
</script>

{#if rows.length}
  <Section {id} {title} {icon} count={rows.length}>
    <RelationTable columns={plan.columns} {rows} label={title} sort={{ id: 'name', dir: 'asc' }}>
      <svelte:fragment slot="cell" let:row let:column>
        {#if column === 'name'}<EntityLink ref={row.counterpart} {registry} />
        {:else if column === 'level'}<NpcLevel level={row.level} />
        {:else if column === 'role'}{row.roles.map(roleLabel).join(', ')}
        {:else if column === 'spots'}
          {#if row.placementCount && row.counterpart.key}<a class="c-link" href={entityOnMap(row.counterpart.key)}>{row.placementCount}</a>
          {:else if row.placementCount}{row.placementCount}
          {:else}<MissingValue explanation="No spot is published" />{/if}
        {/if}
      </svelte:fragment>
    </RelationTable>
  </Section>
{/if}
