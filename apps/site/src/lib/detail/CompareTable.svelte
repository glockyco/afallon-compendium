<script lang="ts" generics="Item">
  // Items compared side by side, such as the versions of a creature or of an ability: one column per item, headed by the
  // `head` slot, and one row per fact. The items share the width evenly. When they do not fit beside the fact names,
  // they wrap into blocks whose sizes differ by at most one, each repeating the fact names, so the comparison never
  // scrolls sideways. A phone shows one item per block, which reads as a list of facts.

  export let items: Item[];
  /** The facts in reading order. A block leaves out a fact that none of its items has. */
  export let facts: ReadonlyArray<{ id: string; label: string }>;
  export let has: (item: Item, fact: string) => boolean;
  /** The anchor of an item's column, so a link can name one item. */
  export let anchor: (item: Item) => string;
  /** The accessible name of the comparison. */
  export let label: string;
  /** The narrowest column that still reads its cells, in pixels at the base font size. */
  export let minColumn: number;
  /** Short values center on their columns. Prose and lists read from the left. */
  export let align: 'center' | 'start' = 'center';

  // The fact names take a fixed width, narrower on a phone so that the item columns keep their room.
  const FACT_WIDTH = 168;
  const PHONE_FACT_WIDTH = 128;
  const PHONE_WIDTH = 480;
  // Before the first layout the width is unknown, and three items fit the widest common column.
  let width = 0;
  $: factWidth = width && width < PHONE_WIDTH ? PHONE_FACT_WIDTH : FACT_WIDTH;
  $: perBlock = width ? Math.max(1, Math.floor((width - factWidth) / minColumn)) : 3;
  $: blockCount = Math.ceil(items.length / perBlock);
  $: blockSize = Math.ceil(items.length / blockCount);
  // Block sizes differ by at most one, so no item is left alone in a last block: seven items read as 3, 2, and 2.
  $: blocks = Array.from({ length: blockCount }, (_, index) => {
    const smaller = Math.floor(items.length / blockCount);
    const larger = items.length % blockCount;
    const start = index * smaller + Math.min(index, larger);
    return { start, items: items.slice(start, start + smaller + (index < larger ? 1 : 0)) };
  });
</script>

<div class="compare" class:centered={align === 'center' && blockSize > 1} bind:clientWidth={width}>
  {#each blocks as { start, items: block }}
    <table aria-label={blocks.length > 1 ? `${label} ${start + 1} to ${start + block.length}` : label}>
      <colgroup><col style:width={`${factWidth}px`} />{#each { length: blockSize } as _}<col />{/each}</colgroup>
      <thead>
        <tr>
          <td class="corner"><slot name="corner" /></td>
          {#each block as item (anchor(item))}<th scope="col" id={anchor(item)}><slot name="head" {item} /></th>{/each}
          {#each { length: blockSize - block.length } as _}<td></td>{/each}
        </tr>
      </thead>
      <tbody>
        {#each facts.filter((fact) => block.some((item) => has(item, fact.id))) as fact (fact.id)}
          <tr>
            <th scope="row"><slot name="fact" {fact}>{fact.label}</slot></th>
            {#each block as item (anchor(item))}<td><slot name="cell" {item} fact={fact.id} /></td>{/each}
            {#each { length: blockSize - block.length } as _}<td></td>{/each}
          </tr>
        {/each}
      </tbody>
    </table>
  {/each}
</div>

<style>
  /* One frame as a relation table has. Each block of items is its own table with equal item columns. */
  .compare { min-width: 0; border: 1px solid var(--c-line-soft); border-radius: var(--c-radius); background: var(--c-surface-1); overflow: hidden; }
  table { width: 100%; table-layout: fixed; border-collapse: collapse; font-size: var(--c-text-body); }
  table + table { border-top: 1px solid var(--c-line); }
  th, td { padding: .55rem .75rem; text-align: left; vertical-align: top; overflow-wrap: break-word; }
  thead tr { background: var(--c-surface-2); }
  thead tr > * { border-bottom: 1px solid var(--c-line-soft); }
  /* The corner can name what the item columns are, such as a gear score. */
  .corner { color: var(--c-text-dim); font-size: var(--c-text-small); vertical-align: bottom; }
  thead th { color: var(--c-text-strong); font-weight: 600; line-height: 1.3; vertical-align: bottom; scroll-margin-top: 6rem; }
  thead th:target { color: var(--c-accent); box-shadow: inset 0 -2px 0 var(--c-accent); }
  tbody th { color: var(--c-text-dim); font-weight: 400; }
  tbody tr + tr > * { border-top: 1px solid var(--c-line-soft); }
  td { font-variant-numeric: tabular-nums; }
  td :global(small) { display: block; color: var(--c-text-mute); font-size: var(--c-text-small); }
  td :global(.separator) { display: none; }
  /* Items side by side center their values, so the space spreads across the columns. One item per block reads as a
     list of facts from the left. */
  .centered thead th, .centered td:not(.corner) { text-align: center; }
</style>
