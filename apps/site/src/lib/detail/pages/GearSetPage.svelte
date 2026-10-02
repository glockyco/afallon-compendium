<script lang="ts">
  import type { GearSetPiece, PublicGearSet, PublicKindEntry } from '@afallon/contracts/public';
  import EntityLink from '../../EntityLink.svelte';
  import { formatNumber, nameOf, signedAmount } from '../../format';
  import AnswerCard from '../AnswerCard.svelte';
  import DetailFrame from '../DetailFrame.svelte';
  import FactsCard from '../FactsCard.svelte';
  import { planColumns, type RelationColumn } from '../relation-table';
  import RelationTable from '../RelationTable.svelte';
  import Section from '../Section.svelte';
  import Sections from '../Sections.svelte';
  import TitleBlock from '../TitleBlock.svelte';

  export let document: PublicGearSet;
  export let registry: PublicKindEntry[];

  $: pieceCount = document.pieces.length;
  $: sideFacts = [
    { label: 'Pieces', value: formatNumber(pieceCount), href: '#pieces' },
    ...(document.tiers.length ? [{ label: 'Bonus tiers', value: formatNumber(document.tiers.length), href: '#set-bonuses' }] : []),
  ];
  const columns: RelationColumn<GearSetPiece>[] = [
    { id: 'item', label: 'Piece', value: (row) => nameOf(row.item), sort: (row) => nameOf(row.item) },
    { id: 'type', label: 'Type', value: (row) => row.type, sort: (row) => row.type ?? '' },
  ];
  $: plan = planColumns(columns, document.pieces);
</script>

<article class="detail-page">
  <DetailFrame>
    <div slot="head">
      <TitleBlock name={document.ref.name} typeLine={document.type ? `${document.type} gear set` : 'Gear set'} {registry} />
    </div>

    <div slot="answer">
      <AnswerCard title="Set bonuses" id="set-bonuses">
        {#if document.description}<p class="description">{document.description}</p>{/if}
        {#if document.tiers.length}
          <p>Bonuses unlock as you equip different pieces of the set. Higher tiers keep the earlier bonuses.</p>
          <ul class="tiers">
            {#each document.tiers as tier}
              <li><strong>{formatNumber(tier.equipped)} {tier.equipped === 1 ? 'piece' : 'pieces'}</strong>
                <span>{#each tier.stats as stat, index}{index ? ', ' : ''}{signedAmount(stat.amount, stat.isPercent)} <EntityLink ref={stat.stat} {registry} />{/each}</span></li>
            {/each}
          </ul>
        {:else}<p>This set has no published bonus.</p>{/if}
      </AnswerCard>
    </div>

    <svelte:fragment slot="side">
      <FactsCard facts={sideFacts} title="At a glance">
        <p slot="after">Two copies of the same piece count only once.</p>
      </FactsCard>
    </svelte:fragment>
    <Sections>
      <Section id="pieces" title="Pieces" count={pieceCount}>
        <RelationTable columns={plan.columns} rows={document.pieces} label="Pieces">
          <svelte:fragment slot="cell" let:row let:column>
            {#if column === 'item'}<EntityLink ref={row.item} {registry} />
            {:else if column === 'type' && row.type}{row.type}{/if}
          </svelte:fragment>
        </RelationTable>
      </Section>
    </Sections>
  </DetailFrame>
</article>

<style>
  .description { color: var(--c-text-dim); line-height: 1.5; }
  .tiers { display: grid; gap: .6rem; list-style: none; padding: 0; margin: 0; }
  .tiers li { display: grid; gap: .15rem; border-bottom: 1px solid var(--c-line-soft); padding-bottom: .6rem; }
  .tiers li:last-child { border-bottom: 0; padding-bottom: 0; }
  .tiers strong { color: var(--c-text-strong); }
</style>
