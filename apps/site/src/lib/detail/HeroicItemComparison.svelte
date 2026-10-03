<script lang="ts">
  import { onMount } from 'svelte';
  import { base } from '$app/paths';
  import type { PublicItem, PublicKindEntry } from '@afallon/contracts/public';
  import EntityLink from '../EntityLink.svelte';
  import { clientMapLoader } from '../client-publication';
  import type { ItemPickerOption } from './item-picker-options';
  import ItemComparison from './ItemComparison.svelte';
  import ItemSearchPicker from './ItemSearchPicker.svelte';

  export let registry: PublicKindEntry[];
  export let options: ItemPickerOption[];
  let selected = options.find((option) => option.ref.slug === 'iron-cutlass') ?? options[0];
  let item: PublicItem | undefined;
  let loading = false;
  let error = '';
  let request = 0;

  async function choose(option: ItemPickerOption): Promise<void> {
    selected = option;
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

  onMount(() => { if (selected) void choose(selected); });
</script>

<div class="item-preview">
  <ItemSearchPicker id="heroic-item" {options} selectedKey={selected?.ref.key ?? ''} onSelect={(choice) => { void choose(choice); }} {loading} {error} emptyText="No Heroic gear matches." />
  {#if item}
    <p class="context"><EntityLink ref={item.ref} {registry} tooltip={false} rarity={item.facts.rarity} /> can drop as Heroic from creatures while the Heroic tier is on. {#if item.droppedBy.length}<a class="c-link" href={`${base}/items/${item.ref.slug}/`}>See Drop Sources</a>{/if}</p>
  {/if}
  <ItemComparison {item} {registry} {loading} {error} beforeLabel="Normal" afterLabel="Heroic" afterHeroic tableLabel="Heroic Item Stat Changes" />
  <p class="context">Only fixed stats and weapon damage gain the Heroic bonus. Random rolls, gems and enchantments do not.</p>
</div>

<style>
  .item-preview { min-width: 0; }
  .context { margin: .5rem 0 1rem; color: var(--c-text-dim); line-height: 1.55; }
</style>
