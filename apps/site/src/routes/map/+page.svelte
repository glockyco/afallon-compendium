<script lang="ts">
  import MapExplorer from '$lib/MapExplorer.svelte';
  import type { PageData } from './$types';
  export let data: PageData;
</script>

<MapExplorer release={data.release} />
