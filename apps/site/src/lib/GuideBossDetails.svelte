<script lang="ts">
  import { base } from '$app/paths';
  import type { PublicEntity, PublicGuideBoss } from '@afallon/contracts/public';

  export let boss: PublicGuideBoss;
  export let entities: ReadonlyMap<string, PublicEntity>;

  function quantityLabel(minimum: number | undefined, maximum: number | undefined): string {
    if (minimum === undefined && maximum === undefined) return '';
    if (minimum === maximum || maximum === undefined) return String(minimum);
    if (minimum === undefined) return String(maximum);
    return `${minimum}–${maximum}`;
  }

  function statLabel(value: number, isPercent: boolean | undefined): string {
    return isPercent ? `${(value * 100).toFixed(1)}%` : (Number.isInteger(value) ? String(value) : value.toFixed(1));
  }
</script>

{#if boss.abilities?.length}
  <section class="guide-section"><h3>Abilities</h3>{#each boss.abilities as phase}<article class="phase"><header><strong>{phase.label}</strong><span>Phase {phase.phaseIndex + 1}</span></header>{#if phase.requirement}<p>{phase.requirement}</p>{/if}{#if phase.abilityIds.length}<p class="ability-ids">Abilities: {phase.abilityIds.join(', ')}</p>{/if}</article>{/each}</section>
{/if}
{#if boss.stats?.length}
  <section class="guide-section"><h3>Stats</h3><p class="stat-note">Authored base values</p><div class="stat-grid">{#each boss.stats as stat}<div class="stat-row"><span>{stat.label}</span><strong>{statLabel(stat.value, stat.isPercent)}</strong></div>{/each}</div></section>
{/if}
{#if boss.loot.length}
  <section class="guide-section"><h3>Loot</h3><div class="table-scroll"><table class="loot-table"><thead><tr><th scope="col">Item</th><th scope="col">Quantity</th><th scope="col">Authored rate</th></tr></thead><tbody>{#each [...boss.loot].sort((a, b) => (b.rawRate ?? -1) - (a.rawRate ?? -1)) as loot}<tr><td><a href={`${base}/?item=${encodeURIComponent(loot.itemKey)}`}>{loot.label ?? entities.get(loot.itemKey)?.name ?? loot.itemKey}</a></td><td>{quantityLabel(loot.minimum, loot.maximum)}</td><td>{loot.rawRate === undefined ? 'Unknown' : String(loot.rawRate)}</td></tr>{/each}</tbody></table></div></section>
{/if}

<style>
  :global(a) { color: #d5b978; }
  .guide-section { margin-top: 1.25rem; }
  .guide-section h3 { border-bottom: 1px solid #3a3934; padding-bottom: .45rem; font-size: .85rem; letter-spacing: .05em; text-transform: uppercase; color: #b6b2a7; }
  .phase { border-top: 1px solid #353633; padding: .7rem 0; }
  .phase > header { display: flex; justify-content: space-between; align-items: baseline; gap: .75rem; }
  .phase > header span, .ability-ids { color: #85837c; font-size: .8rem; }
  .phase p { margin: .35rem 0 0; color: #c5c1b6; font-size: .88rem; }
  .stat-note { margin: -.55rem 0 .7rem; color: #85837c; font-size: .82rem; }
  .stat-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: .55rem; }
  .stat-row { display: flex; justify-content: space-between; gap: .75rem; border: 1px solid #353633; border-radius: .35rem; padding: .65rem .75rem; background: #1b1c1b; }
  .stat-row span { color: #a9a59b; }
  .stat-row strong { color: #f1e6c5; font-variant-numeric: tabular-nums; }
  .table-scroll { overflow-x: auto; border: 1px solid #353633; border-radius: .45rem; }
  .loot-table { width: 100%; min-width: 30rem; border-collapse: collapse; }
  .loot-table th, .loot-table td { padding: .65rem .75rem; text-align: left; }
  .loot-table th { color: #a9a59b; font-size: .78rem; letter-spacing: .05em; text-transform: uppercase; }
  .loot-table th:nth-child(2), .loot-table th:nth-child(3), .loot-table td:nth-child(2), .loot-table td:nth-child(3) { text-align: right; white-space: nowrap; }
  .loot-table tbody tr:nth-child(even) { background: #1b1c1b; }
  .loot-table td { border-top: 1px solid #353633; color: #c5c1b6; font-size: .88rem; }
  .loot-table td:first-child { min-width: 12rem; }
  @media (max-width: 700px) {
    .stat-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  }
  @media (max-width: 430px) {
    .stat-grid { grid-template-columns: 1fr; }
  }
</style>
