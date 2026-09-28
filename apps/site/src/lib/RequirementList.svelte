<script lang="ts">
  import type { RequirementGroup, RequirementRef } from '@afallon/contracts/public';
  import { requirementCountLabel, requirementSeparator } from './format';

  // Renders requirement groups and their text spans. The caller renders each referenced entity through the
  // default slot, because pages link entities and tooltips cannot import the linking component.
  export let requirements: RequirementGroup[];
  /** False for use requirements, whose phrases such as "Ursine Aspect is active" read fully without a kind label. */
  export let kindLabels = true;

  function conditionPrefix(requirement: RequirementRef): string {
    switch (requirement.type.name) {
      case 'Class': return 'Class:';
      case 'Effect': return 'Effect:';
      case 'Quest': return 'Quest:';
      case 'Skill': return 'Skill:';
      case 'Currency': return 'Currency:';
      case 'Time': return /^time\b/i.test(requirement.label) ? '' : 'Time:';
      default: return '';
    }
  }
</script>

<ul class="requirements">
  {#each requirements as group}
    {@const countLabel = requirementCountLabel(group)}
    <li>
      {#if countLabel}<span class="count">{countLabel}</span>{/if}
      {#each group.requirements as requirement, index}
        {@const prefix = kindLabels ? conditionPrefix(requirement) : ''}
        {requirementSeparator(group, index)}<span class="condition">{#if prefix}<span class="kind">{prefix}</span>{' '}{/if}{#each requirement.spans as span}{#if 'ref' in span}<slot ref={span.ref} />{:else}{span.text}{/if}{/each}</span>
      {/each}
    </li>
  {/each}
</ul>

<style>
  .requirements { display: inline; margin: 0; padding: 0; list-style: none; }
  li { display: inline; font-size: var(--c-text-body); line-height: 1.5; }
  li + li::before { content: ' and '; color: var(--c-text-dim); }
  .count, .kind { color: var(--c-text-dim); }
  .count { margin-right: .2rem; }
  .requirements :global(.entity-link), .requirements :global(.entity-text), .requirements :global(.entity-reference) { gap: .25rem; }
  .requirements :global(.entity-link img), .requirements :global(.entity-link .kind-icon), .requirements :global(.entity-text img), .requirements :global(.entity-reference img), .requirements :global(.entity-reference .kind-icon) { width: 1rem; height: 1rem; }
  .requirements :global(.kind-icon svg) { width: .7rem; height: .7rem; }
</style>
