<script lang="ts">
  import type { RecipeRank, Ref } from '@afallon/contracts/public';
  import { formatNumber, nameOf } from '../format';
  import { skillLevelId } from '../reader-levels';
  import { craftBandAt } from './craft-experience';
  import LevelControl from './LevelControl.svelte';

  /** A recipe rank with its experience bands, at the reader's level in the recipe's skill. */
  export let rank: RecipeRank;
  export let skill: Ref | undefined;
  export let id: string;

  /** The level in use, for a parent that marks the reader's band. */
  export let level = rank.requiredLevel;
  $: skillName = skill ? nameOf(skill) : 'skill';
  $: state = craftBandAt(rank, level);
</script>

<div class="craft-experience">
  <LevelControl {id} readerId={skillLevelId(skill ?? { key: null, label: 'crafting' })} label={`${skill ? nameOf(skill) : 'Skill'} Level`} max={rank.highestLevel} min={1} fallback={rank.requiredLevel} bind:level />
  <p>
    {#if state.kind === 'locked'}You can craft it from {skillName} level {formatNumber(rank.requiredLevel)}.
    {:else}<strong>{state.band.experience ? formatNumber(state.band.experience) : 'No'}</strong> {skillName} experience per craft at your level{#if state.next}, and {state.next.experience ? formatNumber(state.next.experience) : 'none'} from level {formatNumber(state.next.from)}{/if}.{/if}
  </p>
</div>

<style>
  .craft-experience { display: grid; gap: .7rem; }
  p { margin: 0; line-height: 1.5; }
  strong { color: var(--c-text-strong); }
</style>
