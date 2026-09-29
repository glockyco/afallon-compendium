<script lang="ts">
  import type { MechanicsRule, PublicKindEntry } from '@afallon/contracts/public';
  import EntityLink from '../../EntityLink.svelte';

  export let rules: MechanicsRule[];
  export let registry: PublicKindEntry[];

  function ruleText(rule: MechanicsRule): string {
    return rule.phrase.replace(/\{([a-z][A-Za-z0-9]*)\}/g, (match, key: string) =>
      Object.hasOwn(rule.operands, key)
        ? rule.operands[key]!.toLocaleString('en-US', { maximumFractionDigits: 4 })
        : match);
  }
</script>

{#if rules.length}
  <ul class="rules">
    {#each rules as rule (rule.id)}
      <li>
        {#if rule.status === 'unknown'}<strong class="unknown">Unknown</strong>{/if}
        {ruleText(rule)}
        {#if rule.links.length}<span class="links">{#each rule.links as ref, index}{index > 0 ? ', ' : ' '}<EntityLink {ref} {registry} />{/each}</span>{/if}
      </li>
    {/each}
  </ul>
{/if}

<style>
  .rules { display: grid; gap: .7rem; margin: .6rem 0 0; padding-left: 1.3rem; line-height: 1.55; }
  .rules li { padding-left: .2rem; }
  .unknown { display: inline-block; margin-right: .4rem; color: var(--c-text-strong); text-decoration: underline; text-decoration-color: var(--c-warning-line); text-underline-offset: .2em; }
</style>
