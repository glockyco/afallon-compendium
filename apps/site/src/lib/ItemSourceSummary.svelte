<script lang="ts">
  import type { PublicItem } from '@afallon/contracts/public';
  import { itemSourceLines, summaryText } from './detail/item-sources';

  // The hover tooltip of an item answers how to get it in plain text, because a tooltip holds no links.
  export let document: PublicItem;

  $: lines = itemSourceLines(document);
</script>

<section class="sources" aria-label="How to get it">
  <h4>How to get it</h4>
  {#if lines.length}
    <dl>{#each lines as line}<div><dt>{line.label}</dt><dd>{summaryText(line)}</dd></div>{/each}</dl>
  {:else}<p>No way to get this item is known for this build.</p>{/if}
</section>

<style>
  .sources { display: grid; gap: .35rem; margin-top: .75rem; padding-top: .6rem; border-top: 1px solid var(--c-line-soft); font-size: var(--c-text-small); }
  h4 { margin: 0; color: var(--c-text-dim); font-size: var(--c-text-label); font-weight: 700; letter-spacing: .06em; text-transform: uppercase; }
  dl { display: grid; gap: .25rem; margin: 0; }
  dl > div { display: grid; grid-template-columns: 7.5rem minmax(0, 1fr); gap: .5rem; }
  dt { color: var(--c-text-dim); }
  dd { margin: 0; color: var(--c-text); }
  p { margin: 0; color: var(--c-text-mute); }
</style>
