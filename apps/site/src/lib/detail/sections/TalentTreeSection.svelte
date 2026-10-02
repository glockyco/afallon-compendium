<script lang="ts">
  import { base } from '$app/paths';
  import type { PlacedRule, PublicKindEntry, TalentRow, TalentTree } from '@afallon/contracts/public';
  import EntityLink from '../../EntityLink.svelte';
  import Requirements from '../../Requirements.svelte';
  import TalentEffect from '../../TalentEffect.svelte';
  import { planColumns, type RelationColumn } from '../relation-table';
  import RelationTable from '../RelationTable.svelte';

  export let tree: TalentTree;
  /** The points that the tree spends, given only when they differ from the points of the other trees of the class. */
  export let points: string | undefined = undefined;
  /** The guide section that explains how you earn those points. */
  export let pointsGuide: PlacedRule | undefined = undefined;
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

<!-- The tab names the tree, so the panel has no heading of its own. It keeps the tree anchor for links. -->
<div id={tree.anchor} class="c-stack">
  {#if points}<p class="points">Talents in this tree cost {#if pointsGuide}<a class="c-link" href={`${base}/mechanics/${pointsGuide.guide.slug}/#${pointsGuide.section}`}>{points}</a>{:else}{points}{/if}.</p>{/if}
  <RelationTable columns={plan.columns} rows={tree.rows} label={tree.name} rowAnchors={(row) => [row.anchor]}>
    <svelte:fragment slot="cell" let:row let:column>
      {#if column === 'tier'}{row.tier}
      {:else if column === 'talent'}{#if row.ability}<EntityLink ref={row.ability} {registry} />{:else}{row.name}{/if}
      {:else if column === 'ranks'}{row.ranks}
      {:else if column === 'effect'}<TalentEffect {row} {registry} />
      {:else if column === 'requirements'}<Requirements requirements={row.requirements} {registry} />{/if}
    </svelte:fragment>
  </RelationTable>
</div>

<style>
  .points { color: var(--c-text-dim); line-height: 1.5; }
</style>
