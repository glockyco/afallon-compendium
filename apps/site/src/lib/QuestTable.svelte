<script lang="ts">
  import type { PublicKindEntry, QuestGivenRow, QuestLinkRow, QuestObjective, QuestObjectiveRow, QuestRewardRow } from '@afallon/contracts/public';
  import EntityLink from './EntityLink.svelte';
  import MissingValue from './MissingValue.svelte';

  type QuestRelationRow = QuestGivenRow | QuestRewardRow | QuestLinkRow | QuestObjectiveRow;

  export let rows: QuestRelationRow[] = [];
  export let objectives: QuestObjective[] = [];
  export let registry: PublicKindEntry[];
  export let heading = 'Quests';
  export let limit: number | undefined = undefined;

  $: visibleRows = (limit === undefined ? rows : rows.slice(0, limit));
  $: visibleObjectives = limit === undefined ? objectives : objectives.slice(0, Math.max(0, limit - visibleRows.length));
</script>

{#if visibleRows.length > 0 || visibleObjectives.length > 0}
  <section><h2>{heading}</h2><div class="scroll"><table><thead><tr><th>Target</th><th>Role or objective</th><th>Count</th></tr></thead><tbody>
    {#each visibleRows as row}
      <tr><td><EntityLink ref={row.counterpart} {registry} /></td><td>{#if 'objective' in row}{row.objective.label}<small>{row.objective.type}{#if row.objective.timeLimit !== undefined} · {row.objective.timeLimit}s{/if}{#if 'keepItems' in row.objective && row.objective.keepItems} · Keep items{/if}</small>{:else if 'role' in row}{row.role === 'gives' ? 'Quest giver' : 'Quest turn-in'}{:else if 'choice' in row}{row.choice ? 'Choose as reward' : 'Reward'}{:else}Given by quest{/if}</td><td>{#if 'objective' in row && 'count' in row.objective}{row.objective.count}{:else if 'count' in row}{row.count}{:else}<MissingValue explanation="No quantity is published" />{/if}</td></tr>
    {/each}
    {#each visibleObjectives as objective}
      <tr><td>{#if 'target' in objective}<EntityLink ref={objective.target} {registry} />{:else}Unsupported objective{/if}</td><td>{objective.label}<small>{objective.type}{#if objective.timeLimit !== undefined} · {objective.timeLimit}s{/if}{#if 'keepItems' in objective && objective.keepItems} · Keep items{/if}</small>{#if objective.description}<small>{objective.description}</small>{/if}</td><td>{#if 'count' in objective}{objective.count}{:else}<MissingValue explanation="No quantity is published" />{/if}</td></tr>
    {/each}
  </tbody></table></div></section>
{/if}

<style>
  section { margin-top: 1.25rem; } h2 { margin: 0 0 .55rem; color: #eee9dd; font: 600 1rem/1.3 Georgia, serif; } .scroll { overflow-x: auto; }
  table { width: 100%; border-collapse: collapse; font-size: .82rem; } th, td { padding: .55rem; border-bottom: 1px solid #3b3c38; text-align: left; vertical-align: top; }
  th { color: #bdb8ad; font-size: .68rem; letter-spacing: .06em; text-transform: uppercase; }
  small { display: block; margin-top: .2rem; color: #aaa69d; }
</style>
