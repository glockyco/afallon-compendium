<script lang="ts">
  import { base } from '$app/paths';
  import type { FlightStop } from '@afallon/contracts/public';
  export let stop: FlightStop;
</script>

{#if stop.master && 'slug' in stop.master && stop.master.slug}
  <a class="c-link" href={`${base}/npcs/${stop.master.slug}/${stop.master.variant ? `#${stop.master.variant}` : ''}`}>{stop.name}</a>
{:else}
  {stop.name}
{/if}
