<script lang="ts">
  import type { PublicAbility, PublicKindEntry } from '@afallon/contracts/public';
  import EntityHeader from './EntityHeader.svelte';
  import RefList from './RefList.svelte';

  export let document: PublicAbility;
  export let registry: PublicKindEntry[];
  export let compact = false;
  export let showRelations = false;
  export let limit: number | undefined = undefined;
</script>

<article class="document" class:c-compact={compact}>
  <EntityHeader
    name={document.ref.name}
    art={document.art.icon ?? document.ref.icon}
    fallbackIcon={registry.find((entry) => entry.kind === 'abilities')?.icon}
    description={document.description}
    {compact}
  />

  {#if showRelations}
    <div class="c-stack">
      <RefList title="Used by" refs={document.usedBy} {registry} {limit} />
      <RefList title="Taught by" refs={document.taughtBy} {registry} {limit} />
    </div>
  {/if}
</article>
