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
  import LootChanceHint from '../LootChanceHint.svelte';
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
    { id: 'rate', label: 'Listed Rate', hint: LISTED_RATE_HINT, numeric: true, value: (row) => row.killChance ?? row.chance ?? 'Unknown', sort: (row) => row.killChance ?? row.chance },
    { id: 'requirements', label: 'Requirement', value: (row) => row.requirements.length ? JSON.stringify(row.requirements) : undefined },
    { id: 'variant', label: 'Version', value: (row) => row.variants?.join(' ') },
  ];
  const ruleKey = (row: NpcDropRow) => JSON.stringify([row.lootGroup ?? null, row.tableChance ?? null, row.tableMinimum ?? null, row.tableLimit ?? null]);
  $: groups = mergeRows(rows, ruleKey, (group) => [...group]);

  function groupColumns(group: readonly NpcDropRow[], computed: boolean): RelationColumn<NpcDropRow>[] {
    const rate = columns.map((column) => column.id === 'rate'
      ? { ...column, label: computed ? 'Chance per Kill' : 'Listed Rate', hint: computed ? KILL_CHANCE_HINT : LISTED_RATE_HINT }
      : column);
    return planColumns(rate, group).columns;
  }
</script>

{#snippet rateTable(group: NpcDropRow[], computed: boolean, label: string)}
  <RelationTable columns={groupColumns(group, computed)} rows={group} {label} sort={{ id: 'rate', dir: 'desc' }} mobileAlignedNumbers>
    <svelte:fragment slot="cell" let:row let:column>
      {#if column === 'name'}<EntityLink ref={row.counterpart} {registry} />
      {:else if column === 'quantity'}{#if row.min !== undefined || row.max !== undefined}{rangeText(row.min, row.max)}{:else}<MissingValue explanation={nameOf(row.counterpart) === 'Gold' ? 'The game gives no valid gold amount for this drop' : 'Drop quantity unknown'} />{/if}
      {:else if column === 'rate'}
        {@const value = dropRateText(row)}
        {#if value === undefined}<MissingValue explanation={row.oddsUnavailable ?? 'Listed rate unknown'} />
        {:else if row.oddsUnavailable}<Hint text={`${computed ? KILL_CHANCE_HINT : LISTED_RATE_HINT} ${row.oddsUnavailable}`}>{value}</Hint>
        {:else}{value}{/if}
      {:else if column === 'requirements'}<Requirements requirements={row.requirements} {registry} />
      {:else if column === 'variant'}{#if row.variants}<VariantLinks anchors={row.variants} {variants} />{:else}All{/if}{/if}
    </svelte:fragment>
  </RelationTable>
{/snippet}

{#snippet tables()}
  {#if groups.length}
    <div class="groups">
      {#each groups as group, index}
        {@const calculated = group.filter((row) => row.killChance !== undefined)}
        {@const listed = group.filter((row) => row.killChance === undefined)}
        {@const groupLabel = groups.length > 1 ? `Drop Group ${index + 1}` : 'Drops'}
        <div class="group">
          {#if group[0]}<p class="group-line">{#if groups.length > 1}<strong>Drop Group {index + 1}</strong>{/if}{dropGroupText(group[0], group.length, listed.length > 0)}</p>{/if}
          <div class="rate-groups">
            {#if calculated.length}
              <div>
                {#if listed.length}<h3>Calculated chance per kill</h3>{/if}
                <p class="rate-line">Chance for each kill, assuming no Loot Chance. <LootChanceHint /></p>
                {@render rateTable(calculated, true, listed.length ? `${groupLabel}: calculated chance per kill` : groupLabel)}
              </div>
            {/if}
            {#if listed.length}
              <div>
                {#if calculated.length}<h3>Listed rates</h3>{/if}
                <p class="rate-line">The game lists these rates before choosing how many items drop. They are not chances per kill.</p>
                {@render rateTable(listed, false, calculated.length ? `${groupLabel}: listed rates` : groupLabel)}
              </div>
            {/if}
          </div>
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
  .groups, .rate-groups { display: grid; gap: 1.25rem; }
  .group, .rate-groups > div { min-width: 0; }
  .group-line, .rate-line { margin: 0 0 .5rem; color: var(--c-text-dim); font-size: var(--c-text-body); line-height: 1.5; }
  .group-line strong { display: block; color: var(--c-text-strong); font-weight: 600; }
  h3 { margin: 0 0 .25rem; color: var(--c-text-strong); font-size: var(--c-text-body); }
  .empty { margin: 0; color: var(--c-text-dim); }
</style>
