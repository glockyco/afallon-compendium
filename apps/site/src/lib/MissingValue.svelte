<script lang="ts">
  export let explanation: string;
</script>

<button type="button" class="missing-value" title={explanation} data-explanation={explanation} aria-label={`Missing value: ${explanation}`}>—</button>

<style>
  .missing-value { display: inline-flex; min-width: 1.4rem; justify-content: center; padding: 0; border: 0; border-bottom: 1px dotted currentColor; background: transparent; color: #a5a198; cursor: help; position: relative; }
  .missing-value:focus-visible { outline: 2px solid #d5b978; outline-offset: 2px; }
  .missing-value::after { background: #181715; border: 1px solid #5d574d; border-radius: 0.25rem; color: #f4efe3; content: attr(data-explanation); display: none; font: 0.75rem/1.35 system-ui, sans-serif; left: 50%; min-width: 11rem; padding: 0.35rem 0.5rem; position: absolute; top: calc(100% + 0.35rem); transform: translateX(-50%); white-space: normal; z-index: 20; }
  .missing-value:hover::after, .missing-value:focus-visible::after { display: block; }
</style>
