<script lang="ts">
  import { base } from '$app/paths';
  import { page } from '$app/stores';
  import { absolutePageUrl, jsonLdScript, SITE_ORIGIN } from './seo';
  export let title: string;
  export let description: string;
  export let type: 'website' | 'article' = 'website';
  export let website = false;
  $: url = absolutePageUrl($page.url.pathname);
  $: image = `${SITE_ORIGIN}${base}/og-default.png`;
</script>

<svelte:head>
  <title>{title}</title>
  <meta name="description" content={description} />
  <link rel="canonical" href={url} />
  <meta property="og:type" content={type} />
  <meta property="og:site_name" content="Afallon Compendium" />
  <meta property="og:title" content={title} />
  <meta property="og:description" content={description} />
  <meta property="og:url" content={url} />
  <meta property="og:image" content={image} />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:alt" content="Afallon Compendium" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content={title} />
  <meta name="twitter:description" content={description} />
  <meta name="twitter:image" content={image} />
  {#if website}{@html jsonLdScript({ '@context': 'https://schema.org', '@type': 'WebSite', name: 'Afallon Compendium', url: `${SITE_ORIGIN}${base}/` })}{/if}
</svelte:head>
