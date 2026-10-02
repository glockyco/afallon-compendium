<script lang="ts">
  import type { CurrencyPurchaseRow, PublicKindEntry } from '@afallon/contracts/public';
  import EntityLink from '../../EntityLink.svelte';
  import Price from '../../Price.svelte';
  import { nameOf } from '../../format';
  import { planColumns, type RelationColumn } from '../relation-table';
  import RelationTable from '../RelationTable.svelte';
  import Section from '../Section.svelte';
  import { sharedPurchaseSellers } from './purchase-sellers';

  // What merchants sell for a currency. A currency item's page and the currency's page show the same rows.
  export let rows: CurrencyPurchaseRow[];
  export let registry: PublicKindEntry[];
  export let id: string;
  export let title: string;
  /** The currency represented by this page, when its name need not repeat in every cost cell. */
  export let subjectCurrency: CurrencyPurchaseRow['price']['currency'] | undefined = undefined;
  export let sellersInSide = false;

  const columns: RelationColumn<CurrencyPurchaseRow>[] = [
    { id: 'item', label: 'Item', value: (row) => nameOf(row.item), sort: (row) => nameOf(row.item) },
    { id: 'cost', label: 'Cost', numeric: true, value: (row) => row.price.amount, sort: (row) => row.price.amount },
    { id: 'sold-by', label: 'Sold by', value: (row) => row.soldBy.map(nameOf).join(', ') },
  ];
  $: sharedSellers = sharedPurchaseSellers(rows);
  $: plan = planColumns(sharedSellers.length ? columns.filter((column) => column.id !== 'sold-by') : columns, rows);
  $: inSubjectCurrency = Boolean(subjectCurrency?.key !== null && subjectCurrency && rows.every((row) => row.price.currency.key === subjectCurrency?.key));
</script>

<Section {id} {title} count={rows.length} line={inSubjectCurrency && subjectCurrency ? `Costs in ${nameOf(subjectCurrency)}.` : undefined}>
  {#if sharedSellers.length && !sellersInSide}
    <p class="sellers">Sold by {#each sharedSellers as seller, index}{index ? index === sharedSellers.length - 1 ? ' and ' : ', ' : ''}<EntityLink ref={seller} {registry} />{/each}.</p>
  {/if}
  <RelationTable columns={plan.columns} {rows} label={title}>
    <svelte:fragment slot="cell" let:row let:column>
      {#if column === 'item'}<EntityLink ref={row.item} {registry} />
      {:else if column === 'cost'}<Price price={row.price} showName={!inSubjectCurrency} showIcon={!inSubjectCurrency} />
      {:else}{#each row.soldBy as seller, index}{index ? ', ' : ''}<EntityLink ref={seller} {registry} />{/each}{/if}
    </svelte:fragment>
  </RelationTable>
</Section>

<style>
  .sellers { color: var(--c-text-dim); }
</style>
