<script lang="ts">
  import { base } from '$app/paths';
  import type { PublicKindEntry, PublicProperty } from '@afallon/contracts/public';
  import Card from './Card.svelte';
  import EntityHeader, { type HeaderFact } from './EntityHeader.svelte';
  import EntityLink from './EntityLink.svelte';
  import LocationLinks from './LocationLinks.svelte';
  import MissingValue from './MissingValue.svelte';
  import PropertyPanel from './PropertyPanel.svelte';

  export let document: PublicProperty;
  export let registry: PublicKindEntry[];
  export let showRelations = false;
  export let limit: number | undefined = undefined;

  $: headerFacts = document.facts.propertyType ? [{ value: document.facts.propertyType }] satisfies HeaderFact[] : [];
  $: signs = limit === undefined ? document.locations : document.locations.slice(0, limit);
</script>

<article class="document">
  <EntityHeader name={document.ref.name} facts={headerFacts} description={document.description} />

  <div class="overview">
    <section class="panel-card" aria-label="In-game purchase panel"><PropertyPanel {document} /></section>

    <Card title="Where to buy it">
      <svelte:fragment slot="action">{#if document.locations.length}<a class="c-link action" href={`${base}/?entity=${encodeURIComponent(document.ref.key)}`}>View on the map</a>{/if}</svelte:fragment>
      {#if document.place}<p class="place">In <EntityLink ref={document.place} {registry} /></p>{/if}
      {#if showRelations && signs.length}
        <p class="note">Buy it at its for-sale sign:</p>
        <LocationLinks placements={signs} />
      {:else if !document.locations.length}
        <p class="c-empty"><MissingValue explanation="No for-sale sign is published" /> No for-sale sign is published for this build.</p>
      {/if}
    </Card>
  </div>
</article>

<style>
  .overview { display: grid; grid-template-columns: minmax(0, 24rem) minmax(0, 1fr); gap: 1rem; align-items: start; }
  .panel-card { padding: .85rem; border: 1px solid #74684e; border-radius: var(--c-radius); background: var(--c-surface-1); box-shadow: 0 6px 20px #0006; }
  .place { margin: 0 0 .75rem; font-size: .9rem; }
  .note { margin: 0 0 .4rem; color: var(--c-text-dim); font-size: .84rem; }
  .action { font-size: .8rem; }
  @media (max-width: 760px) { .overview { grid-template-columns: 1fr; } }
</style>
