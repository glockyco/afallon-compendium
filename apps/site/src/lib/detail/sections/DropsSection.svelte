<script lang="ts">
  import type { NpcDropRow, NpcVariant, PlacedRule, PublicKindEntry } from '@afallon/contracts/public';
  import EntityLink from '../../EntityLink.svelte';
  import MissingValue from '../../MissingValue.svelte';
  import Requirements from '../../Requirements.svelte';
  import HowItWorks from '../HowItWorks.svelte';
  import Hint from '../../Hint.svelte';
  import VariantLinks from '../../VariantLinks.svelte';
  import { dropGroupText, dropRateText, KILL_CHANCE_HINT, LISTED_RATE_HINT, nameOf, rangeText } from '../../format';
  import { mergeRows, omitWhenShared, planColumns, type RelationColumn } from '../relation-table';
  import RelationTable from '../RelationTable.svelte';
  import Section from '../Section.svelte';

  export let rows: NpcDropRow[];
  export let variants: NpcVariant[] = [];
  export let registry: PublicKindEntry[];
  export let answer = false;
  /** The name of the NPC, which the empty state names. */
  export let name: string;
  export let guide: PlacedRule | undefined = undefined;

  const columns: RelationColumn<NpcDropRow>[] = [
    { id: 'name', label: 'Item', value: (row) => nameOf(row.counterpart), sort: (row) => nameOf(row.counterpart) },
    { id: 'quantity', label: 'Quantity', numeric: true, value: (row) => rangeText(row.min, row.max) ?? 'Unknown', sort: (row) => row.max ?? row.min, whenShared: omitWhenShared('1') },
    { id: 'rate', label: 'Listed Rate', hint: LISTED_RATE_HINT, numeric: true, value: (row) => row.killChance ?? row.chance, sort: (row) => row.killChance ?? row.chance },
    { id: 'requirements', label: 'Requirement', value: (row) => row.requirements.length ? JSON.stringify(row.requirements) : undefined },
    { id: 'variant', label: 'Version', value: (row) => row.variants?.join(' ') },
  ];
  const ruleKey = (row: NpcDropRow) => JSON.stringify([row.lootGroup ?? null, row.tableChance ?? null, row.tableMinimum ?? null, row.tableLimit ?? null]);
  $: groups = mergeRows(rows, ruleKey, (group) => [...group]);

  function groupColumns(group: readonly NpcDropRow[]): RelationColumn<NpcDropRow>[] {
    const known = group.filter((row) => row.killChance !== undefined).length;
    const rate = columns.map((column) => {
      if (column.id !== 'rate') return column;
      return { ...column, label: known === group.length ? 'Chance per Kill' : known ? 'Rate' : 'Listed Rate',
        hint: known === group.length ? KILL_CHANCE_HINT : LISTED_RATE_HINT };
    });
    return planColumns(rate, group).columns;
  }
</script>

{#snippet tables()}
  {#if groups.length}
    <div class="groups">
      {#each groups as group, index}
        {@const mixedRates = group.some((row) => row.killChance !== undefined) && group.some((row) => row.killChance === undefined)}
        <div class="group">
          {#if group[0]}<p class="group-line">{#if groups.length > 1}<strong>Drop Group {index + 1}</strong>{/if}{dropGroupText(group[0], group.length, group.some((row) => row.killChance === undefined))}</p>{/if}
          <RelationTable columns={groupColumns(group)} rows={group} label={groups.length > 1 ? `Drop Group ${index + 1}` : 'Drops'} sort={{ id: 'rate', dir: 'desc' }}>
            <svelte:fragment slot="cell" let:row let:column>
              {#if column === 'name'}<EntityLink ref={row.counterpart} {registry} />
              {:else if column === 'quantity'}{#if row.min !== undefined || row.max !== undefined}{rangeText(row.min, row.max)}{:else}<MissingValue explanation={nameOf(row.counterpart) === 'Gold' ? 'The game gives no valid gold amount for this drop' : 'Drop quantity unknown'} />{/if}
              {:else if column === 'rate'}
                {@const value = dropRateText(row)}
                {#if value === undefined}<MissingValue explanation={row.oddsUnavailable ?? 'Listed rate unknown'} />
                {:else}
                  {#if group.length === 1 || mixedRates}
                    <span class:single-rate-label={group.length === 1}>
                      {#if row.killChance === undefined}<Hint text={`${LISTED_RATE_HINT}${row.oddsUnavailable ? ` ${row.oddsUnavailable}` : ''}`}>Listed Rate:</Hint>
                      {:else}<Hint text={KILL_CHANCE_HINT}>Chance per Kill:</Hint>{/if}{' '}
                    </span>
                  {/if}{#if row.killChance === undefined && row.oddsUnavailable}<Hint text={`${LISTED_RATE_HINT} ${row.oddsUnavailable}`}>{value}</Hint>{:else}{value}{/if}
                {/if}
              {:else if column === 'requirements'}<Requirements requirements={row.requirements} {registry} />
              {:else if column === 'variant'}{#if row.variants}<VariantLinks anchors={row.variants} {variants} />{:else}All{/if}{/if}
            </svelte:fragment>
          </RelationTable>
        </div>
      {/each}
      {#if guide}<HowItWorks guide={guide.guide} section={guide.section} label="How creature drops work" />{/if}
    </div>
  {:else}<p class="empty">No known drops for {name}.</p>{/if}
{/snippet}

{#if answer}
  {@render tables()}
{:else if rows.length}
  <Section id="drops" title="Drops" count={rows.length}>
    {@render tables()}
  </Section>
{/if}

<style>
  .groups { display: grid; gap: 1.25rem; }
  .group { min-width: 0; }
  .group-line { margin: 0 0 .5rem; color: var(--c-text-dim); font-size: var(--c-text-body); line-height: 1.5; }
  .group-line strong { display: block; color: var(--c-text-strong); font-weight: 600; }
  .single-rate-label { display: none; }
  @media (max-width: 640px) { .single-rate-label { display: inline; } }
  .empty { margin: 0; color: var(--c-text-dim); }
</style>
