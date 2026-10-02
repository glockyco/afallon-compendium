<script lang="ts">
  import { base } from '$app/paths';
  import type { PublicAbility, PublicKindEntry } from '@afallon/contracts/public';
  import AbilityTooltip from '../../AbilityTooltip.svelte';
  import Requirements from '../../Requirements.svelte';
  import AnswerCard from '../AnswerCard.svelte';
  import DetailFrame from '../DetailFrame.svelte';
  import TitleBlock from '../TitleBlock.svelte';
  import AppliedEffects from '../sections/AppliedEffects.svelte';
  import AbilityReferencesSection from '../sections/AbilityReferencesSection.svelte';
  import AbilityVersionsSection from '../sections/AbilityVersionsSection.svelte';
  import LearnedBySection from '../sections/LearnedBySection.svelte';
  import { shownRowCount } from '../relation-table';
  import SideCard from '../SideCard.svelte';
  import Sections from '../Sections.svelte';

  export let document: PublicAbility;
  export let registry: PublicKindEntry[];

  $: main = document.versions.reduce((chosen, version) => version.usedBy.length + version.usedByItems.length > chosen.usedBy.length + chosen.usedByItems.length ? version : chosen);
  $: icon = main.icon ?? document.art.icon ?? document.ref.icon;
  $: hasSources = document.versions.some((version) => version.learnedBy.length || version.usedBy.length || version.usedByItems.length);
  let showAllUsers = false;
</script>

<article class="detail-page">
  <DetailFrame side={hasSources || main.useRequirements.length > 0}>
    <div slot="head"><TitleBlock name={document.ref.name} imageUrl={icon ? `${base}/data/${icon.url}` : undefined} {registry} /></div>
    <div slot="answer"><AnswerCard title={hasSources ? 'Who learns and uses it' : 'What it does'}>
      {#if hasSources}
        <LearnedBySection versions={document.versions} {registry} />
        <AbilityReferencesSection versions={document.versions} relation="usedBy" {registry} compact showAllHref={document.versions.length > 1 ? '#versions' : '#used-by'} onShowAll={() => (showAllUsers = true)} />
        <AbilityReferencesSection versions={document.versions} relation="usedByItems" {registry} compact showAllHref={document.versions.length > 1 ? '#versions' : '#used-by-items'} onShowAll={() => (showAllUsers = true)} />
      {:else}
        <div class="c-game-frame"><AbilityTooltip {document} variant={main.anchor} /></div>
        <AppliedEffects rows={main.appliedEffects} {registry} />
        <p class="source-note">No learner or user is listed for this ability.</p>
      {/if}
    </AnswerCard></div>
      <svelte:fragment slot="side">
        {#if hasSources}<div class="c-game-frame"><AbilityTooltip {document} variant={main.anchor} /></div>{/if}
        {#if hasSources && main.appliedEffects.length}<SideCard title="Applies effects"><AppliedEffects rows={main.appliedEffects} {registry} heading={false} /></SideCard>{/if}
        {#if main.useRequirements.length}<SideCard title="Use requirements"><Requirements requirements={main.useRequirements} {registry} kindLabels={false} /></SideCard>{/if}
      </svelte:fragment>
    <Sections>
      <AbilityVersionsSection versions={document.versions} {registry} {showAllUsers} />
      {#if document.versions.length === 1 && shownRowCount(document.versions[0]!.usedBy.length, false) < document.versions[0]!.usedBy.length}<AbilityReferencesSection versions={document.versions} relation="usedBy" {registry} />{/if}
      {#if document.versions.length === 1 && shownRowCount(document.versions[0]!.usedByItems.length, false) < document.versions[0]!.usedByItems.length}<AbilityReferencesSection versions={document.versions} relation="usedByItems" {registry} />{/if}
    </Sections>
  </DetailFrame>
</article>

<style>
  .source-note { margin-top: .75rem; color: var(--c-text-dim); }
</style>
