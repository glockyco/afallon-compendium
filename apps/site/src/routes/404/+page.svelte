<script lang="ts">
  import { base } from '$app/paths';
  import PageShell from '$lib/PageShell.svelte';
</script>

<svelte:head>
  <title>Page not found · Afallon Compendium</title>
  <meta name="description" content="This address does not match a page in the Afallon Compendium." />
  <meta name="robots" content="noindex" />
</svelte:head>

<PageShell>
  <div class="not-found">
    <p class="eyebrow">Error 404</p>
    <h1>Page not found</h1>
    <p class="lede">This address does not match a page in the current Afallon publication.</p>
    <nav aria-label="Recovery">
      <a class="c-action" href={`${base}/items/`}>Browse the compendium</a>
      <a class="c-action" href={`${base}/`}>Search the atlas</a>
    </nav>
  </div>
</PageShell>

<style>
  .not-found { max-width: 34rem; margin: 6vh auto; padding: 1.5rem; border: 1px solid var(--c-line); border-radius: var(--c-radius); background: var(--c-surface-1); }
  .eyebrow { margin: 0; color: var(--c-accent); font-size: .7rem; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; }
  h1 { margin: .5rem 0; color: #f6f2e7; font: 600 1.8rem/1.2 var(--c-serif); }
  .lede { margin: 0 0 1.2rem; color: var(--c-text-dim); line-height: 1.55; }
  nav { display: flex; flex-wrap: wrap; gap: .75rem; }
</style>
