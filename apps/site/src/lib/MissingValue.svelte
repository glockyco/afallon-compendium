<script lang="ts">
  import Hint from './Hint.svelte';

  /** Why the value is missing, in plain words. */
  export let explanation: string;
</script>

<span class="missing-value"><Hint text={explanation} label={`Missing value: ${explanation}`}>—</Hint></span>

<style>
  .missing-value { display: inline-flex; min-width: 1.4rem; justify-content: center; color: var(--c-text-mute); }
</style>
