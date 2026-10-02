<script lang="ts">
  import { spawnerChances, type PublicKindEntry, type SpawnerOption } from '@afallon/contracts/public';
  import EntityLink from '../EntityLink.svelte';
  import { nameOf } from '../format';

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
</script>

<div class="table-scroll"><table aria-label={label}>
  <thead><tr><th scope="col">Node</th><th scope="col">Weight</th>{#if oddsVerified}<th scope="col">Chance</th>{/if}</tr></thead>
  <tbody>
    {#each rows as row}
      <tr class:current={current !== null && row.option.node.key === current}>
        <td>{#if current !== null && row.option.node.key === current}{nameOf(row.option.node)}{:else}<EntityLink ref={row.option.node} {registry} />{/if}</td>
        <td>{weightFormat.format(row.weight)}{#if row.boost}<span class="boost"> incl. +{weightFormat.format(row.boost)}</span>{/if}</td>
        {#if oddsVerified}<td><span class="chance"><span class="bar" style:width={`${row.percent}%`}></span><span class="value">{percentFormat.format(row.percent)}%</span></span></td>{/if}
      </tr>
    {/each}
  </tbody>
</table></div>

<style>
  .table-scroll { max-width: 100%; overflow-x: auto; }
  table { width: 100%; border-collapse: collapse; font-variant-numeric: tabular-nums; }
  th, td { padding: .5rem .7rem; border-bottom: 1px solid var(--c-line); text-align: left; }
  th { color: var(--c-text-dim); font-weight: 600; }
  th:not(:first-child), td:not(:first-child) { text-align: right; white-space: nowrap; }
  tr.current td { color: var(--c-text-strong); font-weight: 600; }
  .boost { color: var(--c-text-mute); font-size: var(--c-text-small); font-weight: 400; }
  /* The bar shows the chance at a glance and the number gives its value. */
  .chance { position: relative; display: inline-block; min-width: 4.5rem; }
  .bar { position: absolute; inset: auto auto -.2rem 0; height: 3px; border-radius: 2px; background: var(--c-accent); opacity: .7; }
  .value { position: relative; }
</style>
