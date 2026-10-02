<script lang="ts">
  // A titled part of a mechanics page, such as one activity or one stage. Its sections follow under it with level 3
  // headings, and the part's rule marks where the next part starts.
  export let id: string;
  export let title: string;
</script>

<section class="part" aria-labelledby={`${id}-title`}>
  <h2 class="part-title" id={`${id}-title`}>{title}</h2>
  <slot />
</section>

<style>
  .part { display: grid; gap: var(--c-space-section); }
  .part-title { margin: 0; padding-bottom: .45rem; border-bottom: 1px solid var(--c-accent-line); color: var(--c-text-strong); font: 700 1.6rem/1.2 var(--c-serif); }
</style>
