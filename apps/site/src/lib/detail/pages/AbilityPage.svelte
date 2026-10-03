<script lang="ts">
  import { base } from '$app/paths';
  import type { PublicAbility, PublicKindEntry } from '@afallon/contracts/public';
  import EntityLink from '../../EntityLink.svelte';
  import NativeText from '../../NativeText.svelte';
  import Requirements from '../../Requirements.svelte';
  import { isNamedAppliedEffect } from '../effect-outcome';
  import AnswerCard from '../AnswerCard.svelte';
  import DetailFrame from '../DetailFrame.svelte';
  import TitleBlock from '../TitleBlock.svelte';
  import AppliedEffects from '../sections/AppliedEffects.svelte';
  import AbilityScalingSection from '../sections/AbilityScalingSection.svelte';
  import AbilityReferencesSection from '../sections/AbilityReferencesSection.svelte';
  import AbilityVersionsSection from '../sections/AbilityVersionsSection.svelte';
  import LearnedBySection from '../sections/LearnedBySection.svelte';
  import { shownRowCount } from '../relation-table';
  import { rankStatNote } from '../scaling-formula';
  import SideCard from '../SideCard.svelte';
  import Section from '../Section.svelte';
  import Sections from '../Sections.svelte';

  export let document: PublicAbility;
  export let registry: PublicKindEntry[];

  $: main = document.versions.reduce((chosen, version) => version.usedBy.length + version.usedByItems.length + version.unlockedByActions.length > chosen.usedBy.length + chosen.usedByItems.length + chosen.unlockedByActions.length ? version : chosen);
  $: icon = main.icon ?? document.art.icon ?? document.ref.icon;
  $: firstRank = main.ranks[0];
  $: hasSources = document.versions.some((version) => version.learnedBy.length || version.usedBy.length || version.usedByItems.length || version.unlockedByActions.length);
  $: grantOnly = hasSources && document.versions.every((version) => !version.learnedBy.length && !version.usedBy.length && !version.usedByItems.length);
  let showAllUsers = false;
</script>

<article class="detail-page">
  <DetailFrame side={main.useRequirements.length > 0}>
    <div slot="head"><TitleBlock name={document.ref.name} imageUrl={icon ? `${base}/data/${icon.url}` : undefined} {registry} /></div>
    <div slot="answer"><AnswerCard title="What it does">
      {#if document.versions.length > 1}<p class="version">Version {document.versions.indexOf(main) + 1} of {document.versions.length}</p>{/if}
      {#if firstRank}
        {#if main.ranks.length > 1}<h3>Rank {firstRank.rankIndex + 1}</h3>{/if}
        <NativeText lines={firstRank.lines} />
        {@const stats = rankStatNote(main.appliedEffects, firstRank.rankIndex)}
        {#if stats}<p class="stats">{stats}</p>{/if}
      {/if}
      {#if main.appliedEffects.some(isNamedAppliedEffect)}<AppliedEffects rows={main.appliedEffects} {registry} heading={false} />{/if}
      {#if !hasSources}<p class="source-note">No learner or user is listed for this ability.</p>{/if}
    </AnswerCard></div>
    <div slot="side"><SideCard title="Use requirements"><Requirements requirements={main.useRequirements} {registry} kindLabels={false} /></SideCard></div>
    <Sections>
      <AbilityScalingSection rows={main.appliedEffects} {registry} />
      {#if hasSources}
        <Section id="learners-and-users" title={grantOnly ? 'How it is granted' : 'Who learns and uses it'}>
          <div class="sources">
            <LearnedBySection versions={document.versions} {registry} />
            <AbilityReferencesSection versions={document.versions} relation="usedBy" {registry} compact showAllHref={document.versions.length > 1 ? '#versions' : '#used-by'} onShowAll={() => (showAllUsers = true)} />
            <AbilityReferencesSection versions={document.versions} relation="usedByItems" {registry} compact showAllHref={document.versions.length > 1 ? '#versions' : '#used-by-items'} onShowAll={() => (showAllUsers = true)} />
            {#each main.unlockedByActions as action}
              <p>{#if action.label === 'Dialogue'}A dialogue grants this ability.{:else}{action.label} grants this ability{/if}{#if action.owner}{' '}in <EntityLink ref={action.owner} {registry} />{/if}{action.label === 'Dialogue' ? '' : '.'}</p>
            {/each}
          </div>
        </Section>
      {/if}
      <AbilityVersionsSection versions={document.versions} {registry} {showAllUsers} icon={document.art.icon ?? document.ref.icon} />
      {#if document.versions.length === 1 && shownRowCount(document.versions[0]!.usedBy.length, false) < document.versions[0]!.usedBy.length}<AbilityReferencesSection versions={document.versions} relation="usedBy" {registry} />{/if}
      {#if document.versions.length === 1 && shownRowCount(document.versions[0]!.usedByItems.length, false) < document.versions[0]!.usedByItems.length}<AbilityReferencesSection versions={document.versions} relation="usedByItems" {registry} />{/if}
    </Sections>
  </DetailFrame>
</article>

<style>
  .source-note { color: var(--c-text-dim); }
  .sources { display: grid; gap: 1rem; }
  .version { color: var(--c-text-dim); font-size: var(--c-text-small); }
  .stats { color: var(--c-text-dim); font-size: var(--c-text-small); }
  h3 { color: var(--c-accent-strong); font: 600 var(--c-text-body)/1.25 var(--c-serif); }
</style>
