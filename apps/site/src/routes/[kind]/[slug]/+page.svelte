<script lang="ts">
  import { base } from '$app/paths';
  import DetailPage from '$lib/detail/DetailPage.svelte';
  import PageShell from '$lib/PageShell.svelte';
  import SeoHead from '$lib/SeoHead.svelte';
  import { entityDescription, entitySocialArt } from '$lib/seo';
  import type { PageData } from './$types';
  export let data: PageData;

  $: document = data.page.document;
  $: summary = entityDescription(data.page, data.effectSubtitle);
  $: crumbs = [
    { label: 'Compendium', href: `${base}/` },
    { label: data.kind.plural, href: `${base}/${data.kind.route}/` },
    { label: document.ref.name },
  ];
</script>

<SeoHead title={data.title} description={summary} type="article" art={entitySocialArt(data.page)} imageAlt={document.ref.name} noindex={data.page.kind === 'effects' && data.page.document.type === 'Teleport'} />

<PageShell registry={data.registry} {crumbs} release={data.release}>
  <DetailPage page={data.page} registry={data.registry} inlineItem={data.inlineItem} heroicItems={data.heroicItems} corruptionItems={data.corruptionItems} effectSubtitle={data.effectSubtitle} />
  <svelte:fragment slot="footer-extra"><a class="c-link" href={`${base}/data/${data.documentPath}`}>JSON</a></svelte:fragment>
</PageShell>
