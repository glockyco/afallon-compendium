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
          {#if quest.key === currentKey}<strong class="name" aria-current="step">{quest.name}</strong>
          {:else}<EntityLink ref={quest} {registry} />{/if}
        </li>
      {/each}
    </ol>
  </Section>
{/if}

<style>
  /* Equal cells fill each row. A name that does not fit its cell ends in an ellipsis, and the hover tooltip of the link
     names the quest in full. The truncation sits on the link's own box, so the tooltip beside it stays unclipped. The
     box has room for the 2px focus ring and its 2px offset, which the clipping would otherwise hide. The number and the
     name share the text baseline, because the icon makes the name's box taller than its letters. */
  .steps { display: grid; grid-template-columns: repeat(auto-fill, minmax(15rem, 1fr)); gap: .5rem; margin: 0; padding: 0; list-style: none; }
  li { display: flex; min-width: 0; align-items: baseline; gap: .5rem; padding: .4rem .65rem; border: 1px solid var(--c-line); border-radius: var(--c-radius-sm); background: var(--c-surface-2); font-size: var(--c-text-body); }
  .number { display: inline-grid; width: 1.25rem; height: 1.25rem; flex: none; place-items: center; color: var(--c-text-dim); font-variant-numeric: tabular-nums; }
  .name, li > :global(:is(.tooltip-anchor, .entity-link, .entity-text)) { min-width: 0; margin: -4px; padding: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  strong { color: #f2e4bb; font-weight: 600; }
  li:has([aria-current]) { border-color: var(--c-accent); }
</style>
