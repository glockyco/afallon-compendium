<script lang="ts">
  import { base } from '$app/paths';
  import type { PublicAbility, PublicKindEntry } from '@afallon/contracts/public';
  import Card from './Card.svelte';
  import EntityHeader from './EntityHeader.svelte';
  import NativeText from './NativeText.svelte';
  import RefList from './RefList.svelte';

  export let document: PublicAbility;
  export let registry: PublicKindEntry[];
  export let showRelations = false;
  export let limit: number | undefined = undefined;

  $: versioned = document.versions.length > 1;
</script>

<article class="document">
  <EntityHeader
    name={document.ref.name}
    art={document.art.icon ?? document.ref.icon}
    description={document.description}
  />

  <!-- Records whose rank texts differ are versions of the ability. Each version shows its ranks and who uses it. -->
  {#each document.versions as version, index}
    <section class="version" id={versioned ? version.anchor : undefined}>
      {#if versioned}<h2>{#if version.icon}<img src={`${base}/data/${version.icon.url}`} width={version.icon.width} height={version.icon.height} alt="" loading="lazy" />{/if}Version {index + 1}</h2>{/if}
      <div class="rank-grid">
        {#each version.ranks as rank}
          <Card title={version.ranks.length > 1 ? `Rank ${rank.rankIndex + 1}` : 'Ability details'}>
            <NativeText lines={rank.lines} />
          </Card>
        {/each}
      </div>
      {#if showRelations}
        <div class="c-stack">
          <RefList title="Used by" refs={version.usedBy} {registry} {limit} />
          <RefList title="Taught by" refs={version.taughtBy} {registry} {limit} />
        </div>
      {/if}
    </section>
  {/each}
</article>

<style>
  .version { scroll-margin-top: 5rem; }
  .version + .version { margin-top: 1.75rem; }
  h2 { display: flex; align-items: center; gap: .5rem; margin: 0 0 .75rem; color: var(--c-accent-strong); font: 600 1.05rem/1.3 var(--c-serif); }
  h2 img { width: 1.6rem; height: 1.6rem; border: 1px solid var(--c-line); border-radius: var(--c-radius-sm); }
  .version:target h2 { text-decoration: underline; text-underline-offset: .25em; }
  .rank-grid { display: grid; gap: 1rem; margin-bottom: 1rem; }
</style>
