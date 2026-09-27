<script lang="ts">
  import type { PublicProperty } from '@afallon/contracts/public';
  import EntityHeader from './EntityHeader.svelte';
  import PropertyPanel from './PropertyPanel.svelte';

  export let document: PublicProperty;
</script>

<article>
  <EntityHeader name={document.ref.name} facts={document.place && document.place.key !== null ? [{ label: 'In', value: document.place.name }] : []} compact />
  <PropertyPanel {document} />
</article>
