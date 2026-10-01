<script lang="ts">
  import Section from './Section.svelte';

  export let steps: readonly { id: string; title: string; text: string; rules?: readonly string[] }[];
  export let ruleNumbers: ReadonlyMap<string, number> | undefined = undefined;

  // Wide screens show the steps in two columns, read down the first and then down the second. Each column is its own
  // list that continues the numbering, so a column ends at its last step and has no space left over from balancing.
  $: half = Math.ceil(steps.length / 2);
  $: columns = [steps.slice(0, half), steps.slice(half)].filter((column) => column.length > 0);
</script>

<Section id="steps" title="Steps">
  <div class="steps">
    {#each columns as column, columnIndex}
      <ol start={columnIndex * half + 1}>
        {#each column as step (step.id)}
          <li id={`step-${step.id}`}>
            <h3>{step.title}</h3>
            <slot name="content" {step}><p>{step.text}</p></slot>
            {#if step.rules?.length && ruleNumbers}
              <p class="step-links">{step.rules.length > 1 ? 'Rules' : 'Rule'} {#each step.rules as id, index}{#if index > 0}{', '}{/if}<a class="c-link" href={`#rule-${id}`}>{ruleNumbers.get(id)}</a>{/each}</p>
            {/if}
          </li>
        {/each}
      </ol>
    {/each}
  </div>
</Section>

<style>
  .steps { display: grid; gap: 1rem 2.5rem; align-items: start; }
  ol { display: grid; gap: 1rem; padding-left: 1.5rem; }
  li { min-width: 0; padding-left: .25rem; scroll-margin-top: 2rem; }
  h3 { margin-bottom: .35rem; color: var(--c-text-strong); font: 600 var(--c-text-lead)/1.3 var(--c-serif); }
  .steps :global(p) { line-height: 1.55; }
  .step-links { margin-top: .25rem; color: var(--c-text-dim); font-size: var(--c-text-small); overflow-wrap: anywhere; }
  @media (min-width: 1024px) { .steps { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
</style>
