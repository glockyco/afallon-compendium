<script lang="ts">
  import type { PublicKindEntry, RequirementGroup } from '@afallon/contracts/public';
  import EntityLink from './EntityLink.svelte';
  import MissingValue from './MissingValue.svelte';

  export let requirements: RequirementGroup[];
  export let registry: PublicKindEntry[];
  export let emptyExplanation: string | undefined = undefined;

  // A group the game satisfies with any one member reads as an alternative: "Shieldmaster or
  // Assassin". A group it checks in full reads as a conjunction.
  function separator(group: RequirementGroup, index: number): string {
    if (index === 0) return '';
    if (group.mode === 'any' && (group.requiredCount ?? 1) === 1) return ' or ';
    return group.mode === 'all' ? ' and ' : ', ';
  }
</script>

{#if requirements.length === 0}
  {#if emptyExplanation}<MissingValue explanation={emptyExplanation} />{/if}
{:else}
  <ul class="requirements">
    {#each requirements as group}
      <li>
        {#if group.mode === 'any' && (group.requiredCount ?? 1) > 1}<span class="count">{group.requiredCount} of</span>{/if}
        {#each group.requirements as requirement, index}{separator(group, index)}{#if requirement.target}<EntityLink ref={requirement.target} {registry} />{#if requirement.amount !== undefined}&nbsp;{requirement.amount}{/if}{#if requirement.secondaryAmount !== undefined}–{requirement.secondaryAmount}{/if}{:else}{requirement.label}{/if}{/each}
      </li>
    {/each}
  </ul>
{/if}

<style>
  .requirements { display: grid; gap: .3rem; margin: 0; padding: 0; list-style: none; }
  li { display: flex; flex-wrap: wrap; align-items: center; gap: .25rem; font-size: .85rem; }
  .count { color: var(--c-text-dim); }
</style>
