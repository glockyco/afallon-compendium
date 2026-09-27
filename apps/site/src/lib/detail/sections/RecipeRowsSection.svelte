<script lang="ts">
  import type { PublicKindEntry, RecipeRow } from '@afallon/contracts/public';
  import EntityLink from '../../EntityLink.svelte';
  import { nameOf } from '../../format';
  import { omitWhenShared, planColumns, type RelationColumn } from '../relation-table';
  import RelationTable from '../RelationTable.svelte';
  import Section from '../Section.svelte';

  export let id: string;
  export let title: string;
  /** The heading of the first column: "Recipe" or "Material". */
  export let counterpartLabel: string;
  /** The heading of the quantity column, such as "Makes" or "Needs". */
  export let quantityLabel: string;
  export let rows: RecipeRow[];
  export let registry: PublicKindEntry[];
  /**
   * The quantity that a reader assumes, such as one product of a recipe. The column leaves when every row has it.
   * Materials have none, because each material states how many a recipe needs.
   */
  export let assumedQuantity: number | undefined = undefined;

  const columns: RelationColumn<RecipeRow>[] = [
    { id: 'name', label: counterpartLabel, value: (row) => nameOf(row.counterpart), sort: (row) => nameOf(row.counterpart) },
    { id: 'count', label: quantityLabel, numeric: true, value: (row) => row.count, sort: (row) => row.count, ...(assumedQuantity === undefined ? {} : { whenShared: omitWhenShared(assumedQuantity) }) },
  ];

  $: plan = planColumns(columns, rows);
</script>

{#if rows.length}
  <Section {id} {title} icon="recipe" count={rows.length}>
    <RelationTable columns={plan.columns} {rows} label={title}>
      <svelte:fragment slot="cell" let:row let:column>
        {#if column === 'name'}<EntityLink ref={row.counterpart} {registry} />{:else if column === 'count'}{row.count}{/if}
      </svelte:fragment>
    </RelationTable>
  </Section>
{/if}
