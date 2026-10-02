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
  import KofiGlyph from './KofiGlyph.svelte';
  import { kindGlyphSvg } from './kind-icon';
  import { KOFI_URL, siteNavigation } from './site-navigation';
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

  // On a phone the panel stacks its columns, and each column opens on its own. The column of the current page starts open.
  let expanded: string | null = null;
  $: if (browse && !browse.open) expanded = navigationModel.sections.find((section) => section.links.some((link) => current(link.href)) || (section.more && current(section.more.href)))?.id ?? null;

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
        <img src={`${base}/logo.png`} width="36" height="36" alt="" />
        <span class="brand-copy"><strong>Afallon</strong><span>Compendium</span></span>
      </a>
      <nav class="site-nav" aria-label="Site">
        <ul class="primary">
          {#each navigationModel.primary as link (link.href)}<li><a href={link.href} aria-current={current(link.href) ? 'page' : undefined}>{link.label}</a></li>{/each}
        </ul>
        <details class="browse" bind:this={browse}>
          <summary class:current={navigationModel.sections.some((section) => section.links.some((link) => current(link.href))) && !navigationModel.primary.some((link) => current(link.href))}>Browse</summary>
          <div class="panel">
            <div class="columns">
              {#each navigationModel.sections as section (section.id)}
                <section class="group" class:expanded={expanded === section.id} aria-labelledby={`nav-${section.id}`}>
                  <h2 id={`nav-${section.id}`}><button type="button" aria-expanded={expanded === section.id} on:click={() => (expanded = expanded === section.id ? null : section.id)}>{section.label}</button></h2>
                  <ul>{#each section.links as link (link.href)}
                    <li><a href={link.href} aria-current={current(link.href) ? 'page' : undefined}>
                      {#if link.icon && kindGlyphSvg(link.icon)}<span class="glyph" aria-hidden="true">{@html kindGlyphSvg(link.icon)}</span>{/if}
                      <span class="copy"><span class="label">{link.label}</span>{#if link.description}<span class="description">{link.description}</span>{/if}</span>
                    </a></li>
                  {/each}</ul>
                  {#if section.more}<a class="more" href={section.more.href}>{section.more.label}<span aria-hidden="true">→</span></a>{/if}
                </section>
              {/each}
            </div>
          </div>
        </details>
      </nav>
      {#if search}<div class="bar-search"><CompendiumSearch {registry} /></div>{/if}
      <span class="divider" aria-hidden="true"></span>
      <a class="kofi" href={KOFI_URL} rel="external" aria-label="Support on Ko-fi" title="Support on Ko-fi"><KofiGlyph /><span>Support</span></a>
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
        <a class="c-link" href={KOFI_URL} rel="external">Support on Ko-fi</a>
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
  /* The bar is one row of the brand, the site links, search, and support. Its links fill the bar's height, so the current
     link's gold rule sits on the bar's lower edge, under a faint gold line that closes the bar. */
  .bar { position: relative; z-index: 20; border-bottom: 1px solid var(--c-line); background: var(--c-surface-1); }
  .bar::after { content: ''; position: absolute; right: 0; bottom: -1px; left: 0; height: 1px; background: linear-gradient(90deg, transparent, color-mix(in srgb, var(--c-accent-line) 45%, transparent) 50%, transparent); pointer-events: none; }
  .bar-inner { position: relative; display: flex; align-items: stretch; gap: 1.5rem; width: min(72rem, 100%); margin: 0 auto; padding: 0 1.5rem; min-height: 4rem; }
  .brand { display: inline-flex; align-self: center; align-items: center; gap: .65rem; color: var(--c-text); text-decoration: none; }
  .brand img { width: 36px; height: 36px; flex: none; object-fit: contain; }
  .brand-copy { display: grid; gap: .2rem; line-height: 1; }
  .brand-copy strong { color: var(--c-text-strong); font: 700 1.25rem/1 var(--c-serif); letter-spacing: .01em; }
  .brand-copy span { color: var(--c-accent); font-size: .6875rem; font-weight: 600; letter-spacing: .22em; text-transform: uppercase; }
  .brand:hover strong { color: var(--c-accent-strong); }

  .site-nav { display: flex; align-items: stretch; gap: .25rem; }
  .primary { display: flex; align-items: stretch; gap: .25rem; margin: 0; padding: 0; list-style: none; }
  .primary li { display: flex; }
  .primary a, summary { display: inline-flex; align-items: center; gap: .4rem; height: 100%; padding: 0 .65rem; border-top: 2px solid transparent; border-bottom: 2px solid transparent; color: var(--c-text-soft); font-size: .9375rem; font-weight: 500; text-decoration: none; }
  .primary a:hover, summary:hover { color: var(--c-text-strong); border-bottom-color: var(--c-line-strong); }
  .primary a[aria-current='page'], summary.current { color: var(--c-text-strong); border-bottom-color: var(--c-accent); }
  .browse { display: flex; }
  summary { list-style: none; user-select: none; cursor: pointer; }
  summary::-webkit-details-marker { display: none; }
  summary::after { content: ''; width: .38rem; height: .38rem; margin-top: -.2rem; border-right: 1.5px solid currentcolor; border-bottom: 1.5px solid currentcolor; transform: rotate(45deg); opacity: .7; }
  details[open] > summary::after { margin-top: .15rem; transform: rotate(225deg); }
  details[open] > summary { color: var(--c-text-strong); border-bottom-color: var(--c-accent); }
  summary:focus-visible, .site-nav a:focus-visible { outline: 2px solid var(--c-accent); outline-offset: 2px; }
  /* One panel names every destination in labeled columns, so a reader scans all of them at once. It is placed against
     the bar, not the button, and its columns wrap to the space there, so it never runs past the screen edge. */
  /* One panel names every destination in labeled columns, so a reader scans all of them at once. It is placed against
     the bar, not the button, and keeps each column wide enough for a label and its line. A long label wraps inside its
     own highlight. */
  .panel { position: absolute; z-index: 1; top: calc(100% + .35rem); left: 1.5rem; width: min(66rem, calc(100% - 3rem)); max-height: calc(100vh - 5rem); overflow-y: auto; border: 1px solid var(--c-line); border-radius: var(--c-radius); background: var(--c-surface-1); box-shadow: 0 14px 32px var(--c-shadow); }
  .columns { display: grid; grid-template-columns: repeat(auto-fit, minmax(14.5rem, 1fr)); gap: 1.25rem 1rem; padding: 1.1rem 1.1rem .9rem; }
  .group h2 { margin: 0 0 .4rem; padding: 0 .55rem .45rem; border-bottom: 1px solid var(--c-line-soft); color: var(--c-accent); font-size: .8125rem; font-weight: 600; line-height: 1.3; letter-spacing: .06em; text-transform: uppercase; }
  .group h2 button { all: unset; display: block; width: 100%; cursor: default; }
  .group ul { display: grid; gap: .15rem; margin: 0; padding: 0; list-style: none; }
  .group a { display: grid; grid-template-columns: auto minmax(0, 1fr); align-items: start; gap: .65rem; padding: .5rem .55rem; border-radius: var(--c-radius-sm); color: var(--c-text); text-decoration: none; }
  .group a:hover { background: var(--c-tint-hover); }
  .group a:hover .label, .group a[aria-current='page'] .label { color: var(--c-accent); }
  .glyph { display: grid; place-items: center; width: 2rem; height: 2rem; border: 1px solid var(--c-line-soft); border-radius: var(--c-radius-sm); background: var(--c-surface-2); color: var(--c-text-dim); }
  .glyph :global(svg) { width: 1.05rem; height: 1.05rem; }
  .group a:hover .glyph, .group a[aria-current='page'] .glyph { border-color: var(--c-accent-line); color: var(--c-accent); }
  .copy { display: grid; gap: .1rem; min-width: 0; grid-column: -2; }
  .label { font-weight: 600; line-height: 1.3; overflow-wrap: anywhere; }
  .description { color: var(--c-text-dim); font-size: var(--c-text-small); line-height: 1.35; }
  .group a[aria-current='page'] .label { font-weight: 700; }
  /* A column that names only some destinations ends with a link to all of them, aligned with the entry names. */
  /* Entry names sit after the empty glyph column and its gap, so the link takes the same indent. */
  .group a.more { display: inline-flex; gap: .4rem; margin-top: .35rem; padding: .35rem .55rem .35rem calc(.55rem + .65rem); color: var(--c-accent); font-size: var(--c-text-small); font-weight: 600; }
  .group a.more:hover { background: var(--c-tint-hover); color: var(--c-accent-strong); }
  .kofi { display: inline-flex; align-items: center; gap: .45rem; color: var(--c-text-dim); text-decoration: none; }
  .kofi:hover { color: var(--c-text-strong); }
  .kofi :global(svg) { width: 1.15rem; height: 1.15rem; flex: none; }
  .kofi { align-self: center; min-height: 2.25rem; padding: .4rem .5rem; border-radius: var(--c-radius-sm); font-size: var(--c-text-small); white-space: nowrap; }
  .kofi:hover :global(svg) { color: var(--c-accent); }
  .divider { align-self: center; width: 1px; height: 1.5rem; margin-left: auto; background: var(--c-line); }
  .bar-search + .divider { margin-left: 0; }
  /* The field keeps room for a query. Where the bar cannot give it that room, the field moves to a row of its own. */
  .bar-search { align-self: center; flex: 1 1 14rem; min-width: 14rem; max-width: 20rem; margin-left: auto; }

  .c-page { width: min(72rem, 100%); margin: 0 auto; padding: 1.5rem 1.5rem 3rem; }
  .crumbs { display: flex; flex-wrap: wrap; gap: .4rem; margin-bottom: 1.1rem; color: var(--c-text-mute); font-size: var(--c-text-small); }
  .crumbs a { text-decoration: none; }
  .crumbs a:hover { text-decoration: underline; }

  footer { display: flex; flex-wrap: wrap; gap: .3rem 1rem; margin-top: 2.5rem; padding-top: 1rem; border-top: 1px solid var(--c-line); color: var(--c-text-mute); font-size: var(--c-text-small); overflow-wrap: anywhere; }

  /* Below the width of the full bar, Support keeps only the Ko-fi cup, so the search field keeps its room. */
  @media (max-width: 1180px) {
    .kofi span { display: none; }
  }

  @media (max-width: 1023px) {
    .bar-inner { flex-wrap: wrap; gap: 0 1rem; padding: 0 1rem .7rem; }
    .brand, .site-nav { min-height: 3.75rem; }
    .bar-search { flex-basis: 100%; min-width: 0; max-width: none; margin-left: 0; order: 3; }
    .bar-search :global(.compendium-search) { max-width: none; }
    .bar-search + .divider { margin-left: auto; }
  }

  /* Below the width of six links, the bar holds the brand and Browse; the panel lists every destination. */
  @media (max-width: 45rem) {
    .primary { display: none; }
  }

  @media (max-width: 640px) {
    /* The panel stacks its columns as sections that open one at a time, with full-width rows. */
    .panel { left: .5rem; width: calc(100% - 1rem); }
    .columns { grid-template-columns: 1fr; gap: 0; padding: .4rem .5rem; }
    .group { border-bottom: 1px solid var(--c-line-soft); }
    .group:last-child { border-bottom: 0; }
    .group h2 { margin: 0; padding: 0; border: 0; }
    .group h2 button { display: flex; align-items: center; justify-content: space-between; box-sizing: border-box; min-height: 3rem; padding: 0 .55rem; cursor: pointer; }
    .group h2 button::after { content: ''; width: .45rem; height: .45rem; margin-top: -.25rem; border-right: 1.5px solid currentcolor; border-bottom: 1.5px solid currentcolor; transform: rotate(45deg); }
    .group.expanded h2 button::after { margin-top: .2rem; transform: rotate(225deg); }
    .group ul { display: none; padding-bottom: .5rem; }
    .group.expanded ul { display: grid; }
      .kofi { padding: .4rem; }
    .kofi span { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
    .c-page { padding: 1.1rem 1rem 2.5rem; }
  }
</style>
