<script lang="ts" context="module">
  export type Crumb = { label: string; href?: string };
</script>

<script lang="ts">
  import { afterNavigate } from '$app/navigation';
  import { base } from '$app/paths';
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import type { PublicKindEntry, PublicRelease } from '@afallon/contracts/public';
  import CompendiumSearch from './CompendiumSearch.svelte';
  import { formatCalendarDate } from './format';
  import { siteNavigation } from './site-navigation';
  import './compendium.css';

  export let registry: PublicKindEntry[] = [];
  export let crumbs: Crumb[] = [];
  /** The release of the selected publication. The footer names it with its patch notes. */
  export let release: PublicRelease | undefined = undefined;
  /** False on a page that shows its own search, so the page has one search field. */
  export let search = true;

  $: navigationModel = siteNavigation(registry, base);
  // A reactive function, so the markup that calls it follows client-side navigation.
  $: current = (href: string) => $page.url.pathname.startsWith(href);

  // Browse is a native disclosure, so the menu works without JavaScript. With JavaScript, Escape, an outside click, focus
  // that leaves the menu, or a navigation closes it.
  let browse: HTMLDetailsElement;

  function closeBrowse(): void {
    if (browse) browse.open = false;
  }

  function onKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Escape' || !browse.open) return;
    browse.open = false;
    browse.querySelector('summary')?.focus();
  }

  // Focus that moves to an element outside the menu closes it. Focus that moves to no element, as when Safari clicks a
  // link without focusing it, leaves the menu open for the click, and the pointer handler closes it.
  function onFocusout(event: FocusEvent): void {
    if (event.relatedTarget instanceof Node && !browse.contains(event.relatedTarget)) browse.open = false;
  }

  onMount(() => {
    const onPointerDown = (event: PointerEvent) => { if (!(event.target instanceof Node) || !browse.contains(event.target)) closeBrowse(); };
    document.addEventListener('pointerdown', onPointerDown);
    browse.addEventListener('keydown', onKeydown);
    browse.addEventListener('focusout', onFocusout);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      browse.removeEventListener('keydown', onKeydown);
      browse.removeEventListener('focusout', onFocusout);
    };
  });
  // The first load also counts as a navigation. It keeps a menu that a reader opened before the page became interactive.
  afterNavigate((navigated) => { if (navigated.type !== 'enter') closeBrowse(); });
</script>

<div class="frame">
  <header class="bar">
    <div class="bar-inner">
      <a class="brand" href={`${base}/`}>
        <img src={`${base}/logo.png`} width="32" height="32" alt="" />
        <span class="brand-copy"><strong>Afallon</strong><span>Compendium</span></span>
      </a>
      <nav class="site-nav" aria-label="Site">
        <ul class="primary">
          {#each navigationModel.primary as link (link.href)}<li><a href={link.href} aria-current={current(link.href) ? 'page' : undefined}>{link.label}</a></li>{/each}
        </ul>
        <details class="browse" bind:this={browse}>
          <summary class:current={navigationModel.sections.some((section) => section.links.some((link) => current(link.href))) && !navigationModel.primary.some((link) => current(link.href))}>Browse</summary>
          <div class="panel">
            {#each navigationModel.sections as section (section.id)}
              <section aria-labelledby={`nav-${section.id}`}>
                <h2 id={`nav-${section.id}`}>{section.label}</h2>
                <ul>{#each section.links as link (link.href)}<li><a href={link.href} aria-current={current(link.href) ? 'page' : undefined}>{link.label}</a></li>{/each}</ul>
              </section>
            {/each}
          </div>
        </details>
      </nav>
      {#if search}<div class="bar-search"><CompendiumSearch {registry} /></div>{/if}
    </div>
  </header>

  <main>
    <!-- A page can open with a full-width band above its centered content. -->
    <slot name="hero" />
    <div class="c-page">
      {#if crumbs.length}
        <nav class="crumbs" aria-label="Breadcrumb">
          {#each crumbs as crumb, index}
            {#if index > 0}<span aria-hidden="true">/</span>{/if}
            {#if crumb.href}<a class="c-link" href={crumb.href}>{crumb.label}</a>{:else}<span aria-current="page">{crumb.label}</span>{/if}
          {/each}
        </nav>
      {/if}
      <slot />
      <footer>
        {#if release}
          <span>Afallon {release.version}</span>
          <span>Patched {formatCalendarDate(release.patchNotes.date)}</span>
          <span>Data from {formatCalendarDate(release.dataDate)}</span>
          <a class="c-link" href={release.patchNotes.url} rel="external">Patch notes</a>
        {/if}
        <slot name="footer-extra" />
        <a class="c-link" href={`${base}/coverage/`}>Coverage</a>
      </footer>
    </div>
  </main>
</div>

<style>
  :global(*) { box-sizing: border-box; }
  :global(body) { margin: 0; background: var(--c-surface-0); color: var(--c-text); font: 1rem/1.5 Inter, ui-sans-serif, system-ui, -apple-system, sans-serif; }
  :global(button, input, select) { font: inherit; }
  :global(button, select) { cursor: pointer; }
  :global(a) { color: var(--c-accent); }

  .frame { min-height: 100vh; }
  .bar { position: relative; z-index: 20; border-bottom: 1px solid var(--c-line); background: var(--c-surface-1); }
  .bar-inner { position: relative; display: flex; align-items: center; gap: 1.25rem; width: min(72rem, 100%); margin: 0 auto; padding: .7rem 1.5rem; min-height: 3.75rem; }
  .brand { display: inline-flex; align-items: center; gap: .55rem; color: var(--c-text); text-decoration: none; }
  .brand img { width: 32px; height: 32px; flex: none; object-fit: contain; }
  .brand-copy { display: grid; line-height: 1; }
  .brand-copy strong { font-size: 1rem; }
  .brand-copy span { margin-top: .15rem; color: var(--c-accent); font-size: .875rem; font-weight: 600; }
  .brand:hover strong { color: var(--c-accent); }

  .site-nav { display: flex; align-items: center; gap: .25rem; }
  .primary { display: flex; gap: .25rem; margin: 0; padding: 0; list-style: none; }
  .primary a, summary { display: inline-flex; align-items: center; gap: .4rem; min-height: 2.25rem; padding: .4rem .6rem; border: 1px solid transparent; border-radius: var(--c-radius-sm); color: var(--c-text); font-size: var(--c-text-body); text-decoration: none; }
  .primary a:hover { background: var(--c-surface-2); color: var(--c-accent); }
  .primary a[aria-current='page'], summary.current { color: var(--c-accent); }
  summary { list-style: none; user-select: none; cursor: pointer; }
  summary::-webkit-details-marker { display: none; }
  summary::after { content: ''; width: .38rem; height: .38rem; margin-top: -.2rem; border-right: 1.5px solid currentcolor; border-bottom: 1.5px solid currentcolor; transform: rotate(45deg); opacity: .7; }
  details[open] > summary::after { margin-top: .15rem; transform: rotate(225deg); }
  summary:hover, details[open] > summary { border-color: var(--c-line); background: var(--c-surface-2); }
  summary:focus-visible, .site-nav a:focus-visible { outline: 2px solid var(--c-accent); outline-offset: 2px; }
  /* One panel names every destination in labeled columns, so a reader scans all of them at once. It is placed against
     the bar, not the button, and its columns wrap to the space there, so it never runs past the screen edge. */
  .panel { position: absolute; z-index: 1; top: calc(100% - .25rem); left: 1.5rem; display: grid; width: min(52rem, calc(100% - 3rem)); grid-template-columns: repeat(auto-fit, minmax(11rem, 1fr)); gap: 1rem 1.5rem; padding: 1rem 1.1rem; border: 1px solid var(--c-line); border-radius: var(--c-radius); background: var(--c-surface-1); box-shadow: 0 10px 24px var(--c-shadow); }
  .panel h2 { margin: 0 0 .35rem; padding: 0 .5rem; color: var(--c-text-dim); font-size: var(--c-text-small); font-weight: 600; }
  .panel ul { margin: 0; padding: 0; list-style: none; }
  .panel a { display: block; padding: .4rem .5rem; border-radius: 2px; color: var(--c-text); text-decoration: none; white-space: nowrap; }
  .panel a:hover { background: var(--c-tint-hover); color: var(--c-accent); }
  .panel a[aria-current='page'] { color: var(--c-accent); font-weight: 600; }
  .bar-search { min-width: 0; flex: 1; max-width: 22rem; margin-left: auto; }

  .c-page { width: min(72rem, 100%); margin: 0 auto; padding: 1.5rem 1.5rem 3rem; }
  .crumbs { display: flex; flex-wrap: wrap; gap: .4rem; margin-bottom: 1.1rem; color: var(--c-text-mute); font-size: var(--c-text-small); }
  .crumbs a { text-decoration: none; }
  .crumbs a:hover { text-decoration: underline; }

  footer { display: flex; flex-wrap: wrap; gap: .3rem 1rem; margin-top: 2.5rem; padding-top: 1rem; border-top: 1px solid var(--c-line); color: var(--c-text-mute); font-size: var(--c-text-small); overflow-wrap: anywhere; }

  @media (max-width: 860px) {
    .bar-inner { flex-wrap: wrap; gap: .75rem 1rem; padding: .6rem 1rem; }
    .bar-search { flex-basis: 100%; max-width: none; margin-left: 0; order: 3; }
  }

  /* Below the width of six links, the bar holds the brand and Browse; the panel lists every destination. */
  @media (max-width: 45rem) {
    .primary { display: none; }
  }

  @media (max-width: 640px) {
    .panel { left: 1rem; width: calc(100% - 2rem); grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .panel a { padding: .55rem .5rem; white-space: normal; }
    .c-page { padding: 1.1rem 1rem 2.5rem; }
  }
</style>
