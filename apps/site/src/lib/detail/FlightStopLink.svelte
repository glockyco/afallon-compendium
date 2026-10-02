<script lang="ts">
  import type { FlightStop, PublicKindEntry } from '@afallon/contracts/public';
  import EntityLink from '../EntityLink.svelte';
  export let stop: FlightStop;
  export let registry: PublicKindEntry[];
</script>

{#if stop.master && stop.master.key !== null}
  <EntityLink ref={{ ...stop.master, name: stop.name }} {registry} />
{:else}
  {stop.name}
{/if}
