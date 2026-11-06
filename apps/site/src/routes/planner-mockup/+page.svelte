<script lang="ts">
  import { page } from '$app/stores';
  import Overview from './kit/Overview.svelte';
  export let data;
</script>

<Overview {data} preview={$page.url.searchParams.has('preview')} moreOpen={$page.url.searchParams.has('more')} />
