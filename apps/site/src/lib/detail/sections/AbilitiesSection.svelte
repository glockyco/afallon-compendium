<script lang="ts">
  import type { AbilityPhase, PublicKindEntry } from '@afallon/contracts/public';
  import EntityLink from '../../EntityLink.svelte';
  import Section from '../Section.svelte';

  export let phases: AbilityPhase[];
  export let registry: PublicKindEntry[];

  $: used = phases.filter((phase) => phase.abilities.length > 0);
  $: total = used.reduce((sum, phase) => sum + phase.abilities.length, 0);
  $: grouped = used.length > 1 || used.some((phase) => phase.name || phase.requirement);
</script>

{#snippet abilities()}
  <div class="phases">
    {#each used as phase}
      <div>
        {#if grouped}<h3>{phase.name ?? `Phase ${phase.phaseIndex + 1}`}{#if phase.requirement}<span class="requirement">{phase.requirement}</span>{/if}</h3>{/if}
        <ul>
          {#each phase.abilities as reference}
            <li>
              <EntityLink ref={reference.ability} rankIndex={reference.rankIndex} {registry} />
            </li>
          {/each}
        </ul>
      </div>
    {/each}
  </div>
{/snippet}

{#if total > 0}<Section id="abilities" title="Abilities" count={total}>{@render abilities()}</Section>{/if}

<style>
  .phases { display: grid; gap: .9rem; }
  h3 { display: flex; flex-wrap: wrap; gap: .5rem; margin-bottom: .45rem; color: var(--c-text-dim); font-size: var(--c-text-small); font-weight: 700; }
  .requirement { color: var(--c-text-mute); font-weight: 400; }
  ul { display: grid; gap: .45rem 1rem; grid-template-columns: repeat(auto-fill, minmax(12rem, 1fr)); padding: 0; list-style: none; }
</style>
