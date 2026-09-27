<script lang="ts">
  import type { PublicKindEntry } from '@afallon/contracts/public';
  import EntityLink from '../../EntityLink.svelte';
  import ObjectiveText from '../../ObjectiveText.svelte';
  import { nameOf } from '../../format';
  import type { QuestRow } from '../quest-rows';
  import { omitWhenShared, planColumns, type RelationColumn } from '../relation-table';
  import RelationTable from '../RelationTable.svelte';
  import Section from '../Section.svelte';

  export let id: string;
  export let title: string;
  /** The heading of the role column, such as "Role" or "Given as". */
  export let roleLabel: string;
  export let rows: QuestRow[];
  export let registry: PublicKindEntry[];

  const columns: RelationColumn<QuestRow>[] = [
    { id: 'name', label: 'Quest', value: (row) => nameOf(row.quest), sort: (row) => nameOf(row.quest) },
    { id: 'role', label: roleLabel, value: (row) => [...row.roles, ...row.objectives.map((objective) => objective.text)].join('\n') || undefined },
    { id: 'count', label: 'Count', numeric: true, value: (row) => row.count, sort: (row) => row.count, whenShared: omitWhenShared(1) },
  ];

  $: plan = planColumns(columns, rows);
</script>

{#if rows.length}
  <Section {id} {title} icon="quest" count={rows.length}>
    <RelationTable columns={plan.columns} {rows} label={title} sort={{ id: 'name', dir: 'asc' }}>
      <svelte:fragment slot="cell" let:row let:column>
        {#if column === 'name'}<EntityLink ref={row.quest} {registry} />
        {:else if column === 'role'}
          <span class="roles">
            {#if row.roles.length}<span>{row.roles.join(', ')}</span>{/if}
            {#each row.objectives as objective}<span><ObjectiveText {objective} /></span>{/each}
          </span>
        {:else if column === 'count'}{row.count ?? ''}{/if}
      </svelte:fragment>
    </RelationTable>
  </Section>
{/if}

<style>
  .roles { display: grid; gap: .2rem; }
</style>
