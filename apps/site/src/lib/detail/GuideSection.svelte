<script lang="ts">
  import type { GuideSection, PublicKindEntry } from '@afallon/contracts/public';
  import Section from './Section.svelte';
  import RulePhrase from './sections/RulePhrase.svelte';

  /** One mechanic of a guide: its lead, its rules, and the data that the page adds. */
  export let section: GuideSection;
  export let registry: PublicKindEntry[];
  /** One sentence beside the heading that states a value that the whole section shares. */
  export let line: string | undefined = undefined;
  $: verified = section.rules.filter((rule) => rule.status === 'verified');
  $: unknown = section.rules.filter((rule) => rule.status === 'unknown');
</script>

<!-- The section reads as prose: the lead, its computed values, and then the verified rules. `top` holds data that readers
     need before the rules, and the default slot holds tables and examples. Unknown rules close the section as notes. -->
<Section id={section.id} title={section.title} {line}>
  <p class="lead">{section.lead}<slot name="lead" /></p>
  <slot name="top" />
  {#if verified.length}<p class="rules">{#each verified as rule, index (rule.id)}{index ? ' ' : ''}<RulePhrase {rule} {registry} />{/each}</p>{/if}
  <slot />
  {#each unknown as rule (rule.id)}<p class="unknown-rule"><strong class="unknown">Unknown:</strong> <RulePhrase {rule} {registry} /></p>{/each}
</Section>

<style>
  .lead, .rules, .unknown-rule { line-height: 1.55; overflow-wrap: anywhere; }
  .unknown-rule { color: var(--c-text-dim); }
  .unknown { color: var(--c-text-strong); text-decoration: underline; text-decoration-color: var(--c-warning-line); text-underline-offset: .2em; }
</style>
