<script lang="ts">
  import type { PublicKindEntry, PublicQuest } from '@afallon/contracts/public';
  import { levelText } from '../../format';
  import TitleBlock, { type TitleFact } from '../TitleBlock.svelte';
  import LinkSection from '../sections/LinkSection.svelte';
  import QuestChainSection from '../sections/QuestChainSection.svelte';
  import QuestStartSection from '../sections/QuestStartSection.svelte';
  import QuestObjectivesSection from '../sections/QuestObjectivesSection.svelte';
  import QuestRewardsSection from '../sections/QuestRewardsSection.svelte';
  import QuestTextSection from '../sections/QuestTextSection.svelte';
  import QuestWorldChangesSection from '../sections/QuestWorldChangesSection.svelte';
  import Sections from '../Sections.svelte';

  export let document: PublicQuest;
  export let registry: PublicKindEntry[];

  $: facts = document.facts;
  $: step = document.chainQuests.findIndex((quest) => quest.key === document.ref.key);
  $: titleFacts = [
    ...(facts.levelRange ? [{ label: 'Quest level', text: levelText(facts.levelRange) }] : []),
    ...(facts.levelRequirement !== undefined ? [{ label: 'Minimum level', text: String(facts.levelRequirement) }] : []),
    ...(facts.chain && step >= 0 ? [{ label: 'Chain', text: `${facts.chain.name}, step ${step + 1} of ${document.chainQuests.length}` }] : []),
    ...(facts.worldQuest ? [{ text: 'World Quest' }] : []),
    ...(facts.repeatable ? [{ text: 'Repeatable' }] : []),
    ...(document.dungeon ? [{ label: 'Dungeon', refs: [document.dungeon] }] : []),
  ] satisfies TitleFact[];
</script>

<article class="detail-page">
  <TitleBlock name={document.ref.name} facts={titleFacts} {registry} />
  <Sections>
    <QuestChainSection quests={document.chainQuests} currentKey={document.ref.key} {registry} />
    <QuestStartSection {document} {registry} />
    <QuestObjectivesSection objectives={document.objectives} {registry} />
    <QuestRewardsSection {document} {registry} />
    <QuestTextSection {document} />
    <QuestWorldChangesSection changes={document.worldChanges} {registry} />
    <LinkSection id="unlocks" title="Unlocks" icon="unlock" refs={document.unlocks} {registry} />
  </Sections>
</article>
