<script lang="ts">
  import { base } from '$app/paths';
  import type { PublicAbility, PublicKindEntry } from '@afallon/contracts/public';
  import EntityLink from '../../EntityLink.svelte';
  import AbilityTooltip from '../../AbilityTooltip.svelte';
  import NativeText from '../../NativeText.svelte';
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

  $: main = document.versions.reduce((chosen, version) => version.usedBy.length + version.usedByItems.length + version.unlockedByActions.length > chosen.usedBy.length + chosen.usedByItems.length + chosen.unlockedByActions.length ? version : chosen);
  $: icon = main.icon ?? document.art.icon ?? document.ref.icon;
  $: hasSources = document.versions.some((version) => version.learnedBy.length || version.usedBy.length || version.usedByItems.length || version.unlockedByActions.length);
  $: grantOnly = hasSources && document.versions.every((version) => !version.learnedBy.length && !version.usedBy.length && !version.usedByItems.length);
  $: outcomeLines = main.ranks[0]?.lines.filter((line) => line.spans.some((span) => span.tone !== 'muted' && span.text.trim())) ?? [];
  let showAllUsers = false;
</script>

<article class="detail-page">
  <DetailFrame>
    <div slot="head"><TitleBlock name={document.ref.name} imageUrl={icon ? `${base}/data/${icon.url}` : undefined} {registry} /></div>
    <div slot="answer"><AnswerCard title={grantOnly ? 'How it is granted' : hasSources ? 'Who learns and uses it' : 'What it does'}>
      {#if hasSources}
        <LearnedBySection versions={document.versions} {registry} />
        <AbilityReferencesSection versions={document.versions} relation="usedBy" {registry} compact showAllHref={document.versions.length > 1 ? '#versions' : '#used-by'} onShowAll={() => (showAllUsers = true)} />
        <AbilityReferencesSection versions={document.versions} relation="usedByItems" {registry} compact showAllHref={document.versions.length > 1 ? '#versions' : '#used-by-items'} onShowAll={() => (showAllUsers = true)} />
        {#each main.unlockedByActions as action}
          <p>{#if action.label === 'Dialogue'}A dialogue grants this ability.{:else}{action.label} grants this ability{/if}{#if action.owner}{' '}in <EntityLink ref={action.owner} {registry} />{/if}{action.label === 'Dialogue' ? '' : '.'}</p>
        {/each}
      {:else}
        {#if main.appliedEffects.length}<AppliedEffects rows={main.appliedEffects} {registry} heading={false} />
        {:else if outcomeLines.length}<NativeText lines={outcomeLines} />{/if}
        <p class="source-note">No learner or user is listed for this ability.</p>
      {/if}
    </AnswerCard></div>
      <svelte:fragment slot="side">
        <div class="c-game-frame"><AbilityTooltip {document} variant={main.anchor} /></div>
        {#if hasSources && main.appliedEffects.length}<SideCard title="Applies Effects"><AppliedEffects rows={main.appliedEffects} {registry} heading={false} /></SideCard>{/if}
        {#if main.useRequirements.length}<SideCard title="Use Requirements"><Requirements requirements={main.useRequirements} {registry} kindLabels={false} /></SideCard>{/if}
      </svelte:fragment>
    <Sections>
      <AbilityVersionsSection versions={document.versions} {registry} {showAllUsers} icon={document.art.icon ?? document.ref.icon} />
      {#if document.versions.length === 1 && shownRowCount(document.versions[0]!.usedBy.length, false) < document.versions[0]!.usedBy.length}<AbilityReferencesSection versions={document.versions} relation="usedBy" {registry} />{/if}
      {#if document.versions.length === 1 && shownRowCount(document.versions[0]!.usedByItems.length, false) < document.versions[0]!.usedByItems.length}<AbilityReferencesSection versions={document.versions} relation="usedByItems" {registry} />{/if}
    </Sections>
  </DetailFrame>
</article>

<style>
  .source-note { margin-top: .75rem; color: var(--c-text-dim); }
</style>
