<script lang="ts">
  export let label: string;
  /** The section that holds the rows behind the fact. */
  export let href: string | undefined = undefined;
</script>

<div class="fact-row"><dt>{#if href}<a class="c-link" {href}>{label}</a>{:else}{label}{/if}</dt><dd><slot /></dd></div>

<style>
  /* The rows share the columns of the list, so labels and values line up. */
  .fact-row { display: contents; }
  dt { color: var(--c-text-dim); }
  dt a { text-decoration-color: color-mix(in srgb, currentcolor 45%, transparent); }
  dd { min-width: 0; margin: 0; color: var(--c-text); overflow-wrap: break-word; }
  @media (max-width: 640px) { dd { margin-bottom: .45rem; } }
</style>
