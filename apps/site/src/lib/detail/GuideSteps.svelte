<script lang="ts">
  import Section from './Section.svelte';

  export let steps: readonly { id: string; title: string; text: string; rules?: readonly string[] }[];
  export let ruleNumbers: ReadonlyMap<string, number> | undefined = undefined;
</script>

<Section id="steps" title="Steps">
  <ol class="steps">
    {#each steps as step (step.id)}
      <li id={`step-${step.id}`}>
        <h3>{step.title}</h3>
        <slot name="content" {step}><p>{step.text}</p></slot>
        {#if step.rules?.length && ruleNumbers}
          <p class="step-links">{step.rules.length > 1 ? 'Rules' : 'Rule'} {#each step.rules as id, index}{#if index > 0}{', '}{/if}<a class="c-link" href={`#rule-${id}`}>{ruleNumbers.get(id)}</a>{/each}</p>
        {/if}
      </li>
    {/each}
  </ol>
</Section>

<style>
  .steps { margin: 0; padding-left: 1.5rem; column-gap: 2.5rem; }
  .steps li { min-width: 0; padding: 0 0 1rem .25rem; break-inside: avoid; scroll-margin-top: 2rem; }
  .steps li:last-child { padding-bottom: 0; }
  h3 { margin: 0 0 .35rem; color: var(--c-text-strong); font: 600 var(--c-text-lead)/1.3 var(--c-serif); }
  .steps :global(p) { margin: 0; line-height: 1.55; }
  .step-links { margin-top: .25rem !important; color: var(--c-text-dim); font-size: var(--c-text-small); overflow-wrap: anywhere; }
  @media (min-width: 1024px) { .steps { columns: 2; } }
</style>
