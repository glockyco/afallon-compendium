<script lang="ts">
  import type { DropRow, PlacedRule, PublicKindEntry } from '@afallon/contracts/public';
  import EntityLink from '../../EntityLink.svelte';
  import MissingValue from '../../MissingValue.svelte';
  import Hint from '../../Hint.svelte';
  import HowItWorks from '../HowItWorks.svelte';
  import Requirements from '../../Requirements.svelte';
  import { creatureLevelText, dropRateText, dropsPerKillText, KILL_CHANCE_HINT, LISTED_RATE_HINT, itemDropText, nameOf, rangeText } from '../../format';
  import { omitWhenShared, planColumns, stateInHeading, type RelationColumn } from '../relation-table';
  import RelationTable from '../RelationTable.svelte';
  import Section from '../Section.svelte';

  /** The sources of an item page that drop it: creatures, and world loot of creatures by level. */
  export let rows: DropRow[];
  export let registry: PublicKindEntry[];
  export let guide: PlacedRule | undefined = undefined;

  const columns: RelationColumn<DropRow>[] = [
    { id: 'name', label: 'Creature', value: (row) => nameOf(row.counterpart), sort: (row) => nameOf(row.counterpart) },
    { id: 'level', label: 'Level', hint: 'The levels of the creatures that can drop the item.', numeric: true,
      value: (row) => row.creatureLevel ? creatureLevelText(row.creatureLevel) : undefined, sort: (row) => row.creatureLevel?.min },
    { id: 'quantity', label: 'Quantity', hint: 'How many of the item one drop gives.', numeric: true,
      value: (row) => rangeText(row.min, row.max) ?? undefined, sort: (row) => row.max ?? row.min, whenShared: omitWhenShared('1') },
    { id: 'rate', label: 'Listed Rate', hint: LISTED_RATE_HINT, numeric: true,
      value: (row) => row.killChance ?? row.chance, sort: (row) => row.killChance ?? row.chance },
    { id: 'perKill', label: 'Loot List Roll', hint: 'The chance that one kill rolls the loot list and the number of items that list can give.',
      value: dropsPerKillText, whenShared: stateInHeading },
    { id: 'requirements', label: 'Requirement', value: (row) => row.requirements.length ? JSON.stringify(row.requirements) : undefined },
  ];

  $: known = rows.filter((row) => row.killChance !== undefined).length;
  $: plan = planColumns(columns.map((column) => column.id === 'rate'
    ? { ...column, label: known === rows.length ? 'Chance per Kill' : known ? 'Rate' : 'Listed Rate',
      hint: known === rows.length ? KILL_CHANCE_HINT : LISTED_RATE_HINT }
    : column), rows);
  $: line = plan.shared.some((shared) => shared.column.id === 'perKill') && rows[0] ? itemDropText({ ...rows[0], killChance: known === rows.length ? rows[0].killChance : undefined }) : undefined;
</script>

{#if rows.length}
  <Section id="dropped-by" title="Dropped by" count={rows.length} {line}>
    <RelationTable columns={plan.columns} {rows} label="Dropped by" sort={{ id: 'rate', dir: 'desc' }}>
      <svelte:fragment slot="cell" let:row let:column>
        {#if column === 'name'}<EntityLink ref={row.counterpart} {registry} />
        {:else if column === 'level'}{#if row.creatureLevel}{creatureLevelText(row.creatureLevel)}{/if}
        {:else if column === 'quantity'}{rangeText(row.min, row.max) ?? ''}
        {:else if column === 'rate'}
          {@const value = dropRateText(row)}
          {#if value === undefined}<MissingValue explanation={row.oddsUnavailable ?? 'Listed rate unknown'} />
          {:else}
            {#if rows.length === 1 || known > 0 && known < rows.length}
              <span class:single-rate-label={rows.length === 1}>
                {#if row.killChance === undefined}<Hint text={`${LISTED_RATE_HINT}${row.oddsUnavailable ? ` ${row.oddsUnavailable}` : ''}`}>Listed Rate:</Hint>
                {:else}<Hint text={KILL_CHANCE_HINT}>Chance per Kill:</Hint>{/if}{' '}
              </span>
            {/if}{#if row.killChance === undefined && row.oddsUnavailable}<Hint text={`${LISTED_RATE_HINT} ${row.oddsUnavailable}`}>{value}</Hint>{:else}{value}{/if}{#if row.killChance !== undefined && row.chanceLevel !== undefined}<small>At creature level {row.chanceLevel}, with 0 Loot Chance</small>{/if}
          {/if}
        {:else if column === 'perKill'}{dropsPerKillText(row)}
        {:else if column === 'requirements'}<Requirements requirements={row.requirements} {registry} />{/if}
      </svelte:fragment>
    </RelationTable>
    {#if guide}<HowItWorks guide={guide.guide} section={guide.section} label="How creature drops work" />{/if}
  </Section>
{/if}

<style>
  .single-rate-label { display: none; }
  @media (max-width: 640px) { .single-rate-label { display: inline; } }
</style>
