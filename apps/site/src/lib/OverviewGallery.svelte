<script lang="ts">
  import type { ListRow, PublicKindEntry, StaticKindList } from '@afallon/contracts/public';
  import { formatNumber } from './format';
  import ListSearchCount from './ListSearchCount.svelte';
  import OverviewTile from './OverviewTile.svelte';

  export let list: StaticKindList;
  export let kind: PublicKindEntry;
  export let registry: PublicKindEntry[];
  let query = '';

  const number = (row: ListRow, key: string): number | null => typeof row.values[key] === 'number' ? row.values[key] as number : null;
  $: raceClassesVary = list.rows.some((row) => row.values.classes !== list.rows[0]?.values.classes);
  const text = (row: ListRow, key: string): string | null => typeof row.values[key] === 'string' ? row.values[key] as string : null;
  const count = (value: number | null, singular: string, plural: string) => value === null ? null : `${formatNumber(value)} ${value === 1 ? singular : plural}`;
  const present = (values: Array<string | null>): string[] => values.filter((value): value is string => value !== null);
  const openingSentence = (value: string | null): string | null => value?.match(/^.*?[.!?](?=\s|$)/s)?.[0] ?? value;
  function facts(row: ListRow): string[] {
    switch (kind.kind) {
      case 'classes': return present([count(number(row, 'talentTrees'), 'talent tree', 'talent trees'), count(number(row, 'abilities'), 'ability', 'abilities')]);
      case 'skills': return present([number(row, 'highestLevel') === null ? null : `Max level ${formatNumber(number(row, 'highestLevel')!)}`,
        count(number(row, 'recipes'), 'recipe', 'recipes') ?? count(number(row, 'gatheringNodes'), 'node', 'nodes') ?? (text(row, 'automatic') ? 'Starts learned' : null)]);
      case 'races': return present([text(row, 'start') && `Starts in ${text(row, 'start')}`, raceClassesVary ? count(number(row, 'classes'), 'class', 'classes') : null, count(number(row, 'adventurers'), 'adventurer', 'adventurers')]);
      case 'factions': return present([text(row, 'startingStance') && `Starts ${text(row, 'startingStance')!.toLocaleLowerCase()}`, count(number(row, 'members'), 'NPC', 'NPCs') ?? 'NPC count unavailable', text(row, 'shownInReputation')]);
      case 'properties': return present([text(row, 'place') && `In ${text(row, 'place')}`]);
      default: return [];
    }
  }
  $: rows = list.rows.filter((row) => row.ref.name.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())).sort((a, b) => a.ref.name.localeCompare(b.ref.name));
  $: groups = kind.kind === 'skills'
    ? ['Crafting', 'Gathering', 'Weapon', 'Other'].map((label) => ({ label, rows: rows.filter((row) => (text(row, 'type') ?? 'Other') === label) })).filter((group) => group.rows.length)
    : [{ label: '', rows }];
</script>

<ListSearchCount {kind} {query} count={rows.length} total={list.rows.length} onQuery={(value) => (query = value)} />
{#each groups as group}
  <section class="group" aria-label={group.label || kind.plural}>
    {#if group.label}<h2>{group.label}</h2>{/if}
    <ul class:portraits={kind.kind === 'classes' || kind.kind === 'races'} class:races={kind.kind === 'races'} class:topics={kind.kind === 'mechanics'} class:properties={kind.kind === 'properties'}>
      {#each group.rows as row (row.ref.key)}
        <li><OverviewTile ref={row.ref} {registry} facts={facts(row)} artwork={kind.kind === 'properties' ? row.artwork ?? null : null}
          description={kind.kind === 'classes' ? openingSentence(text(row, 'description')) : kind.kind === 'mechanics' ? text(row, 'description') : null}
          metrics={kind.kind === 'properties' ? [
            { label: 'Price', amount: number(row, 'price'), currency: row.relations?.priceCurrency?.[0] ?? null },
            { label: 'Income', amount: number(row, 'income'), currency: row.relations?.incomeCurrency?.[0] ?? null, interval: number(row, 'incomeInterval') ?? undefined },
          ] : []}
          variant={kind.kind === 'classes' ? 'class' : kind.kind === 'races' || kind.kind === 'factions' ? 'portrait-art' : kind.kind === 'mechanics' ? 'editorial' : kind.kind === 'properties' ? 'property' : 'compact'} /></li>
      {/each}
    </ul>
  </section>
{/each}
{#if rows.length === 0}<p class="c-empty">No {kind.plural.toLocaleLowerCase()} match this name.</p>{/if}

<style>
  .group + .group { margin-top: 2rem; }
  h2 { margin: 0 0 .85rem; color: var(--c-text-strong); font: 600 1.3rem/1.3 var(--c-serif); }
  ul { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: .75rem; list-style: none; padding: 0; margin: 0; }
  ul.portraits { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  ul.races :global(.facts) { display: grid; justify-items: center; gap: .1rem; }
  ul.races :global(.separator) { display: none; }
  li { min-width: 0; }
  @media (max-width: 740px) { ul, ul.portraits { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
  @media (max-width: 640px) { ul.properties, ul.races { grid-template-columns: minmax(0, 1fr); } }
</style>
