<script lang="ts">
  import type { ExperienceRow } from '@afallon/contracts/public';
  import { planColumns, type RelationColumn } from '../relation-table';
  import RelationTable from '../RelationTable.svelte';
  import Section from '../Section.svelte';

  export let rows: ExperienceRow[];

  // The game stores, for each level, the experience that takes a character from that level to the next one.
  const columns: RelationColumn<ExperienceRow>[] = [
    { id: 'level', label: 'Level', numeric: true, value: (row) => row.level, sort: (row) => row.level },
    { id: 'experience', label: 'Experience to next level', numeric: true, value: (row) => row.experience, sort: (row) => row.experience },
  ];
  $: plan = planColumns(columns, rows);
</script>

{#if rows.length}
  <Section id="experience" title="Experience" icon="chain" count={rows.length}>
    <RelationTable columns={plan.columns} {rows} label="Experience">
      <svelte:fragment slot="cell" let:row let:column>{#if column === 'level'}{row.level}{:else}{row.experience.toLocaleString('en-US')}{/if}</svelte:fragment>
    </RelationTable>
  </Section>
{/if}
