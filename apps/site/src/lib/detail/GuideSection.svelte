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
  $: verified = rules.filter((rule) => rule.status === 'verified');
  $: unknown = rules.filter((rule) => rule.status === 'unknown');
</script>

<Section id={section.id} title={section.title} {line}>
  <p class="lead">{section.lead}<slot name="lead" /></p>
  <slot name="top" />
  {#each verified as rule (rule.id)}<p class="rule"><RulePhrase {rule} {registry} /></p>{/each}
  <slot />
  {#if unknown.length}
    <details class="unknown"><summary>Unconfirmed details</summary>
      {#each unknown as rule (rule.id)}<p><RulePhrase {rule} {registry} /></p>{/each}
    </details>
  {/if}
</Section>

<style>
  .lead, .rule, .unknown { line-height: 1.55; }
  .unknown { border-top: 1px solid var(--c-line-soft); padding-top: .8rem; }
  .unknown summary { color: var(--c-accent); cursor: pointer; font-weight: 600; }
  .unknown p { margin: .6rem 0 0; }
</style>
