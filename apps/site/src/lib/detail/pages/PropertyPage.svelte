<script lang="ts">
  import type { PublicKindEntry, PublicProperty } from '@afallon/contracts/public';
  import EntityLink from '../../EntityLink.svelte';
  import PropertyPanel from '../../PropertyPanel.svelte';
  import { nameOf } from '../../format';
  import { entityOnMap, spotOnMap } from '../../map-links';
  import AnswerCard from '../AnswerCard.svelte';
  import DetailFrame from '../DetailFrame.svelte';
  import TitleBlock, { type TitleFact } from '../TitleBlock.svelte';

  export let document: PublicProperty;
  export let registry: PublicKindEntry[];

  $: facts = document.facts;
  $: signAreas = [...new Set(document.locations.map((sign) => sign.label))];
  $: titleFacts = signAreas.length === 1
    ? [{ label: 'In', ...(document.place && nameOf(document.place) === signAreas[0] ? { refs: [document.place] } : { text: signAreas[0]! }) }] satisfies TitleFact[]
    : document.place ? [{ label: 'In', refs: [document.place] }] satisfies TitleFact[] : [];
</script>

<DetailFrame>
  <svelte:fragment slot="head"><TitleBlock name={document.ref.name} typeLine={facts.propertyType} facts={titleFacts} {registry} /></svelte:fragment>
  <svelte:fragment slot="answer">
    <AnswerCard title="Buy this property" id="where-to-buy">
      {#if document.description}<p>{document.description}</p>{/if}
      <PropertyPanel {document}>
        {#if document.locations.length}
          <div class="where">
            <p>{document.locations.length === 1 ? 'One for-sale sign marks this property.' : `${document.locations.length} for-sale signs mark this property.`}</p>
            <ul class="signs">{#each document.locations as sign, index}
              <li><span>{#if document.place && nameOf(document.place) === sign.label}<EntityLink ref={document.place} {registry} />{:else}{sign.label}{/if}</span><a class="c-link" href={spotOnMap(sign.placementId)} aria-label={`${sign.label}, for-sale sign ${index + 1} on map`}>Show Sign on Map</a></li>
            {/each}</ul>
            {#if document.locations.length > 1}<a class="c-action" href={entityOnMap(document.ref.key)}>Show All Signs on Map</a>{/if}
          </div>
        {:else}<p>No for-sale sign is known for this property.</p>{/if}
      </PropertyPanel>
    </AnswerCard>
  </svelte:fragment>
</DetailFrame>

<style>
  .where { display: grid; gap: .6rem; padding-top: .9rem; border-top: 1px solid var(--c-line-soft); }
  .where p { margin: 0; }
  .signs { display: grid; gap: .5rem; margin: 0; padding: 0; list-style: none; }
  .signs li { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: .35rem 1rem; padding: .75rem; border: 1px solid var(--c-line-soft); border-radius: var(--c-radius); background: var(--c-surface-1); }
</style>
