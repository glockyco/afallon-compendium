<script lang="ts">
  import type { CurrencyPurchaseRow, PublicKindEntry } from '@afallon/contracts/public';
  import EntityLink from '../../EntityLink.svelte';
  import Price from '../../Price.svelte';
  import { nameOf } from '../../format';
  import { planColumns, type RelationColumn } from '../relation-table';
  import RelationTable from '../RelationTable.svelte';
  import Section from '../Section.svelte';

  // What merchants sell for a currency. A currency item's page and the currency's page show the same rows.
  export let rows: CurrencyPurchaseRow[];
  export let registry: PublicKindEntry[];
  export let id: string;
  export let title: string;

  const columns: RelationColumn<CurrencyPurchaseRow>[] = [
    { id: 'item', label: 'Item', value: (row) => nameOf(row.item), sort: (row) => nameOf(row.item) },
    { id: 'cost', label: 'Cost', value: (row) => row.price.amount, sort: (row) => row.price.amount },
    { id: 'sold-by', label: 'Sold by', value: (row) => row.soldBy.map(nameOf).join(', ') },
  ];
  $: plan = planColumns(columns, rows);
</script>

<Section {id} {title} count={rows.length}>
  <RelationTable columns={plan.columns} {rows} label={title}>
    <svelte:fragment slot="cell" let:row let:column>
      {#if column === 'item'}<EntityLink ref={row.item} {registry} />
      {:else if column === 'cost'}<Price price={row.price} showName />
      {:else}{#each row.soldBy as seller, index}{index ? ', ' : ''}<EntityLink ref={seller} {registry} />{/each}{/if}
    </svelte:fragment>
  </RelationTable>
</Section>
