<script lang="ts">
  import type { PublicKindEntry, PublicProperty } from '@afallon/contracts/public';
  import LocationLinks from '../../LocationLinks.svelte';
  import PropertyPanel from '../../PropertyPanel.svelte';
  import { entityOnMap } from '../../map-links';
  import FactList from '../FactList.svelte';
  import FactRow from '../FactRow.svelte';
  import Hero from '../Hero.svelte';
  import Section from '../Section.svelte';
  import TitleBlock, { type TitleFact } from '../TitleBlock.svelte';

  export let document: PublicProperty;
  export let registry: PublicKindEntry[];

  $: facts = [
    ...(document.facts.propertyType ? [{ text: document.facts.propertyType }] : []),
    ...(document.place ? [{ label: 'In', refs: [document.place] }] : []),
  ] satisfies TitleFact[];
</script>

<article class="detail-page">
  <TitleBlock name={document.ref.name} {facts} mapHref={document.locations.length ? entityOnMap(document.ref.key) : undefined} {registry} />

  <Hero view="wide">
    <div slot="view" class="c-game-frame"><PropertyPanel {document} /></div>
    {#if document.description}<p class="c-prose">{document.description}</p>{/if}
    {#if document.locations.length}
      <FactList><FactRow label="For-sale sign"><LocationLinks placements={document.locations} /></FactRow></FactList>
    {/if}
  </Hero>

  <div class="c-sections">
    {#if document.locations.length > 1}
      <Section id="where-to-buy" title="Where to buy" icon="sign" count={document.locations.length}>
        <LocationLinks placements={document.locations} />
      </Section>
    {/if}
  </div>
</article>
