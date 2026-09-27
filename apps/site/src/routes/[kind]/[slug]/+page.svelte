<script lang="ts">
  import { base } from '$app/paths';
  import FactCard from '$lib/FactCard.svelte';
  import PageShell from '$lib/PageShell.svelte';
  import type { PageData } from './$types';
  export let data: PageData;

  $: summary = (data.document.description ?? `${data.document.ref.name} in Afallon.`).replace(/\s+/g, ' ').trim().slice(0, 220);
  $: socialArt = data.document.ref.icon ?? data.document.art.icon ?? data.document.art.portrait ?? data.document.art.artwork;
  $: socialImage = socialArt ? `https://afallon.compendiums.org${base}/data/${socialArt.url}` : `https://afallon.compendiums.org${base}/og-default.png`;
  $: crumbs = [
    { label: 'Compendium', href: `${base}/` },
    { label: data.kind.plural, href: `${base}/${data.kind.route}/` },
    { label: data.document.ref.name },
  ];
</script>

<svelte:head>
  <title>{data.document.ref.name} · Afallon Compendium</title>
  <meta name="description" content={summary} />
  <meta property="og:type" content="article" />
  <meta property="og:site_name" content="Afallon Compendium" />
  <meta property="og:title" content={data.document.ref.name} />
  <meta property="og:description" content={summary} />
  <meta property="og:image" content={socialImage} />
  <meta property="og:image:alt" content={data.document.ref.name} />
</svelte:head>

<PageShell registry={data.registry} {crumbs} buildId={data.buildId} catalogId={data.catalogId}>
  <FactCard document={data.document} registry={data.registry} mapSpaceLabels={data.mapSpaceLabels} showRelations />
  <svelte:fragment slot="footer-extra"><a class="c-link" href={`${base}/data/${data.documentPath}`}>JSON</a></svelte:fragment>
</PageShell>
