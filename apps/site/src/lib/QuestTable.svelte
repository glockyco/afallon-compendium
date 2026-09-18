<script lang="ts">
  import type { PublicKindEntry, QuestGivenRow, QuestLinkRow, QuestObjective, QuestObjectiveRow, QuestRewardRow } from '@afallon/contracts/public';
  import Card from './Card.svelte';
  import DataTable, { type TableColumn } from './DataTable.svelte';
  import EntityLink from './EntityLink.svelte';
  import MissingValue from './MissingValue.svelte';
  import { objectiveLabel } from './format';

  type QuestRelationRow = QuestGivenRow | QuestRewardRow | QuestLinkRow | QuestObjectiveRow;

  export let rows: QuestRelationRow[] = [];
  export let objectives: QuestObjective[] = [];
  export let registry: PublicKindEntry[];
  export let heading = 'Quests';
  export let limit: number | undefined = undefined;

  const columns: TableColumn[] = [
    { id: 'target', label: 'Target' },
    { id: 'role', label: 'Role or objective' },
    { id: 'count', label: 'Count', numeric: true },
  ];

  $: visibleRows = limit === undefined ? rows : rows.slice(0, limit);
  $: visibleObjectives = limit === undefined ? objectives : objectives.slice(0, Math.max(0, limit - visibleRows.length));
</script>

{#if rows.length > 0 || objectives.length > 0}
  <Card title={heading} count={rows.length + objectives.length}>
    <DataTable {columns}>
      {#each visibleRows as row}
        <tr>
          <td><EntityLink ref={row.counterpart} {registry} /></td>
          <td>
            {#if 'objective' in row}{row.objective.label}<small>{objectiveLabel(row.objective.type)}{#if row.objective.timeLimit !== undefined} · {row.objective.timeLimit}s{/if}{#if 'keepItems' in row.objective && row.objective.keepItems} · Keep items{/if}</small>
            {:else if 'role' in row}{row.role === 'gives' ? 'Quest giver' : 'Quest turn-in'}
            {:else if 'choice' in row}{row.choice ? 'Choose as reward' : 'Reward'}
            {:else}Given by quest{/if}
          </td>
          <td class="c-num">{#if 'objective' in row && 'count' in row.objective}{row.objective.count}{:else if 'count' in row}{row.count}{:else}<MissingValue explanation="No quantity is published" />{/if}</td>
        </tr>
      {/each}
      {#each visibleObjectives as objective}
        <tr>
          <td>{#if 'target' in objective}<EntityLink ref={objective.target} {registry} />{:else}Unsupported objective{/if}</td>
          <td>{objective.label}<small>{objectiveLabel(objective.type)}{#if objective.timeLimit !== undefined} · {objective.timeLimit}s{/if}{#if 'keepItems' in objective && objective.keepItems} · Keep items{/if}</small>{#if objective.description}<small>{objective.description}</small>{/if}</td>
          <td class="c-num">{#if 'count' in objective}{objective.count}{:else}<MissingValue explanation="No quantity is published" />{/if}</td>
        </tr>
      {/each}
    </DataTable>
  </Card>
{/if}
