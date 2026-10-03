<script lang="ts">
  import type { DropRow, PlacedRule, PublicKindEntry } from '@afallon/contracts/public';
  import EntityLink from '../../EntityLink.svelte';
  import MissingValue from '../../MissingValue.svelte';
  import Hint from '../../Hint.svelte';
  import HowItWorks from '../HowItWorks.svelte';
  import Requirements from '../../Requirements.svelte';
  import { creatureLevelText, dropRateText, dropsPerKillText, KILL_CHANCE_HINT, LISTED_RATE_HINT, nameOf, rangeText } from '../../format';
  import { omitWhenShared, planColumns, stateInHeading, type RelationColumn } from '../relation-table';
  import RelationTable from '../RelationTable.svelte';
  import LootChanceHint from '../LootChanceHint.svelte';
  import Section from '../Section.svelte';

  /** The sources of an item page that drop it: creatures, and world loot of creatures by level. */
  export let rows: DropRow[];
  export let registry: PublicKindEntry[];
  export let guide: PlacedRule | undefined = undefined;

  const columns: RelationColumn<DropRow>[] = [
    { id: 'name', label: 'Creature', value: (row) => nameOf(row.counterpart), sort: (row) => nameOf(row.counterpart) },
    { id: 'quantity', label: 'Quantity', hint: 'How many of the item one drop gives.', numeric: true,
      value: (row) => rangeText(row.min, row.max) ?? undefined, sort: (row) => row.max ?? row.min, whenShared: omitWhenShared('1') },
    { id: 'rate', label: 'Listed Rate', hint: LISTED_RATE_HINT, numeric: true,
      value: (row) => row.killChance ?? row.chance ?? 'Unknown', sort: (row) => row.killChance ?? row.chance },
    { id: 'level', label: 'Level', hint: 'The levels of the creatures that can drop the item.', numeric: true,
      value: (row) => row.creatureLevel ? creatureLevelText(row.creatureLevel) : undefined, sort: (row) => row.creatureLevel?.min },
    { id: 'perKill', label: 'Loot List Roll', hint: 'The chance that one kill rolls the loot list and the number of items that list can give.',
      value: dropsPerKillText, whenShared: stateInHeading },
    { id: 'requirements', label: 'Requirement', value: (row) => row.requirements.length ? JSON.stringify(row.requirements) : undefined },
  ];

  $: calculated = rows.filter((row) => row.killChance !== undefined);
  $: listed = rows.filter((row) => row.killChance === undefined);
  $: plan = planColumns(columns, rows);
  $: line = plan.shared.some((shared) => shared.column.id === 'perKill') && rows[0] ? dropsPerKillText(rows[0]) : undefined;
</script>

{#snippet table(groupRows: DropRow[], computed: boolean)}
  {@const groupPlan = planColumns(columns.map((column) => column.id === 'rate'
    ? { ...column, label: computed ? 'Chance per Kill' : 'Listed Rate', hint: computed ? KILL_CHANCE_HINT : LISTED_RATE_HINT }
    : column), groupRows)}
  <RelationTable columns={groupPlan.columns} rows={groupRows} label={computed ? 'Calculated chance per kill' : 'Listed drop rates'} sort={{ id: 'rate', dir: 'desc' }} mobileAlignedNumbers>
    <svelte:fragment slot="cell" let:row let:column>
      {#if column === 'name'}<EntityLink ref={row.counterpart} {registry} />
      {:else if column === 'level'}{#if row.creatureLevel}{creatureLevelText(row.creatureLevel)}{/if}
      {:else if column === 'quantity'}{rangeText(row.min, row.max) ?? ''}
      {:else if column === 'rate'}
        {@const value = dropRateText(row)}
        {#if value === undefined}<MissingValue explanation={row.oddsUnavailable ?? 'Listed rate unknown'} />
        {:else if row.oddsUnavailable}<Hint text={`${computed ? KILL_CHANCE_HINT : LISTED_RATE_HINT} ${row.oddsUnavailable}`}>{value}</Hint>
        {:else}{value}{/if}
        {#if computed && row.chanceLevel !== undefined}<small>At creature level {row.chanceLevel} <LootChanceHint /></small>{/if}
      {:else if column === 'perKill'}{dropsPerKillText(row)}
      {:else if column === 'requirements'}<Requirements requirements={row.requirements} {registry} />{/if}
    </svelte:fragment>
  </RelationTable>
{/snippet}

{#if rows.length}
  <Section id="dropped-by" title="Dropped by" count={rows.length} countUnit={rows.length === 1 ? 'creature' : 'creatures'} {line}>
    <div class="rate-groups">
      {#if calculated.length}
        <div>
          {#if listed.length}<h3>Calculated chance per kill</h3>{/if}
          <p>Chance for each eligible kill, assuming no Loot Chance. <LootChanceHint /></p>
          {@render table(calculated, true)}
        </div>
      {/if}
      {#if listed.length}
        <div>
          {#if calculated.length}<h3>Listed rates</h3>{/if}
          <p>The game lists these rates before choosing how many items drop. They are not chances per kill.</p>
          {@render table(listed, false)}
        </div>
      {/if}
    </div>
    {#if guide}<HowItWorks guide={guide.guide} section={guide.section} label="How creature drops work" />{/if}
  </Section>
{/if}

<style>
  .rate-groups { display: grid; gap: 1.25rem; }
  .rate-groups > div { min-width: 0; }
  h3 { margin: 0 0 .25rem; color: var(--c-text-strong); font-size: var(--c-text-body); }
  p { margin: 0 0 .5rem; color: var(--c-text-dim); font-size: var(--c-text-body); line-height: 1.5; }
</style>
