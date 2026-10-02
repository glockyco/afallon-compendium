<script lang="ts">
  import type { NpcDropRow, NpcVariant, PublicKindEntry } from '@afallon/contracts/public';
  import EntityLink from '../../EntityLink.svelte';
  import MissingValue from '../../MissingValue.svelte';
  import Requirements from '../../Requirements.svelte';
  import VariantLinks from '../../VariantLinks.svelte';
  import { dropGroupText, formatNumber, nameOf, rangeText } from '../../format';
  import { mergeRows, omitWhenShared, planColumns, type RelationColumn } from '../relation-table';
  import RelationTable from '../RelationTable.svelte';
  import Section from '../Section.svelte';

  export let rows: NpcDropRow[];
  export let variants: NpcVariant[] = [];
  export let registry: PublicKindEntry[];
  export let answer = false;
  /** The name of the NPC, which the empty state names. */
  export let name: string;

  const columns: RelationColumn<NpcDropRow>[] = [
    { id: 'name', label: 'Item', value: (row) => nameOf(row.counterpart), sort: (row) => nameOf(row.counterpart) },
    { id: 'quantity', label: 'Quantity', numeric: true, value: (row) => rangeText(row.min, row.max) ?? 'Unknown', sort: (row) => row.max ?? row.min, whenShared: omitWhenShared('1') },
    { id: 'chance', label: 'Item chance', numeric: true, value: (row) => row.chance, sort: (row) => row.chance },
    { id: 'requirements', label: 'Requirement', value: (row) => row.requirements.length ? JSON.stringify(row.requirements) : undefined },
    { id: 'variant', label: 'Variant', value: (row) => row.variants?.join(' ') },
  ];
  const ruleKey = (row: NpcDropRow) => JSON.stringify([row.tableChance ?? null, row.tableMinimum ?? null, row.tableLimit ?? null]);
  $: groups = mergeRows(rows, ruleKey, (group) => [...group]);
</script>

{#snippet tables()}
  {#if groups.length}
    <div class="groups">
      {#each groups as group, index}
        <div class="group">
          {#if group[0]}<p class="group-line">{groups.length > 1 ? `Loot table ${index + 1}: ` : ''}{dropGroupText(group[0], group.length)}</p>{/if}
          <RelationTable columns={planColumns(columns, group).columns} rows={group} label={groups.length > 1 ? `Loot table ${index + 1}` : 'Drops'} sort={{ id: 'chance', dir: 'desc' }}>
            <svelte:fragment slot="cell" let:row let:column>
              {#if column === 'name'}<EntityLink ref={row.counterpart} {registry} />
              {:else if column === 'quantity'}{#if row.min !== undefined || row.max !== undefined}{rangeText(row.min, row.max)}{:else}Unknown <MissingValue explanation={nameOf(row.counterpart) === 'Gold' ? 'The quantity range is invalid' : 'Drop quantity unknown'} />{/if}
              {:else if column === 'chance'}{#if row.chance === undefined}<MissingValue explanation="Item drop chance unknown" />{:else}{formatNumber(row.chance)}%{/if}
              {:else if column === 'requirements'}<Requirements requirements={row.requirements} {registry} />
              {:else if column === 'variant'}{#if row.variants}<VariantLinks anchors={row.variants} {variants} />{:else}All{/if}{/if}
            </svelte:fragment>
          </RelationTable>
        </div>
      {/each}
    </div>
  {:else}<p class="empty">No drops are published for {name}.</p>{/if}
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
  .empty { margin: 0; color: var(--c-text-dim); }
</style>
