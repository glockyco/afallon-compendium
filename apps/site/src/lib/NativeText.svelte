<script lang="ts">
  import type { NativeTextLine } from '@afallon/contracts/public';

  export let lines: NativeTextLine[];
</script>

<div class="native-text">
  {#each lines as line}
    <p>{#each line.spans as span}<span class:italic={span.italic} data-tone={span.tone ?? undefined}>{span.text}</span>{/each}</p>
  {/each}
</div>

<style>
  .native-text { display: grid; gap: .22rem; }
  p { min-height: 1em; margin: 0; color: var(--c-text); line-height: 1.42; white-space: pre-wrap; }
  .italic { font-style: italic; }
  [data-tone='positive'] { color: var(--c-positive); }
  [data-tone='info'] { color: var(--c-tone-info); }
  [data-tone='effect'] { color: var(--c-tone-effect); }
  [data-tone='muted'] { color: var(--c-text-mute); }
  [data-tone='damage'] { color: var(--c-tone-damage); }
  [data-tone='negative'] { color: var(--c-tone-negative); }
  [data-tone='control'] { color: var(--c-tone-control); }
  [data-tone='description'] { color: var(--c-text-dim); }
</style>
