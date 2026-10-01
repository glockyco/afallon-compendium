<script lang="ts">
  import { base } from '$app/paths';
  import DetailPage from '$lib/detail/DetailPage.svelte';
  import PageShell from '$lib/PageShell.svelte';
  import type { PageData } from './$types';
  export let data: PageData;

  $: document = data.page.document;
  $: summary = (document.description ?? `${document.ref.name} in Afallon.`).replace(/\s+/g, ' ').trim().slice(0, 220);
  $: socialArt = document.ref.icon ?? document.art.icon ?? document.art.portrait ?? document.art.artwork;
  $: socialImage = socialArt ? `https://afallon.compendiums.org${base}/data/${socialArt.url}` : `https://afallon.compendiums.org${base}/og-default.png`;
  $: crumbs = [
    { label: 'Compendium', href: `${base}/` },
    { label: data.kind.plural, href: `${base}/${data.kind.route}/` },
    { label: document.ref.name },
  ];
</script>

<svelte:head>
  <title>{document.ref.name} · Afallon Compendium</title>
  <meta name="description" content={summary} />
  <meta property="og:type" content="article" />
  <meta property="og:site_name" content="Afallon Compendium" />
  <meta property="og:title" content={document.ref.name} />
  <meta property="og:description" content={summary} />
  <meta property="og:image" content={socialImage} />
  <meta property="og:image:alt" content={document.ref.name} />
</svelte:head>

<PageShell registry={data.registry} {crumbs} release={data.release}>
  <DetailPage page={data.page} registry={data.registry} inlineItem={data.inlineItem} />
  <svelte:fragment slot="footer-extra"><a class="c-link" href={`${base}/data/${data.documentPath}`}>JSON</a></svelte:fragment>
</PageShell>
