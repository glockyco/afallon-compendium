<script lang="ts">
  import type { DropRow, PublicKindEntry } from '@afallon/contracts/public';
  import EntityLink from '../../EntityLink.svelte';
  import MissingValue from '../../MissingValue.svelte';
  import Requirements from '../../Requirements.svelte';
  import { creatureLevelText, dropsPerKillText, formatNumber, itemDropText, nameOf, rangeText } from '../../format';
  import { omitWhenShared, planColumns, stateInHeading, type RelationColumn } from '../relation-table';
  import RelationTable from '../RelationTable.svelte';
  import Section from '../Section.svelte';

  /** The sources of an item page that drop it: creatures, and world loot of creatures by level. */
  export let rows: DropRow[];
  export let registry: PublicKindEntry[];

  const columns: RelationColumn<DropRow>[] = [
    { id: 'name', label: 'Creature', value: (row) => nameOf(row.counterpart), sort: (row) => nameOf(row.counterpart) },
    { id: 'level', label: 'Level', hint: 'The levels of the creatures that can drop the item.', numeric: true,
      value: (row) => row.creatureLevel ? creatureLevelText(row.creatureLevel) : undefined, sort: (row) => row.creatureLevel?.min },
    { id: 'quantity', label: 'Quantity', hint: 'How many of the item one drop gives.', numeric: true,
      value: (row) => rangeText(row.min, row.max) ?? undefined, sort: (row) => row.max ?? row.min, whenShared: omitWhenShared('1') },
    { id: 'chance', label: 'Chance', hint: 'The chance of the item to drop from its loot list.', numeric: true,
      value: (row) => row.chance, sort: (row) => row.chance },
    { id: 'perKill', label: 'Drops per kill',
      hint: 'How often a kill can drop items from the loot list that holds this item, and how many items one kill drops from that list. When a kill drops a set number of items, items with a higher chance drop more often.',
      value: dropsPerKillText, whenShared: stateInHeading },
    { id: 'requirements', label: 'Requirement', value: (row) => row.requirements.length ? JSON.stringify(row.requirements) : undefined },
  ];

  $: plan = planColumns(columns, rows);
  $: line = plan.shared.some((shared) => shared.column.id === 'perKill') && rows[0] ? itemDropText(rows[0]) : undefined;
</script>

{#if rows.length}
  <Section id="dropped-by" title="Dropped by" count={rows.length} {line}>
    <RelationTable columns={plan.columns} {rows} label="Dropped by" sort={{ id: 'chance', dir: 'desc' }}>
      <svelte:fragment slot="cell" let:row let:column>
        {#if column === 'name'}<EntityLink ref={row.counterpart} {registry} />
        {:else if column === 'level'}{#if row.creatureLevel}{creatureLevelText(row.creatureLevel)}{/if}
        {:else if column === 'quantity'}{rangeText(row.min, row.max) ?? ''}
        {:else if column === 'chance'}{#if row.chance === undefined}<MissingValue explanation="Drop chance unknown" />{:else}{formatNumber(row.chance)}%{/if}
        {:else if column === 'perKill'}{dropsPerKillText(row)}
        {:else if column === 'requirements'}<Requirements requirements={row.requirements} {registry} />{/if}
      </svelte:fragment>
    </RelationTable>
  </Section>
{/if}
