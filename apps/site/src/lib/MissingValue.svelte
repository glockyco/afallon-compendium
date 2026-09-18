<script lang="ts">
  export let explanation: string;
</script>

<button type="button" class="missing-value" title={explanation} data-explanation={explanation} aria-label={`Missing value: ${explanation}`}>—</button>

<style>
  .missing-value { position: relative; display: inline-flex; min-width: 1.4rem; justify-content: center; padding: 0; border: 0; border-bottom: 1px dotted currentcolor; background: transparent; color: var(--c-text-mute); cursor: help; }
  .missing-value:focus-visible { outline: 2px solid var(--c-accent); outline-offset: 2px; }
  .missing-value::after { position: absolute; top: calc(100% + .35rem); left: 50%; z-index: 20; display: none; min-width: 11rem; padding: .35rem .5rem; border: 1px solid #5d574d; border-radius: var(--c-radius-sm); background: #181715; color: #f4efe3; content: attr(data-explanation); font: .75rem/1.35 system-ui, sans-serif; text-align: left; white-space: normal; transform: translateX(-50%); }
  .missing-value:hover::after, .missing-value:focus-visible::after { display: block; }
</style>
