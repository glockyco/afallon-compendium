<script lang="ts">
  import type { PublicAbility, PublicKindEntry } from '@afallon/contracts/public';
  import EntityHeader from './EntityHeader.svelte';
  import NativeText from './NativeText.svelte';

  export let document: PublicAbility;
  export let registry: PublicKindEntry[];
  export let rankIndex: number | undefined = undefined;

  $: selectedRanks = rankIndex === undefined ? document.facts.ranks : document.facts.ranks.filter((rank) => rank.rankIndex === rankIndex);
  $: showLabels = document.facts.ranks.length > 1;
</script>

<article class="ability-tooltip">
  <EntityHeader
    name={document.ref.name}
    art={document.art.icon ?? document.ref.icon}
    fallbackIcon={registry.find((entry) => entry.kind === 'abilities')?.icon}
    description={document.description}
    compact
  />
  <div class="ranks">
    {#each selectedRanks as rank}
      <section>
        {#if showLabels}<h4>Rank {rank.rankIndex + 1}</h4>{/if}
        <NativeText lines={rank.lines} />
      </section>
    {/each}
  </div>
</article>

<style>
  .ranks, section { display: grid; gap: .35rem; }
  .ranks { gap: .75rem; font-size: .84rem; }
  h4 { margin: 0; color: var(--c-accent-strong); font: 600 .82rem/1.25 var(--c-serif); }
</style>
