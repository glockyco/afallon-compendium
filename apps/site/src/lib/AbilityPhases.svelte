<script lang="ts">
  import type { AbilityPhase, PublicKindEntry } from '@afallon/contracts/public';
  import Card from './Card.svelte';
  import EntityLink from './EntityLink.svelte';

  export let phases: AbilityPhase[];
  export let registry: PublicKindEntry[];
  export let limit: number | undefined = undefined;

  $: visible = limit === undefined ? phases : phases.slice(0, limit);
  $: total = phases.reduce((sum, phase) => sum + phase.abilities.length, 0);
  $: grouped = phases.length > 1 || phases.some((phase) => phase.name || phase.requirement);
</script>

{#if phases.length > 0}
  <Card title="Abilities" count={total}>
    <div class="phases">
      {#each visible as phase}
        <div class="phase">
          {#if grouped}
            <p class="phase-name">{phase.name ?? `Phase ${phase.phaseIndex + 1}`}{#if phase.requirement}<span class="requirement">{phase.requirement}</span>{/if}</p>
          {/if}
          <ul>{#each phase.abilities as ability}<li><EntityLink ref={ability} {registry} /></li>{/each}</ul>
        </div>
      {/each}
    </div>
  </Card>
{/if}

<style>
  .phases { display: grid; gap: .9rem; }
  .phase-name { display: flex; flex-wrap: wrap; align-items: baseline; gap: .5rem; margin: 0 0 .45rem; color: var(--c-text-dim); font-size: .72rem; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; }
  .requirement { color: var(--c-text-mute); font-weight: 400; letter-spacing: normal; text-transform: none; }
  ul { display: grid; gap: .4rem; grid-template-columns: repeat(auto-fill, minmax(13rem, 1fr)); margin: 0; padding: 0; list-style: none; }
  li { padding: .4rem .55rem; border: 1px solid var(--c-line); border-radius: var(--c-radius-sm); background: var(--c-surface-2); font-size: .82rem; }
</style>
