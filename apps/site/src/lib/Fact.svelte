<script lang="ts">
  export let label: string;
  /** A hash or a sentence needs the whole row rather than one column of the grid. */
  export let full = false;
</script>

<div class="c-fact" class:c-fact--full={full}><dt>{label}</dt><dd><slot /></dd></div>
