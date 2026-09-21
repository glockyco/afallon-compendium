<script lang="ts">
  import { base } from '$app/paths';
  import type { PlacementGroup, PublicKindEntry, PublicPlace } from '@afallon/contracts/public';
  import Card from './Card.svelte';
  import DataTable, { type TableColumn } from './DataTable.svelte';
  import EntityHeader, { type HeaderBadge, type HeaderFact } from './EntityHeader.svelte';
  import EntityLink from './EntityLink.svelte';
  import Fact from './Fact.svelte';
  import FactGrid from './FactGrid.svelte';
  import LocationLinks from './LocationLinks.svelte';
  import MissingValue from './MissingValue.svelte';
  import RefList from './RefList.svelte';
  import { connectionLabel, labelOf, roleLabel } from './format';

  export let document: PublicPlace;
  export let registry: PublicKindEntry[];
  export let mapSpaceLabels: Readonly<Record<string, string>> = {};
  export let showRelations = false;
  export let limit: number | undefined = undefined;

  const creatureColumns: TableColumn[] = [
    { id: 'name', label: 'Creature' },
    { id: 'level', label: 'Level', numeric: true },
    { id: 'roles', label: 'Roles' },
    { id: 'locations', label: 'Locations', numeric: true },
  ];
  const npcColumns: TableColumn[] = [
    { id: 'name', label: 'NPC' },
    { id: 'roles', label: 'Role' },
    { id: 'locations', label: 'Locations', numeric: true },
  ];
  $: connectionColumns = [
    { id: 'name', label: 'Place' },
    { id: 'kind', label: 'Connection' },
    ...(connectionLocations ? [{ id: 'locations', label: 'Locations' }] : []),
  ] satisfies TableColumn[];
  $: connectionLocations = document.connections.some((connection) => connection.placements.length > 0);

  $: facts = document.facts;
  $: mapSpaceLabel = document.space ? mapSpaceLabels[document.space.mapSpaceId] : undefined;
  $: badges = [
    { label: labelOf(facts.placeType) },
    ...(facts.guideIncluded ? [{ label: 'Guide entry', tone: 'accent' as const }] : []),
  ] satisfies HeaderBadge[];
  $: headerFacts = [
    ...(facts.levelRange ? [{ label: 'Level', value: `${facts.levelRange.min}–${facts.levelRange.max}` }] : []),
    ...(mapSpaceLabel ? [{ label: 'Map space', value: mapSpaceLabel }] : []),
  ] satisfies HeaderFact[];
  $: placementGroups = [
    { title: 'Services', groups: document.services },
    { title: 'Resources', groups: document.resources },
    { title: 'Containers', groups: document.containers },
  ].filter((entry) => entry.groups.length > 0) as { title: string; groups: PlacementGroup[] }[];

  function visible<T>(rows: T[]): T[] {
    return limit === undefined ? rows : rows.slice(0, limit);
  }
</script>

<article class="document">
  <EntityHeader
    name={document.ref.name}
    art={document.art.artwork ?? document.art.icon ?? document.ref.icon}
    artRole="artwork"
    fallbackIcon={registry.find((entry) => entry.kind === 'places')?.icon}
    {badges}
    facts={headerFacts}
    description={document.description}
    atlasHref={document.space ? `${base}/?place=${encodeURIComponent(document.ref.key)}` : undefined}
    atlasLabel="View the map space"
  />

  <div class="c-stack">
    {#if document.parent || document.space?.regionIds.length}
      <div class="c-card-grid">
        <Card title="Facts">
          <FactGrid>
            {#if document.parent}<Fact label="Part of"><EntityLink ref={document.parent} {registry} /></Fact>{/if}
            {#if document.space?.regionIds.length}<Fact label="Outlined areas">{document.space.regionIds.length}</Fact>{/if}
          </FactGrid>
        </Card>
      </div>
    {/if}

    {#if showRelations}
      <RefList title="Bosses" refs={document.bosses} {registry} {limit} />

      {#if document.creatures.length}
        <Card title="Creatures" count={document.creatures.length}>
          <DataTable columns={creatureColumns}>
            {#each visible(document.creatures) as creature}
              <tr>
                <td><EntityLink ref={creature.counterpart} {registry} /></td>
                <td class="c-num">{#if creature.levelRange}{creature.levelRange.min}–{creature.levelRange.max}{:else}<MissingValue explanation="Not measured for this build" />{/if}</td>
                <td>{creature.roles.map(roleLabel).join(', ')}</td>
                <td class="c-num">{#if creature.placementCount === 0}<MissingValue explanation="No location is published" />{:else if creature.counterpart.key}<a class="c-link" href={`${base}/?entity=${encodeURIComponent(creature.counterpart.key)}`}>{creature.placementCount}</a>{:else}{creature.placementCount}{/if}</td>
              </tr>
            {/each}
          </DataTable>
        </Card>
      {/if}

      {#if document.npcs.length}
        <Card title="NPCs and services" count={document.npcs.length}>
          <DataTable columns={npcColumns}>
            {#each visible(document.npcs) as npc}
              <tr>
                <td><EntityLink ref={npc.counterpart} {registry} /></td>
                <td>{npc.roles.map(roleLabel).join(', ')}</td>
                <td class="c-num">{#if npc.placementCount === 0}<MissingValue explanation="No location is published" />{:else if npc.counterpart.key}<a class="c-link" href={`${base}/?entity=${encodeURIComponent(npc.counterpart.key)}`}>{npc.placementCount}</a>{:else}{npc.placementCount}{/if}</td>
              </tr>
            {/each}
          </DataTable>
        </Card>
      {/if}

      {#if placementGroups.length}
        <div class="c-card-grid">
          {#each placementGroups as group}
            <Card title={group.title} count={group.groups.length}>
              <ul class="groups">
                {#each visible(group.groups) as placementGroup}
                  <li><a class="c-link" href={`${base}/?categories=${encodeURIComponent(placementGroup.category)}`}>{roleLabel(placementGroup.category)}</a><span class="count">{placementGroup.placementCount}</span></li>
                {/each}
              </ul>
            </Card>
          {/each}
        </div>
      {/if}

      <RefList title="Quests" refs={document.quests} {registry} {limit} />
      <RefList title="Properties" refs={document.properties} {registry} {limit} />
      <RefList title="Regions" refs={document.regions} {registry} {limit} />

      {#if document.connections.length}
        <Card title="Connections" count={document.connections.length}>
          <DataTable columns={connectionColumns}>
            {#each visible(document.connections) as connection}
              <tr>
                <td><EntityLink ref={connection.counterpart} {registry} /></td>
                <td>{connectionLabel(connection.kind)}</td>
                {#if connectionLocations}<td><LocationLinks placements={connection.placements} /></td>{/if}
              </tr>
            {/each}
          </DataTable>
        </Card>
      {/if}
    {/if}
  </div>
</article>

<style>
  .groups { display: grid; gap: .4rem; margin: 0; padding: 0; list-style: none; }
  .groups li { display: flex; align-items: baseline; justify-content: space-between; gap: .75rem; padding: .4rem .6rem; border: 1px solid var(--c-line); border-radius: var(--c-radius-sm); background: var(--c-surface-2); font-size: .82rem; }
  .count { color: #f3eee2; font-variant-numeric: tabular-nums; font-weight: 600; }
</style>
