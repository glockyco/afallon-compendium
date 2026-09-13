<svelte:head>
  <title>Page not found · Afallon Compendium</title>
  <meta name="description" content="This address does not match a page in the Afallon Compendium." />
  <meta name="robots" content="noindex" />
</svelte:head>

<main>
  <p class="eyebrow">Error 404</p>
  <h1>Page not found</h1>
  <p>This address does not match a page in the current Afallon publication.</p>
  <a href="/">Return to the atlas</a>
</main>

<style>
  :global(body) {
    margin: 0;
    background: #171818;
    color: #e9e4d9;
    font-family: Inter, ui-sans-serif, system-ui, -apple-system, sans-serif;
  }
  main { max-width: 34rem; margin: 14vh auto; padding: 2rem; border: 1px solid #3e403b; background: #202120; }
  .eyebrow { color: #bca36e; font-size: .7rem; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; }
  h1 { margin: .5rem 0; font-size: 1.5rem; }
  p { color: #aaa9a0; line-height: 1.5; }
  a { color: #d5b978; text-underline-offset: 3px; }
  @media (max-width: 680px) { main { margin: 2rem .8rem; padding: 1.2rem; } }
</style>
