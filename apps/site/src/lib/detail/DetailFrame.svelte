<script lang="ts">
  import '../compendium.css';
  import { afterNavigate } from '$app/navigation';
  import { followPageScroll } from './side-follow';
  /** Whether the page has an answer card. Without one, the side starts beside the sections. */
  export let answer = true;
  /** Suppress the side when a page has no distinct facts to place there. */
  export let side = true;
  /** On narrow screens, show the side's identity facts before long primary detail. */
  export let mobileSideFirst = false;
  /** On narrow screens, show the main sections before supporting side content. */
  export let mobileRestFirst = false;
  // A navigation to another page returns the side column to its place at the top.
  let navigation = 0;
  afterNavigate(() => { navigation += 1; });
</script>

<!-- A page without side content gives its main column the full width instead of an empty column beside it. -->
<div class="detail-frame" class:no-answer={!answer} class:no-side={!side || !$$slots.side} class:mobile-side-first={mobileSideFirst} class:mobile-rest-first={mobileRestFirst}>
  <div class="head"><slot name="head" /></div>
  {#if answer}<div class="answer"><slot name="answer" /></div>{/if}
  {#if side && $$slots.side}<aside class="side" aria-label="Additional details"><div class="side-column" use:followPageScroll={navigation}><slot name="side" /></div></aside>{/if}
  <div class="rest"><slot /></div>
</div>

<style>
  .detail-frame {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 20rem;
    /* The side starts beside the answer, not the title, so the page's first answer and the side facts share a top edge. */
    grid-template-areas: 'head .' 'answer side' 'rest side';
    /* A side taller than the main column puts its extra height into the last row. With equal rows, the grid spread it
       over the answer row too and opened a gap between the answer and the sections. */
    grid-template-rows: auto auto 1fr;
    gap: var(--c-space-section) 2.5rem;
    align-items: start;
  }
  .detail-frame.no-answer { grid-template-areas: 'head .' 'rest side'; grid-template-rows: auto 1fr; }
  .detail-frame.no-side { grid-template-columns: minmax(0, 1fr); grid-template-areas: 'head' 'answer' 'rest'; grid-template-rows: none; }
  .detail-frame.no-side.no-answer { grid-template-areas: 'head' 'rest'; }
  .head { grid-area: head; }
  .answer { grid-area: answer; }
  /* The side area spans the answer and the sections, and the column inside it stays in view while the page scrolls.
     The column has no scroll area of its own, so the wheel over it scrolls the page. A column taller than the window
     follows the page until its far edge is in view (side-follow.ts). */
  .side { grid-area: side; align-self: stretch; }
  /* The side is a column of cards and short headed groups, one below the other. */
  .side-column { display: grid; align-content: start; gap: 1rem; min-width: 0; position: sticky; top: 1.25rem; }
  .rest { grid-area: rest; }
  .detail-frame > * { min-width: 0; }
  @media (max-width: 1023px) {
    .detail-frame { grid-template-columns: minmax(0, 1fr); grid-template-areas: 'head' 'answer' 'side' 'rest'; grid-template-rows: none; }
    .detail-frame.no-answer { grid-template-areas: 'head' 'side' 'rest'; }
    .detail-frame.no-side { grid-template-areas: 'head' 'answer' 'rest'; }
    .detail-frame.no-side.no-answer { grid-template-areas: 'head' 'rest'; }
    .detail-frame.mobile-side-first:not(.no-side) { grid-template-areas: 'head' 'side' 'answer' 'rest'; }
    .detail-frame.mobile-side-first.no-answer:not(.no-side) { grid-template-areas: 'head' 'side' 'rest'; }
    .detail-frame.mobile-rest-first:not(.no-side) { grid-template-areas: 'head' 'answer' 'rest' 'side'; }
    .side-column { position: static; }
  }
</style>
