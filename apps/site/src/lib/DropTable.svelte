<script lang="ts">
  import type { NpcDropRow, NpcVariant, PublicKindEntry } from '@afallon/contracts/public';
  import Card from './Card.svelte';
  import DataTable, { type TableColumn } from './DataTable.svelte';
  import EntityLink from './EntityLink.svelte';
  import MissingValue from './MissingValue.svelte';
  import Requirements from './Requirements.svelte';
  import VariantLinks from './VariantLinks.svelte';
  import { creatureLevelText, formatNumber, lootTableText, rangeText } from './format';
  import { sortRows, toggleSort, type SortState, type SortValue } from './table';

  export let rows: NpcDropRow[];
  /** The variants of a creature page. A row that only some variants drop names them. */
  export let variants: NpcVariant[] = [];
  export let registry: PublicKindEntry[];
  export let heading = 'Drops';
  export let counterpartLabel = 'Entity';
  export let limit: number | undefined = undefined;

  let sort: SortState = { id: 'chance', dir: 'desc' };

  $: hasLevels = rows.some((row) => row.creatureLevel);
  $: hasTables = rows.some((row) => lootTableText(row) !== null);
  $: hasVariants = rows.some((row) => row.variants);
  $: hasRequirements = rows.some((row) => row.requirements.length > 0);
  // How to read the loot columns. The Adventure Guide shows the same Chance value.
  $: notes = hasLevels || hasTables ? [
    'Chance is the authored entry rate that the Adventure Guide shows, not an effective chance per kill.',
    ...(hasTables ? ['Table shows the authored rate of the roll for the whole loot table, and how many of its items one roll gives.'] : []),
    ...(hasLevels ? ['World loot can drop from any creature whose level is in the Level range.'] : []),
  ] : [];
  $: columns = [
    { id: 'name', label: counterpartLabel, sortable: true },
    ...(hasLevels ? [{ id: 'level', label: 'Level', numeric: true, sortable: true }] : []),
    { id: 'quantity', label: 'Quantity', numeric: true, sortable: true },
    { id: 'chance', label: 'Chance', numeric: true, sortable: true },
    ...(hasTables ? [{ id: 'table', label: 'Table' }] : []),
    ...(hasRequirements ? [{ id: 'requirements', label: 'Requirements' }] : []),
    ...(hasVariants ? [{ id: 'variant', label: 'Variant' }] : []),
  ] satisfies TableColumn[];
  $: visible = sortRows(rows, value, sort).slice(0, limit ?? rows.length);

  function value(row: NpcDropRow, id: string): SortValue {
    if (id === 'quantity') return row.max ?? row.min;
    if (id === 'chance') return row.chance;
    if (id === 'level') return row.creatureLevel?.min;
    return row.counterpart.key === null ? row.counterpart.label : row.counterpart.name;
  }
</script>

{#if rows.length > 0}
  <Card title={heading} count={rows.length}>
    <DataTable {columns} {sort} onSort={(id, numeric) => (sort = toggleSort(sort, id, numeric))}>
      {#each visible as row}
        <tr>
          <td><EntityLink ref={row.counterpart} {registry} /></td>
          {#if hasLevels}<td class="c-num">{#if row.creatureLevel}{creatureLevelText(row.creatureLevel)}{/if}</td>{/if}
          <td class="c-num">{#if rangeText(row.min, row.max) === null}<MissingValue explanation="No quantity is published" />{:else}{rangeText(row.min, row.max)}{/if}</td>
          <td class="c-num">{#if row.chance === undefined}<MissingValue explanation="Not measured for this build" />{:else}{formatNumber(row.chance)}%{/if}</td>
          {#if hasTables}<td class="table">{lootTableText(row) ?? ''}</td>{/if}
          {#if hasRequirements}<td><Requirements requirements={row.requirements} {registry} /></td>{/if}
          {#if hasVariants}<td>{#if row.variants}<VariantLinks anchors={row.variants} {variants} />{:else}All{/if}</td>{/if}
        </tr>
      {/each}
    </DataTable>
    {#if notes.length > 0}<p class="note">{notes.join(' ')}</p>{/if}
  </Card>
{/if}

<style>
  .table { color: var(--c-text-dim); font-size: .84rem; white-space: nowrap; }
  .note { margin: .7rem 0 0; color: var(--c-text-dim); font-size: .8rem; line-height: 1.5; }
</style>
