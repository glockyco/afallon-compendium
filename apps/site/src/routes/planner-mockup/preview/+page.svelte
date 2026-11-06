<script lang="ts">
  import { page } from '$app/stores';
  import Overview from '../kit/Overview.svelte';
  export let data;
</script>

<Overview {data} preview source={$page.url.searchParams.get('from') === 'save' ? 'save' : 'link'} />
