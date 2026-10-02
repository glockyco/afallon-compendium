<script lang="ts">
  import type { PublicKindEntry, Ref } from '@afallon/contracts/public';
  import EntityLink from '../../EntityLink.svelte';
  import { kindGlyphSvg } from '../../kind-icon';
  import SideCard from '../SideCard.svelte';

  export let quests: Ref[];
  export let currentKey: string;
  export let chainName: string | undefined = undefined;
  export let registry: PublicKindEntry[];
  let expanded = false;
  $: currentIndex = Math.max(0, quests.findIndex((quest) => quest.key === currentKey));
  $: steps = quests.map((quest, index) => ({ quest, index }));
  $: firstStep = Math.max(0, Math.min(currentIndex - 1, quests.length - 4));
  $: shown = quests.length <= 6 || expanded ? steps : steps.slice(firstStep, firstStep + 4);
  $: questGlyph = kindGlyphSvg(registry.find((entry) => entry.kind === 'quests')?.icon);
</script>

{#if quests.length > 1}
  <SideCard title={chainName ?? 'Quest chain'} id="quest-chain">
    <p class="caption">Quest chain</p>
    <ol>
      {#each shown as { quest, index }}
        <li class:current={quest.key === currentKey}>
          <span class="number">{index + 1}</span>
          <span class="step-name">{#if quest.key === currentKey}<strong aria-current="step" title={quest.name}><span class="kind-icon" aria-hidden="true">{@html questGlyph ?? ''}</span><span class="current-name">{quest.name}</span></strong>{:else}<EntityLink ref={quest} {registry} truncate />{/if}</span>
        </li>
      {/each}
    </ol>
    {#if shown.length < quests.length}<button type="button" class="c-action more" on:click={() => (expanded = true)}>Show {quests.length - shown.length} more</button>{/if}
  </SideCard>
{/if}

<style>
  .caption { margin: .2rem 0 .75rem; color: var(--c-text-dim); font-size: .875rem; }
  ol { margin: 0; padding: 0; list-style: none; }
  li { display: grid; grid-template-columns: 1.75rem minmax(0, 1fr); gap: .65rem; position: relative; align-items: start; min-height: 2.5rem; padding: .25rem 0 .55rem; }
  li:not(:last-child)::after { content: ''; position: absolute; top: 1.9rem; bottom: -.2rem; left: .86rem; border-left: 1px solid var(--c-line); }
  .number { display: grid; place-items: center; width: 1.75rem; height: 1.75rem; border: 1px solid var(--c-line); border-radius: 50%; background: var(--c-surface-2); font-variant-numeric: tabular-nums; }
  .current .number { border-color: var(--c-accent); color: var(--c-accent-strong); }
  .step-name { min-width: 0; }
  strong { display: flex; align-items: center; min-width: 0; color: var(--c-accent-strong); font-weight: 600; }
  .current-name { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .kind-icon { box-sizing: border-box; display: inline-grid; place-items: center; flex: none; position: relative; top: -.12em; width: 1.45em; height: 1.45em; margin-right: .35em; border: 1px solid var(--c-frame); border-radius: var(--c-radius-sm); background: var(--c-surface-2); color: var(--c-text-mute); }
  .kind-icon :global(svg) { width: .65em; height: .65em; }
  .more { justify-self: start; }
</style>
