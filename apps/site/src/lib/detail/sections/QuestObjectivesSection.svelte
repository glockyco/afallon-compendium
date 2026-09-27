<script lang="ts">
  import type { PublicKindEntry, QuestObjective } from '@afallon/contracts/public';
  import Availability from '../../Availability.svelte';
  import EntityLink from '../../EntityLink.svelte';
  import LocationLinks from '../../LocationLinks.svelte';
  import ObjectiveText from '../../ObjectiveText.svelte';
  import { planColumns, type RelationColumn } from '../relation-table';
  import RelationTable from '../RelationTable.svelte';
  import Section from '../Section.svelte';

  export let objectives: QuestObjective[];
  export let registry: PublicKindEntry[];

  const columns: RelationColumn<QuestObjective>[] = [
    { id: 'objective', label: 'Objective', value: (objective) => objective.text },
    { id: 'count', label: 'Count', numeric: true, value: (objective) => 'count' in objective ? objective.count : undefined },
    { id: 'completion', label: 'Completed at', value: (objective) => objective.completions.length ? JSON.stringify(objective.completions) : undefined },
  ];
  $: plan = planColumns(columns, objectives);
</script>

{#if objectives.length}
  <Section id="objectives" title="Objectives" icon="objective" count={objectives.length}>
    <RelationTable columns={plan.columns} rows={objectives} label="Quest objectives">
      <svelte:fragment slot="cell" let:row let:column>
        {#if column === 'objective'}
          <ObjectiveText objective={row} />
          {#if 'target' in row}<div class="target"><EntityLink ref={row.target} {registry} /></div>{/if}
        {:else if column === 'count'}{#if 'count' in row}{row.count}{/if}
        {:else if column === 'completion'}
          {#each row.completions as completion}
            <div class="completion">
              <div>{completion.label ?? 'Interactive object'}</div>
              {#if completion.placements.length}<LocationLinks placements={completion.placements} />{/if}
              {#if completion.availability.length}<Availability rules={completion.availability} {registry} />{/if}
            </div>
          {/each}
        {/if}
      </svelte:fragment>
    </RelationTable>
  </Section>
{/if}

<style>
  .target { margin-top: .25rem; }
  .completion + .completion { margin-top: .55rem; }
</style>
