<script lang="ts">
  import { base } from '$app/paths';
  import type { PublicKindEntry, PublicQuest, QuestStart, QuestWorldChange } from '@afallon/contracts/public';
  import Availability from './Availability.svelte';
  import Card from './Card.svelte';
  import DataTable, { type TableColumn } from './DataTable.svelte';
  import EntityHeader, { type HeaderBadge, type HeaderFact } from './EntityHeader.svelte';
  import EntityLink from './EntityLink.svelte';
  import Fact from './Fact.svelte';
  import FactGrid from './FactGrid.svelte';
  import LocationLinks from './LocationLinks.svelte';
  import MissingValue from './MissingValue.svelte';
  import ObjectiveText from './ObjectiveText.svelte';
  import QuestTable from './QuestTable.svelte';
  import RefList from './RefList.svelte';
  import Requirements from './Requirements.svelte';
  import { formatDuration, formatNumber, objectiveLabel } from './format';

  export let document: PublicQuest;
  export let registry: PublicKindEntry[];
  export let showRelations = false;
  export let limit: number | undefined = undefined;

  const objectiveColumns: TableColumn[] = [
    { id: 'task', label: 'Objective' }, { id: 'action', label: 'Action' },
    { id: 'count', label: 'Count', numeric: true }, { id: 'completion', label: 'Completed at' },
  ];
  const worldColumns: TableColumn[] = [
    { id: 'source', label: 'Source' }, { id: 'kind', label: 'Kind' },
    { id: 'availability', label: 'Availability' }, { id: 'locations', label: 'Locations' },
  ];
  const worldKindLabels: Record<QuestWorldChange['sourceKind'], string> = {
    creature: 'Creature', object: 'Object', container: 'Container', resource: 'Resource',
    craftingStation: 'Crafting station', worldZone: 'World quest zone',
  };

  $: facts = document.facts;
  $: chainQuests = document.chainQuests;
  $: chainStep = chainQuests.findIndex((quest) => quest.key === document.ref.key);
  $: badges = [
    ...(facts.chain ? [{ label: facts.chain.name, tone: 'accent' as const }] : []),
    ...(facts.worldQuest ? [{ label: 'World quest' }] : []),
    ...(facts.repeatable ? [{ label: 'Repeatable' }] : []),
  ] satisfies HeaderBadge[];
  $: headerFacts = [
    ...(chainStep >= 0 ? [{ label: 'Chain step', value: `${chainStep + 1} of ${chainQuests.length}` }] : []),
    ...(facts.levelRange ? [{ label: 'Level', value: `${facts.levelRange.min}–${facts.levelRange.max}` }] : []),
    ...(facts.levelRequirement !== undefined ? [{ label: 'Requires level', value: String(facts.levelRequirement) }] : []),
    ...(facts.experience !== undefined ? [{ label: 'Experience', value: formatNumber(facts.experience) }] : []),
  ] satisfies HeaderFact[];
  $: visibleStarts = limit === undefined ? document.starts : document.starts.slice(0, limit);
  $: visibleObjectives = limit === undefined ? document.objectives : document.objectives.slice(0, limit);
  $: visibleWorldChanges = limit === undefined ? document.worldChanges : document.worldChanges.slice(0, limit);
  $: visibleChain = limit === undefined ? chainQuests : chainQuests.slice(0, limit);
  // A zone delay names its zones only when the quest has several zone starts to tell apart.
  $: zoneStarts = document.starts.filter((start): start is Extract<QuestStart, { kind: 'worldZone' }> => start.kind === 'worldZone');
</script>

<article class="document">
  <EntityHeader
    name={document.ref.name}
    art={document.art.icon ?? document.ref.icon}
    fallbackIcon={registry.find((entry) => entry.kind === 'quests')?.icon}
    {badges}
    facts={headerFacts}
    description={document.description}
  />

  <div class="c-stack">
    <div class="c-card-grid">
      <Card title="Start" count={document.starts.length || undefined}>
        {#if document.starts.length}
          <ul class="start-list">
            {#each visibleStarts as start}
              <li>
                {#if start.kind === 'npc'}
                  <span>Talk to <EntityLink ref={start.npc} {registry} /></span>
                  {#if start.areas.length}
                    <span class="detail">{start.areas.join(', ')}</span>
                    {#if start.npc.key !== null}<a class="c-link detail" href={`${base}/?entity=${encodeURIComponent(start.npc.key)}`}>View on the atlas</a>{/if}
                  {/if}
                {:else if start.kind === 'worldZone'}
                  Enter an active world quest zone
                  <LocationLinks placements={start.placements} />
                  <Availability rules={start.availability} {registry} />
                  {#if start.pool.length}
                    <span class="detail">Also offered here:</span>
                    <ul class="reference-list">{#each start.pool as quest}<li><EntityLink ref={quest} {registry} /></li>{/each}</ul>
                  {/if}
                {:else}
                  Interact with {start.label ?? 'object'}
                  <LocationLinks placements={start.placements} />
                  <Availability rules={start.availability} {registry} />
                {/if}
              </li>
            {/each}
          </ul>
        {:else}<MissingValue explanation="No start is authored" />{/if}
      </Card>
      <Card title="Turn-in">
        {#if document.turnIns.length}
          <ul class="reference-list">{#each document.turnIns as turnIn}<li><EntityLink ref={turnIn} {registry} /></li>{/each}</ul>
        {:else if facts.turnInWithoutNpc}No NPC required
        {:else if facts.worldQuest}<MissingValue explanation="The authored world quest names no turn-in NPC" />
        {:else}<MissingValue explanation="No turn-in is published" />{/if}
      </Card>
      {#if document.dungeon}<Card title="Dungeon"><EntityLink ref={document.dungeon} {registry} /></Card>{/if}
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

    {#if facts.worldQuest}
      <Card title="World quest timing">
        <FactGrid wide>
          <Fact label="Active duration">{formatDuration(facts.worldQuest.availableSeconds)}</Fact>
          <Fact label="Return after completion">{formatDuration(facts.worldQuest.cooldownAfterCompletionSeconds)} + up to {formatDuration(facts.worldQuest.cooldownJitterSeconds)} jitter</Fact>
          <Fact label="Return after expiry">{formatDuration(facts.worldQuest.cooldownAfterExpirySeconds)} + up to {formatDuration(facts.worldQuest.cooldownJitterSeconds)} jitter</Fact>
          <Fact label="Initial wait">Up to {formatDuration(facts.worldQuest.initialRollSeconds)}</Fact>
          {#each zoneStarts as start}
            {#if start.zoneDelaySeconds !== undefined}
              <Fact label="Zone delay before next pick">{formatDuration(start.zoneDelaySeconds)}{#if zoneStarts.length > 1} · {[...new Set(start.placements.map((placement) => placement.label))].join(', ')}{/if}</Fact>
            {/if}
          {/each}
        </FactGrid>
      </Card>
    {/if}

    {#if showRelations}
      {#if document.objectives.length}
        <Card title="Objectives" count={document.objectives.length}>
          <DataTable columns={objectiveColumns}>
            {#each visibleObjectives as objective}
              <tr>
                <td><ObjectiveText {objective} /></td>
                <td>{#if 'target' in objective}{objectiveLabel(objective.type)} <EntityLink ref={objective.target} {registry} />{/if}</td>
                <td class="c-num">{#if 'count' in objective}{objective.count}{/if}</td>
                <td>{#each objective.completions as completion}<div class="completion">{completion.label ?? 'Interactive object'}<LocationLinks placements={completion.placements} /><Availability rules={completion.availability} {registry} /></div>{/each}</td>
              </tr>
            {/each}
          </DataTable>
        </Card>
      {/if}
      <QuestTable rows={document.itemsGiven} {registry} heading="Items given" counterpartLabel="Item" {limit} />
      <QuestTable rows={document.rewards} {registry} heading="Rewards" counterpartLabel="Reward" {limit} />
      <QuestTable rows={document.rewardChoices} {registry} heading="Choose one" counterpartLabel="Reward" {limit} />

      {#if chainQuests.length}
        <Card title="Quest chain" count={chainQuests.length}>
          <ol class="chain">
            {#each visibleChain as quest}<li>{#if quest.key === document.ref.key}<strong aria-current="step">{quest.name}</strong>{:else}<EntityLink ref={quest} {registry} />{/if}</li>{/each}
          </ol>
        </Card>
      {/if}
      <RefList title="Unlocks" refs={document.unlocks} {registry} {limit} />
      {#if document.worldChanges.length}
        <Card title="World changes" count={document.worldChanges.length}>
          <DataTable columns={worldColumns}>
            {#each visibleWorldChanges as change}
              <tr>
                <td>{#if change.label}{change.label}{/if}{#each change.subjects as subject}<div><EntityLink ref={subject} {registry} /></div>{/each}</td>
                <td>{worldKindLabels[change.sourceKind]}</td>
                <td><Availability rules={change.availability} {registry} /></td>
                <td><LocationLinks placements={change.placements} /></td>
              </tr>
            {/each}
          </DataTable>
        </Card>
      {/if}
    {/if}
  </div>
</article>

<style>
  .start-list, .reference-list { display: grid; gap: .45rem; margin: 0; padding: 0; list-style: none; }
  .start-list > li { display: grid; justify-items: start; gap: .35rem; font-size: .85rem; }
  .detail { display: block; color: var(--c-text-dim); font-size: .78rem; }
  .chain { display: grid; gap: .4rem; margin: 0; padding-left: 1.4rem; }
  .chain li { font-size: .85rem; }
  .chain strong { color: var(--c-text); }
  .completion { display: grid; gap: .25rem; }
  .completion + .completion { margin-top: .5rem; }
</style>
