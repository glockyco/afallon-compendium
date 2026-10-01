<script lang="ts">
  import type { CreatureRow, PlacementGroup, PublicKindEntry } from '@afallon/contracts/public';
  import EntityLink from '../../EntityLink.svelte';
  import MissingValue from '../../MissingValue.svelte';
  import NpcLevel from '../../NpcLevel.svelte';
  import { levelText, nameOf, roleLabel } from '../../format';
  import { entityOnMap, placeOnMap } from '../../map-links';
  import { planColumns, shownRowCount, type RelationColumn } from '../relation-table';
  import RelationTable from '../RelationTable.svelte';
  import Section from '../Section.svelte';

  export let id: string;
  export let title: string;
  export let rows: CreatureRow[];
  export let registry: PublicKindEntry[];
  export let services: PlacementGroup[] = [];
  export let placeKey: string | undefined = undefined;
  let expanded = false;
  $: orderedBosses = [...rows].sort((left, right) => nameOf(left.counterpart).localeCompare(nameOf(right.counterpart)));
  $: shownBosses = orderedBosses.slice(0, shownRowCount(orderedBosses.length, expanded));

  const columns: RelationColumn<CreatureRow>[] = [
    { id: 'name', label: 'Creature', value: (row) => nameOf(row.counterpart), sort: (row) => nameOf(row.counterpart) },
    { id: 'level', label: 'Level', numeric: true, value: (row) => row.level ? levelText(row.level) + (row.level.scales ? '*' : '') : undefined, sort: (row) => row.level?.min },
    { id: 'role', label: 'Role', value: (row) => row.roles.map(roleLabel).join(', ') || undefined },
    { id: 'spots', label: 'Map spots', numeric: true, value: (row) => row.placementCount, sort: (row) => row.placementCount },
  ];

  $: plan = planColumns(columns.filter((column) => id === 'npcs' ? column.id !== 'level' : true).map((column) => column.id === 'name' ? { ...column, label: id === 'npcs' ? 'NPC' : 'Creature' } : column), rows);
</script>

{#if rows.length || services.length}
  <Section {id} {title} count={rows.length + services.length}>
    {#if id === 'bosses'}
      <div class="boss-cards">
        {#each shownBosses as row}
          <article class="boss-card">
            <EntityLink ref={row.counterpart} {registry} />
            {#if row.level}<p>Level <NpcLevel level={row.level} /></p>{/if}
            {#if row.placementCount && row.counterpart.key}<a class="c-link" href={entityOnMap(row.counterpart.key)}>{row.placementCount} {row.placementCount === 1 ? 'spot' : 'spots'} on map</a>{/if}
          </article>
        {/each}
      </div>
      {#if shownBosses.length < orderedBosses.length}<button type="button" class="c-action more" on:click={() => (expanded = true)}>Show {orderedBosses.length - shownBosses.length} more</button>{/if}
    {:else if rows.length}<RelationTable columns={plan.columns} {rows} label={title} sort={{ id: 'name', dir: 'asc' }}>
      <svelte:fragment slot="cell" let:row let:column>
        {#if column === 'name'}<EntityLink ref={row.counterpart} {registry} />
        {:else if column === 'level'}<NpcLevel level={row.level} />
        {:else if column === 'role'}{row.roles.map(roleLabel).join(', ')}
        {:else if column === 'spots'}
          {#if row.placementCount && row.counterpart.key}<a class="c-link" href={entityOnMap(row.counterpart.key)}>{row.placementCount} {row.placementCount === 1 ? 'spot' : 'spots'}</a>
          {:else if row.placementCount}{row.placementCount}
          {:else}<MissingValue explanation="No spot is published" />{/if}
        {/if}
      </svelte:fragment>
    </RelationTable>{/if}
    {#if services.length}
      <div class="services">
        <ul>{#each services as service}<li><span>{roleLabel(service.category)}</span>{#if placeKey}<a class="c-link" href={placeOnMap(placeKey, service.category)}>{service.placementCount} {service.placementCount === 1 ? 'spot' : 'spots'} on map</a>{:else}<span>{service.placementCount} {service.placementCount === 1 ? 'spot' : 'spots'}</span>{/if}</li>{/each}</ul>
      </div>
    {/if}
  </Section>
{/if}

<style>
  .boss-cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 9.5rem), 1fr)); gap: .75rem; }
  .boss-card { min-width: 0; padding: .85rem; border: 1px solid var(--c-line-soft); border-radius: var(--c-radius); background: var(--c-surface-1); }
  .boss-card :global(.entity-link) { display: flex; flex-direction: column; align-items: flex-start; gap: .6rem; font-size: 1rem; font-weight: 600; }
  .boss-card :global(.entity-link img) { display: block; width: min(100%, 8rem); height: 8rem; margin: 0; border-radius: .4rem; object-fit: cover; }
  .boss-card :global(.entity-link .kind-icon) { width: 3.5rem; height: 3.5rem; margin: 0; }
  .boss-card p { margin: .55rem 0 .4rem; color: var(--c-text-dim); font-size: var(--c-text-small); }
  .boss-card > a { font-size: var(--c-text-small); }
  .more { margin-top: .75rem; }
  .services { margin-top: 1rem; }
  .services ul { display: grid; gap: .5rem; margin: 0; padding: 0; list-style: none; }
  .services li { display: flex; justify-content: space-between; gap: 1rem; padding: .5rem .75rem; border-bottom: 1px solid var(--c-line-soft); }
</style>
