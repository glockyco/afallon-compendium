<script lang="ts">
  import type { CorruptionGuide, PublicItem, PublicKindEntry } from '@afallon/contracts/public';
  import EntityLink from '../EntityLink.svelte';
  import { clientMapLoader } from '../client-publication';
  import ItemComparison from './ItemComparison.svelte';
  import ItemSearchPicker from './ItemSearchPicker.svelte';
  import type { ItemPickerOption } from './item-picker-options';
  import LevelControl from './LevelControl.svelte';

  export let guide: CorruptionGuide;
  export let inlineItem: PublicItem | undefined;
  export let registry: PublicKindEntry[];
  export let options: ItemPickerOption[];

  let selectedKey = guide.tryIt.defaultItem.key;
  let item: PublicItem | undefined = inlineItem;
  let loading = false;
  let error = '';
  let from = 0;
  let to = guide.maxLevel ?? 30;
  let request = 0;
  $: beforeLabel = from === 0 ? 'None' : `+${from}`;
  $: afterLabel = to === 0 ? 'None' : `+${to}`;


  async function choose(option: ItemPickerOption): Promise<void> {
    const key = option.ref.key;
    selectedKey = key;
    const ref = option.ref;
    const current = ++request;
    if (inlineItem?.ref.key === key) { item = inlineItem; loading = false; error = ''; return; }
    loading = true;
    error = '';
    try {
      const page = await clientMapLoader()?.loadPageForRef(ref);
      if (current !== request) return;
      if (!page || page.kind !== 'items') throw new Error('The item could not be loaded.');
      item = page.document;
    } catch (cause) {
      if (current === request) { error = cause instanceof Error ? cause.message : String(cause); selectedKey = item?.ref.key ?? guide.tryIt.defaultItem.key; }
    } finally {
      if (current === request) loading = false;
    }
  }
</script>

<div class="try-it">
<ItemSearchPicker id="corruption-try-item" {options} {selectedKey} onSelect={(option) => { void choose(option); }} {loading} {error} />
<ItemComparison {item} {registry} {loading} {error} {beforeLabel} {afterLabel} beforeLevel={from} afterLevel={to} tableLabel="Corrupted Item Stat Changes">
  <LevelControl slot="before-control" id="corruption-from" label="From" min={0} max={guide.maxLevel ?? 30} bind:level={from} valueText={(level) => level === 0 ? 'None' : `+${level}`} />
  <LevelControl slot="after-control" id="corruption-to" label="To" min={0} max={guide.maxLevel ?? 30} bind:level={to} valueText={(level) => level === 0 ? 'None' : `+${level}`} />
  <div slot="summary">
    {#if item?.facts.dungeonRewards?.length}
      <dl class="drop-list"><div><dt>Can drop corrupted from</dt><dd>{#each item.facts.dungeonRewards as source}<span class="source-line"><EntityLink ref={source.place} {registry} /> · {#each source.bosses as boss, bossIndex}{bossIndex ? ', ' : ''}<EntityLink ref={boss} {registry} />{/each}</span>{/each}</dd></div></dl>
    {/if}
  </div>
</ItemComparison>
</div>

<style>
  .drop-list { margin: .5rem 0 0; padding-top: .3rem; border-top: 1px solid var(--c-line-soft); }
  .drop-list dd { margin: 0; }
  .source-line { display: block; margin-top: .3rem; color: var(--c-text); }
</style>
