<script lang="ts">
  import Hint from './Hint.svelte';

  // A value that the game data does not establish. The words stand in the value's place and carry the reason, so a
  // reader never sees a bare mark after a value.
  /** Why the value is missing, in plain words. */
  export let explanation: string;
  /** The words in the value's place, such as "an unknown time" inside a sentence. */
  export let text = 'Unknown';
</script>

<span class="missing-value"><Hint text={explanation} label={`${text}: ${explanation}`}>{text}</Hint></span>

<style>
  .missing-value { color: var(--c-text-mute); }
</style>
