<script lang="ts">
  import type { RequirementGroup } from '@afallon/contracts/public';
  import MissingValue from './MissingValue.svelte';

  export let requirements: RequirementGroup[];
  export let emptyExplanation: string | undefined = undefined;
  export let fulfilled = false;

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
  <ul class="requirements" class:fulfilled>
    {#each requirements as group}
      <li>
        {#if group.mode === 'any' && group.checkCount && (group.requiredCount ?? 1) > 1}<span class="count">{group.requiredCount} of</span>{/if}
        {#each group.requirements as requirement, index}{separator(group, index)}{requirement.label}{/each}
      </li>
    {/each}
  </ul>
{/if}

<style>
  .requirements { display: grid; gap: .3rem; margin: 0; padding: 0; list-style: none; }
  li { display: flex; flex-wrap: wrap; align-items: center; gap: .25rem; font-size: .85rem; }
  .count { color: var(--c-text-dim); }
  .fulfilled { color: #72c875; }
  .fulfilled .count { color: inherit; }
</style>
