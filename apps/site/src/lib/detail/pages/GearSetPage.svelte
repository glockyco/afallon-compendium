<script lang="ts">
  import type { GearSetPiece, PublicGearSet, PublicKindEntry } from '@afallon/contracts/public';
  import EntityLink from '../../EntityLink.svelte';
  import { formatNumber, nameOf, signedAmount } from '../../format';
  import AnswerCard from '../AnswerCard.svelte';
  import DetailFrame from '../DetailFrame.svelte';
  import { planColumns, type RelationColumn } from '../relation-table';
  import RelationTable from '../RelationTable.svelte';
  import Section from '../Section.svelte';
  import Sections from '../Sections.svelte';
  import StatStrip from '../StatStrip.svelte';
  import TitleBlock from '../TitleBlock.svelte';

  export let document: PublicGearSet;
  export let registry: PublicKindEntry[];

  $: pieceCount = document.pieces.length;
  $: lastTier = document.tiers.at(-1);
  $: stats = [
    { label: 'Pieces', value: formatNumber(pieceCount), href: '#pieces' },
    ...(document.tiers.length ? [{ label: 'Set bonuses', value: formatNumber(document.tiers.length), href: '#set-bonuses' }] : []),
    ...(lastTier ? [{ label: 'Pieces for the last bonus', value: formatNumber(lastTier.equipped) }] : []),
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
      <TitleBlock name={document.ref.name} typeLine={document.type ? `${document.type} Gear Set` : 'Gear Set'} {registry}><StatStrip {stats} /></TitleBlock>
    </div>

    <div slot="answer">
      <AnswerCard title="Set bonuses" id="set-bonuses">
        {#if document.description}<p class="description">{document.description}</p>{/if}
        {#if document.tiers.length}
          <p>A bonus is active while you wear at least that many different pieces of the set. Two copies of one piece count once, and reaching a higher bonus keeps the lower ones.</p>
          <ul class="tiers">
            {#each document.tiers as tier}
              <li><strong>{formatNumber(tier.equipped)} {tier.equipped === 1 ? 'piece' : 'pieces'}</strong>
                <span>{#each tier.stats as stat, index}{index ? ', ' : ''}{signedAmount(stat.amount, stat.isPercent)} <EntityLink ref={stat.stat} {registry} />{/each}</span></li>
            {/each}
          </ul>
        {:else}<p>This set has no published bonus.</p>{/if}
      </AnswerCard>
    </div>

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
