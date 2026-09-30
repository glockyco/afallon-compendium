<script lang="ts">
  import type { NpcVariant, NpcVendorRow, PublicKindEntry } from '@afallon/contracts/public';
  import EntityLink from '../../EntityLink.svelte';
  import Price from '../../Price.svelte';
  import Requirements from '../../Requirements.svelte';
  import VariantLinks from '../../VariantLinks.svelte';
  import { nameOf } from '../../format';
  import type { SortState } from '../../table';
  import { planColumns, type RelationColumn } from '../relation-table';
  import RelationTable from '../RelationTable.svelte';
  import Section from '../Section.svelte';

  export let id: string;
  export let title: string;
  /** The heading of the first column: "Item" on a vendor, "Vendor" on an item. */
  export let counterpartLabel: string;
  export let rows: NpcVendorRow[];
  /** The variants of an NPC page. A row that only some variants sell names them. */
  export let variants: NpcVariant[] = [];
  export let registry: PublicKindEntry[];
  export let sort: SortState;

  const columns: RelationColumn<NpcVendorRow>[] = [
    { id: 'name', label: counterpartLabel, value: (row) => nameOf(row.counterpart), sort: (row) => nameOf(row.counterpart) },
    { id: 'price', label: 'Price', numeric: true, value: (row) => `${row.price.amount} ${nameOf(row.price.currency)}`, sort: (row) => row.price.amount },
    { id: 'unlock', label: 'Unlock requirement', value: (row) => row.requirements.length ? JSON.stringify(row.requirements) : undefined },
    { id: 'variant', label: 'Variant', value: (row) => row.variants?.join(' ') },
  ];

  $: plan = planColumns(columns, rows);
</script>

{#if rows.length}
  <Section {id} {title} count={rows.length}>
    <RelationTable columns={plan.columns} {rows} label={title} {sort}>
      <svelte:fragment slot="cell" let:row let:column>
        {#if column === 'name'}<EntityLink ref={row.counterpart} {registry} />
        {:else if column === 'price'}<Price price={row.price} />
        {:else if column === 'unlock'}<Requirements requirements={row.requirements} {registry} />
        {:else if column === 'variant'}{#if row.variants}<VariantLinks anchors={row.variants} {variants} />{:else}All{/if}{/if}
      </svelte:fragment>
    </RelationTable>
  </Section>
{/if}
