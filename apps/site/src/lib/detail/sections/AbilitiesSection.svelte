<script lang="ts">
  import type { AbilityPhase, PublicKindEntry } from '@afallon/contracts/public';
  import EntityLink from '../../EntityLink.svelte';
  import Section from '../Section.svelte';

  export let phases: AbilityPhase[];
  export let registry: PublicKindEntry[];

  $: used = phases.filter((phase) => phase.abilities.length > 0);
  $: total = used.reduce((sum, phase) => sum + phase.abilities.length, 0);
  // Phases get names only when the NPC changes its abilities during a fight.
  $: grouped = used.length > 1 || used.some((phase) => phase.name || phase.requirement);
</script>

{#if total > 0}
  <Section id="abilities" title="Abilities" icon="ability" count={total}>
    <div class="phases">
      {#each used as phase}
        <div>
          {#if grouped}<h3>{phase.name ?? `Phase ${phase.phaseIndex + 1}`}{#if phase.requirement}<span class="requirement">{phase.requirement}</span>{/if}</h3>{/if}
          <ul>{#each phase.abilities as reference}<li><EntityLink ref={reference.ability} rankIndex={reference.rankIndex} {registry} /></li>{/each}</ul>
        </div>
      {/each}
    </div>
  </Section>
{/if}

<style>
  .phases { display: grid; gap: .9rem; }
  h3 { display: flex; flex-wrap: wrap; align-items: baseline; gap: .5rem; margin: 0 0 .45rem; color: var(--c-text-dim); font-size: var(--c-text-label); font-weight: 700; letter-spacing: .06em; text-transform: uppercase; }
  .requirement { color: var(--c-text-mute); font-weight: 400; letter-spacing: normal; text-transform: none; }
  ul { display: grid; gap: .45rem 1rem; grid-template-columns: repeat(auto-fill, minmax(14rem, 1fr)); margin: 0; padding: 0; list-style: none; font-size: var(--c-text-body); }
</style>
