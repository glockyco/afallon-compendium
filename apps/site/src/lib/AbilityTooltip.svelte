<script lang="ts">
  import type { PublicAbility } from '@afallon/contracts/public';
  import EntityHeader from './EntityHeader.svelte';
  import NativeText from './NativeText.svelte';
  import { rankStatNote } from './detail/scaling-formula';

  export let document: PublicAbility;
  export let rankIndex: number | undefined = undefined;
  /** The anchor of the version that the reference names. Without it, the tooltip shows the first version. */
  export let variant: string | undefined = undefined;

  $: versionIndex = Math.max(0, document.versions.findIndex((candidate) => candidate.anchor === variant));
  $: version = document.versions[versionIndex]!;
  $: selectedRanks = [version.ranks.find((rank) => rank.rankIndex === rankIndex) ?? version.ranks[0]!];
  $: showLabels = version.ranks.length > 1;

</script>

<article class="ability-tooltip">
  <EntityHeader
    name={document.ref.name}
    art={version.icon ?? document.art.icon ?? document.ref.icon}
    compact
  />
  {#if document.versions.length > 1}<p class="version">Version {versionIndex + 1} of {document.versions.length}</p>{/if}
  <div class="ranks">
    {#each selectedRanks as rank}
      {@const stats = rankStatNote(version.appliedEffects, rank.rankIndex)}
      <section>
        {#if showLabels}<h4>Rank {rank.rankIndex + 1}</h4>{/if}
        <NativeText lines={rank.lines} />
        {#if stats}<p class="stats">{stats}</p>{/if}
      </section>
    {/each}
  </div>
</article>

<style>
  .ranks, section { display: grid; gap: .35rem; }
  .ranks { gap: .75rem; font-size: var(--c-text-body); }
  h4 { margin: 0; color: var(--c-accent-strong); font: 600 var(--c-text-body)/1.25 var(--c-serif); }
  .version { margin: 0 0 .6rem; color: var(--c-text-dim); font-size: var(--c-text-small); }
  .stats { margin: .25rem 0 0; color: var(--c-text-dim); font-size: var(--c-text-small); }
</style>
