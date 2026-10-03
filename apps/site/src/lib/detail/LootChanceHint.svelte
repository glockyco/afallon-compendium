<script lang="ts">
  import { base } from '$app/paths';
  import Hint from '../Hint.svelte';

  export let wrapsControl = false;
  export let compact = true;
</script>

<span class="loot-chance-hint" class:compact>
  <Hint {wrapsControl} label="How this drop chance is calculated" let:control>
    <slot {control}><span class="c-help-mark" aria-hidden="true">?</span></slot>
    <svelte:fragment slot="explanation">
      Assumes no <a class="c-link" href={`${base}/stats/loot-chance/`}>Loot Chance</a>. Loot Chance comes from <a class="c-link" href={`${base}/stats/luck/`}>Luck</a> and other bonuses, and in this version it makes ordinary creature drops rarer. <a class="c-link" href={`${base}/mechanics/loot/#loot-chance`}>How Loot Chance works</a>
    </svelte:fragment>
  </Hint>
</span>

<style>
  .loot-chance-hint { display: inline-flex; align-items: baseline; vertical-align: baseline; color: var(--c-accent); }
  .compact :global(.hint .term) { display: inline-flex; align-items: baseline; text-decoration: none; }
  .compact :global(.c-help-mark) { position: relative; top: .4px; }
</style>
