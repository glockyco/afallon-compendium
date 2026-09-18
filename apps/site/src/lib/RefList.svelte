<script lang="ts">
  import type { PublicKindEntry, Ref } from '@afallon/contracts/public';
  import Card from './Card.svelte';
  import EntityLink from './EntityLink.svelte';

  export let title: string;
  export let refs: Ref[];
  export let registry: PublicKindEntry[];
  export let limit: number | undefined = undefined;
  export let showCount = true;

  $: visible = limit === undefined ? refs : refs.slice(0, limit);
</script>

{#if refs.length > 0}
  <Card {title} count={showCount ? refs.length : undefined}>
    <ul>{#each visible as ref}<li><EntityLink {ref} {registry} /></li>{/each}</ul>
  </Card>
{/if}

<style>
  ul { display: grid; gap: .4rem; grid-template-columns: repeat(auto-fill, minmax(13rem, 1fr)); margin: 0; padding: 0; list-style: none; }
  li { font-size: .85rem; }
</style>
