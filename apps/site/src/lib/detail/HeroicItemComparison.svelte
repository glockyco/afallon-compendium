<script lang="ts">
  import { onMount } from 'svelte';
  import type { PublicItem, PublicKindEntry } from '@afallon/contracts/public';
  import EntityLink from '../EntityLink.svelte';
  import { clientMapLoader } from '../client-publication';
  import ItemComparison from './ItemComparison.svelte';

  export let registry: PublicKindEntry[];
  // Each example has a published creature-drop path; confirm eligibility again on the loaded item.
  const examples = [
    { slug: 'iron-cutlass', name: 'Iron Cutlass' },
    { slug: 'necromancer-scythe', name: 'Necromancer Scythe' },
    { slug: 'novice-plate-boots', name: 'Novice Plate Boots' },
    { slug: 'dragon-rend', name: 'Dragon Rend' },
  ] as const;
  let selected: string = examples[0].slug;
  let item: PublicItem | undefined;
  let loading = false;
  let error = '';
  let request = 0;

  async function choose(slug: string): Promise<void> {
    selected = slug;
    const current = ++request;
    loading = true;
    error = '';
    try {
      const page = await clientMapLoader()?.loadDocument('items', slug);
      if (current !== request) return;
      if (!page || page.kind !== 'items' || !page.document.facts.heroic) throw new Error('This item has no eligible Heroic creature drop in this publication.');
      item = page.document;
    } catch (cause) {
      if (current === request) { item = undefined; error = cause instanceof Error ? cause.message : String(cause); }
    } finally { if (current === request) loading = false; }
  }
  onMount(() => { void choose(selected); });
</script>

<div class="item-preview">
  <div class="picker"><label for="heroic-item">Item</label><span role="status" aria-live="polite">{loading ? 'Loading Item…' : error}</span>
    <select id="heroic-item" bind:value={selected} on:change={(event) => choose(event.currentTarget.value)}>
      {#each examples as example}<option value={example.slug}>{example.name}</option>{/each}
    </select>
  </div>
  {#if item}<p class="context"><EntityLink ref={item.ref} {registry} /> has a creature-drop path where Heroic Tier can be active. A Heroic drop is possible, not guaranteed. This item is a separate example, not a claimed drop from the creature above.</p>{/if}
  <ItemComparison {item} {registry} {loading} {error} beforeLabel="Normal" afterLabel="Heroic" afterHeroic tableLabel="Heroic Item Stat Changes" />
  <p class="context">The Heroic bonus applies to fixed stats and weapon damage, not random rolls, gems or enchantments.</p>
</div>

<style>
  .item-preview { min-width: 0; }
  .picker { display: grid; gap: .35rem; max-width: 30rem; margin-bottom: 1rem; }
  .picker label { color: var(--c-text-strong); font-weight: 600; }
  .picker span { min-height: 1.3rem; color: var(--c-text-dim); font-size: var(--c-text-small); }
  select { box-sizing: border-box; width: 100%; min-height: 2.75rem; padding: .4rem .6rem; border: 1px solid var(--c-frame); border-radius: var(--c-radius-sm); background: var(--c-surface-sunken); color: var(--c-text); font: inherit; }
  .context { margin: .5rem 0 1rem; color: var(--c-text-dim); line-height: 1.55; }
</style>
