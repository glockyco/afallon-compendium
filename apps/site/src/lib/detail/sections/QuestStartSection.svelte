<script lang="ts">
  import type { PublicKindEntry, PublicQuest, QuestStart, QuestTurnIn } from '@afallon/contracts/public';
  import Availability from '../../Availability.svelte';
  import EntityLink from '../../EntityLink.svelte';
  import LocationLinks from '../../LocationLinks.svelte';
  import Requirements from '../../Requirements.svelte';
  import { intervalText, nameOf } from '../../format';
  import { entityOnMap } from '../../map-links';
  import FactList from '../FactList.svelte';
  import FactRow from '../FactRow.svelte';
  import { questRoleText } from '../quest-rows';
  import { planColumns, type RelationColumn } from '../relation-table';
  import RelationTable from '../RelationTable.svelte';
  import Section from '../Section.svelte';

  export let document: PublicQuest;
  export let registry: PublicKindEntry[];

  type Person = { npc: QuestTurnIn['npc']; areas: string[]; starts: boolean; turnsIn: boolean };
  const role = (person: Person) => questRoleText(person.starts, person.turnsIn) ?? '';

  function peopleFor(quest: PublicQuest): Person[] {
    const people = new Map<string, Person>();
    function add(npc: QuestTurnIn['npc'], areas: string[], starts: boolean): void {
      const id = npc.key === null ? `label:${npc.label}` : `key:${npc.key}`;
      const person = people.get(id);
      if (person) {
        person.areas = [...new Set([...person.areas, ...areas])].sort((a, b) => a.localeCompare(b));
        person.starts ||= starts;
        person.turnsIn ||= !starts;
      } else {
        people.set(id, { npc, areas: [...new Set(areas)].sort((a, b) => a.localeCompare(b)), starts, turnsIn: !starts });
      }
    }
    for (const start of quest.starts) if (start.kind === 'npc') add(start.npc, start.areas, true);
    for (const turnIn of quest.turnIns) add(turnIn.npc, turnIn.areas, false);
    return [...people.values()];
  }

  const columns: RelationColumn<Person>[] = [
    { id: 'character', label: 'Character', value: (person) => nameOf(person.npc), sort: (person) => nameOf(person.npc) },
    { id: 'role', label: 'Role', value: role },
    { id: 'areas', label: 'Areas', value: (person) => person.areas.join(', ') || undefined },
    { id: 'map', label: 'Map', value: (person) => person.npc.key === null ? undefined : 'View on map' },
  ];

  $: people = peopleFor(document);
  $: zones = document.starts.filter((start): start is Extract<QuestStart, { kind: 'worldZone' }> => start.kind === 'worldZone');
  $: objects = document.starts.filter((start): start is Extract<QuestStart, { kind: 'object' }> => start.kind === 'object');
  $: plan = planColumns(columns, people);
  $: hasContent = document.facts.requirements.length > 0 || people.length > 0 || zones.length > 0 || objects.length > 0 || document.facts.turnInWithoutNpc || Boolean(document.facts.worldQuest);
  $: rowCount = people.length + zones.length + objects.length;
</script>

{#if hasContent}
  <Section id="start-and-turn-in" title="Start and turn-in" icon="start" count={rowCount || undefined}>
    {#if document.facts.requirements.length}
      <div class="requirements"><FactList><FactRow label="Requirements"><Requirements requirements={document.facts.requirements} {registry} /></FactRow></FactList></div>
    {/if}

    {#if people.length}
      <RelationTable columns={plan.columns} rows={people} label="Quest characters">
        <svelte:fragment slot="cell" let:row let:column>
          {#if column === 'character'}<EntityLink ref={row.npc} {registry} />
          {:else if column === 'role'}{role(row)}
          {:else if column === 'areas'}{row.areas.join(', ')}
          {:else if column === 'map' && row.npc.key !== null}<a class="c-link" href={entityOnMap(row.npc.key)}>View on map</a>{/if}
        </svelte:fragment>
      </RelationTable>
    {/if}

    {#each zones as zone}
      <div class="start-source">
        <h3>Enter an active world quest zone</h3>
        <FactList>
          <FactRow label="Locations"><LocationLinks placements={zone.placements} /></FactRow>
          {#if zone.availability.length}<FactRow label="Availability"><Availability rules={zone.availability} {registry} /></FactRow>{/if}
          {#if zone.pool.length}<FactRow label="Other quests here"><span class="refs">{#each zone.pool as quest}<span><EntityLink ref={quest} {registry} /></span>{/each}</span></FactRow>{/if}
          {#if zone.zoneDelaySeconds !== undefined}<FactRow label="Wait before next zone quest">{intervalText(zone.zoneDelaySeconds)}</FactRow>{/if}
        </FactList>
      </div>
    {/each}

    {#if document.facts.worldQuest}
      <div class="timing">
        <FactList title="World Quest timing">
          <FactRow label="Active for">{intervalText(document.facts.worldQuest.availableSeconds)}</FactRow>
          <FactRow label="Returns after completion">{intervalText(document.facts.worldQuest.cooldownAfterCompletionSeconds)}</FactRow>
          <FactRow label="Returns after expiry">{intervalText(document.facts.worldQuest.cooldownAfterExpirySeconds)}</FactRow>
          <FactRow label="Random extra wait">Up to {intervalText(document.facts.worldQuest.cooldownJitterSeconds)}, added to either return time</FactRow>
          <FactRow label="First appearance">After a random wait of up to {intervalText(document.facts.worldQuest.initialRollSeconds)}</FactRow>
        </FactList>
      </div>
    {/if}

    {#each objects as object}
      <div class="start-source">
        <h3>Use {object.label ?? 'an object'}</h3>
        <FactList>
          <FactRow label="Locations"><LocationLinks placements={object.placements} /></FactRow>
          {#if object.availability.length}<FactRow label="Availability"><Availability rules={object.availability} {registry} /></FactRow>{/if}
        </FactList>
      </div>
    {/each}

    {#if !document.turnIns.length && document.facts.worldQuest}
      <p class="completion-note">The world quest names no turn-in character.</p>
    {:else if document.facts.turnInWithoutNpc}
      <p class="completion-note">The quest completes without a turn-in character.</p>
    {/if}
  </Section>
{/if}

<style>
  .requirements { margin-bottom: .8rem; }
  .start-source:not(:first-child), .timing:not(:first-child) { padding-top: .9rem; margin-top: .9rem; border-top: 1px solid var(--c-line-soft); }
  .start-source h3 { margin: 0 0 .6rem; color: var(--c-text); font-size: var(--c-text-body); font-weight: 600; }
  .refs { display: grid; gap: .25rem; }
  .completion-note { margin: .9rem 0 0; color: var(--c-text-dim); font-size: var(--c-text-body); }
</style>
