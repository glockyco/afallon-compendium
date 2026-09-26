<script lang="ts">
  import type { RequirementGroup } from '@afallon/contracts/public';
  import { requirementCountLabel, requirementSeparator } from './format';

  // Renders requirement groups and their text spans. The caller renders each referenced entity through the
  // default slot, because pages link entities and tooltips cannot import the linking component.
  export let requirements: RequirementGroup[];
</script>

<ul class="requirements">
  {#each requirements as group}
    {@const countLabel = requirementCountLabel(group)}
    <li>
      {#if countLabel}<span class="count">{countLabel}</span>{/if}
      {#each group.requirements as requirement, index}
        {requirementSeparator(group, index)}{#each requirement.spans as span}{#if 'ref' in span}<slot ref={span.ref} />{:else}{span.text}{/if}{/each}
      {/each}
    </li>
  {/each}
</ul>

<style>
  .requirements { display: grid; gap: .3rem; margin: 0; padding: 0; list-style: none; }
  li { display: flex; flex-wrap: wrap; align-items: center; gap: .25rem; font-size: .85rem; }
  .count { color: var(--c-text-dim); }
</style>
