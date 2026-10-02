<script lang="ts">
  import type { PlacedRule } from '@afallon/contracts/public';
  import HowItWorks from './HowItWorks.svelte';
  export let label: string;
  /** The section that holds the rows behind the fact. */
  export let href: string | undefined = undefined;
  export let rules: PlacedRule[] = [];
  $: guides = [...new Map(rules.map((entry) => [`${entry.guide.key}:${entry.section}`, entry])).values()];
</script>

<div class="fact-row"><dt>{#if href}<a class="c-link" {href}>{label}</a>{:else}{label}{/if}</dt><dd><slot />{#each guides as guide}<span class="guide"><HowItWorks guide={guide.guide} section={guide.section} /></span>{/each}</dd></div>

<style>
  /* The rows share the columns of the list, so labels and values line up. */
  .fact-row { display: contents; }
  dt { color: var(--c-text-dim); }
  dt a { text-decoration-color: color-mix(in srgb, currentcolor 45%, transparent); }
  dd { min-width: 0; color: var(--c-text); overflow-wrap: break-word; }
  .guide { display: block; margin-top: .2rem; }
  /* On a narrow screen each label sits above its value, and a margin separates one pair from the next. */
  @media (max-width: 640px) { .fact-row:not(:last-child) dd { margin-bottom: .45rem; } }
</style>
