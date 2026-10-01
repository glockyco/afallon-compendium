<script lang="ts">
  import '../compendium.css';
</script>

<div class="detail-frame">
  <div class="head"><slot name="head" /></div>
  <div class="answer"><slot name="answer" /></div>
  <aside class="side" aria-label="Additional details"><slot name="side" /></aside>
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
  .head { grid-area: head; }
  .answer { grid-area: answer; }
  /* The side scrolls when it is taller than the window. The scroll box clips anything outside it, so a small padding
     keeps focus outlines of the content at its edges visible. The negative margin keeps the content aligned. */
  /* The side is a column of cards and short headed groups, one below the other. */
  .side { grid-area: side; display: grid; align-content: start; gap: 1rem; position: sticky; top: 1.25rem; max-height: calc(100vh - 2.5rem); overflow-y: auto; overscroll-behavior: contain; scrollbar-width: thin; margin: -.3rem; padding: .3rem; }
  .rest { grid-area: rest; }
  .detail-frame > * { min-width: 0; }
  @media (max-width: 1023px) {
    .detail-frame { grid-template-columns: minmax(0, 1fr); grid-template-areas: 'head' 'answer' 'side' 'rest'; grid-template-rows: none; }
    .side { position: static; max-height: none; overflow: visible; margin: 0; padding: 0; }
  }
</style>
