<script lang="ts">
  import type { PublicKindEntry, PublicQuest } from '@afallon/contracts/public';
  import Card from './Card.svelte';
  import EntityHeader, { type HeaderBadge, type HeaderFact } from './EntityHeader.svelte';
  import EntityLink from './EntityLink.svelte';
  import Fact from './Fact.svelte';
  import FactGrid from './FactGrid.svelte';
  import MissingValue from './MissingValue.svelte';
  import QuestTable from './QuestTable.svelte';
  import Requirements from './Requirements.svelte';
  import { formatNumber } from './format';

  export let document: PublicQuest;
  export let registry: PublicKindEntry[];
  export let compact = false;
  export let showRelations = false;
  export let limit: number | undefined = undefined;

  $: facts = document.facts;
  $: badges = [
    ...(facts.chain ? [{ label: facts.chain.name, tone: 'accent' as const }] : []),
    ...(facts.repeatable ? [{ label: 'Repeatable' }] : []),
  ] satisfies HeaderBadge[];
  $: headerFacts = [
    ...(facts.chain ? [{ label: 'Chain step', value: String(facts.chain.order) }] : []),
    ...(facts.levelRequirement !== undefined ? [{ label: 'Requires level', value: String(facts.levelRequirement) }] : []),
    ...(facts.experience !== undefined ? [{ label: 'Experience', value: formatNumber(facts.experience) }] : []),
  ] satisfies HeaderFact[];
  $: chainLength = (document.previous ? 1 : 0) + (document.next ? 1 : 0) + document.chainQuests.length;
  $: chainQuests = limit === undefined ? document.chainQuests : document.chainQuests.slice(0, limit);
</script>

<article class="document" class:c-compact={compact}>
  <EntityHeader
    name={document.ref.name}
    art={document.art.icon ?? document.ref.icon}
    fallbackIcon={registry.find((entry) => entry.kind === 'quests')?.icon}
    {badges}
    facts={headerFacts}
    description={document.description}
    {compact}
  />

  <div class="c-stack">
    <div class="c-card-grid">
      <Card title="Facts" wide>
        <FactGrid>
          <Fact label="Quest giver">
            {#if document.givers.length}{#each document.givers as giver}<span class="line"><EntityLink ref={giver} {registry} /></span>{/each}{:else}<MissingValue explanation="No quest giver is published" />{/if}
          </Fact>
          <Fact label="Turn-in">
            {#if document.turnIns.length}{#each document.turnIns as turnIn}<span class="line"><EntityLink ref={turnIn} {registry} /></span>{/each}{:else if facts.turnInWithoutNpc}No NPC required{:else}<MissingValue explanation="No turn-in is published" />{/if}
          </Fact>
        </FactGrid>
      </Card>

      {#if facts.requirements.length}<Card title="Requirements"><Requirements requirements={facts.requirements} {registry} /></Card>{/if}
    </div>

    {#if facts.objectiveText || facts.completedDescription}
      <Card title="Quest text">
        <FactGrid wide>
          {#if facts.objectiveText}<Fact label="Objective">{facts.objectiveText}</Fact>{/if}
          {#if facts.completedDescription}<Fact label="On completion">{facts.completedDescription}</Fact>{/if}
        </FactGrid>
      </Card>
    {/if}

    {#if showRelations}
      <QuestTable objectives={document.objectives} {registry} heading="Objectives" {limit} />
      <QuestTable rows={document.itemsGiven} {registry} heading="Items given" {limit} />
      <QuestTable rows={document.rewards} {registry} heading="Rewards" {limit} />
      <QuestTable rows={document.rewardChoices} {registry} heading="Choose a reward" {limit} />

      {#if chainLength > 0}
        <Card title="Quest chain" count={chainLength}>
          <ul class="chain">
            {#if document.previous}<li><span class="step">Previous</span><EntityLink ref={document.previous} {registry} /></li>{/if}
            {#each chainQuests as quest}<li><EntityLink ref={quest} {registry} /></li>{/each}
            {#if document.next}<li><span class="step">Next</span><EntityLink ref={document.next} {registry} /></li>{/if}
          </ul>
        </Card>
      {/if}
    {/if}
  </div>
</article>

<style>
  .line { display: block; }
  .line + .line { margin-top: .25rem; }
  .chain { display: grid; gap: .4rem; margin: 0; padding: 0; list-style: none; }
  .chain li { display: flex; flex-wrap: wrap; align-items: center; gap: .5rem; font-size: .85rem; }
  .step { color: var(--c-text-dim); font-size: .7rem; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; }
</style>
