<script lang="ts">
  import type { PublicKindEntry, RequirementGroup } from '@afallon/contracts/public';
  import EntityLink from './EntityLink.svelte';
  import MissingValue from './MissingValue.svelte';

  export let requirements: RequirementGroup[];
  export let registry: PublicKindEntry[];
  export let emptyExplanation: string | undefined = undefined;

  function separator(group: RequirementGroup, index: number): string {
    if (index === 0) return '';
    if (group.mode === 'any' && (group.requiredCount ?? 1) === 1) return ' or ';
    return group.mode === 'all' ? ' and ' : ', ';
  }
</script>

{#if requirements.length === 0}
  {#if emptyExplanation}<MissingValue explanation={emptyExplanation} />{:else}<span class="none">None</span>{/if}
{:else}
  <ul>
    {#each requirements as group}
      <li>
        {#if group.mode === 'any' && (group.requiredCount ?? 1) > 1}{group.requiredCount} of: {/if}
        {#each group.requirements as requirement, index}
          {separator(group, index)}{#if requirement.target}<EntityLink ref={requirement.target} {registry} />{#if requirement.amount !== undefined} {requirement.amount}{/if}{#if requirement.secondaryAmount !== undefined}–{requirement.secondaryAmount}{/if}{:else}{requirement.label}{/if}
        {/each}
      </li>
    {/each}
  </ul>
{/if}

<style>
  ul { margin: 0; padding-left: 1rem; }
  li + li { margin-top: .25rem; }
  .none { color: #aaa69d; }
</style>
