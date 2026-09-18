<script lang="ts">
  import type { AbilityPhase, PublicKindEntry } from '@afallon/contracts/public';
  import EntityLink from './EntityLink.svelte';

  export let phases: AbilityPhase[];
  export let registry: PublicKindEntry[];
  export let limit: number | undefined = undefined;
  $: visible = limit === undefined ? phases : phases.slice(0, limit);
</script>

{#if visible.length > 0}
  <section><h2>Abilities</h2><div class="phase-list">{#each visible as phase}<article><h3>{phase.name ?? `Phase ${phase.phaseIndex + 1}`}</h3>{#if phase.requirement}<p>{phase.requirement}</p>{/if}<ul>{#each phase.abilities as ability}<li><EntityLink ref={ability} {registry} /></li>{/each}</ul></article>{/each}</div></section>
{/if}

<style>
  section { margin-top: 1.25rem; } h2 { margin: 0 0 .55rem; color: #eee9dd; font: 600 1rem/1.3 Georgia, serif; }
  .phase-list { display: grid; gap: .55rem; } article { padding: .65rem; border: 1px solid #3b3c38; background: #1b1c1b; }
  h3 { margin: 0; font-size: .82rem; } p { margin: .25rem 0; color: #aaa69d; font-size: .75rem; }
  ul { display: flex; flex-wrap: wrap; gap: .35rem 1rem; margin: .45rem 0 0; padding-left: 1rem; }
</style>
