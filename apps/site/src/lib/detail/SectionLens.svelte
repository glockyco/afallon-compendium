<script lang="ts">
  import { onMount, tick } from 'svelte';
  import { ChevronUp, TableOfContents } from 'lucide';
  import { iconNodeToSvg } from '../icon-svg';
  import { SECTION_LIST_MINIMUM, type SectionEntry } from './detail-navigation';

  const glyph = iconNodeToSvg(TableOfContents, 'currentColor');
  const chevron = iconNodeToSvg(ChevronUp, 'currentColor');

  /** The rendered sections of the page, in page order. */
  export let sections: SectionEntry[];

  let open = false;
  let activeId: string | undefined;
  let root: HTMLDivElement | undefined;
  let pill: HTMLButtonElement | undefined;

  $: active = sections.find((section) => section.id === activeId) ?? sections[0];

  // The active section is the lowest section whose heading has passed the upper quarter of the viewport. At the end of
  // a scrolled page the last section is active, because a short last section never reaches that line. The lens only reads the
  // scroll position; the links are plain fragment links.
  function select(): void {
    if (sections.length === 0) return;
    // Only a scrolled page can be at its end. Before the sections lay out, an unscrolled page can look short.
    if (window.scrollY > 0 && window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2) {
      activeId = sections[sections.length - 1]!.id;
      return;
    }
    const line = window.innerHeight * 0.25;
    let current = sections[0]!.id;
    for (const section of sections) {
      const element = section.element ?? document.getElementById(section.id);
      if (element && element.getBoundingClientRect().top <= line) current = section.id;
    }
    activeId = current;
  }

  onMount(() => {
    let frame = 0;
    const schedule = () => { if (!frame) frame = requestAnimationFrame(() => { frame = 0; select(); }); };
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    schedule();
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
  });
  $: if (typeof window !== 'undefined' && sections) select();

  async function close(focusPill: boolean): Promise<void> {
    open = false;
    if (focusPill) { await tick(); pill?.focus(); }
  }

  function toTop(): void {
    open = false;
    window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }

  function onPointerDown(event: PointerEvent): void {
    if (open && root && !root.contains(event.target as Node)) open = false;
  }
  function onKeyDown(event: KeyboardEvent): void {
    if (open && event.key === 'Escape') void close(true);
  }
</script>

<svelte:window on:pointerdown={onPointerDown} on:keydown={onKeyDown} />

{#if sections.length >= SECTION_LIST_MINIMUM && active}
  <div class="lens" bind:this={root}>
    {#if open}
      <nav class="menu" id="section-lens-menu" aria-label="On this page">
        <button type="button" class="row top" on:click={toTop}>
          <span class="mark" aria-hidden="true">↑</span>
          <span class="label">Back to top</span>
        </button>
        <div class="rule" aria-hidden="true"></div>
        {#each sections as section, index (section.id)}
          <a class="row section" class:active={section.id === active.id} href={`#${section.id}`} aria-current={section.id === active.id ? 'location' : undefined} style={`--i: ${index}`} on:click={() => { open = false; }}>
            <span class="mark" aria-hidden="true">•</span>
            <span class="index">{String(index + 1).padStart(2, '0')}</span>
            <span class="name">{section.title}</span>
          </a>
        {/each}
      </nav>
    {/if}
    <button type="button" class="pill" bind:this={pill} aria-expanded={open} aria-controls="section-lens-menu" on:click={() => { if (!open) select(); open = !open; }}>
      <span class="glyph" aria-hidden="true">{@html glyph}</span>
      <span class="visually-hidden">On this page:</span>
      <span class="current">{active.title}</span>
      <span class="chevron" class:open aria-hidden="true">{@html chevron}</span>
    </button>
  </div>
{/if}

<style>
  /* The pill floats over the page end, so the page keeps room below its last line. */
  :global(body:has(.lens)) { padding-bottom: 4.5rem; }
  .lens { position: fixed; right: 1.1rem; bottom: 1.1rem; z-index: 40; display: flex; flex-direction: column; align-items: flex-end; gap: .5rem; max-width: calc(100vw - 2.2rem); }
  .pill { display: inline-flex; align-items: center; gap: .6rem; max-width: 100%; margin: 0; padding: .45rem .7rem; border: 1px solid var(--c-line); border-radius: 999px; background: color-mix(in oklab, var(--c-surface-2) 88%, transparent); -webkit-backdrop-filter: blur(8px); backdrop-filter: blur(8px); box-shadow: var(--c-shadow); color: var(--c-text); font: inherit; font-size: var(--c-text-small); line-height: 1.2; cursor: pointer; transition: border-color .15s, background-color .15s; }
  .pill:hover, .pill[aria-expanded='true'] { border-color: var(--c-accent-line); }
  .pill:focus-visible, .row:focus-visible { outline: 2px solid var(--c-accent); outline-offset: 2px; }
  .glyph { display: flex; color: var(--c-accent); }
  .glyph :global(svg) { width: 1rem; height: 1rem; }
  .current { min-width: 0; max-width: 16rem; overflow: hidden; color: var(--c-text-strong); font-weight: 500; text-overflow: ellipsis; white-space: nowrap; }
  .chevron { display: flex; color: var(--c-text-mute); transition: transform .18s; }
  .chevron :global(svg) { width: .9rem; height: .9rem; }
  .chevron.open { transform: rotate(180deg); }
  .visually-hidden { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
  .menu { display: grid; grid-template-columns: auto auto minmax(0, 1fr); column-gap: .75rem; width: max-content; max-width: 100%; max-height: min(70vh, 32rem); overflow-y: auto; padding: .4rem; border: 1px solid var(--c-frame); border-radius: var(--c-radius); background: color-mix(in oklab, var(--c-surface-2) 90%, transparent); -webkit-backdrop-filter: blur(10px); backdrop-filter: blur(10px); box-shadow: 0 14px 38px rgb(0 0 0 / .5); }
  .row { grid-column: 1 / -1; display: grid; grid-template-columns: subgrid; align-items: center; margin: 0; padding: .6rem .75rem; border: 0; border-radius: var(--c-radius-sm); background: none; color: var(--c-text); font: inherit; text-align: left; text-decoration: none; cursor: pointer; }
  .row:hover { background: var(--c-tint-hover); }
  .top { color: var(--c-text-mute); font-size: var(--c-text-label); font-weight: 700; letter-spacing: .12em; text-transform: uppercase; }
  .top .mark { color: var(--c-accent); }
  .top .label { grid-column: 3; }
  .rule { grid-column: 1 / -1; height: 1px; margin: .15rem .4rem; background: var(--c-line); }
  .mark { display: flex; justify-content: center; width: 1ch; color: var(--c-accent); }
  .section .mark { opacity: 0; }
  .section:hover .mark { opacity: .5; }
  .section.active .mark { opacity: 1; }
  .index { color: var(--c-text-mute); font-size: var(--c-text-small); font-variant-numeric: tabular-nums; }
  .name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .section.active .index, .section.active .name { color: var(--c-accent); }
  @media (prefers-reduced-motion: no-preference) {
    .menu { animation: lens-in .16s ease-out; }
    .section { animation: row-in .24s ease-out backwards; animation-delay: calc(40ms + var(--i) * 30ms); }
  }
  @media (prefers-reduced-motion: reduce) { .pill, .chevron { transition: none; } }
  @media (max-width: 520px) { .current { max-width: 11rem; } }
  @keyframes lens-in { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
  @keyframes row-in { from { opacity: 0; transform: translateX(7px); } to { opacity: 1; transform: none; } }
</style>
