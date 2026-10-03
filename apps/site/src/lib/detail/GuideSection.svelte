<script lang="ts">
  import type { GuideSection, MechanicsRule, PublicKindEntry } from '@afallon/contracts/public';
  import Section from './Section.svelte';
  import RulePhrase from './sections/RulePhrase.svelte';

  /** A topic section supplies its lead and rules; pages may compose a different rule layout in the default slot. */
  export let section: GuideSection;
  export let registry: PublicKindEntry[];
  export let rules: MechanicsRule[] = section.rules;
  /** One sentence beside the heading that states a value that the whole section shares. */
  export let line: string | undefined = undefined;
  /** The heading level, 3 when the section sits inside a titled part of its page. */
  export let level: 2 | 3 = 2;
  $: verified = rules.filter((rule) => rule.status === 'verified');
  $: unknown = rules.filter((rule) => rule.status === 'unknown');
</script>

<!-- The section reads as prose: the lead, its computed values, and then the verified rules. `top` holds data that readers
     need before the rules, and the default slot holds tables and examples. Unknown rules close the section as notes. -->
<Section id={section.id} title={section.title} {line} {level}>
  {#if section.lead || $$slots.lead}<p class="lead">{section.lead}<slot name="lead" /></p>{/if}
  <slot name="top" />
  {#each verified as rule (rule.id)}<div class="rule"><RulePhrase {rule} {registry} /></div>{/each}
  <slot />
  {#if unknown.length}
    <details class="unknown"><summary>Unconfirmed Details</summary>
      {#each unknown as rule (rule.id)}<div class="rule-line"><RulePhrase {rule} {registry} /></div>{/each}
    </details>
  {/if}
</Section>

<style>
  .lead, .rule, .unknown { line-height: 1.55; }
  .rule-line { text-wrap: balance; }
  @supports (text-wrap: pretty) { .rule-line { text-wrap: pretty; } }
  .unknown { border-top: 1px solid var(--c-line-soft); padding-top: .8rem; }
  .unknown summary { color: var(--c-accent); cursor: pointer; font-weight: 600; }
  .unknown .rule-line { margin: .6rem 0 0; }
</style>
