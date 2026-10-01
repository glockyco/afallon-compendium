<script lang="ts">
  import type { RequirementGroup, RequirementRef } from '@afallon/contracts/public';
  import { requirementCountLabel, requirementSeparator, sentenceStart } from './format';

  // Renders requirement groups and their text spans. The caller renders each referenced entity through the
  // default slot, because pages link entities and tooltips cannot import the linking component.
  export let requirements: RequirementGroup[];
  /** False for use requirements, whose phrases such as "Ursine Aspect is active" read fully without a kind label. */
  export let kindLabels = true;
  /** False when words such as "Not while" lead into the list, so that its first phrase continues their sentence. */
  export let opensSentence = true;

  function conditionPrefix(requirement: RequirementRef): string {
    switch (requirement.type.name) {
      case 'Class': return 'Class:';
      case 'Effect': return 'Effect:';
      case 'Quest': return 'Quest:';
      case 'Skill': return 'Skill:';
      case 'Currency': return /^costs\b/i.test(requirement.label) ? '' : 'Currency:';
      case 'Time': return /^time\b/i.test(requirement.label) ? '' : 'Time:';
      default: return '';
    }
  }
</script>

<!-- The groups and their requirements form one sentence, so only its first phrase starts with a capital. -->
<ul class="requirements">
  {#each requirements as group, groupIndex}
    {@const countLabel = requirementCountLabel(group)}
    <li>
      {#if countLabel}<span class="count">{countLabel}</span>{/if}
      {#each group.requirements as requirement, index}
        {@const prefix = kindLabels ? conditionPrefix(requirement) : ''}
        {@const starts = opensSentence && groupIndex === 0 && index === 0 && !countLabel && !prefix}
        {requirementSeparator(group, index)}<span class="condition">{#if prefix}<span class="kind">{prefix}</span>{' '}{/if}{#each requirement.spans as span, spanIndex}{#if 'ref' in span}<slot ref={span.ref} />{:else}{starts && spanIndex === 0 ? sentenceStart(span.text) : span.text}{/if}{/each}</span>
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
