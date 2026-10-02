<script lang="ts">
  import { base } from '$app/paths';
  import type { CurrencyPropertyRow, CurrencyRewardRow, PublicCurrency, PublicKindEntry } from '@afallon/contracts/public';
  import EntityLink from '../../EntityLink.svelte';
  import { formatNumber, nameOf } from '../../format';
  import AnswerCard from '../AnswerCard.svelte';
  import DetailFrame from '../DetailFrame.svelte';
  import { planColumns, type RelationColumn } from '../relation-table';
  import RelationTable from '../RelationTable.svelte';
  import Section from '../Section.svelte';
  import Sections from '../Sections.svelte';
  import PurchasesSection from '../sections/PurchasesSection.svelte';
  import StatStrip from '../StatStrip.svelte';
  import TitleBlock from '../TitleBlock.svelte';

  export let document: PublicCurrency;
  export let registry: PublicKindEntry[];

  $: icon = document.art.icon ?? document.ref.icon;
  $: stats = [
    ...(document.purchases.length ? [{ label: 'Items sold for it', value: formatNumber(document.purchases.length), href: '#buys' }] : []),
    ...(document.properties.length ? [{ label: 'Properties priced in it', value: formatNumber(document.properties.length), href: '#properties' }] : []),
    ...(document.rewards.length ? [{ label: 'Quest rewards', value: formatNumber(document.rewards.length), href: '#quest-rewards' }] : []),
  ];
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
  <DetailFrame>
    <div slot="head">
      <TitleBlock name={document.ref.name} imageUrl={icon ? `${base}/data/${icon.url}` : undefined} typeLine="Currency" {registry}><StatStrip {stats} /></TitleBlock>
    </div>

    <div slot="answer">
      <AnswerCard title="How to get it" id="how-to-get-it">
        {#if document.description}<p class="description">{document.description}</p>{/if}
        <ul class="routes">
          {#if document.item}<li><strong>Pick it up</strong><span>In your bags it is the item <EntityLink ref={document.item} {registry} />. Its page lists where to find it.</span></li>{/if}
          {#if document.rewards.length && smallest !== undefined && largest !== undefined}
            <li><strong>Quest rewards</strong><span><a class="c-link" href="#quest-rewards">{formatNumber(document.rewards.length)} {document.rewards.length === 1 ? 'quest rewards' : 'quests reward'} it</a>, {smallest === largest ? formatNumber(smallest) : `${formatNumber(smallest)} to ${formatNumber(largest)}`} at a time.</span></li>
          {/if}
          {#if !document.item && !document.rewards.length}<li>No source of this currency is published.</li>{/if}
        </ul>
      </AnswerCard>
    </div>

    <Sections>
      {#if document.purchases.length}<PurchasesSection id="buys" title="What it buys" rows={document.purchases} {registry} />{/if}

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
  .routes { display: grid; gap: .75rem; list-style: none; padding: 0; margin: 0; }
  .routes li { display: grid; gap: .15rem; border-bottom: 1px solid var(--c-line-soft); padding: .3rem 0 .8rem; }
  .routes li:last-child { border-bottom: 0; padding-bottom: 0; }
  .routes strong { color: var(--c-text-strong); }
</style>
