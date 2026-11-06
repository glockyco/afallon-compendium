<script lang="ts">
  // Throwaway: the changes on one equipped item, in the item page's own words: Heroic, corruption level, gems by
  // socket, one enchantment and random stats.
  import type { PublicKindEntry } from '@afallon/contracts/public';
  import LevelControl from '$lib/detail/LevelControl.svelte';
  import type { PlannerMock } from '../data.server';

  export let entry: PlannerMock['slots'][number];
  export let registry: PublicKindEntry[];
  export let id = 'editor';
  registry;
  $: document = entry.document!;
  $: maxCorruption = document.facts.corruption?.maxLevel;
  // Heroic exists only for items that can drop as Heroic; an item that drops only where the Heroic Tier pauses never does.
  $: canBeHeroic = Boolean(document.facts.heroic) && !document.facts.heroicPausedIn?.length;
</script>

<div class="editor pm-hidden-label">
  <div class="field">
    <span class="pm-label">Collected</span>
    <label class="check"><input type="checkbox" checked={Boolean(entry.collected)} /> I have it</label>
  </div>
  {#if canBeHeroic}
    <div class="field">
      <span class="pm-label">Version</span>
      <div class="pm-segmented" role="group" aria-label="Version"><button aria-pressed={!entry.heroic}>Normal</button><button aria-pressed={Boolean(entry.heroic)}>Heroic</button></div>
    </div>
  {/if}
  {#if maxCorruption}
    <div class="field">
      <span class="pm-label">Corruption</span>
      <LevelControl id={`${id}-corruption`} label="Corruption level" min={0} max={maxCorruption} level={entry.corruption ?? 0} compact slider={false} />
    </div>
  {/if}
  <div class="field top">
    <span class="pm-label">Gems</span>
    <div class="sockets">
      {#each entry.gems as socket, index}
        <label class="socket-row">
          <span class="socket" class:filled={Boolean(socket.gem)} data-colour={socket.colour.toLowerCase()} aria-hidden="true"></span>
          <span class="sr">{socket.colour} socket {index + 1}</span>
          <select class="pm-select">
            <option>{socket.gem ? socket.gem.ref.name : 'Empty'}</option>
          </select>
        </label>
      {:else}
        <span class="pm-note">No sockets.</span>
      {/each}
    </div>
  </div>
  <div class="field">
    <span class="pm-label">Enchantment</span>
    <select class="pm-select"><option>{entry.enchant ? entry.enchant.ref.name : 'None'}</option></select>
  </div>
  <div class="pm-row-actions"><button class="c-action">Change Item</button><button class="c-action quiet">Remove</button></div>
</div>

<style>
  .editor { display: grid; gap: .8rem; }
  .field { display: grid; grid-template-columns: 6.25rem minmax(0, 1fr); align-items: center; gap: .75rem; }
  .field.top { align-items: start; }
  .field.top > .pm-label { padding-top: .45rem; }
  .sockets { display: grid; gap: .4rem; }
  .check { display: inline-flex; align-items: center; gap: .4rem; font-size: var(--c-text-small); }
  .check input { accent-color: var(--c-accent); }
  .socket-row { display: grid; grid-template-columns: .8rem minmax(0, 1fr); align-items: center; gap: .5rem; }
  .socket-row .pm-select { width: 100%; }
  .field > .pm-select { width: 100%; }
  .sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); }
  .socket { --gem: var(--c-text-dim); width: .8rem; height: .8rem; box-sizing: border-box; border: 2px solid var(--gem); border-radius: 50%; }
  .socket.filled { background: var(--gem); }
  .socket[data-colour='blue'] { --gem: #6aa9e0; }
  .socket[data-colour='orange'] { --gem: #e2883f; }
  .socket[data-colour='green'] { --gem: #79c07a; }
  .socket[data-colour='yellow'] { --gem: #e0c341; }
  .socket[data-colour='red'] { --gem: #df7770; }
  .socket[data-colour='white'] { --gem: #e9e4d9; }
</style>
