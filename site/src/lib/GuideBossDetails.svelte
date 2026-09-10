<script lang="ts">
  import { base } from '$app/paths';
  import type { PublicEntity, PublicGuideBoss } from '../../../pipeline/public-contracts';

  export let boss: PublicGuideBoss;
  export let entities: ReadonlyMap<string, PublicEntity>;

  function quantityLabel(minimum: number | undefined, maximum: number | undefined): string {
    if (minimum === undefined && maximum === undefined) return '';
    if (minimum === maximum || maximum === undefined) return String(minimum);
    if (minimum === undefined) return String(maximum);
    return `${minimum}–${maximum}`;
  }

  function chanceLabel(chance: number | undefined): string {
    if (chance === undefined) return '';
    return `${Number.isInteger(chance) ? chance : chance.toFixed(1)}%`;
  }
</script>

{#if boss.abilities?.length}
  <section class="guide-section"><h3>Abilities</h3>{#each boss.abilities as phase}<article class="phase"><header><strong>{phase.label}</strong><span>Phase {phase.phaseIndex + 1}</span></header>{#if phase.requirement}<p>{phase.requirement}</p>{/if}{#if phase.abilityIds.length}<p class="ability-ids">Abilities: {phase.abilityIds.join(', ')}</p>{/if}</article>{/each}</section>
{/if}
{#if boss.stats?.length}
  <section class="guide-section"><h3>Stats</h3><dl>{#each boss.stats as stat}<div><dt>{stat.statId}</dt><dd>{stat.value}</dd></div>{/each}</dl></section>
{/if}
{#if boss.loot.length}
  <section class="guide-section"><h3>Loot</h3><ul class="loot-list">{#each boss.loot as loot}<li><a href={`${base}/?item=${encodeURIComponent(loot.itemKey)}`}>{loot.label ?? entities.get(loot.itemKey)?.name ?? loot.itemKey}</a><span>{quantityLabel(loot.minimum, loot.maximum)}</span>{#if loot.chance !== undefined}<span>{chanceLabel(loot.chance)}</span>{/if}</li>{/each}</ul></section>
{/if}

<style>
  :global(a) { color: #d5b978; }
  .guide-section { margin-top: 1.25rem; }
  .guide-section h3 { border-bottom: 1px solid #3a3934; padding-bottom: .45rem; font-size: .85rem; letter-spacing: .05em; text-transform: uppercase; color: #b6b2a7; }
  .phase { border-top: 1px solid #353633; padding: .7rem 0; }
  .phase > header { display: flex; justify-content: space-between; align-items: baseline; gap: .75rem; }
  .phase > header span, .ability-ids { color: #85837c; font-size: .8rem; }
  .phase p { margin: .35rem 0 0; color: #c5c1b6; font-size: .88rem; }
  dl { margin: 0; }
  dl > div { display: flex; justify-content: space-between; border-top: 1px solid #353633; padding: .5rem 0; }
  dt { color: #a9a59b; }
  dd { margin: 0; }
  .loot-list { margin: 0; padding: 0; list-style: none; }
  .loot-list li { display: grid; grid-template-columns: minmax(0, 1fr) auto auto; gap: .75rem; align-items: baseline; border-top: 1px solid #353633; padding: .5rem 0; }
  .loot-list li > span { color: #c5c1b6; font-size: .86rem; }
  @media (max-width: 650px) {
    .loot-list li { grid-template-columns: 1fr auto; }
    .loot-list li > span:last-child { grid-column: 2; grid-row: 1; }
  }
</style>
