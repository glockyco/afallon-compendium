<script lang="ts" context="module">
  export interface Fact { label: string; value: string; href?: string }
</script>
<script lang="ts">
  export let facts: Fact[];
</script>

{#if facts.length}
  <dl class="facts-grid">
    {#each facts as fact}
      <div><dt>{fact.label}</dt><dd>{#if fact.href}<a class="c-link" href={fact.href}>{fact.value}</a>{:else}{fact.value}{/if}</dd></div>
    {/each}
  </dl>
{/if}

<style>
  .facts-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: .9rem 1.5rem; margin: 0; }
  .facts-grid > div { min-width: 0; }
  dt { color: var(--c-text-mute); font-size: var(--c-text-small); }
  dd { margin: .1rem 0 0; color: var(--c-text); overflow-wrap: break-word; }
  @media (max-width: 1023px) { .facts-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
</style>
