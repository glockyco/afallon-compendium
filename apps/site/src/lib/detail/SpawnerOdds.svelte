<script lang="ts">
  import { spawnerChances, type PublicKindEntry, type SpawnerOption } from '@afallon/contracts/public';
  import EntityLink from '../EntityLink.svelte';
  import { nameOf } from '../format';
  import RelationTable from './RelationTable.svelte';
  import type { RelationColumn } from './relation-table';

  /** The options of one spawner, at a skill level, with each option's bonus from active attunements. */
  export let options: SpawnerOption[];
  export let skillCap: number;
  export let level: number;
  export let boosts: number[] = [];
  /** Whether verified rules turn the weights into chances. Without them, the table shows weights only. */
  export let oddsVerified: boolean;
  /** The node of the page, which the table marks and does not link. */
  export let current: string | null = null;
  export let registry: PublicKindEntry[];
  export let label: string;

  const weightFormat = new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 });
  const percentFormat = new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 });
  $: rows = spawnerChances(options, level, skillCap, boosts).map((chance, index) => ({ option: options[index]!, ...chance, boost: boosts[index] ?? 0 }));
  type Row = (typeof rows)[number];
  $: columns = [
    { id: 'node', label: 'Node', value: (row: Row) => nameOf(row.option.node), sort: (row: Row) => nameOf(row.option.node) },
    { id: 'weight', label: 'Chance Ratio', numeric: true, value: (row: Row) => row.weight, sort: (row: Row) => row.weight },
    ...(oddsVerified ? [{ id: 'chance', label: 'Chance', numeric: true, value: (row: Row) => row.percent, sort: (row: Row) => row.percent }] : []),
  ] satisfies RelationColumn<Row>[];
</script>

<RelationTable {rows} {columns} {label}>
  <svelte:fragment slot="cell" let:row let:column>
    {#if column === 'node'}
      {#if current !== null && row.option.node.key === current}<strong class="current-node" aria-current="page">{nameOf(row.option.node)}</strong>{:else}<EntityLink ref={row.option.node} {registry} />{/if}
    {:else if column === 'weight'}
      {weightFormat.format(row.weight)}{#if row.boost}<small>incl. +{weightFormat.format(row.boost)}</small>{/if}
    {:else if column === 'chance'}
      <span class="chance"><span class="bar" style:width={`${row.percent}%`}></span><span class="value">{percentFormat.format(row.percent)}%</span></span>
    {/if}
  </svelte:fragment>
</RelationTable>

<style>
  .current-node { color: var(--c-text-strong); }
  .chance { position: relative; display: inline-block; min-width: 4.5rem; padding-bottom: .3rem; }
  .chance::before { content: ''; position: absolute; inset: auto 0 0 0; height: 3px; border-radius: 2px; background: var(--c-line-soft); }
  .bar { position: absolute; inset: auto auto 0 0; height: 3px; border-radius: 2px; background: var(--c-accent); }
  .value { position: relative; }
</style>
