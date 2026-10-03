<script lang="ts">
  import type { CorruptionGuide, PublicItem, PublicKindEntry } from '@afallon/contracts/public';
  import EntityLink from '../EntityLink.svelte';
  import { clientMapLoader } from '../client-publication';
  import ItemComparison from './ItemComparison.svelte';
  import LevelSlider from './LevelSlider.svelte';

  export let guide: CorruptionGuide;
  export let inlineItem: PublicItem | undefined;
  export let registry: PublicKindEntry[];

  let selectedKey = guide.tryIt.defaultItem.key;
  let item: PublicItem | undefined = inlineItem;
  let loading = false;
  let error = '';
  let from = 0;
  let to = guide.maxLevel ?? 30;
  let request = 0;
  $: beforeLabel = from === 0 ? 'None' : `+${from}`;
  $: afterLabel = to === 0 ? 'None' : `+${to}`;


  async function choose(key: string): Promise<void> {
    selectedKey = key;
    const ref = guide.tryIt.groups.flatMap((group) => group.items).find((entry) => entry.item.key === key)?.item;
    if (!ref) return;
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
  function navigate(event: KeyboardEvent): void {
    if (!['ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) return;
    const select = event.currentTarget as HTMLSelectElement;
    const last = select.options.length - 1;
    const index = event.key === 'Home' ? 0 : event.key === 'End' ? last
      : Math.max(0, Math.min(last, select.selectedIndex + (event.key === 'ArrowDown' ? 1 : -1)));
    event.preventDefault();
    const option = select.options.item(index);
    if (option) void choose(option.value);
  }

</script>

<div class="try-it">
<div class="picker">
  <label for="corruption-try-item">Item</label>
  <span class="picker-status" role="status" aria-live="polite">{loading ? 'Loading item…' : error}</span>
  <select id="corruption-try-item" value={selectedKey} on:change={(event) => choose(event.currentTarget.value)} on:keydown={navigate}>
    {#each guide.tryIt.groups as group}
      <optgroup label={group.place.name}>
        {#each group.items as entry}<option value={entry.item.key}>{entry.item.name}</option>{/each}
      </optgroup>
    {/each}
  </select>
</div>
<ItemComparison {item} {registry} {loading} {error} {beforeLabel} {afterLabel} beforeLevel={from} afterLevel={to} tableLabel="Corrupted Item Stat Changes">
  <LevelSlider slot="before-control" id="corruption-from" label="From" min={0} max={guide.maxLevel ?? 30} bind:level={from} readout={(level) => level === 0 ? 'None' : `+${level}`} valueText={(level) => level === 0 ? 'None' : `+${level}`} />
  <LevelSlider slot="after-control" id="corruption-to" label="To" min={0} max={guide.maxLevel ?? 30} bind:level={to} readout={(level) => level === 0 ? 'None' : `+${level}`} valueText={(level) => level === 0 ? 'None' : `+${level}`} />
  <div slot="summary">
    {#if item?.facts.dungeonRewards?.length}
      <dl class="drop-list"><div><dt>Can Drop Corrupted From</dt><dd>{#each item.facts.dungeonRewards as source}<span class="source-line"><EntityLink ref={source.place} {registry} /> · {#each source.bosses as boss, bossIndex}{bossIndex ? ', ' : ''}<EntityLink ref={boss} {registry} />{/each}</span>{/each}</dd></div></dl>
    {/if}
  </div>
</ItemComparison>
</div>

<style>
  .picker { position: relative; display: grid; gap: .35rem; max-width: 30rem; margin-bottom: 1.2rem; }
  .picker label { font-weight: 600; color: var(--c-text-strong); }
  .picker-status { position: absolute; top: 0; right: 0; color: var(--c-text-dim); font-size: .875rem; }
  select { width: 100%; min-height: 2.75rem; padding: .4rem .6rem; border: 1px solid var(--c-frame); border-radius: var(--c-radius-sm); background: var(--c-surface-sunken); color: var(--c-text); font: inherit; }
  .drop-list { margin: .5rem 0 0; padding-top: .3rem; border-top: 1px solid var(--c-line-soft); }
  .drop-list dd { margin: 0; }
  .source-line { display: block; margin-top: .3rem; color: var(--c-text); }
</style>
