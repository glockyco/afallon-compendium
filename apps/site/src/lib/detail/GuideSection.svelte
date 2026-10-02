<script lang="ts">
  import type { GuideSection, PublicKindEntry } from '@afallon/contracts/public';
  import Section from './Section.svelte';
  import RulePhrase from './sections/RulePhrase.svelte';

  /** One mechanic of a guide: its lead, its rules, and the data that the page adds. */
  export let section: GuideSection;
  export let registry: PublicKindEntry[];
  /** One sentence beside the heading that states a value that the whole section shares. */
  export let line: string | undefined = undefined;
</script>

<!-- The `lead` slot continues the lead with computed values. `top` holds data that readers need before the rules, and the
     default slot holds tables and examples that the rules explain. -->
<Section id={section.id} title={section.title} {line}>
  <p class="lead">{section.lead}<slot name="lead" /></p>
  <slot name="top" />
  <ul class="rules">
    {#each section.rules as rule (rule.id)}
      <li>{#if rule.status === 'unknown'}<strong class="unknown">Unknown:</strong>{' '}{/if}<RulePhrase {rule} {registry} /></li>
    {/each}
  </ul>
  <slot />
</Section>

<style>
  .lead, .rules { line-height: 1.55; }
  .rules { display: grid; gap: .45rem; padding-left: 1.25rem; overflow-wrap: anywhere; }
  .rules li::marker { color: var(--c-text-mute); }
  .unknown { color: var(--c-text-strong); text-decoration: underline; text-decoration-color: var(--c-warning-line); text-underline-offset: .2em; }
</style>
