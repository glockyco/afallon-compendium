<script lang="ts" generics="Row extends DropTableRow">
  import type { NpcVariant, PublicKindEntry } from '@afallon/contracts/public';
  import EntityLink from '../EntityLink.svelte';
  import Hint from '../Hint.svelte';
  import MissingValue from '../MissingValue.svelte';
  import Requirements from '../Requirements.svelte';
  import VariantLinks from '../VariantLinks.svelte';
  import { CLOTH_CHANCE_HINT, dropRateText, KILL_CHANCE_HINT, LISTED_RATE_HINT, nameOf, rangeText } from '../format';
  import type { DropTableRow } from './level-loot';
  import LootChanceHint from './LootChanceHint.svelte';
  import { omitWhenShared, planColumns, type RelationColumn } from './relation-table';
  import RelationTable from './RelationTable.svelte';

  // The items of one roll of a kill. `rate` says what the rate column holds: a chance per kill, the game's listed rate,
  // or a cloth chance, which Loot Chance does not change.
  export let rows: Row[];
  export let label: string;
  export let registry: PublicKindEntry[];
  export let rate: 'kill' | 'listed' | 'cloth' = 'kill';
  export let variants: NpcVariant[] = [];
  /** A heading above the table, when a group splits its rows into more than one table. */
  export let heading: string | undefined = undefined;
  /** Leave out the quantity column, when the sentence above the table already states it. */
  export let quantity = true;

  $: hint = rate === 'kill' ? KILL_CHANCE_HINT : rate === 'cloth' ? CLOTH_CHANCE_HINT : LISTED_RATE_HINT;
  $: columns = planColumns<Row>([
    { id: 'name', label: 'Item', value: (row) => nameOf(row.counterpart), sort: (row) => nameOf(row.counterpart) },
    ...(quantity ? [{ id: 'quantity', label: 'Quantity', numeric: true, value: (row: Row) => rangeText(row.min, row.max) ?? 'Unknown', sort: (row: Row) => row.max ?? row.min, whenShared: omitWhenShared('1') }] : []),
    { id: 'rate', label: rate === 'listed' ? 'Listed Rate' : 'Chance per Kill', hint, numeric: true, value: (row) => row.killChance ?? row.chance ?? 'Unknown', sort: (row) => row.killChance ?? row.chance },
    { id: 'requirements', label: 'Requirement', value: (row) => row.requirements?.length ? JSON.stringify(row.requirements) : undefined },
    { id: 'variant', label: 'Version', value: (row) => row.variants?.join(' ') },
  ] satisfies RelationColumn<Row>[], rows).columns;
</script>

<div class="drop-table">
  {#if heading}<h3>{heading}</h3>{/if}
  <p class="rate-line">
    {#if rate === 'listed'}The game lists these rates before choosing how many items drop. They are not chances per kill.
    {:else if rate === 'cloth'}Chance for each kill. <LootChanceHint cloth />
    {:else}Chance for each kill, assuming no Loot Chance. <LootChanceHint />{/if}
  </p>
  <RelationTable {columns} {rows} {label} sort={{ id: 'rate', dir: 'desc' }} mobileAlignedNumbers>
    <svelte:fragment slot="cell" let:row let:column>
      {#if column === 'name'}<EntityLink ref={row.counterpart} {registry} />{#if row.questOnly}<small>Drops while a quest needs it</small>{/if}
      {:else if column === 'quantity'}{#if row.min !== undefined || row.max !== undefined}{rangeText(row.min, row.max)}{:else}<MissingValue explanation={nameOf(row.counterpart) === 'Gold' ? 'The game gives no valid gold amount for this drop' : 'Drop quantity unknown'} />{/if}
      {:else if column === 'rate'}
        {@const value = dropRateText(row)}
        {#if value === undefined}<MissingValue explanation={row.oddsUnavailable ?? 'Listed rate unknown'} />
        {:else if row.oddsUnavailable}<Hint text={`${hint} ${row.oddsUnavailable}`}>{value}</Hint>
        {:else}{value}{/if}
      {:else if column === 'requirements'}{#if row.requirements}<Requirements requirements={row.requirements} {registry} />{/if}
      {:else if column === 'variant'}{#if row.variants}<VariantLinks anchors={row.variants} {variants} />{:else}All{/if}{/if}
    </svelte:fragment>
  </RelationTable>
</div>

<style>
  .drop-table { min-width: 0; }
  .rate-line { margin: 0 0 .5rem; color: var(--c-text-dim); font-size: var(--c-text-body); line-height: 1.5; }
  h3 { margin: 0 0 .25rem; color: var(--c-text-strong); font-size: var(--c-text-body); }
</style>
