<script lang="ts">
  import type { ItemFacts, PlacedRule, Ref } from '@afallon/contracts/public';
  import HowItWorks from './HowItWorks.svelte';
  import { corruptionDisplay, tooltipStat } from './corruption';

  export let facts: ItemFacts;
  export let guide: PlacedRule | undefined;
  let level = 0;
  $: settings = facts.corruption;
  $: calculated = corruptionDisplay(facts, level);
  const name = (ref: Ref) => ref.key === null ? ref.label : ref.name;
  const stat = (amount: number, percent: boolean) => `${amount < 0 ? '-' : '+'}${tooltipStat(Math.abs(amount))}${percent ? '%' : ''}`;
</script>

{#if settings && calculated}
  <details class="comparison">
    <summary>Compare corruption levels <span class="summary-note">Calculated values</span></summary>
    <div class="contents">
      <p>Shows this item's stats at a chosen corruption level.</p>
      <label for="corruption-level">Corruption level</label>
      <select id="corruption-level" bind:value={level}>
        {#each Array.from({ length: settings.maxLevel + 1 }, (_, index) => index) as choice}
          <option value={choice}>{choice === 0 ? 'Unmodified (0)' : `Corruption +${choice}`}</option>
        {/each}
      </select>
      {#if level > 0}<p class="corruption-line">Corruption +{level}</p>{/if}
      <div class="table-wrap"><table>
        <thead><tr><th scope="col">Stat</th><th scope="col">Base</th><th scope="col">{level > 0 ? `+${level}` : '0'}</th></tr></thead>
        <tbody>
          {#if facts.itemPower !== undefined && calculated.itemPower !== undefined}
            <tr><th scope="row">Item power</th><td>{tooltipStat(facts.itemPower)}</td><td>{tooltipStat(calculated.itemPower)}</td></tr>
          {/if}
          {#if facts.minDamage !== undefined && facts.maxDamage !== undefined && calculated.minDamage !== undefined && calculated.maxDamage !== undefined && facts.maxDamage > 0}
            <tr><th scope="row">Damage</th>
              <td>{facts.minDamage}–{facts.maxDamage}</td>
              <td>{calculated.minDamage}–{calculated.maxDamage}</td>
            </tr>
            {#if facts.damagePerSecond !== undefined && calculated.damagePerSecond !== undefined}
              <tr><th scope="row">Damage per second</th><td>{facts.damagePerSecond.toFixed(1)}</td><td>{calculated.damagePerSecond.toFixed(1)}</td></tr>
            {/if}
          {/if}
          {#each calculated.stats as computed, index}
            {@const baseStat = facts.stats[index]}
            {#if baseStat}
              <tr><th scope="row">{name(baseStat.stat)}</th><td>{stat(baseStat.amount, baseStat.isPercent)}</td><td>{stat(computed.amount, baseStat.isPercent)}</td></tr>
            {/if}
          {/each}
        </tbody>
      </table></div>
      {#if !facts.stats.length && facts.itemPower === undefined && facts.maxDamage === undefined}<p>This item has no fixed stats that corruption changes.</p>{/if}
      {#if facts.randomStats.length || facts.randomStatsMax > 0}<p>Random stats keep their rolled values at every corruption level.</p>{/if}
      {#if facts.sockets.length || facts.gem}<p>Gems keep their values at every corruption level.</p>{/if}
      {#if guide}<HowItWorks guide={guide.guide} stepId={guide.stepId} label="How corruption works" />{/if}
    </div>
  </details>
{/if}

<style>
  .comparison { border: 1px solid var(--c-line); border-radius: var(--c-radius); background: var(--c-surface-1); min-width: 0; }
  summary { cursor: pointer; padding: .85rem 1rem; color: var(--c-text-strong); font-weight: 650; }
  summary:hover { color: var(--c-accent); }
  .summary-note { margin-left: .5rem; color: var(--c-text-dim); font-size: var(--c-text-small); font-weight: 400; }
  .contents { display: grid; justify-items: start; gap: .8rem; min-width: 0; padding: 0 1rem 1rem; }
  p { margin: 0; line-height: 1.5; }
  label { font-weight: 650; }
  select { max-width: 100%; min-height: 2.4rem; padding: .4rem .6rem; color: var(--c-text-strong); border: 1px solid var(--c-line); border-radius: var(--c-radius); background: var(--c-surface-1); }
  .corruption-line { color: var(--c-positive); font-weight: 650; }
  .table-wrap { max-width: 100%; overflow-x: auto; }
  table { border-collapse: collapse; font-variant-numeric: tabular-nums; min-width: min(100%, 24rem); }
  th, td { padding: .55rem .7rem; border-bottom: 1px solid var(--c-line); text-align: left; vertical-align: top; }
  thead th { color: var(--c-text-dim); font-size: var(--c-text-small); }
  tbody th { color: var(--c-text-strong); font-weight: 600; }
  td { white-space: nowrap; }
  @media (max-width: 480px) {
    table, tbody, tr, th, td { display: block; width: 100%; }
    thead { display: none; }
    tbody tr { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .2rem .6rem; padding: .65rem 0; border-bottom: 1px solid var(--c-line); }
    tbody th { grid-column: 1 / -1; }
    th, td { box-sizing: border-box; padding: 0; border: 0; font-size: var(--c-text-small); }
    td { white-space: normal; overflow-wrap: anywhere; }
    td::before { display: block; margin-bottom: .2rem; color: var(--c-text-dim); content: 'Base'; }
    td:nth-of-type(2)::before { content: 'Selected'; }
  }
</style>
