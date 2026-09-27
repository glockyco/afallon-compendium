<script lang="ts">
  /** A heading for a group of facts, such as "How to get it". */
  export let title: string | undefined = undefined;
</script>

<div class="fact-list">
  {#if title}<h3>{title}</h3>{/if}
  {#if $$slots.note}<p class="note"><slot name="note" /></p>{:else}<dl><slot /></dl>{/if}
</div>

<style>
  h3 { margin: 0 0 .45rem; color: var(--c-text-dim); font-size: .72rem; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; }
  dl { display: grid; grid-template-columns: max-content minmax(0, 1fr); align-items: baseline; gap: .4rem 1.25rem; margin: 0; font-size: .88rem; line-height: 1.45; }
  .note { display: flex; align-items: baseline; gap: .4rem; margin: 0; color: var(--c-text-dim); font-size: .88rem; }
  @media (max-width: 640px) { dl { grid-template-columns: minmax(0, 1fr); gap: .15rem; } }
</style>
