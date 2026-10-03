<script lang="ts">
  import { base } from '$app/paths';
  import DetailPage from '$lib/detail/DetailPage.svelte';
  import PageShell from '$lib/PageShell.svelte';
  import SeoHead from '$lib/SeoHead.svelte';
  import { entityDescription } from '$lib/seo';
  import type { PageData } from './$types';
  export let data: PageData;

  $: document = data.page.document;
  $: summary = entityDescription(data.page);
  $: crumbs = [
    { label: 'Compendium', href: `${base}/` },
    { label: data.kind.plural, href: `${base}/${data.kind.route}/` },
    { label: document.ref.name },
  ];
</script>

<SeoHead title={`${document.ref.name} · Afallon Wiki`} description={summary} type="article" />

<PageShell registry={data.registry} {crumbs} release={data.release}>
  <DetailPage page={data.page} registry={data.registry} inlineItem={data.inlineItem} heroicItems={data.heroicItems} corruptionItems={data.corruptionItems} />
  <svelte:fragment slot="footer-extra"><a class="c-link" href={`${base}/data/${data.documentPath}`}>JSON</a></svelte:fragment>
</PageShell>
