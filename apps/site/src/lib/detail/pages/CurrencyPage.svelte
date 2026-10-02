<script lang="ts">
  import { base } from '$app/paths';
  import { isEntityRef, type CurrencyPropertyRow, type CurrencyRewardRow, type PublicCurrency, type PublicItem, type PublicKindEntry } from '@afallon/contracts/public';
  import EntityLink from '../../EntityLink.svelte';
  import { formatNumber, nameOf } from '../../format';
  import AnswerCard from '../AnswerCard.svelte';
  import DetailFrame from '../DetailFrame.svelte';
  import { planColumns, type RelationColumn } from '../relation-table';
  import RelationTable from '../RelationTable.svelte';
  import Section from '../Section.svelte';
  import SideCard from '../SideCard.svelte';
  import Sections from '../Sections.svelte';
  import PurchasesSection from '../sections/PurchasesSection.svelte';
  import ItemSourceRoutes from '../sections/ItemSourceRoutes.svelte';
  import { sharedPurchaseSellers } from '../sections/purchase-sellers';
  import TitleBlock from '../TitleBlock.svelte';

  export let document: PublicCurrency;
  export let registry: PublicKindEntry[];
  export let inlineItem: PublicItem | undefined = undefined;

  $: icon = document.art.icon ?? document.ref.icon;
  $: sharedSellers = sharedPurchaseSellers(document.purchases);
  $: largest = document.rewards.length ? Math.max(...document.rewards.map((row) => row.amount)) : undefined;
  $: smallest = document.rewards.length ? Math.min(...document.rewards.map((row) => row.amount)) : undefined;
  const propertyColumns: RelationColumn<CurrencyPropertyRow>[] = [
    { id: 'property', label: 'Property', value: (row) => nameOf(row.property), sort: (row) => nameOf(row.property) },
    { id: 'price', label: 'Price', numeric: true, value: (row) => row.price, sort: (row) => row.price },
  ];
  const rewardColumns: RelationColumn<CurrencyRewardRow>[] = [
    { id: 'quest', label: 'Quest', value: (row) => nameOf(row.quest), sort: (row) => nameOf(row.quest) },
    { id: 'amount', label: 'Amount', numeric: true, value: (row) => row.amount, sort: (row) => row.amount },
  ];
  $: propertyPlan = planColumns(propertyColumns, document.properties);
  $: rewardPlan = planColumns(rewardColumns, document.rewards);
</script>

<article class="detail-page">
  <DetailFrame side={sharedSellers.length > 0}>
    <div slot="head">
      <TitleBlock name={document.ref.name} imageUrl={icon ? `${base}/data/${icon.url}` : undefined} typeLine="Currency" {registry} />
    </div>

    <div slot="answer">
      <AnswerCard title="How to get it" id="how-to-get-it">
        {#if document.description}<p class="description">{document.description}</p>{/if}
        {#if inlineItem && document.item && isEntityRef(document.item) && document.item.slug}
          <ItemSourceRoutes document={inlineItem} {registry} itemHref={`${base}/items/${document.item.slug}/`} />
        {:else if document.item && isEntityRef(document.item) && document.item.slug}
          <p>See <EntityLink ref={document.item} {registry} /> for ways to get it.</p>
        {:else if !document.rewards.length && !document.description}
          <p>No way to get this currency is known.</p>
        {/if}
        {#if document.rewards.length && smallest !== undefined && largest !== undefined}
          <p><a class="c-link" href="#quest-rewards">{formatNumber(document.rewards.length)} {document.rewards.length === 1 ? 'quest rewards' : 'quests reward'} it</a>, {smallest === largest ? formatNumber(smallest) : `${formatNumber(smallest)} to ${formatNumber(largest)}`} at a time.</p>
        {/if}
      </AnswerCard>
    </div>

    <svelte:fragment slot="side">
      <SideCard title="Merchants">
        <div class="merchant-list">
          {#each sharedSellers as seller}<EntityLink ref={seller} {registry} />{/each}
        </div>
      </SideCard>
    </svelte:fragment>
    <Sections>
      {#if document.purchases.length}<PurchasesSection id="buys" title="What it buys" rows={document.purchases} subjectCurrency={document.ref} sellersInSide={Boolean(sharedSellers.length)} {registry} />{/if}

      {#if document.properties.length}
        <Section id="properties" title="Properties" count={document.properties.length}>
          <RelationTable columns={propertyPlan.columns} rows={document.properties} label="Properties">
            <svelte:fragment slot="cell" let:row let:column>
              {#if column === 'property'}<EntityLink ref={row.property} {registry} />
              {:else if column === 'price'}{formatNumber(row.price)}{/if}
            </svelte:fragment>
          </RelationTable>
        </Section>
      {/if}

      {#if document.rewards.length}
        <Section id="quest-rewards" title="Quest rewards" count={document.rewards.length} line={document.rewards.some((row) => row.choice) ? 'A reward marked as a choice is one of the rewards that you pick one of.' : undefined}>
          <RelationTable columns={rewardPlan.columns} rows={document.rewards} label="Quest rewards" sort={{ id: 'amount', dir: 'desc' }}>
            <svelte:fragment slot="cell" let:row let:column>
              {#if column === 'quest'}<EntityLink ref={row.quest} {registry} />{#if row.choice} <small>Choice</small>{/if}
              {:else if column === 'amount'}{formatNumber(row.amount)}{/if}
            </svelte:fragment>
          </RelationTable>
        </Section>
      {/if}
    </Sections>
  </DetailFrame>
</article>

<style>
  .description { color: var(--c-text-dim); line-height: 1.5; }
  .merchant-list { display: grid; gap: .4rem; }
</style>
