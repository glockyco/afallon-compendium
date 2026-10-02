<script lang="ts">
  import { readerLevels, setReaderLevel } from '../reader-levels';
  import LevelSlider from './LevelSlider.svelte';

  /** The control's element id. */
  export let id: string;
  /** The reader value that the control sets, such as `character` or a skill's id from `skillLevelId`. */
  export let readerId: string;
  export let label: string;
  export let min = 1;
  export let max: number;
  /** The level before the reader sets one. */
  export let fallback: number;
  /** The level in use, for the parent to compute with. */
  export let level = fallback;

  // A saved level outside this control's range shows at the nearest end, and the saved level stays unchanged.
  $: level = Math.min(max, Math.max(min, $readerLevels[readerId] ?? fallback));
</script>

<LevelSlider {id} {label} {min} {max} {level} onSelect={(value) => setReaderLevel(readerId, value)} />
