<script lang="ts">
  import type { EffectScaling, PublicKindEntry } from '@afallon/contracts/public';
  import EntityLink from '../../EntityLink.svelte';
  import RelationTable from '../RelationTable.svelte';
  import type { RelationColumn } from '../relation-table';
  import { scalingBreakdown, scalingRows, type ScalingPart } from '../scaling-formula';

  /** One column per rank. A single rank gets one Amount column. */
  export let ranks: { label: string; scaling: EffectScaling }[];
  export let registry: PublicKindEntry[];
  /** The accessible name of the table. */
  export let label: string;

  type Row = { part: ScalingPart; amounts: string[] };
  $: rows = scalingRows(ranks.map((rank) => rank.scaling));
  $: notes = [...new Set(ranks.flatMap((rank) => scalingBreakdown(rank.scaling).note ?? []))];
  $: healing = ranks.every((rank) => rank.scaling.healing);
  $: columns = [
    { id: 'part', label: healing ? 'Healing From' : 'Damage From', value: (row: Row) => row.part.ref ? 'name' in row.part.ref ? row.part.ref.name : '' : row.part.label },
    ...ranks.map((rank, index): RelationColumn<Row> => ({ id: `rank-${index}`, label: ranks.length > 1 ? rank.label : 'Amount', numeric: true, value: (row) => row.amounts[index] || undefined })),
  ] satisfies RelationColumn<Row>[];
</script>

{#if rows.length}
  <RelationTable {columns} {rows} {label}>
    <svelte:fragment slot="cell" let:row let:column>
      {#if column === 'part'}{#if row.part.ref}<EntityLink ref={row.part.ref} {registry} />{:else}{row.part.label}{/if}
      {:else}{row.amounts[Number(column.slice(5))] || '–'}{/if}
    </svelte:fragment>
  </RelationTable>
{/if}
{#each notes as note}<p>{note}</p>{/each}
