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
  /** A table whose heading already names the role of every row, such as "Rewards", shows no role column. */
  export let showRole = true;

  function roleText(row: QuestGivenRow | QuestRewardRow | QuestLinkRow): string {
    if ('role' in row) return row.role === 'gives' ? 'Quest giver' : 'Quest turn-in';
    if ('choice' in row) return row.choice ? 'Choose as reward' : 'Reward';
    return 'Given by quest';
  }

  function countValue(row: QuestRelationRow): number | undefined {
    if ('objective' in row) return 'count' in row.objective ? row.objective.count : undefined;
    return 'count' in row ? row.count : undefined;
  }

  $: visibleRows = limit === undefined ? rows : rows.slice(0, limit);
  // A count of one says nothing, so the column appears only when some row has another count.
  $: showCount = visibleRows.some((row) => { const count = countValue(row); return count !== undefined && count !== 1; });
  $: columns = [
    { id: 'target', label: counterpartLabel },
    ...(showRole ? [{ id: 'role', label: 'Role or objective' }] : []),
    ...(showCount ? [{ id: 'count', label: 'Count', numeric: true }] : []),
  ] satisfies TableColumn[];
</script>

{#if rows.length > 0}
  <Card title={heading} count={rows.length}>
    <DataTable {columns}>
      {#each visibleRows as row}
        <tr>
          <td><EntityLink ref={row.counterpart} {registry} /></td>
          {#if showRole}
            <td>
              {#if 'objective' in row}<ObjectiveText objective={row.objective} />
              {:else}{roleText(row)}{/if}
            </td>
          {/if}
          {#if showCount}<td class="c-num">{countValue(row) ?? ''}</td>{/if}
        </tr>
      {/each}
    </DataTable>
  </Card>
{/if}
