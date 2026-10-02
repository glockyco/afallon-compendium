<script lang="ts">
  import type { PublicMechanics } from '@afallon/contracts/public';
  import EntityHeader from './EntityHeader.svelte';

  // A mechanics page names what it explains and the sections a reader finds in it.
  export let document: PublicMechanics;
</script>

<article>
  <EntityHeader name={document.ref.name} facts={[{ value: 'Mechanics' }]} description={document.description} compact />
  {#if document.sections.length}
    <p class="sections"><span>Sections</span> {document.sections.map((section) => section.title).join(' · ')}</p>
  {/if}
</article>

<style>
  .sections { margin: .55rem 0 0; color: var(--c-text-dim); font-size: .875rem; line-height: 1.5; }
  .sections span { color: var(--c-text-soft); font-weight: 600; }
</style>
