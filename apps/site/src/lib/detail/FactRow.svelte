<script lang="ts">
  import type { PlacedRule, PublicKindEntry } from '@afallon/contracts/public';
  import EntityLink from '../EntityLink.svelte';
  import Hint from '../Hint.svelte';
  import RulePhrase from './sections/RulePhrase.svelte';
  export let label: string;
  /** The section that holds the rows behind the fact. */
  export let href: string | undefined = undefined;
  export let rules: PlacedRule[] = [];
  export let registry: PublicKindEntry[] = [];
  $: guides = [...new Map(rules.flatMap((entry) => entry.guide ? [[entry.guide.key, entry.guide] as const] : [])).values()];
</script>

<div class="fact-row"><dt>{#if rules.length}<Hint><svelte:fragment slot="explanation">{#each rules as entry}<span class="rule-phrase">{#if entry.rule.status === 'unknown'}Unknown: {/if}<RulePhrase rule={entry.rule} {registry} /></span>{/each}{#if guides.length}<span class="rule-phrase">More in {#each guides as guide, index}{index > 0 ? ', ' : ''}<EntityLink ref={guide} {registry} />{/each}</span>{/if}</svelte:fragment>{label}</Hint>{:else if href}<a class="c-link" {href}>{label}</a>{:else}{label}{/if}</dt><dd><slot /></dd></div>

<style>
  /* The rows share the columns of the list, so labels and values line up. */
  .fact-row { display: contents; }
  dt { color: var(--c-text-dim); }
  dt a { text-decoration-color: color-mix(in srgb, currentcolor 45%, transparent); }
  dd { min-width: 0; margin: 0; color: var(--c-text); overflow-wrap: break-word; }
  .rule-phrase { display: block; }
  .rule-phrase + .rule-phrase { margin-top: .45rem; }
  @media (max-width: 640px) { dd { margin-bottom: .45rem; } }
</style>
