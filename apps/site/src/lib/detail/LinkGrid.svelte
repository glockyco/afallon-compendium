<script lang="ts">
  import type { PublicKindEntry, Ref } from '@afallon/contracts/public';
  import EntityLink from '../EntityLink.svelte';

  export let refs: Ref[];
  export let registry: PublicKindEntry[];
</script>

<ul class="link-grid">{#each refs as ref}<li><EntityLink {ref} {registry} /></li>{/each}</ul>

<style>
  .link-grid { display: grid; gap: .45rem 1rem; grid-template-columns: repeat(auto-fill, minmax(14rem, 1fr)); margin: 0; padding: 0; list-style: none; font-size: var(--c-text-body); }
</style>
