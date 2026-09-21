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
  [data-tone='positive'] { color: #72c875; }
  [data-tone='info'] { color: #77b9e8; }
  [data-tone='effect'] { color: #d4b36d; }
  [data-tone='muted'] { color: var(--c-text-mute); }
  [data-tone='damage'] { color: #e28b75; }
  [data-tone='negative'] { color: #df7770; }
  [data-tone='control'] { color: #c394df; }
  [data-tone='description'] { color: var(--c-text-dim); }
</style>
