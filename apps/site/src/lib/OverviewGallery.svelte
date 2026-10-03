<script lang="ts">
  import type { ListRow, PublicKindEntry, StaticKindList } from '@afallon/contracts/public';
  import { formatNumber, intervalText } from './format';
  import OverviewTile from './OverviewTile.svelte';

  export let list: StaticKindList;
  export let kind: PublicKindEntry;
  export let registry: PublicKindEntry[];
  let query = '';

  const number = (row: ListRow, key: string): number | null => typeof row.values[key] === 'number' ? row.values[key] as number : null;
  const text = (row: ListRow, key: string): string | null => typeof row.values[key] === 'string' ? row.values[key] as string : null;
  const count = (value: number | null, singular: string, plural: string) => value === null ? null : `${formatNumber(value)} ${value === 1 ? singular : plural}`;
  const present = (values: Array<string | null>): string[] => values.filter((value): value is string => value !== null);
  const openingSentence = (value: string | null): string | null => value?.match(/^.*?[.!?](?=\s|$)/s)?.[0] ?? value;
  function facts(row: ListRow): string[] {
    switch (kind.kind) {
      case 'classes': return present([count(number(row, 'talentTrees'), 'talent tree', 'talent trees'), count(number(row, 'abilities'), 'ability', 'abilities')]);
      case 'skills': return present([text(row, 'type') && `${text(row, 'type')} skill`, number(row, 'highestLevel') === null ? null : `Level ${formatNumber(number(row, 'highestLevel')!)}`,
        count(number(row, 'recipes'), 'recipe', 'recipes') ?? count(number(row, 'gatheringNodes'), 'gathering node', 'gathering nodes') ?? text(row, 'automatic')]);
      case 'races': return present([text(row, 'start') && `Starts in ${text(row, 'start')}`, count(number(row, 'classes'), 'class', 'classes'), count(number(row, 'adventurers'), 'adventurer', 'adventurers')]);
      case 'factions': return present([text(row, 'startingStance') && `Starting standing: ${text(row, 'startingStance')}`, count(number(row, 'members'), 'NPC', 'NPCs'), text(row, 'shownInReputation')]);
      case 'properties': return present([text(row, 'place') && `In ${text(row, 'place')}`]);
      default: return [];
    }
  }
  const price = (row: ListRow, key: 'price' | 'income') => number(row, key) === null ? null : `${formatNumber(number(row, key)!)}${text(row, `${key}Currency`) ? ` ${text(row, `${key}Currency`)}` : ''}`;
  $: rows = list.rows.filter((row) => row.ref.name.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())).sort((a, b) => a.ref.name.localeCompare(b.ref.name));
  $: groups = kind.kind === 'skills'
    ? ['Crafting', 'Gathering', 'Weapon', 'Other'].map((label) => ({ label, rows: rows.filter((row) => (text(row, 'type') ?? 'Other') === label) })).filter((group) => group.rows.length)
    : [{ label: '', rows }];
</script>

<div class="search-row"><input type="search" aria-label={`Filter ${kind.plural} by Name`} placeholder={`Filter ${kind.plural} by Name`} bind:value={query} /></div>
<p class="count" aria-live="polite"><strong>{formatNumber(rows.length)}</strong>{#if rows.length !== list.rows.length}{' of '}{formatNumber(list.rows.length)}{/if} {rows.length === 1 ? kind.label : kind.plural}</p>
{#each groups as group}
  <section class="group" aria-label={group.label || kind.plural}>
    {#if group.label}<h2>{group.label}</h2>{/if}
    <ul class:portraits={kind.kind === 'classes' || kind.kind === 'races'} class:topics={kind.kind === 'mechanics'} class:properties={kind.kind === 'properties'}>
      {#each group.rows as row (row.ref.key)}
        <li><OverviewTile ref={row.ref} {registry} facts={facts(row)}
          description={kind.kind === 'classes' ? openingSentence(text(row, 'description')) : kind.kind === 'mechanics' ? text(row, 'description') : null}
          metrics={kind.kind === 'properties' ? [{ label: 'Price', value: price(row, 'price') }, { label: 'Income', value: price(row, 'income'), detail: number(row, 'incomeInterval') === null ? undefined : `Every ${intervalText(number(row, 'incomeInterval')!)}` }] : []}
          variant={kind.kind === 'classes' || kind.kind === 'races' ? 'class' : kind.kind === 'mechanics' ? 'editorial' : kind.kind === 'properties' ? 'property' : 'compact'} /></li>
      {/each}
    </ul>
  </section>
{/each}
{#if rows.length === 0}<p class="c-empty">No {kind.plural.toLocaleLowerCase()} match this name.</p>{/if}

<style>
  .search-row { margin-bottom: .75rem; }
  input { width: 100%; min-height: 2.35rem; padding: .4rem .6rem; border: 1px solid var(--c-line-strong); border-radius: var(--c-radius-sm); background: var(--c-surface-sunken); color: var(--c-text); }
  input:focus-visible { outline: 2px solid var(--c-accent); outline-offset: 2px; }
  .count { margin: 0 0 1rem; color: var(--c-text-dim); font-size: var(--c-text-small); }
  .count strong { color: var(--c-text); font-variant-numeric: tabular-nums; }
  .group + .group { margin-top: 2rem; }
  h2 { margin: 0 0 .85rem; color: var(--c-text-strong); font: 600 1.3rem/1.3 var(--c-serif); }
  ul { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: .75rem; list-style: none; padding: 0; margin: 0; }
  ul.portraits { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  li { min-width: 0; }
  @media (max-width: 740px) { ul, ul.portraits { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
  @media (max-width: 390px) { ul.properties { grid-template-columns: minmax(0, 1fr); } }
</style>
