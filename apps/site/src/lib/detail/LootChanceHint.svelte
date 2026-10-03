<script lang="ts">
  import { base } from '$app/paths';
  import Hint from '../Hint.svelte';

  export let wrapsControl = false;
  export let compact = true;
  export let trailing = '';
</script>

<span class="loot-chance-hint" class:compact>
  <Hint {wrapsControl} label="How this drop chance is calculated" let:control>
    <slot {control}><span class="mark" aria-hidden="true">?</span>{#if trailing}<span class="trailing" aria-hidden="true">{trailing}</span>{/if}</slot>
    <svelte:fragment slot="explanation">
      Assumes no <a class="c-link" href={`${base}/stats/loot-chance/`}>Loot Chance</a>. Loot Chance comes from <a class="c-link" href={`${base}/stats/luck/`}>Luck</a> and other bonuses, and in this version it makes ordinary creature drops rarer. <a class="c-link" href={`${base}/mechanics/loot/#loot-chance`}>How Loot Chance works</a>
    </svelte:fragment>
  </Hint>
</span>

<style>
  .loot-chance-hint { display: inline-flex; align-items: center; vertical-align: middle; }
  .compact :global(.hint .term) { display: inline-flex; align-items: center; text-decoration: none; }
  .mark { display: inline-grid; place-items: center; width: 1.3em; height: 1.3em; border: 1px solid currentColor; border-radius: 50%; color: var(--c-accent); font-size: var(--c-text-small); font-weight: 700; line-height: 1; }
  .trailing { align-self: end; color: var(--c-text); font-size: var(--c-text-body); line-height: 1.2; }
</style>
