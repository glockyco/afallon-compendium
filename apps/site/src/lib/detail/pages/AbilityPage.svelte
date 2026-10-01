<script lang="ts">
  import { base } from '$app/paths';
  import type { PublicAbility, PublicKindEntry } from '@afallon/contracts/public';
  import AbilityTooltip from '../../AbilityTooltip.svelte';
  import Requirements from '../../Requirements.svelte';
  import AnswerCard from '../AnswerCard.svelte';
  import DetailFrame from '../DetailFrame.svelte';
  import TitleBlock from '../TitleBlock.svelte';
  import AbilityReferencesSection from '../sections/AbilityReferencesSection.svelte';
  import AbilityVersionsSection from '../sections/AbilityVersionsSection.svelte';
  import LearnedBySection from '../sections/LearnedBySection.svelte';
  import { shownRowCount } from '../relation-table';
  import Sections from '../Sections.svelte';

  export let document: PublicAbility;
  export let registry: PublicKindEntry[];

  $: main = document.versions.reduce((chosen, version) => version.usedBy.length + version.usedByItems.length > chosen.usedBy.length + chosen.usedByItems.length ? version : chosen);
  $: icon = main.icon ?? document.art.icon ?? document.ref.icon;
  let showAllUsers = false;
</script>

<article class="detail-page">
  <DetailFrame>
    <div slot="head"><TitleBlock name={document.ref.name} imageUrl={icon ? `${base}/data/${icon.url}` : undefined} {registry} /></div>
    <div slot="answer"><AnswerCard title="Who learns and uses it">
      <LearnedBySection versions={document.versions} {registry} />
      <AbilityReferencesSection versions={document.versions} relation="usedBy" {registry} compact showAllHref={document.versions.length > 1 ? '#versions' : '#used-by'} onShowAll={() => (showAllUsers = true)} />
      <AbilityReferencesSection versions={document.versions} relation="usedByItems" {registry} compact showAllHref={document.versions.length > 1 ? '#versions' : '#used-by-items'} onShowAll={() => (showAllUsers = true)} />
      {#if !document.versions.some((version) => version.learnedBy.length || version.usedBy.length || version.usedByItems.length)}<p>No published learner or user is known.</p>{/if}
    </AnswerCard></div>
    <div slot="side" class="side-content">
      <div class="c-game-frame"><AbilityTooltip {document} variant={main.anchor} /></div>
      {#if main.useRequirements.length}<section><h2>Use requirements</h2><Requirements requirements={main.useRequirements} {registry} kindLabels={false} /></section>{/if}
    </div>
    <Sections>
      <AbilityVersionsSection versions={document.versions} {registry} {showAllUsers} />
      {#if document.versions.length === 1 && shownRowCount(document.versions[0]!.usedBy.length, false) < document.versions[0]!.usedBy.length}<AbilityReferencesSection versions={document.versions} relation="usedBy" {registry} />{/if}
      {#if document.versions.length === 1 && shownRowCount(document.versions[0]!.usedByItems.length, false) < document.versions[0]!.usedByItems.length}<AbilityReferencesSection versions={document.versions} relation="usedByItems" {registry} />{/if}
    </Sections>
  </DetailFrame>
</article>

<style>
  .side-content { display: grid; gap: 1rem; }
  h2 { margin: 0 0 .5rem; color: var(--c-text-strong); font: 700 1.2rem/1.3 var(--c-serif); }
</style>
