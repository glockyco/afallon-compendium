<script lang="ts">
  import type { PublicQuest } from '@afallon/contracts/public';
  import Section from '../Section.svelte';

  export let document: PublicQuest;
</script>

{#if document.description || document.facts.objectiveText || document.facts.completedDescription}
  <Section id="quest-text" title="Quest text" icon="text">
    <div class="passages">
      {#if document.description}<div><h3>Offer</h3><p class="c-prose">{document.description}</p></div>{/if}
      {#if document.facts.objectiveText}<div><h3>Objective</h3><p class="c-prose">{document.facts.objectiveText}</p></div>{/if}
      {#if document.facts.completedDescription}<div><h3>On completion</h3><p class="c-prose">{document.facts.completedDescription}</p></div>{/if}
    </div>
  </Section>
{/if}

<style>
  .passages { display: grid; gap: .9rem; }
  h3 { margin: 0 0 .25rem; color: var(--c-text-dim); font-size: var(--c-text-label); font-weight: 700; letter-spacing: .06em; text-transform: uppercase; }
  p { margin: 0; white-space: pre-line; }
</style>
