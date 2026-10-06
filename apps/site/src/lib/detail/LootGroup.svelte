<script lang="ts">
  // One roll of a kill: its name when a section has more than one roll, the sentence that states what the roll gives,
  // and its tables.
  export let title: string | undefined = undefined;
  export let line: string;
</script>

<div class="group">
  <p class="group-line">{#if title}<strong>{title}</strong>{/if}{line}<slot name="line" /></p>
  <div class="tables"><slot /></div>
</div>

<style>
  .group, .tables { display: grid; gap: 1.25rem; min-width: 0; }
  .group { gap: 0; }
  .group-line { margin: 0 0 .5rem; color: var(--c-text-dim); font-size: var(--c-text-body); line-height: 1.5; }
  .group-line strong { display: block; color: var(--c-text-strong); font-weight: 600; }
</style>
