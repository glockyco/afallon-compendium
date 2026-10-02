<script lang="ts">
  import { base } from '$app/paths';
  import type { PublicKindEntry, PublicRace } from '@afallon/contracts/public';
  import EntityLink from '../../EntityLink.svelte';
  import AnswerCard from '../AnswerCard.svelte';
  import DetailFrame from '../DetailFrame.svelte';
  import Sections from '../Sections.svelte';
  import LinkSection from '../sections/LinkSection.svelte';
  import TitleBlock from '../TitleBlock.svelte';

  export let document: PublicRace;
  export let registry: PublicKindEntry[];

  $: icon = document.art.icon ?? document.ref.icon;
</script>

<article class="detail-page">
  <DetailFrame>
    <div slot="head">
      <TitleBlock name={document.ref.name} imageUrl={icon ? `${base}/data/${icon.url}` : undefined} typeLine="Race" {registry} />
    </div>

    <div slot="answer">
      <AnswerCard title="Playing this race" id="about">
        {#if document.start}<p>A new {document.ref.name} character starts in <EntityLink ref={document.start} {registry} />.</p>{/if}
        {#if document.classes.length}<p>Choose from {#each document.classes as playableClass, index}{index ? index === document.classes.length - 1 ? ' or ' : ', ' : ''}<EntityLink ref={playableClass} {registry} />{/each}.</p>{/if}
        {#if document.description}<p class="description">{document.description}</p>{/if}
      </AnswerCard>
    </div>

    <Sections>
      {#if document.adventurers.length}<LinkSection id="adventurers" title="Adventurers" refs={document.adventurers} {registry} line="The adventurers of this race." />{/if}
    </Sections>
  </DetailFrame>
</article>

<style>
  .description { color: var(--c-text-dim); line-height: 1.5; }
</style>
