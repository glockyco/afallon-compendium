<script lang="ts">
  import type { PublicQuest } from '@afallon/contracts/public';
  import DetailsDisclosure from '../DetailsDisclosure.svelte';
  export let document: PublicQuest;
</script>

<DetailsDisclosure id="quest-text" title="Quest text">
  <div class="passages">
    {#if document.description}<div><h3>Offer</h3><p class="c-prose">{document.description}</p></div>{/if}
    {#if document.facts.objectiveText}<div><h3>Objective</h3><p class="c-prose">{document.facts.objectiveText}</p></div>{/if}
    {#if document.facts.completedDescription}<div><h3>On completion</h3><p class="c-prose">{document.facts.completedDescription}</p></div>{/if}
  </div>
</DetailsDisclosure>

<style>
  .passages { display: grid; gap: .9rem; }
  h3 { margin-bottom: .25rem; color: var(--c-text-dim); font-size: .875rem; font-weight: 700; }
</style>
