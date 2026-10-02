<script lang="ts">
  import type { PublicKindEntry, QuestObjective } from '@afallon/contracts/public';
  import Availability from '../../Availability.svelte';
  import EntityLink from '../../EntityLink.svelte';
  import LocationLinks from '../../LocationLinks.svelte';
  import ObjectiveText from '../../ObjectiveText.svelte';
  import { formatNumber } from '../../format';
  import { entityOnMap } from '../../map-links';

  export let objectives: QuestObjective[];
  export let registry: PublicKindEntry[];
  $: authoredCounts = objectives.map((objective) => 'count' in objective
    && new RegExp(`\\b${objective.count}\\b`).test(objective.text));
</script>

{#if objectives.length}
  <ol class="objectives">
    {#each objectives as objective, index}
      <li>
        <span class="number" aria-hidden="true">{index + 1}</span>
        <div class="task"><p class="instruction"><ObjectiveText {objective} />{#if 'count' in objective && !authoredCounts[index]}<strong class="count">{formatNumber(objective.count)} required</strong>{/if}</p>
          {#if 'target' in objective}<p class="target">Target: <EntityLink ref={objective.target} {registry} />{#if objective.target.key !== null && objective.target.kind === 'npcs'}{' '}· <a class="c-link" href={entityOnMap(objective.target.key)}>Show on map</a>{/if}</p>{/if}
          {#each objective.completions as completion}<div class="completion">
            <p>{completion.label ?? 'Interactive object'}</p>
            {#if completion.placements.length}<LocationLinks placements={completion.placements} />{/if}
            {#if completion.availability.length}<Availability rules={completion.availability} {registry} />{/if}
          </div>{/each}
        </div>
      </li>
    {/each}
  </ol>
{:else}<p>No objectives are published for this quest.</p>{/if}

<style>
  .objectives { display: grid; gap: .75rem; margin: 0; padding: 0; list-style: none; }
  li { display: grid; grid-template-columns: 1.8rem minmax(0, 1fr); gap: .75rem; align-items: start; }
  .number { display: grid; place-items: center; width: 1.8rem; height: 1.8rem; border: 1px solid var(--c-accent); border-radius: 50%; color: var(--c-accent-strong); font-variant-numeric: tabular-nums; }
  .task { min-width: 0; padding: .1rem 0 .7rem; border-bottom: 1px solid var(--c-line-soft); }
  li:last-child .task { border-bottom: 0; }
  p { margin: 0; line-height: 1.5; }
  .count { display: inline-block; margin-left: .55rem; color: var(--c-text-dim); font-size: .875rem; font-weight: 600; white-space: nowrap; }
  .target, .completion { margin-top: .35rem; color: var(--c-text-dim); font-size: .875rem; }
</style>
