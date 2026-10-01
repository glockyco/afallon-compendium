<script lang="ts">
  import type { PublicKindEntry, PublicQuest } from '@afallon/contracts/public';
  import { formatNumber, intervalText, levelText, nameOf } from '../../format';
  import Requirements from '../../Requirements.svelte';
  import AnswerCard from '../AnswerCard.svelte';
  import DetailFrame from '../DetailFrame.svelte';
  import LinkGrid from '../LinkGrid.svelte';
  import FactsGrid from '../FactsGrid.svelte';
  import StatStrip from '../StatStrip.svelte';
  import TitleBlock from '../TitleBlock.svelte';
  import QuestChainSection from '../sections/QuestChainSection.svelte';
  import Section from '../Section.svelte';
  import QuestStartSection from '../sections/QuestStartSection.svelte';
  import QuestObjectivesSection from '../sections/QuestObjectivesSection.svelte';
  import QuestRewardsSection from '../sections/QuestRewardsSection.svelte';
  import QuestTextSection from '../sections/QuestTextSection.svelte';
  import QuestWorldChangesSection from '../sections/QuestWorldChangesSection.svelte';
  import Sections from '../Sections.svelte';

  export let document: PublicQuest;
  export let registry: PublicKindEntry[];

  $: facts = document.facts;
  $: hasQuestText = Boolean(document.description || facts.objectiveText || facts.completedDescription);
  $: step = document.chainQuests.findIndex((quest) => quest.key === document.ref.key);
  $: stats = [
    ...(facts.levelRange ? [{ label: 'Quest level', value: levelText(facts.levelRange) }] : []),
    ...(facts.experience ? [{ label: 'Experience', value: formatNumber(facts.experience) }] : []),
    ...(facts.chain && step >= 0 && document.chainQuests.length > 1 ? [{ label: 'Chain step', value: `${step + 1} of ${document.chainQuests.length}` }] : []),
  ];
  $: sideFacts = [
    ...(facts.levelRequirement !== undefined ? [{ label: 'Minimum level', value: String(facts.levelRequirement) }] : []),
    ...(facts.repeatable ? [{ label: 'Repeatable', value: 'Yes' }] : []),
    ...(facts.worldQuest ? [{ label: 'Quest type', value: 'World quest' }] : []),
    ...(document.dungeon ? [{ label: 'Dungeon', value: nameOf(document.dungeon) }] : []),
  ];
</script>

<article class="detail-page">
  <DetailFrame>
    <div slot="head"><TitleBlock name={document.ref.name} {registry}><StatStrip {stats} /></TitleBlock></div>
    <div slot="answer">
      <AnswerCard id="objectives" title="What to do">
        <QuestObjectivesSection objectives={document.objectives} {registry} />
        <QuestStartSection {document} {registry} />
      </AnswerCard>
    </div>
    <svelte:fragment slot="side">
      <QuestChainSection quests={document.chainQuests} currentKey={document.ref.key} chainName={facts.chain?.name} {registry} />
      {#if facts.requirements.length}<section><h2>Requirements</h2><Requirements requirements={facts.requirements} {registry} /></section>{/if}
      {#if sideFacts.length}<FactsGrid facts={sideFacts} />{/if}
      {#if facts.worldQuest}<section class="timing"><h2>World quest timing</h2><p>Active for {intervalText(facts.worldQuest.availableSeconds)}. Returns {intervalText(facts.worldQuest.cooldownAfterCompletionSeconds)} after completion or {intervalText(facts.worldQuest.cooldownAfterExpirySeconds)} after expiry, with up to {intervalText(facts.worldQuest.cooldownJitterSeconds)} extra wait. First appears after a random wait of up to {intervalText(facts.worldQuest.initialRollSeconds)}.</p></section>{/if}
    </svelte:fragment>
    <Sections>
      <QuestRewardsSection {document} {registry} />
      {#if document.unlocks.length}<Section id="unlocks" title="Unlocks" count={document.unlocks.length}><LinkGrid refs={document.unlocks} {registry} /></Section>{/if}
      {#if hasQuestText || document.worldChanges.length}
        <div class="c-disclosures">
          {#if hasQuestText}<QuestTextSection {document} />{/if}
          {#if document.worldChanges.length}<QuestWorldChangesSection changes={document.worldChanges} {registry} />{/if}
        </div>
      {/if}
    </Sections>
  </DetailFrame>
</article>

<style>
  h2 { margin-bottom: .5rem; color: var(--c-text-strong); font: 700 1.2rem/1.3 var(--c-serif); }
  .timing p { color: var(--c-text-dim); line-height: 1.5; }
</style>
