<script lang="ts">
  import type { PublicAbility, PublicKindEntry } from '@afallon/contracts/public';
  import Card from './Card.svelte';
  import EntityHeader from './EntityHeader.svelte';
  import NativeText from './NativeText.svelte';
  import RefList from './RefList.svelte';

  export let document: PublicAbility;
  export let registry: PublicKindEntry[];
  export let showRelations = false;
  export let limit: number | undefined = undefined;
</script>

<article class="document">
  <EntityHeader
    name={document.ref.name}
    art={document.art.icon ?? document.ref.icon}
    fallbackIcon={registry.find((entry) => entry.kind === 'abilities')?.icon}
    description={document.description}
  />

  <div class="rank-grid">
    {#each document.facts.ranks as rank}
      <Card title={document.facts.ranks.length > 1 ? `Rank ${rank.rankIndex + 1}` : 'Ability details'}>
        <NativeText lines={rank.lines} />
      </Card>
    {/each}
  </div>

  {#if showRelations}
    <div class="c-stack">
      <RefList title="Used by" refs={document.usedBy} {registry} {limit} />
      <RefList title="Taught by" refs={document.taughtBy} {registry} {limit} />
    </div>
  {/if}
</article>

<style>
  .rank-grid { display: grid; gap: 1rem; margin-bottom: 1rem; }
</style>
