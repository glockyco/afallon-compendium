<script lang="ts">
  import { onMount } from 'svelte';
  import type { MechanicsRule, PublicKindEntry } from '@afallon/contracts/public';
  import RulePhrase from './RulePhrase.svelte';
  import { ruleNumbers } from '../rule-numbers';

  export let rules: MechanicsRule[];
  export let registry: PublicKindEntry[];
  let disclosure: HTMLDetailsElement;
  onMount(() => {
    const reveal = () => {
      const anchor = decodeURIComponent(window.location.hash.slice(1));
      if (!rules.some((rule) => anchor === `rule-${rule.id}`)) return;
      disclosure.open = true;
      requestAnimationFrame(() => document.getElementById(anchor)?.scrollIntoView({ block: 'center' }));
    };
    reveal();
    window.addEventListener('hashchange', reveal);
    return () => window.removeEventListener('hashchange', reveal);
  });

  const titles: Record<string, string> = {
    'level-curve': 'Level curve', 'all-experience': 'All experience', 'kill-experience': 'Kill experience',
    'quest-experience': 'Quest experience', 'skill-experience': 'Skill experience', 'talent-points': 'Talent points',
    essence: 'Heroic Essence', settings: 'Settings', crafting: 'Crafting', 'crafting-experience': 'Crafting experience',
    'node-selection': 'Node selection', 'node-availability': 'Node availability', 'node-rewards': 'Node rewards', attunement: 'Attunement',
    chests: 'Chests', 'supply-packs': 'Supply packs',
  };
  $: sections = [...new Set(rules.map((rule) => rule.section))];
  $: numbers = ruleNumbers(rules);
</script>

<details id="all-rules" class="rules-disclosure" bind:this={disclosure}>
  <summary>All rules and sources</summary>
  {#each sections as section}
    <div class="rule-group">
      <h3>{titles[section] ?? section.replaceAll('-', ' ')}</h3>
      {#each rules.filter((rule) => rule.section === section) as rule (rule.id)}
        <div class="rule" id={`rule-${rule.id}`}>
          <p><span class="number">{numbers.get(rule.id)}.</span> {#if rule.status === 'unknown'}<strong class="unknown">Unknown:</strong>{' '}{/if}<RulePhrase {rule} {registry} /></p>
          <div class="evidence">
            {#each rule.sources as source}
              <p><strong>{source.method}.</strong> {source.evidence}</p>
            {/each}
            {#if rule.appearsOn.length}<p>Also on {rule.appearsOn.join(', ')}</p>{/if}
          </div>
        </div>
      {/each}
    </div>
  {/each}
</details>

<style>
  .rules-disclosure { min-width: 0; }
  summary { cursor: pointer; color: var(--c-text-strong); font-weight: 600; }
  .rule-group { margin-top: 1.2rem; }
  h3 { margin: 0 0 .5rem; color: var(--c-text-strong); font: 600 var(--c-text-lead)/1.3 var(--c-serif); }
  .rule { scroll-margin-top: 1.5rem; padding: .55rem 0; border-top: 1px solid var(--c-line); overflow-wrap: anywhere; }
  .rule p { margin: 0; line-height: 1.55; }
  .unknown { color: var(--c-text-strong); text-decoration: underline; text-decoration-color: var(--c-warning-line); text-underline-offset: .2em; }
  .number { color: var(--c-text-dim); font-variant-numeric: tabular-nums; }
  .evidence { margin-top: .3rem; color: var(--c-text-dim); font-size: var(--c-text-small); }
  .evidence p + p { margin-top: .25rem; }
</style>
