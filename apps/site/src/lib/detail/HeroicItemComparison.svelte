<script lang="ts">
  import { onMount, tick } from 'svelte';
  import { base } from '$app/paths';
  import type { PublicItem, PublicKindEntry } from '@afallon/contracts/public';
  import EntityLink from '../EntityLink.svelte';
  import { clientMapLoader } from '../client-publication';
  import { kindGlyphSvg } from '../kind-icon';
  import type { HeroicItemOption } from './heroic-item-options';
  import ItemComparison from './ItemComparison.svelte';

  export let registry: PublicKindEntry[];
  export let options: HeroicItemOption[];
  const itemGlyph = kindGlyphSvg('item');
  let selected = options.find((option) => option.ref.slug === 'iron-cutlass') ?? options[0];
  let query = selected?.ref.name ?? '';
  let open = false;
  let active = 0;
  let input: HTMLInputElement;
  let picker: HTMLDivElement;
  let item: PublicItem | undefined;
  let loading = false;
  let error = '';
  let request = 0;

  $: matches = query.trim()
    ? options.filter((option) => option.ref.name.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()))
    : options;
  $: visible = matches.slice(0, 80);

  async function choose(option: HeroicItemOption): Promise<void> {
    selected = option;
    query = option.ref.name;
    open = false;
    active = 0;
    const current = ++request;
    loading = true;
    error = '';
    try {
      if (!option.ref.slug) throw new Error('This item page is unavailable.');
      const page = await clientMapLoader()?.loadDocument('items', option.ref.slug);
      if (current !== request) return;
      if (!page || page.kind !== 'items' || !page.document.facts.heroic) throw new Error('This item has no Heroic creature drop.');
      item = page.document;
    } catch (cause) {
      if (current === request) { item = undefined; error = cause instanceof Error ? cause.message : String(cause); }
    } finally { if (current === request) loading = false; }
  }

  async function move(direction: number): Promise<void> {
    active = Math.max(0, Math.min(visible.length - 1, active + direction));
    await tick();
    picker.querySelector(`#heroic-option-${active}`)?.scrollIntoView({ block: 'nearest' });
  }

  function onKeydown(event: KeyboardEvent): void {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (!open) { open = true; active = 0; }
      else void move(event.key === 'ArrowDown' ? 1 : -1);
    } else if (event.key === 'Enter' && open) {
      event.preventDefault();
      const choice = visible[active];
      if (choice) { void choose(choice); input.select(); }
    } else if (event.key === 'Escape' && open) {
      event.preventDefault();
      open = false;
      query = selected?.ref.name ?? '';
    }
  }

  function onPointerDown(event: PointerEvent): void {
    if (!picker.contains(event.target as Node)) { open = false; query = selected?.ref.name ?? ''; }
  }

  onMount(() => { if (selected) void choose(selected); });
</script>

<svelte:window on:pointerdown={onPointerDown} />
<div class="item-preview">
  <div class="picker" bind:this={picker}>
    <label for="heroic-item">Item</label>
    <div class="input-wrap">
      <input id="heroic-item" bind:this={input} type="search" bind:value={query} autocomplete="off" role="combobox"
        aria-autocomplete="list" aria-expanded={open} aria-controls="heroic-items" aria-activedescendant={open && visible.length ? `heroic-option-${active}` : undefined}
        placeholder="Search Heroic Gear" on:focus={() => { query = ''; open = true; active = 0; }}
        on:input={() => { open = true; active = 0; }} on:keydown={onKeydown}
        on:blur={() => { if (!open) query = selected?.ref.name ?? ''; }} />
      {#if loading}<span class="spinner" aria-hidden="true"></span>{/if}
    </div>
    {#if open}
      <div id="heroic-items" class="results" role="listbox" aria-label="Heroic Items">
        {#each visible as option, index (option.ref.key)}
          <button id={`heroic-option-${index}`} type="button" role="option" aria-selected={active === index}
            class:active={active === index} data-rarity={option.rarity?.toLocaleLowerCase()} on:pointerdown={(event) => event.preventDefault()}
            on:mouseenter={() => (active = index)} on:click={() => { void choose(option); input.focus(); input.select(); }}>
            {#if option.ref.icon}<img src={`${base}/data/${option.ref.icon.url}`} width={option.ref.icon.width} height={option.ref.icon.height} alt="" loading="lazy" />
            {:else}<span class="kind-icon" aria-hidden="true">{@html itemGlyph}</span>{/if}
            <span class="item-name">{option.ref.name}</span><small>{option.slot}</small>
          </button>
        {/each}
        {#if !visible.length}<p class="empty">No Heroic gear matches.</p>{/if}
        {#if matches.length > visible.length}<p class="more">Keep typing to narrow {matches.length} matches.</p>{/if}
      </div>
    {/if}
    <span class="visually-hidden" role="status" aria-live="polite">{loading ? 'Loading Item…' : error}</span>
  </div>
  {#if item}
    <p class="context"><EntityLink ref={item.ref} {registry} tooltip={false} rarity={item.facts.rarity} /> can drop as Heroic from creatures while the Heroic tier is on. {#if item.droppedBy.length}<a class="c-link" href={`${base}/items/${item.ref.slug}/`}>See its drop sources.</a>{/if}</p>
  {/if}
  <ItemComparison {item} {registry} {loading} {error} beforeLabel="Normal" afterLabel="Heroic" afterHeroic tableLabel="Heroic Item Stat Changes" />
  <p class="context">Only fixed stats and weapon damage gain the Heroic bonus. Random rolls, gems and enchantments do not.</p>
</div>

<style>
  .item-preview { min-width: 0; }
  .picker { position: relative; display: grid; gap: .35rem; max-width: 30rem; margin-bottom: 1rem; }
  .picker label { color: var(--c-text-strong); font-weight: 600; }
  .input-wrap { position: relative; }
  input { box-sizing: border-box; width: 100%; min-height: 2.75rem; padding: .4rem 2rem .4rem .7rem; border: 1px solid var(--c-line); border-radius: var(--c-radius-sm); background: var(--c-surface-0); color: var(--c-text-strong); font: inherit; }
  input:hover { border-color: var(--c-line-strong); }
  input:focus-visible, button:focus-visible { outline: 2px solid var(--c-accent); outline-offset: 2px; }
  .spinner { position: absolute; top: 50%; right: .8rem; width: 1rem; height: 1rem; margin-top: -.5rem; border: 2px solid var(--c-text-mute); border-top-color: var(--c-accent); border-radius: 50%; pointer-events: none; animation: spin .7s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
  @media (prefers-reduced-motion: reduce) { .spinner { animation: none; } }
  .results { position: absolute; z-index: 15; top: 100%; left: 0; right: 0; max-height: min(21rem, 50vh); overflow-y: auto; padding: .3rem; border: 1px solid var(--c-line-strong); border-radius: var(--c-radius-sm); background: var(--c-surface-1); box-shadow: 0 8px 22px var(--c-shadow); }
  .results button { display: flex; align-items: center; gap: .55rem; width: 100%; min-height: 2.5rem; padding: .35rem .5rem; border: 0; border-radius: var(--c-radius-sm); background: none; color: var(--c-text); font: inherit; text-align: left; cursor: pointer; }
  .results button.active, .results button:hover { background: var(--c-surface-2); }
  .results img, .kind-icon { box-sizing: border-box; flex: none; width: 1.7rem; height: 1.7rem; border: 1px solid var(--c-rarity); border-radius: 3px; object-fit: contain; }
  .kind-icon { display: grid; place-items: center; }
  .kind-icon :global(svg) { width: 1rem; height: 1rem; }
  .item-name { min-width: 0; overflow: hidden; color: var(--c-rarity); text-overflow: ellipsis; white-space: nowrap; }
  small { margin-left: auto; color: var(--c-text-dim); white-space: nowrap; }
  .empty, .more { margin: 0; padding: .5rem; color: var(--c-text-dim); font-size: var(--c-text-small); }
  .visually-hidden { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }
  .context { margin: .5rem 0 1rem; color: var(--c-text-dim); line-height: 1.55; }
</style>
