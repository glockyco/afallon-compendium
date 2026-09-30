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
    grid-template-areas: 'head side' 'answer side' 'rest side';
    gap: 1.75rem 2.5rem;
    align-items: start;
  }
  .head { grid-area: head; }
  .answer { grid-area: answer; }
  .side { grid-area: side; position: sticky; top: 1.25rem; max-height: calc(100vh - 2.5rem); overflow-y: auto; overscroll-behavior: contain; scrollbar-width: thin; }
  .rest { grid-area: rest; }
  .detail-frame > * { min-width: 0; }
  @media (max-width: 1023px) {
    .detail-frame { grid-template-columns: minmax(0, 1fr); grid-template-areas: 'head' 'answer' 'side' 'rest'; }
    .side { position: static; max-height: none; overflow: visible; }
  }
</style>
