<script lang="ts">
  import { base } from '$app/paths';
  import Hint from '../Hint.svelte';

  export let wrapsControl = false;
</script>

<Hint {wrapsControl} label="How this drop chance is calculated" let:control>
  <slot {control}>?</slot>
  <svelte:fragment slot="explanation">
    Assumes no <a class="c-link" href={`${base}/stats/loot-chance/`}>Loot Chance</a>. Loot Chance comes from <a class="c-link" href={`${base}/stats/luck/`}>Luck</a> and other bonuses, and in this version it makes ordinary creature drops rarer. <a class="c-link" href={`${base}/mechanics/loot/#loot-chance`}>How Loot Chance works</a>
  </svelte:fragment>
</Hint>
