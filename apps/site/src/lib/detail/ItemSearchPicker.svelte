<script lang="ts">
  import { tick } from 'svelte';
  import { base } from '$app/paths';
  import type { EntityRef } from '@afallon/contracts/public';
  import { kindGlyphSvg } from '../kind-icon';

  type Choice = { ref: EntityRef; slot: string; rarity?: string };
  export let id: string;
  export let options: Choice[];
  export let selectedKey: string;
  export let onSelect: (choice: Choice) => void;
  export let loading = false;
  export let error = '';
  export let emptyText = 'No items match.';

  const itemGlyph = kindGlyphSvg('item');
  let root: HTMLDivElement;
  let trigger: HTMLButtonElement;
  let input: HTMLInputElement;
  let open = false;
  let query = '';
  let active = 0;
  $: selected = options.find((choice) => choice.ref.key === selectedKey);
  $: matches = query.trim() ? options.filter((choice) => choice.ref.name.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())) : options;
  $: visible = matches.slice(0, 80);

  async function openPicker(): Promise<void> {
    query = '';
    active = 0;
    open = true;
    await tick();
    input?.focus();
  }

  async function closePicker(focusTrigger = false): Promise<void> {
    open = false;
    if (focusTrigger) { await tick(); trigger?.focus(); }
  }

  async function choose(choice: Choice): Promise<void> {
    onSelect(choice);
    await closePicker(true);
  }

  async function move(direction: number): Promise<void> {
    active = Math.max(0, Math.min(visible.length - 1, active + direction));
    await tick();
    root.querySelector(`#${id}-option-${active}`)?.scrollIntoView({ block: 'nearest' });
  }

  function onKeydown(event: KeyboardEvent): void {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      void move(event.key === 'ArrowDown' ? 1 : -1);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const choice = visible[active];
      if (choice) void choose(choice);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      void closePicker(true);
    }
  }

  function onPointerDown(event: PointerEvent): void {
    if (open && !root.contains(event.target as Node)) void closePicker();
  }
</script>

<svelte:window on:pointerdown={onPointerDown} />
<div class="picker" bind:this={root}>
  <span class="picker-label" id={`${id}-label`}>Item</span>
  <div class="input-wrap">
    {#if open}
      <input {id} bind:this={input} type="search" bind:value={query} autocomplete="off" role="combobox"
        aria-labelledby={`${id}-label`} aria-autocomplete="list" aria-expanded="true" aria-controls={`${id}-list`}
        aria-activedescendant={visible.length ? `${id}-option-${active}` : undefined} placeholder="Search items"
        on:input={() => (active = 0)} on:keydown={onKeydown} />
    {:else}
      <button type="button" class="chosen" bind:this={trigger} aria-labelledby={`${id}-label ${id}-chosen`} on:click={openPicker}
        on:keydown={(event) => { if (event.key === 'ArrowDown') { event.preventDefault(); void openPicker(); } }}>
        {#if selected}
          <span class="selected-art" data-rarity={selected.rarity?.toLocaleLowerCase()}>
            {#if selected.ref.icon}<img src={`${base}/data/${selected.ref.icon.url}`} width={selected.ref.icon.width} height={selected.ref.icon.height} alt="" />
            {:else}<span class="kind-icon" aria-hidden="true">{@html itemGlyph}</span>{/if}
          </span>
          <span class="selected-name" id={`${id}-chosen`} data-rarity={selected.rarity?.toLocaleLowerCase()}>{selected.ref.name}</span>
        {:else}<span id={`${id}-chosen`}>Select an Item</span>{/if}
        <span class="chevron" aria-hidden="true"></span>
      </button>
    {/if}
    {#if loading}<span class="spinner" aria-hidden="true"></span>{/if}
  </div>
  {#if open}
    <div id={`${id}-list`} class="results" role="listbox" aria-label="Items">
      {#each visible as choice, index (choice.ref.key)}
        <button id={`${id}-option-${index}`} type="button" role="option" aria-selected={active === index}
          class:active={active === index} data-rarity={choice.rarity?.toLocaleLowerCase()} on:pointerdown={(event) => event.preventDefault()}
          on:mouseenter={() => (active = index)} on:click={() => { void choose(choice); }}>
          {#if choice.ref.icon}<img src={`${base}/data/${choice.ref.icon.url}`} width={choice.ref.icon.width} height={choice.ref.icon.height} alt="" loading="lazy" />
          {:else}<span class="kind-icon" aria-hidden="true">{@html itemGlyph}</span>{/if}
          <span class="item-name">{choice.ref.name}</span><small>{choice.slot}</small>
        </button>
      {/each}
      {#if !visible.length}<p class="empty">{emptyText}</p>{/if}
      {#if matches.length > visible.length}<p class="more">Keep typing to narrow {matches.length} matches.</p>{/if}
    </div>
  {/if}
  <span class="visually-hidden" role="status" aria-live="polite">{loading ? 'Loading item…' : error}</span>
</div>

<style>
  .picker { position: relative; display: grid; gap: .35rem; max-width: 30rem; margin-bottom: 1rem; }
  .picker-label { color: var(--c-text-strong); font-weight: 600; }
  .input-wrap { position: relative; }
  input, .chosen { box-sizing: border-box; width: 100%; min-height: 2.75rem; border: 1px solid var(--c-line); border-radius: var(--c-radius-sm); background: var(--c-surface-0); color: var(--c-text-strong); font: inherit; }
  input { padding: .4rem .7rem; }
  .chosen { display: flex; align-items: center; gap: .6rem; padding: .4rem .6rem; text-align: left; cursor: pointer; }
  input:hover, .chosen:hover { border-color: var(--c-line-strong); }
  .selected-art { display: flex; flex: none; }
  input:focus-visible, button:focus-visible { outline: 2px solid var(--c-accent); outline-offset: 2px; }
  .selected-art img, .selected-art .kind-icon { border: 1px solid var(--c-rarity); }
  .selected-name { min-width: 0; overflow: hidden; color: var(--c-rarity); text-overflow: ellipsis; white-space: nowrap; }
  .chevron { flex: none; width: .38rem; height: .38rem; margin: -.2rem .15rem 0 auto; border-right: 1.5px solid currentColor; border-bottom: 1.5px solid currentColor; color: var(--c-text-dim); transform: rotate(45deg); opacity: .7; }
  .spinner { position: absolute; top: 50%; right: 2rem; width: 1rem; height: 1rem; margin-top: -.5rem; border: 2px solid var(--c-text-mute); border-top-color: var(--c-accent); border-radius: 50%; pointer-events: none; animation: spin .7s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
  @media (prefers-reduced-motion: reduce) { .spinner { animation: none; } }
  .results { position: absolute; z-index: 15; top: 100%; left: 0; right: 0; max-height: min(21rem, 50vh); overflow-y: auto; padding: .3rem; border: 1px solid var(--c-line-strong); border-radius: var(--c-radius-sm); background: var(--c-surface-1); box-shadow: 0 8px 22px var(--c-shadow); }
  .results button { display: flex; align-items: center; gap: .55rem; width: 100%; min-height: 2.5rem; padding: .35rem .5rem; border: 0; border-radius: var(--c-radius-sm); background: none; color: var(--c-text); font: inherit; text-align: left; cursor: pointer; }
  .results button.active, .results button:hover { background: var(--c-surface-2); }
  .results img, .kind-icon, .selected-art img { box-sizing: border-box; flex: none; width: 1.7rem; height: 1.7rem; border-radius: 3px; object-fit: contain; }
  .results img, .results .kind-icon { border: 1px solid var(--c-rarity); }
  .kind-icon { display: grid; place-items: center; }
  .kind-icon :global(svg) { width: 1rem; height: 1rem; }
  .item-name { min-width: 0; overflow: hidden; color: var(--c-rarity); text-overflow: ellipsis; white-space: nowrap; }
  small { margin-left: auto; color: var(--c-text-dim); white-space: nowrap; }
  .empty, .more { margin: 0; padding: .5rem; color: var(--c-text-dim); font-size: var(--c-text-small); }
  .visually-hidden { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }
</style>
