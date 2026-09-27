<script lang="ts">
  import type { PublicKindEntry, Ref } from '@afallon/contracts/public';
  import EntityLink from '../../EntityLink.svelte';
  import Section from '../Section.svelte';

  export let quests: Ref[];
  export let currentKey: string;
  export let registry: PublicKindEntry[];
</script>

{#if quests.length}
  <Section id="quest-chain" title="Quest chain" icon="chain" count={quests.length}>
    <ol class="steps">
      {#each quests as quest, index}
        <li>
          <span class="number" aria-hidden="true">{index + 1}</span>
          {#if quest.key === currentKey}<strong aria-current="step">{quest.name}</strong>
          {:else}<EntityLink ref={quest} {registry} />{/if}
        </li>
      {/each}
    </ol>
  </Section>
{/if}

<style>
  .steps { display: flex; flex-wrap: wrap; gap: .5rem; margin: 0; padding: 0; list-style: none; }
  li { display: inline-flex; min-width: 0; max-width: 100%; align-items: baseline; gap: .5rem; padding: .4rem .65rem; border: 1px solid var(--c-line); border-radius: var(--c-radius-sm); background: var(--c-surface-2); font-size: .85rem; }
  .number { display: inline-grid; width: 1.25rem; height: 1.25rem; flex: none; place-items: center; color: var(--c-text-dim); font-variant-numeric: tabular-nums; }
  strong { color: #f2e4bb; font-weight: 600; overflow-wrap: break-word; }
  li:has([aria-current]) { border-color: var(--c-accent); }
</style>
