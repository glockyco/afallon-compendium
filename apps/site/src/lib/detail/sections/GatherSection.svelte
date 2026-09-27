<script lang="ts">
  import type { GatherRow, PublicKindEntry } from '@afallon/contracts/public';
  import EntityLink from '../../EntityLink.svelte';
  import MissingValue from '../../MissingValue.svelte';
  import { formatNumber, nameOf, rangeText } from '../../format';
  import { itemOnMap } from '../../map-links';
  import { omitWhenShared, planColumns, type RelationColumn } from '../relation-table';
  import RelationTable from '../RelationTable.svelte';
  import Section from '../Section.svelte';

  export let rows: GatherRow[];
  /** The item of the page. A spot count opens the map with every spot of the item. */
  export let itemKey: string;
  export let registry: PublicKindEntry[];

  const resourceName = (row: GatherRow) => row.counterpart ? nameOf(row.counterpart) : row.label;
  const columns: RelationColumn<GatherRow>[] = [
    { id: 'name', label: 'Resource', value: resourceName, sort: resourceName },
    { id: 'skill', label: 'Skill', value: (row) => row.skill ? nameOf(row.skill) : undefined, sort: (row) => row.skill ? nameOf(row.skill) : undefined },
    { id: 'rank', label: 'Rank', hint: 'The skill rank that gathering the resource needs.', numeric: true, value: (row) => row.rank, sort: (row) => row.rank },
    { id: 'quantity', label: 'Quantity', hint: 'How many of the item one gathering gives.', numeric: true,
      value: (row) => rangeText(row.min, row.max) ?? undefined, sort: (row) => row.max ?? row.min, whenShared: omitWhenShared('1') },
    { id: 'chance', label: 'Chance', hint: 'The chance that one gathering gives the item.', numeric: true, value: (row) => row.chance, sort: (row) => row.chance },
    { id: 'spots', label: 'Map spots', numeric: true, value: (row) => row.placementCount, sort: (row) => row.placementCount, whenShared: omitWhenShared(1) },
  ];

  $: plan = planColumns(columns, rows);
</script>

{#if rows.length}
  <Section id="gathered-from" title="Gathered from" icon="gather" count={rows.length}>
    <RelationTable columns={plan.columns} {rows} label="Gathered from" sort={{ id: 'chance', dir: 'desc' }}>
      <svelte:fragment slot="cell" let:row let:column>
        {#if column === 'name'}{#if row.counterpart}<EntityLink ref={row.counterpart} {registry} />{:else}{row.label}{/if}
        {:else if column === 'skill'}{#if row.skill}<EntityLink ref={row.skill} {registry} />{/if}
        {:else if column === 'rank'}{row.rank ?? ''}
        {:else if column === 'quantity'}{rangeText(row.min, row.max) ?? ''}
        {:else if column === 'chance'}{#if row.chance === undefined}<MissingValue explanation="No chance is published for this build" />{:else}{formatNumber(row.chance)}%{/if}
        {:else if column === 'spots'}{#if row.placementCount > 0}<a class="c-link" href={itemOnMap(itemKey)}>{row.placementCount}</a>{:else}<MissingValue explanation="No spot is published" />{/if}{/if}
      </svelte:fragment>
    </RelationTable>
  </Section>
{/if}
