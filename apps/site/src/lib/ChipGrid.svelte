<script lang="ts" context="module">
  export type Chip = { label: string; value?: string };
</script>

<script lang="ts">
  export let chips: Chip[];
</script>

<div class="c-chips">
  {#each chips as chip}
    <span class="c-chip" class:c-chip--plain={chip.value === undefined}>
      <span class="c-chip-name">{chip.label}</span>{#if chip.value !== undefined}<span class="c-chip-value">{chip.value}</span>{/if}
    </span>
  {/each}
</div>
