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

  /** The drops of an NPC page. */
  export let rows: NpcDropRow[];
  /** The variants of the page. A row that only some variants drop names them. */
  export let variants: NpcVariant[] = [];
  export let registry: PublicKindEntry[];

  const columns: RelationColumn<NpcDropRow>[] = [
    { id: 'name', label: 'Item', value: (row) => nameOf(row.counterpart), sort: (row) => nameOf(row.counterpart) },
    { id: 'quantity', label: 'Quantity', hint: 'How many of the item one drop gives.', numeric: true,
      value: (row) => rangeText(row.min, row.max) ?? undefined, sort: (row) => row.max ?? row.min, whenShared: omitWhenShared('1') },
    { id: 'chance', label: 'Chance', hint: 'The chance of the item to drop. The text above the table says how many items one kill drops.', numeric: true,
      value: (row) => row.chance, sort: (row) => row.chance },
    { id: 'requirements', label: 'Requirement', value: (row) => row.requirements.length ? JSON.stringify(row.requirements) : undefined },
    { id: 'variant', label: 'Variant', value: (row) => row.variants?.join(' ') },
  ];

  // Items of one loot list share its rule: how often a kill rolls the list and how many items the list gives. The
  // publication rejects two lists of one page that share a rule with a limit or a minimum, so a group is one list.
  const ruleKey = (row: NpcDropRow) => JSON.stringify([row.tableChance ?? null, row.tableMinimum ?? null, row.tableLimit ?? null]);
  $: groups = mergeRows(rows, ruleKey, (group) => [...group]);
</script>

{#if rows.length}
  <Section id="drops" title="Drops" icon="loot" count={rows.length} line={groups.length === 1 && groups[0]?.[0] ? dropGroupText(groups[0][0], groups[0].length) : undefined}>
    <div class="groups">
      {#each groups as group}
        <div>
          {#if groups.length > 1 && group[0]}<p class="group-line">{dropGroupText(group[0], group.length)}</p>{/if}
          <RelationTable columns={planColumns(columns, group).columns} rows={group} label="Drops" sort={{ id: 'chance', dir: 'desc' }}>
            <svelte:fragment slot="cell" let:row let:column>
              {#if column === 'name'}<EntityLink ref={row.counterpart} {registry} />
              {:else if column === 'quantity'}{rangeText(row.min, row.max) ?? ''}
              {:else if column === 'chance'}{#if row.chance === undefined}<MissingValue explanation="No chance is published for this build" />{:else}{formatNumber(row.chance)}%{/if}
              {:else if column === 'requirements'}<Requirements requirements={row.requirements} {registry} />
              {:else if column === 'variant'}{#if row.variants}<VariantLinks anchors={row.variants} {variants} />{:else}All{/if}{/if}
            </svelte:fragment>
          </RelationTable>
        </div>
      {/each}
    </div>
  </Section>
{/if}

<style>
  .groups { display: grid; gap: 1.25rem; }
  .group-line { margin: 0 0 .35rem; color: var(--c-text); font-size: .88rem; line-height: 1.5; }
</style>
