<script lang="ts">
  // The coverage page groups its counts and gap lists in cards. Detail pages use `detail/Section.svelte` instead.
  import './compendium.css';

  export let title: string;
  export let count: number | undefined = undefined;
</script>

<section class="c-card">
  <header><h2>{title}</h2>{#if count !== undefined}<span class="c-count">({count})</span>{/if}<slot name="action" /></header>
  <slot />
</section>
