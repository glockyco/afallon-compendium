<script lang="ts">
  import { base } from '$app/paths';
  import type { PublicKindEntry, PublicRace } from '@afallon/contracts/public';
  import EntityLink from '../../EntityLink.svelte';
  import { formatNumber } from '../../format';
  import AnswerCard from '../AnswerCard.svelte';
  import DetailFrame from '../DetailFrame.svelte';
  import Sections from '../Sections.svelte';
  import LinkSection from '../sections/LinkSection.svelte';
  import StatStrip from '../StatStrip.svelte';
  import TitleBlock from '../TitleBlock.svelte';

  export let document: PublicRace;
  export let registry: PublicKindEntry[];

  $: icon = document.art.icon ?? document.ref.icon;
  $: stats = [
    ...(document.classes.length ? [{ label: 'Classes', value: formatNumber(document.classes.length), href: '#classes' }] : []),
    ...(document.adventurers.length ? [{ label: 'Adventurers', value: formatNumber(document.adventurers.length), href: '#adventurers' }] : []),
  ];
</script>

<article class="detail-page">
  <DetailFrame>
    <div slot="head">
      <TitleBlock name={document.ref.name} imageUrl={icon ? `${base}/data/${icon.url}` : undefined} typeLine="Race"
        facts={document.start ? [{ label: 'Starts in', refs: [document.start] }] : []} {registry}><StatStrip {stats} /></TitleBlock>
    </div>

    <div slot="answer">
      <AnswerCard title="About" id="about">
        {#if document.description}<p class="description">{document.description}</p>{/if}
        {#if document.start}<p>A new {document.ref.name} character starts in <EntityLink ref={document.start} {registry} />.</p>{/if}
      </AnswerCard>
    </div>

    <Sections>
      {#if document.classes.length}<LinkSection id="classes" title="Classes" refs={document.classes} {registry} line="The classes that this race offers." />{/if}
      {#if document.adventurers.length}<LinkSection id="adventurers" title="Adventurers" refs={document.adventurers} {registry} line="The adventurers of this race." />{/if}
    </Sections>
  </DetailFrame>
</article>

<style>
  .description { color: var(--c-text-dim); line-height: 1.5; }
</style>
