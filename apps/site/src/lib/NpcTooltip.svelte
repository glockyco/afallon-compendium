<script lang="ts">
  import type { PublicKindEntry, PublicNpc } from '@afallon/contracts/public';
  import EntityHeader, { type HeaderFact } from './EntityHeader.svelte';
  import EntityReference from './EntityReference.svelte';
  import { labelOf, npcLevelText, placesText, roleLabel, signedAmount } from './format';

  export let document: PublicNpc;
  export let registry: PublicKindEntry[];
  /** The anchor of the variant that the reference names. Its facts replace the page facts that differ. */
  export let variant: string | undefined = undefined;

  $: selected = document.variants.find((candidate) => candidate.anchor === variant);
  $: facts = { ...document.facts, ...selected?.facts };
  $: phases = selected?.facts.abilityPhases ?? document.abilityPhases;
  $: level = selected ? selected.level : document.facts.level;
  $: locations = selected ? document.locations.filter((location) => location.variants.includes(selected.anchor)) : document.locations;
  $: grouped = phases.length > 1 || phases.some((phase) => phase.name || phase.requirement);
  $: creatureType = facts.npcType ?? facts.creatureType;
  $: places = placesText(locations.map((location) => location.label));
  $: headerFacts = [
    ...facts.roles.map((role) => ({ value: roleLabel(role) })),
    ...(level ? [{ label: 'Level', value: npcLevelText(level) }] : []),
    ...(creatureType ? [{ label: 'Type', value: labelOf(creatureType) }] : []),
    ...(places ? [{ label: 'Found in', value: places }] : []),
  ] satisfies HeaderFact[];
  $: relationCounts = [
    ['Drops', document.drops.length], ['Sells', document.sells.length], ['Quests', document.quests.length], ['Locations', locations.length],
  ].filter((entry) => Number(entry[1]) > 0) as [string, number][];
</script>

<article>
  <EntityHeader name={document.ref.name} art={selected?.portrait ?? document.art.portrait ?? document.art.icon ?? document.ref.icon} artRole="portrait" facts={headerFacts} description={document.description} compact />
  {#if selected && document.variantFields.length}<p class="summary">{selected.label}</p>{/if}
  {#if facts.stats.length}<ul class="stats">{#each facts.stats as stat}<li>{signedAmount(stat.amount, stat.isPercent)} {stat.stat.key === null ? stat.stat.label : stat.stat.name}</li>{/each}</ul>{/if}
  {#if facts.immunities.length}<p class="summary">Immune to {facts.immunities.map(labelOf).join(', ')}</p>{/if}
  {#if phases.some((phase) => phase.abilities.length > 0)}
    <section>
      <h4>Abilities</h4>
      {#each phases as phase}
        <div class="phase">
          {#if grouped}
            <p class="phase-name">{phase.name ?? `Phase ${phase.phaseIndex + 1}`}{#if phase.requirement}<span>{phase.requirement}</span>{/if}</p>
          {/if}
          <ul>{#each phase.abilities as reference}<li><EntityReference ref={reference.ability} {registry} /><span>Rank {reference.rankIndex + 1}</span></li>{/each}</ul>
        </div>
      {/each}
    </section>
  {/if}
  {#if relationCounts.length}<p class="summary">{relationCounts.map(([label, count]) => `${label}: ${count}`).join(' · ')}</p>{/if}
</article>

<style>
  section { display: grid; gap: .35rem; margin-top: .6rem; }
  h4 { margin: 0; color: var(--c-accent-strong); font: 600 .8rem/1.25 var(--c-serif); }
  .phase + .phase { margin-top: .45rem; }
  .phase-name { display: flex; gap: .5rem; margin: .2rem 0 0; color: var(--c-text-dim); font-size: .72rem; font-weight: 700; text-transform: uppercase; }
  .phase-name span { color: var(--c-text-mute); font-weight: 400; text-transform: none; }
  ul { display: grid; gap: .28rem; margin: .35rem 0 0; padding: 0; list-style: none; font-size: .82rem; }
  li { display: flex; align-items: baseline; justify-content: space-between; gap: .5rem; }
  li span, .summary { color: var(--c-text-dim); }
  .stats { color: #72c875; }
  .summary { margin: .55rem 0 0; font-size: .78rem; line-height: 1.4; }
</style>
