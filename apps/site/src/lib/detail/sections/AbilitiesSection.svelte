<script lang="ts">
  import type { AbilityPhase, PublicKindEntry } from '@afallon/contracts/public';
  import EntityLink from '../../EntityLink.svelte';
  import Section from '../Section.svelte';

  export let phases: AbilityPhase[];
  export let registry: PublicKindEntry[];
  export let chips = false;

  $: used = phases.filter((phase) => phase.abilities.length > 0);
  $: total = used.reduce((sum, phase) => sum + phase.abilities.length, 0);
  $: grouped = used.length > 1 || used.some((phase) => phase.name || phase.requirement);
</script>

{#snippet abilities()}
  <div class="phases">
    {#each used as phase}
      <div>
        {#if grouped}<h3>{phase.name ?? `Phase ${phase.phaseIndex + 1}`}{#if phase.requirement}<span class="requirement">{phase.requirement}</span>{/if}</h3>{/if}
        <ul class:chips>
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

{#if total > 0}
  {#if chips}<div class="side-card"><h2>Abilities</h2>{@render abilities()}</div>
  {:else}<Section id="abilities" title="Abilities" count={total}>{@render abilities()}</Section>{/if}
{/if}

<style>
  .side-card { padding: 1rem; border: 1px solid var(--c-line-soft); border-radius: var(--c-radius); background: var(--c-surface-1); }
  h2 { margin-bottom: .75rem; font-size: 1rem; }
  .phases { display: grid; gap: .9rem; }
  h3 { display: flex; flex-wrap: wrap; gap: .5rem; margin-bottom: .45rem; color: var(--c-text-dim); font-size: var(--c-text-small); font-weight: 700; }
  .requirement { color: var(--c-text-mute); font-weight: 400; }
  ul { display: grid; gap: .45rem 1rem; grid-template-columns: repeat(auto-fill, minmax(12rem, 1fr)); padding: 0; list-style: none; }
  ul.chips { display: flex; flex-wrap: wrap; }
  .chips li { display: inline-flex; align-items: center; max-width: 100%; min-height: 1.8rem; padding: .2rem .5rem; border: 1px solid var(--c-line-soft); border-radius: var(--c-radius-sm); overflow-wrap: anywhere; }
  .chips :global(.entity-link img) { width: 1.5rem; height: 1.5rem; }
</style>
