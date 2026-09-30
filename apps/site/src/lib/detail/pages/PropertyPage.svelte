<script lang="ts">
  import type { PublicKindEntry, PublicProperty } from '@afallon/contracts/public';
  import EntityLink from '../../EntityLink.svelte';
  import PropertyPanel from '../../PropertyPanel.svelte';
  import { formatNumber, nameOf } from '../../format';
  import { entityOnMap, spotOnMap } from '../../map-links';
  import AnswerCard from '../AnswerCard.svelte';
  import DetailFrame from '../DetailFrame.svelte';
  import StatStrip, { type Stat } from '../StatStrip.svelte';
  import TitleBlock, { type TitleFact } from '../TitleBlock.svelte';

  export let document: PublicProperty;
  export let registry: PublicKindEntry[];

  $: facts = document.facts;
  $: signAreas = [...new Set(document.locations.map((sign) => sign.label))];
  $: titleFacts = signAreas.length === 1
    ? [{ label: 'In', text: signAreas[0]! }] satisfies TitleFact[]
    : document.place ? [{ label: 'In', refs: [document.place] }] satisfies TitleFact[] : [];
  $: stats = [
    ...(facts.price ? [{ label: 'Purchase price', value: formatNumber(facts.price.amount), note: nameOf(facts.price.currency) }] : []),
    ...(facts.income ? [{ label: 'Income per payment', value: formatNumber(facts.income.amount), note: nameOf(facts.income.currency) }] : []),
    ...(facts.sellPrice ? [{ label: 'Sell price', value: formatNumber(facts.sellPrice.amount), note: nameOf(facts.sellPrice.currency) }] : []),
  ] satisfies Stat[];
</script>

<DetailFrame>
  <svelte:fragment slot="head"><TitleBlock name={document.ref.name} typeLine={facts.propertyType} facts={titleFacts} {registry}><StatStrip {stats} /></TitleBlock></svelte:fragment>
  <svelte:fragment slot="answer">
    <AnswerCard title="Where to buy" id="where-to-buy">
      {#if document.description}<p class="description">{document.description}</p>{/if}
      {#if document.locations.length}
        <p>{document.locations.length === 1 ? 'One for-sale sign marks this property.' : `${document.locations.length} for-sale signs mark this property.`}</p>
        <ul class="signs">{#each document.locations as sign, index}
          <li><span>{sign.label}</span><a class="c-link" href={spotOnMap(sign.placementId)} aria-label={`${sign.label}, for-sale sign ${index + 1} on map`}>Show sign on map</a></li>
        {/each}</ul>
        {#if document.locations.length > 1}<a class="c-action" href={entityOnMap(document.ref.key)}>Show all signs on map</a>{/if}
      {:else}<p>No for-sale sign is published for this property.</p>{/if}
    </AnswerCard>
  </svelte:fragment>
  <svelte:fragment slot="side"><div class="purchase-panel"><PropertyPanel {document} /></div></svelte:fragment>
</DetailFrame>

<style>
  .purchase-panel { padding: 1rem; border: 1px solid var(--c-line-soft); border-radius: var(--c-radius); background: var(--c-surface-1); }
  .description { margin: 0 0 1rem; line-height: 1.5; }
  .signs { display: grid; gap: .5rem; margin: 1rem 0; padding: 0; list-style: none; }
  .signs li { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: .35rem 1rem; padding: .75rem; border: 1px solid var(--c-line-soft); border-radius: var(--c-radius); background: var(--c-surface-1); }
</style>
