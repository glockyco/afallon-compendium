<script lang="ts">
  import type { PublicKindEntry, QuestGivenRow, QuestLinkRow, QuestObjectiveRow, QuestRewardRow } from '@afallon/contracts/public';
  import Card from './Card.svelte';
  import DataTable, { type TableColumn } from './DataTable.svelte';
  import EntityLink from './EntityLink.svelte';
  import ObjectiveText from './ObjectiveText.svelte';

  type QuestRelationRow = QuestGivenRow | QuestRewardRow | QuestLinkRow | QuestObjectiveRow;

  export let rows: QuestRelationRow[];
  export let registry: PublicKindEntry[];
  export let heading = 'Quests';
  export let counterpartLabel = 'Entity';
  export let limit: number | undefined = undefined;

  $: columns = [
    { id: 'target', label: counterpartLabel },
    { id: 'role', label: 'Role or objective' },
    { id: 'count', label: 'Count', numeric: true },
  ] satisfies TableColumn[];

  $: visibleRows = limit === undefined ? rows : rows.slice(0, limit);
</script>

{#if rows.length > 0}
  <Card title={heading} count={rows.length}>
    <DataTable {columns}>
      {#each visibleRows as row}
        <tr>
          <td><EntityLink ref={row.counterpart} {registry} /></td>
          <td>
            {#if 'objective' in row}<ObjectiveText objective={row.objective} />
            {:else if 'role' in row}{row.role === 'gives' ? 'Quest giver' : 'Quest turn-in'}
            {:else if 'choice' in row}{row.choice ? 'Choose as reward' : 'Reward'}
            {:else}Given by quest{/if}
          </td>
          <td class="c-num">{#if 'objective' in row && 'count' in row.objective}{row.objective.count}{:else if 'count' in row}{row.count}{/if}</td>
        </tr>
      {/each}
    </DataTable>
  </Card>
{/if}
