<script lang="ts">
  import type { PublicKindEntry, Ref } from '@afallon/contracts/public';
  import LinkGrid from '../LinkGrid.svelte';
  import Section from '../Section.svelte';

  export let id: string;
  export let title: string;
  export let refs: Ref[];
  export let registry: PublicKindEntry[];
  export let line: string | undefined = undefined;
</script>

{#if refs.length}
  <Section {id} {title} count={refs.length} {line}><LinkGrid {refs} {registry} /></Section>
{/if}
