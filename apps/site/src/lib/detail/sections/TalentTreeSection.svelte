<script lang="ts">
  import type { PublicKindEntry, TalentRow, TalentTree } from '@afallon/contracts/public';
  import EntityLink from '../../EntityLink.svelte';
  import Requirements from '../../Requirements.svelte';
  import TalentEffect from '../../TalentEffect.svelte';
  import { planColumns, type RelationColumn } from '../relation-table';
  import RelationTable from '../RelationTable.svelte';
  import Section from '../Section.svelte';

  export let tree: TalentTree;
  export let registry: PublicKindEntry[];

  const columns: RelationColumn<TalentRow>[] = [
    { id: 'tier', label: 'Tier', numeric: true, value: (row) => row.tier, sort: (row) => row.tier * 100 + row.position },
    { id: 'talent', label: 'Talent', value: (row) => row.name, sort: (row) => row.name },
    { id: 'ranks', label: 'Ranks', numeric: true, value: (row) => row.ranks, sort: (row) => row.ranks },
    { id: 'effect', label: 'Effect', value: (row) => row.first || row.last ? 'effect' : undefined },
    { id: 'requirements', label: 'Requirements', value: (row) => row.requirements.length ? 'requirements' : undefined },
  ];
  $: plan = planColumns(columns, tree.rows);
</script>

<Section id={tree.anchor} title={tree.name} count={tree.rows.length} line={tree.points ? `Spends ${tree.points}.` : undefined}>
  <RelationTable columns={plan.columns} rows={tree.rows} label={tree.name} rowAnchors={(row) => [row.anchor]}>
    <svelte:fragment slot="cell" let:row let:column>
      {#if column === 'tier'}{row.tier}
      {:else if column === 'talent'}{#if row.ability}<EntityLink ref={row.ability} {registry} />{:else}{row.name}{/if}
      {:else if column === 'ranks'}{row.ranks}
      {:else if column === 'effect'}<TalentEffect {row} />
      {:else if column === 'requirements'}<Requirements requirements={row.requirements} {registry} />{/if}
    </svelte:fragment>
  </RelationTable>
</Section>
