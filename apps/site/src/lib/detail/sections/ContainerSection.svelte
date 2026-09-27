<script lang="ts">
  import type { ContainerRow, PublicKindEntry } from '@afallon/contracts/public';
  import Availability from '../../Availability.svelte';
  import EntityLink from '../../EntityLink.svelte';
  import MissingValue from '../../MissingValue.svelte';
  import { formatNumber, nameOf, rangeText } from '../../format';
  import { itemOnMap } from '../../map-links';
  import { omitWhenShared, planColumns, type RelationColumn } from '../relation-table';
  import RelationTable from '../RelationTable.svelte';
  import Section from '../Section.svelte';

  export let id: string;
  export let title: string;
  /** The heading of the first column: "Container" or "Object". */
  export let counterpartLabel: string;
  /** "container" for containers and "object" for objects that give the item. */
  export let icon: 'container' | 'object';
  /** The source in the words of a reader, such as "container" or "object". */
  export let noun: string;
  export let rows: ContainerRow[];
  /** The item of the page. A spot count opens the map with every spot of the item. */
  export let itemKey: string;
  export let registry: PublicKindEntry[];

  const columns: RelationColumn<ContainerRow>[] = [
    { id: 'name', label: counterpartLabel, value: (row) => row.label, sort: (row) => row.label },
    { id: 'place', label: 'Place', value: (row) => row.counterpart ? nameOf(row.counterpart) : undefined, sort: (row) => row.counterpart ? nameOf(row.counterpart) : undefined },
    { id: 'quantity', label: 'Quantity', hint: `How many of the item one ${noun} gives.`, numeric: true,
      value: (row) => rangeText(row.min, row.max) ?? undefined, sort: (row) => row.max ?? row.min, whenShared: omitWhenShared('1') },
    { id: 'chance', label: 'Chance', hint: `The chance that one ${noun} gives the item.`, numeric: true, value: (row) => row.chance, sort: (row) => row.chance },
    { id: 'conditions', label: 'Condition', hint: `The ${noun} gives the item only while these conditions hold.`,
      value: (row) => row.availability.length ? JSON.stringify(row.availability) : undefined },
    { id: 'spots', label: 'Map spots', numeric: true, value: (row) => row.placementCount, sort: (row) => row.placementCount, whenShared: omitWhenShared(1) },
  ];

  $: plan = planColumns(columns, rows);
</script>

{#if rows.length}
  <Section {id} {title} {icon} count={rows.length}>
    <RelationTable columns={plan.columns} {rows} label={title} sort={{ id: 'chance', dir: 'desc' }}>
      <svelte:fragment slot="cell" let:row let:column>
        {#if column === 'name'}{row.label}
        {:else if column === 'place'}{#if row.counterpart}<EntityLink ref={row.counterpart} {registry} />{/if}
        {:else if column === 'quantity'}{rangeText(row.min, row.max) ?? ''}
        {:else if column === 'chance'}{#if row.chance === undefined}<MissingValue explanation="No chance is published for this build" />{:else}{formatNumber(row.chance)}%{/if}
        {:else if column === 'conditions'}<Availability rules={row.availability} {registry} />
        {:else if column === 'spots'}{#if row.placementCount > 0}<a class="c-link" href={itemOnMap(itemKey)}>{row.placementCount}</a>{:else}<MissingValue explanation="No spot is published" />{/if}{/if}
      </svelte:fragment>
    </RelationTable>
  </Section>
{/if}
