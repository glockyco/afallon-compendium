<script lang="ts">
  import { categoryLabel, type ItemUsePack, type PublicKindEntry } from '@afallon/contracts/public';
  import EntityLink from '../../EntityLink.svelte';
  import { formatNumber } from '../../format';
  import type { RelationColumn } from '../relation-table';
  import RelationTable from '../RelationTable.svelte';
  import { packPicksText, type PackBand } from '../supply-pack-tabs';

  /** One pack table: its picks when they differ between tables, its world loot filters, and its items. */
  export let band: PackBand;
  export let picksShared: boolean;
  /** Names the level band in the panel, when no tab names it. */
  export let showLabel = false;
  export let registry: PublicKindEntry[];

  type WorldRow = PackBand['worldLoot'][number];
  const levelsText = (row: WorldRow) => row.levels.map((range) => range.max === undefined ? `${formatNumber(range.min)}+` : range.max === range.min ? formatNumber(range.min) : `${formatNumber(range.min)}–${formatNumber(range.max)}`).join(', ');
  const worldColumns: RelationColumn<WorldRow>[] = [
    { id: 'item', label: 'Item', value: (row) => 'name' in row.item ? row.item.name : row.item.label, sort: (row) => 'name' in row.item ? row.item.name : row.item.label },
    { id: 'levels', label: 'Character levels', hint: 'The levels of your character at which the item can be world loot from this band.', numeric: true, value: levelsText, sort: (row) => row.levels[0]?.min },
  ];
  const columns: RelationColumn<ItemUsePack['entries'][number]>[] = [
    { id: 'item', label: 'Item', value: (row) => 'name' in row.item ? row.item.name : row.item.label, sort: (row) => 'name' in row.item ? row.item.name : row.item.label },
    { id: 'quantity', label: 'Quantity', hint: 'How many of the item you get when the pack gives it.', numeric: true, value: (row) => `${row.min}–${row.max}`, sort: (row) => row.max },
  ];
  $: pack = band.pack;
</script>

<div class="c-stack">
  {#if showLabel}<p class="band">{band.label}</p>{/if}
  {#if !picksShared}<p>{packPicksText(pack)}</p>{/if}
  {#if pack.worldShare > 0}<p>World loot is gear from the loot tables of the whole world that your class can use, with a level requirement close to yours.{#if pack.armorType}{' '}World loot armor is {categoryLabel(pack.armorType).toLocaleLowerCase('en-US')}.{/if}{#if pack.stats.length}{' '}Gear with a main stat has {#each pack.stats as stat, statIndex}{#if statIndex}{statIndex === pack.stats.length - 1 ? ' or ' : ', '}{/if}<EntityLink ref={stat} {registry} />{/each}.{/if}</p>{/if}
  <RelationTable {columns} rows={pack.entries} label={`Items for ${band.label.toLocaleLowerCase('en-US')}`}>
    <svelte:fragment slot="cell" let:row let:column>
      {#if column === 'item'}<EntityLink ref={row.item} {registry} />
      {:else}{formatNumber(row.min)}{#if row.max !== row.min}–{formatNumber(row.max)}{/if}{/if}
    </svelte:fragment>
  </RelationTable>
  {#if band.worldLoot.length}
    <h3>World loot</h3>
    <p>The world loot that this band can give, with the levels of your character at which each item can appear.</p>
    <RelationTable columns={worldColumns} rows={band.worldLoot} label={`World loot for ${band.label.toLocaleLowerCase('en-US')}`}>
      <svelte:fragment slot="cell" let:row let:column>
        {#if column === 'item'}<EntityLink ref={row.item} {registry} />{:else}{levelsText(row)}{/if}
      </svelte:fragment>
    </RelationTable>
  {/if}
</div>

<style>
  .band { color: var(--c-text-strong); font-weight: 600; }
  h3 { margin: .5rem 0 0; font-size: 1rem; }
</style>
