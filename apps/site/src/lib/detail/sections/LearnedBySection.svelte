<script lang="ts">
  import type { AbilityVersion, LearnerRow, PublicKindEntry } from '@afallon/contracts/public';
  import EntityLink from '../../EntityLink.svelte';
  import { nameOf } from '../../format';
  import Requirements from '../../Requirements.svelte';
  import { planColumns, type RelationColumn } from '../relation-table';
  import RelationTable from '../RelationTable.svelte';
  import Section from '../Section.svelte';

  export let versions: AbilityVersion[];
  export let registry: PublicKindEntry[];

  type Row = { learner: LearnerRow; version: number };
  const columns: RelationColumn<Row>[] = [
    { id: 'version', label: 'Version', value: (row) => `Version ${row.version}`, whenShared: () => 'omit' },
    { id: 'class', label: 'Class', value: (row) => nameOf(row.learner.class), sort: (row) => nameOf(row.learner.class) },
    { id: 'source', label: 'Source', value: (row) => row.learner.via === 'autoAttack' ? 'Auto attack' : row.learner.tree, sort: (row) => row.learner.tree ?? '' },
    { id: 'tier', label: 'Tier', numeric: true, value: (row) => row.learner.tier, sort: (row) => row.learner.tier ?? 0 },
    { id: 'requirements', label: 'Requirements', value: (row) => row.learner.requirements.length ? 'requirements' : undefined },
  ];
  $: rows = versions.flatMap((version, index) => version.learnedBy.map((learner) => ({ learner, version: index + 1 })));
  $: plan = planColumns(columns, rows);
</script>

{#if rows.length}
  <Section id="learned-by" title="Learned by" icon="teach" count={rows.length}>
    <RelationTable columns={plan.columns} {rows} label="Learned by">
      <svelte:fragment slot="cell" let:row let:column>
        {#if column === 'version'}Version {row.version}
        {:else if column === 'class'}<EntityLink ref={row.learner.class} {registry} />
        {:else if column === 'source'}{#if row.learner.via === 'autoAttack'}Auto attack{:else if row.learner.talent?.key && row.learner.tree}<EntityLink ref={{ ...row.learner.talent, name: row.learner.tree }} {registry} />{:else}{row.learner.tree ?? ''}{/if}
        {:else if column === 'tier'}{row.learner.tier ?? ''}
        {:else if column === 'requirements'}<Requirements requirements={row.learner.requirements} {registry} />{/if}
      </svelte:fragment>
    </RelationTable>
  </Section>
{/if}
