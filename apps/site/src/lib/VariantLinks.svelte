<script lang="ts">
  import type { NpcVariant } from '@afallon/contracts/public';

  /** The anchors of the variants to link, on the page that lists `variants`. */
  export let anchors: readonly string[];
  export let variants: readonly NpcVariant[];
</script>

<span class="variants">{#each anchors as anchor}<a class="c-link" href={`#${anchor}`}>{variants.find((variant) => variant.anchor === anchor)?.label ?? anchor}</a>{/each}</span>

<style>
  .variants { display: inline-flex; flex-wrap: wrap; gap: .2rem .6rem; }
</style>
