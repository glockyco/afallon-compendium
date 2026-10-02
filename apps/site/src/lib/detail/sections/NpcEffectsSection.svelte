<script lang="ts">
  import type { NpcAppliedEffect, PublicKindEntry } from '@afallon/contracts/public';
  import EntityLink from '../../EntityLink.svelte';
  import { formatNumber, intervalText, nameOf } from '../../format';
  import { omitAlways, planColumns, type RelationColumn } from '../relation-table';
  import RelationTable from '../RelationTable.svelte';
  import Section from '../Section.svelte';

  export let rows: NpcAppliedEffect[];
  export let name: string;
  export let registry: PublicKindEntry[];
  $: invitations = rows.filter((row) => row.via === 'Invitation');
  $: abilities = rows.filter((row) => row.via === 'NPC Ability');
  const duration = (seconds: number) => seconds > 0 && seconds % 3600 === 0
    ? `${formatNumber(seconds / 3600)} ${seconds === 3600 ? 'hour' : 'hours'}` : intervalText(seconds);
  const columns: RelationColumn<NpcAppliedEffect>[] = [
    { id: 'effect', label: 'Effect', value: (row) => nameOf(row.effect), sort: (row) => nameOf(row.effect) },
    { id: 'ability', label: 'Ability', value: (row) => row.ability && nameOf(row.ability), sort: (row) => row.ability && nameOf(row.ability) },
    { id: 'chance', label: 'Chance', numeric: true, value: (row) => row.chance, sort: (row) => row.chance },
    { id: 'target', label: 'Target', value: (row) => row.target, whenShared: omitAlways },
  ];
  $: planned = planColumns(columns, abilities);
  $: sharedTarget = abilities.length && abilities.every((row) => row.target === abilities[0]?.target) ? abilities[0]?.target : undefined;
</script>

{#if invitations.length}
  <Section id="joining" title="When they join">
    <div class="c-stack">
      {#each invitations as row (row.effect.key)}
        <p>{#if row.summons}Inviting {name} summons {nameOf(row.summons) === name ? 'them' : nameOf(row.summons)}{#if row.durationSeconds}{' '}for {duration(row.durationSeconds)}{/if}. See the <EntityLink ref={row.effect} {registry} /> effect.{:else}Inviting {name} gives the <EntityLink ref={row.effect} {registry} /> effect{#if row.durationSeconds}{' '}for {duration(row.durationSeconds)}{/if}.{/if}</p>
      {/each}
    </div>
  </Section>
{/if}
{#if abilities.length}
  <Section id="applied-effects" title="Effects they apply" count={abilities.length}>
    {#if sharedTarget && sharedTarget !== 'Target'}<p>{sharedTarget === 'Caster' ? 'These effects affect the NPC.' : `These effects target ${sharedTarget.toLowerCase()}.`}</p>{/if}
    <RelationTable columns={planned.columns} rows={abilities} label={`Effects applied by ${name}`}>
      <svelte:fragment slot="cell" let:row let:column>
        {#if column === 'effect'}<EntityLink ref={row.effect} {registry} />
        {:else if column === 'ability' && row.ability}<EntityLink ref={row.ability} {registry} />
        {:else if column === 'chance' && row.chance !== undefined}{formatNumber(row.chance)}%
        {:else if column === 'target'}{row.target ?? ''}{/if}
      </svelte:fragment>
    </RelationTable>
  </Section>
{/if}
