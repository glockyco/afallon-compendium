<script lang="ts">
  import { base } from '$app/paths';
  import { page } from '$app/stores';
  import PageShell from '$lib/PageShell.svelte';
  import '../../kit/planner.css';
  import Page from '../pages/NpcPage.svelte';
  import HandoffCard from '../HandoffCard.svelte';
  export let data: any;
</script>

<PageShell registry={data.registry} crumbs={[{ label: 'Compendium', href: `${base}/` }, { label: 'Characters' }, { label: data.document.ref.name }]} release={data.release}>
  <Page document={data.document} registry={data.registry}>
    <HandoffCard slot="handoff" mock={data.mock} kind="adventurer" compare={$page.url.searchParams.has('compare')} />
  </Page>
</PageShell>
