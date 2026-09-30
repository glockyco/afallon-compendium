<script lang="ts">
  import '../compendium.css';
  export let title: string;
  export let id: string | undefined = undefined;
</script>

<section class="answer-card" {id} aria-label={title}>
  <h2>{title}</h2>
  <slot />
</section>

<style>
  .answer-card { min-width: 0; padding: 1.25rem 1.35rem; border: 1px solid var(--c-frame); border-radius: .625rem; background: linear-gradient(180deg, var(--c-accent-surface), var(--c-surface-1) 70%); scroll-margin-top: 1rem; }
  h2 { margin: 0 0 1rem; color: var(--c-accent); font-size: var(--c-text-body); font-weight: 700; }
  @media (max-width: 640px) { .answer-card { padding: 1rem; } }
</style>
