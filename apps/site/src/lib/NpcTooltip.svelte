<script lang="ts">
  import type { PublicKindEntry, PublicNpc } from '@afallon/contracts/public';
  import EntityHeader, { type HeaderBadge, type HeaderFact } from './EntityHeader.svelte';
  import EntityReference from './EntityReference.svelte';
  import { labelOf, roleLabel, signedAmount } from './format';

  export let document: PublicNpc;
  export let registry: PublicKindEntry[];

  function uniqueAbilities(phases: PublicNpc['abilityPhases']) {
    const seen = new Set<string>();
    return phases.flatMap((phase) => phase.abilities).filter((reference) => {
      if (reference.ability.key === null) return true;
      const identity = `${reference.ability.key}:${reference.rankIndex}`;
      if (seen.has(identity)) return false;
      seen.add(identity);
      return true;
    });
  }

  $: abilities = uniqueAbilities(document.abilityPhases);
  $: facts = document.facts;
  $: level = facts.level !== undefined ? String(facts.level) : facts.levelRange ? `${facts.levelRange.min}–${facts.levelRange.max}` : null;
  $: creatureType = facts.npcType ?? facts.creatureType;
  $: badges = facts.roles.map((role) => ({ label: roleLabel(role), tone: role === 'boss' ? ('boss' as const) : ('neutral' as const) })) satisfies HeaderBadge[];
  $: headerFacts = [
    ...(level ? [{ label: 'Level', value: level }] : []),
    ...(creatureType ? [{ label: 'Type', value: labelOf(creatureType) }] : []),
    ...(document.locations.length ? [{ label: 'Found in', value: document.locations[0]!.label }] : []),
  ] satisfies HeaderFact[];
  $: relationCounts = [
    ['Drops', document.drops.length], ['Sells', document.sells.length], ['Quests', document.quests.length], ['Locations', document.locations.length],
  ].filter((entry) => Number(entry[1]) > 0) as [string, number][];
</script>

<article>
  <EntityHeader name={document.ref.name} art={document.art.portrait ?? document.art.icon ?? document.ref.icon} artRole="portrait" fallbackIcon={registry.find((entry) => entry.kind === 'npcs')?.icon} {badges} facts={headerFacts} description={document.description} compact />
  {#if facts.stats.length}<ul class="stats">{#each facts.stats as stat}<li>{signedAmount(stat.amount, stat.isPercent)} {stat.stat.key === null ? stat.stat.label : stat.stat.name}</li>{/each}</ul>{/if}
  {#if facts.immunities.length}<p class="summary">Immune to {facts.immunities.map(labelOf).join(', ')}</p>{/if}
  {#if abilities.length}<section><h4>Abilities</h4><ul>{#each abilities as reference}<li><EntityReference ref={reference.ability} {registry} /><span>Rank {reference.rankIndex + 1}</span></li>{/each}</ul></section>{/if}
  {#if relationCounts.length}<p class="summary">{relationCounts.map(([label, count]) => `${label}: ${count}`).join(' · ')}</p>{/if}
</article>

<style>
  section { display: grid; gap: .35rem; margin-top: .6rem; }
  h4 { margin: 0; color: var(--c-accent-strong); font: 600 .8rem/1.25 var(--c-serif); }
  ul { display: grid; gap: .28rem; margin: .55rem 0 0; padding: 0; list-style: none; font-size: .82rem; }
  li { display: flex; justify-content: space-between; gap: .5rem; }
  li span, .summary { color: var(--c-text-dim); }
  .stats { color: #72c875; }
  .summary { margin: .55rem 0 0; font-size: .78rem; line-height: 1.4; }
</style>
