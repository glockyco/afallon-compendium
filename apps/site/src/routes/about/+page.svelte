<script lang="ts">
  import { base } from '$app/paths';
  import PageShell from '$lib/PageShell.svelte';
  import SeoHead from '$lib/SeoHead.svelte';
  import { formatCalendarDate } from '$lib/format';
  import { KOFI_URL } from '$lib/site-navigation';
  import { STEAM_URL, STEAM_GUIDE_URL } from '$lib/seo';
  import type { PageData } from './$types';
  export let data: PageData;
  const crumbs = [{ label: 'Compendium', href: `${base}/` }, { label: 'About' }];
</script>

<SeoHead title="About · Afallon Wiki" description="Learn how the Afallon Compendium wiki and interactive map are made, what they cover, and when the data was last updated." />

<PageShell registry={data.registry} release={data.release} {crumbs}>
  <article class="about">
    <header>
      <h1>About Afallon Compendium</h1>
      <p class="lead">Afallon Compendium is a fan-made map and game reference for Afallon. It works like a wiki, but every page is generated from the game's files rather than edited by hand.</p>
    </header>
    <div class="columns">
      <div class="sections">
        <section aria-labelledby="game"><h2 id="game">About Afallon</h2>
          <p>Afallon is a single-player RPG with the feel of an MMO. Choose a class and race, explore an open world, and take on dungeons with NPC adventurers. Stargazing interactive develops and publishes the game. It entered Steam Early Access for Windows on November 27, 2025.</p>
          <p><a class="c-link" href={STEAM_URL} rel="external">Play Afallon on Steam</a></p>
        </section>
        <section aria-labelledby="reference"><h2 id="reference">How This Reference Is Made</h2>
          <p>The reference is built from the game's data and checks of how its rules work. It follows Afallon {data.release.version}, patched {formatCalendarDate(data.release.patchNotes.date)}, with data from {formatCalendarDate(data.release.dataDate)}. Some entries and locations are incomplete. Check <a class="c-link" href={`${base}/coverage/`}>Coverage</a> for known gaps and the <a class="c-link" href={data.release.patchNotes.url} rel="external">Patch Notes</a> for the game's changes.</p>
        </section>
        <section aria-labelledby="disclaimer"><h2 id="disclaimer">Unofficial Fan Project</h2>
          <p>Afallon Compendium is an unofficial fan project and is not affiliated with the developer or publisher of Afallon. Afallon and its related names, artwork, and assets belong to their respective owners.</p>
        </section>
      </div>
      <aside aria-labelledby="links"><h2 id="links">More Links</h2>
        <ul>
          <li><a href={STEAM_URL} rel="external">Game on Steam</a></li>
          <li><a href={STEAM_GUIDE_URL} rel="external">Steam Guide</a></li>
          <li><a href={`${base}/coverage/`}>Coverage</a></li>
          <li><a href={data.release.patchNotes.url} rel="external">Patch Notes</a></li>
          <li><a href={KOFI_URL} rel="external">Support on Ko-fi</a></li>
        </ul>
      </aside>
    </div>
  </article>
</PageShell>

<style>
  header { padding: 1.5rem 0 2rem; border-bottom: 1px solid var(--c-line); }
  h1 { margin: 0; color: var(--c-text-strong); font: 600 clamp(2rem, 4vw, 3rem)/1.12 var(--c-serif); }
  .lead { max-width: 49rem; margin: 1rem 0 0; color: var(--c-text); font-size: var(--c-text-lead); line-height: 1.55; }
  .columns { display: grid; grid-template-columns: minmax(0, 1fr) minmax(13rem, 17rem); align-items: start; gap: clamp(2rem, 5vw, 5rem); padding-top: 2rem; }
  /* Rules separate sections and never close the last one, which the footer's own rule already does. */
  .sections { display: grid; gap: 1.5rem; }
  section + section { padding-top: 1.5rem; border-top: 1px solid var(--c-line-soft); }
  h2 { margin: 0 0 .75rem; color: var(--c-text-strong); font: 600 1.5rem/1.25 var(--c-serif); }
  p { margin: 0 0 .8rem; color: var(--c-text-dim); line-height: 1.65; }
  p:last-child { margin-bottom: 0; }
  aside { padding: 1.2rem; border: 1px solid var(--c-line); border-radius: var(--c-radius); background: var(--c-surface-1); }
  aside h2 { font-size: 1.2rem; }
  ul { display: grid; gap: .65rem; margin: 0; padding: 0; list-style: none; }
  li a { color: var(--c-accent); text-underline-offset: .2em; }
  @media (max-width: 700px) { .columns { grid-template-columns: minmax(0, 1fr); } header { padding-top: .5rem; } }
</style>
