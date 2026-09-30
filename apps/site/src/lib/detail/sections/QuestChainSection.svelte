<script lang="ts">
  import type { PublicKindEntry, Ref } from '@afallon/contracts/public';
  import EntityLink from '../../EntityLink.svelte';
  import { kindGlyphSvg } from '../../kind-icon';

  export let quests: Ref[];
  export let currentKey: string;
  export let chainName: string | undefined = undefined;
  export let registry: PublicKindEntry[];
  $: questGlyph = kindGlyphSvg(registry.find((entry) => entry.kind === 'quests')?.icon);
</script>

{#if quests.length > 1}
  <section class="chain" id="quest-chain" aria-label="Quest chain">
    <h2>{chainName ?? 'Quest chain'}</h2>
    <p class="caption">Quest chain</p>
    <ol>
      {#each quests as quest, index}
        <li class:current={quest.key === currentKey}>
          <span class="number">{index + 1}</span>
          <span class="step-name">{#if quest.key === currentKey}<strong aria-current="step" title={quest.name}><span class="kind-icon" aria-hidden="true">{@html questGlyph ?? ''}</span><span class="current-name">{quest.name}</span></strong>{:else}<EntityLink ref={quest} {registry} />{/if}</span>
        </li>
      {/each}
    </ol>
  </section>
{/if}

<style>
  .chain { padding: 1rem; border: 1px solid var(--c-line-soft); border-radius: var(--c-radius); background: var(--c-surface-1); }
  h2 { margin: 0; color: var(--c-text-strong); font: 700 1.2rem/1.3 var(--c-serif); overflow-wrap: anywhere; }
  .caption { margin: .2rem 0 .75rem; color: var(--c-text-dim); font-size: .875rem; }
  ol { margin: 0; padding: 0; list-style: none; }
  li { display: grid; grid-template-columns: 1.75rem minmax(0, 1fr); gap: .65rem; position: relative; align-items: start; min-height: 2.5rem; padding: .25rem 0 .55rem; }
  li:not(:last-child)::after { content: ''; position: absolute; top: 1.9rem; bottom: -.2rem; left: .86rem; border-left: 1px solid var(--c-line); }
  .number { display: grid; place-items: center; width: 1.75rem; height: 1.75rem; border: 1px solid var(--c-line); border-radius: 50%; background: var(--c-surface-2); font-variant-numeric: tabular-nums; }
  .current .number { border-color: var(--c-accent); color: var(--c-accent-strong); }
  .step-name { min-width: 0; }
  .step-name :global(.tooltip-anchor) { display: block; min-width: 0; }
  .step-name :global(.entity-link) { display: flex; align-items: center; min-width: 0; width: 100%; white-space: nowrap; }
  .step-name :global(.entity-link .name) { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .step-name :global(.entity-link img), .step-name :global(.entity-link .kind-icon) { flex: none; }
  strong { display: flex; align-items: center; min-width: 0; color: var(--c-accent-strong); font-weight: 600; }
  .current-name { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .kind-icon { box-sizing: border-box; display: inline-grid; place-items: center; flex: none; position: relative; top: -.12em; width: 1.45em; height: 1.45em; margin-right: .35em; border: 1px solid var(--c-frame); border-radius: var(--c-radius-sm); background: var(--c-surface-2); color: var(--c-text-mute); }
  .kind-icon :global(svg) { width: .65em; height: .65em; }
</style>
