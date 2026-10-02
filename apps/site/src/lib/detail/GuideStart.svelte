<script lang="ts">
  // The opening of a mechanics page: what the mechanic is, then columns that say where a reader starts. Each child of
  // the default slot is one column, headed by an h2.
  export let overview: string;
  export let label = 'Where to start';
</script>

<section class="start" aria-label={label}>
  <p class="overview">{overview}</p>
  {#if $$slots.default}<div class="columns"><slot /></div>{/if}
</section>

<style>
  .start { display: grid; gap: 1.1rem; margin-bottom: var(--c-space-section); padding: 1.1rem 1.25rem 1.2rem; border: 1px solid var(--c-frame); border-radius: .625rem; background: linear-gradient(180deg, var(--c-accent-surface), var(--c-surface-1) 70%); }
  .overview { margin: 0; color: var(--c-text-strong); line-height: 1.55; }
  .columns { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 18rem), 1fr)); gap: 1rem 2rem; }
  .columns > :global(*) { display: grid; gap: .55rem; align-content: start; min-width: 0; }
  .columns > :global(*) > :global(h2) { margin: 0; color: var(--c-accent); font-size: var(--c-text-body); font-weight: 700; }
</style>
