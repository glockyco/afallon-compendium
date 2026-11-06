<script lang="ts">
  // Throwaway: the party's roles counted against the Dungeon Finder's party. A count, not a score.
  export let counts: Record<'Tank' | 'Healer' | 'Damage', number>;
  const targets = { Tank: 1, Healer: 1, Damage: 3 } as const;
</script>

<dl class="roles">
  {#each Object.entries(targets) as [role, target]}
    {@const count = counts[role as keyof typeof targets]}
    <div class:full={count === target}>
      <dt>{role}</dt>
      <dd><strong>{count}</strong> of {target}</dd>
    </div>
  {/each}
</dl>

<style>
  .roles { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: .75rem; margin: 0; }
  .roles > div { display: grid; gap: .1rem; padding: .6rem .8rem; border: 1px solid var(--c-line); border-radius: var(--c-radius-sm); background: var(--c-surface-1); }
  .roles > div.full { border-color: var(--c-frame-strong); }
  dt { color: var(--c-text-dim); font-size: var(--c-text-small); }
  dd { margin: 0; color: var(--c-text-dim); }
  strong { color: var(--c-text-strong); font: 700 1.6rem var(--c-serif); font-variant-numeric: tabular-nums; }
</style>
