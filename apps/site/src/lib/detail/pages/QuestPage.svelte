<script lang="ts">
  import type { PublicKindEntry, PublicQuest } from '@afallon/contracts/public';
  import { formatNumber, intervalText, levelText } from '../../format';
  import Requirements from '../../Requirements.svelte';
  import AnswerCard from '../AnswerCard.svelte';
  import DetailFrame from '../DetailFrame.svelte';
  import LinkGrid from '../LinkGrid.svelte';
  import FactList from '../FactList.svelte';
  import FactRow from '../FactRow.svelte';
  import FactsCard from '../FactsCard.svelte';
  import HowItWorks from '../HowItWorks.svelte';
  import SideCard from '../SideCard.svelte';
  import DetailsDisclosure from '../DetailsDisclosure.svelte';
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
  $: experienceGuide = document.placedRules.find((rule) => rule.target === 'experience');
  $: titleFacts = [
    ...(facts.levelRange ? [{ label: 'Levels', text: levelText(facts.levelRange) }] : []),
    ...(facts.chain && step >= 0 && document.chainQuests.length > 1 ? [{ label: 'Chain Step', text: `${step + 1} of ${document.chainQuests.length}` }] : []),
    ...(document.dungeon ? [{ label: 'Dungeon', refs: [document.dungeon] }] : []),
  ];
  $: sideFacts = [
    ...(facts.experience && facts.worldQuest ? [{ label: 'Experience', value: formatNumber(facts.experience), ...(experienceGuide ? { guide: experienceGuide } : {}) }] : []),
    ...(facts.levelRequirement !== undefined ? [{ label: 'Minimum level', value: String(facts.levelRequirement) }] : []),
    ...(facts.repeatable ? [{ label: 'Repeatable', value: 'Yes' }] : []),
    ...(facts.worldQuest ? [{ label: 'Active for', value: intervalText(facts.worldQuest.availableSeconds) }] : []),
  ];
  $: hasSide = document.chainQuests.length > 1 || facts.requirements.length > 0 || sideFacts.length > 1;
</script>

<article class="detail-page">
  <DetailFrame side={hasSide}>
    <div slot="head"><TitleBlock name={document.ref.name} typeLine={facts.worldQuest ? 'World Quest' : 'Quest'} facts={[...titleFacts, ...(!hasSide && sideFacts.length ? [{ label: sideFacts[0]?.label === 'Minimum level' ? 'Minimum Level' : sideFacts[0]?.label === 'Active for' ? 'Active For' : sideFacts[0]?.label, text: sideFacts[0]?.value ?? '' }] : [])]} {registry} /></div>
    <div slot="answer" class="answers">
      <AnswerCard id="objectives" title="What to do">
        <QuestObjectivesSection objectives={document.objectives} {registry} />
        <QuestStartSection {document} {registry} />
      </AnswerCard>
    </div>
    <svelte:fragment slot="side">
      <QuestChainSection quests={document.chainQuests} currentKey={document.ref.key} chainName={facts.chain?.name} {registry} />
      {#if facts.requirements.length}<SideCard title="Requirements"><Requirements requirements={facts.requirements} {registry} /></SideCard>{/if}
      {#if sideFacts.length > 1}<FactsCard facts={sideFacts} />
      {:else if sideFacts.length}<p class="single-fact">{sideFacts[0]?.label}: {sideFacts[0]?.value}</p>{/if}
    </svelte:fragment>
    <Sections>
      <QuestRewardsSection {document} {registry} showExperience={!facts.worldQuest} />
      {#if document.unlocks.length}<Section id="unlocks" title="Unlocks" count={document.unlocks.length}><LinkGrid refs={document.unlocks} {registry} /></Section>{/if}
      {#if facts.worldQuest}
        <DetailsDisclosure id="world-quest-timing" title="When it appears" summary="World quest timing">
          <FactList>
            <FactRow label="Active for">{intervalText(facts.worldQuest.availableSeconds)}</FactRow>
            <FactRow label="After completion">{intervalText(facts.worldQuest.cooldownAfterCompletionSeconds)} before another roll</FactRow>
            <FactRow label="After expiry">{intervalText(facts.worldQuest.cooldownAfterExpirySeconds)} before another roll</FactRow>
            <FactRow label="Extra wait">Up to {intervalText(facts.worldQuest.cooldownJitterSeconds)} on either cooldown</FactRow>
            <FactRow label="First roll">Within {intervalText(facts.worldQuest.initialRollSeconds)} of the zone starting</FactRow>
          </FactList>
          <HowItWorks guide={{ key: 'mechanics:world-quests', kind: 'mechanics', name: 'World Quests', slug: 'world-quests' }} section="availability" label="How World Quests appear" />
        </DetailsDisclosure>
      {/if}
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
  .answers { display: grid; gap: 1rem; }
  .single-fact { margin: 0; color: var(--c-text-dim); font-size: var(--c-text-small); }
</style>
