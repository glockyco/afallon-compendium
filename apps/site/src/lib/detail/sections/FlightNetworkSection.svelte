<script lang="ts">
  import type { FlightNetwork, PublicKindEntry } from '@afallon/contracts/public';
  import { categoryLabel } from '@afallon/contracts/public';
  import { nameOf } from '../../format';
  import LinkGrid from '../LinkGrid.svelte';
  import { omitAlways, planColumns, type RelationColumn } from '../relation-table';
  import RelationTable from '../RelationTable.svelte';
  import FlightStopLink from '../FlightStopLink.svelte';

  export let networks: FlightNetwork[];
  export let registry: PublicKindEntry[];
  type Route = FlightNetwork['routes'][number] & { origin: FlightNetwork['stops'][number]; destination: FlightNetwork['stops'][number] };
  const columns: RelationColumn<Route>[] = [
    { id: 'from', label: 'From', value: (row) => row.origin.name, sort: (row) => row.origin.name },
    { id: 'to', label: 'To', value: (row) => row.destination.name, sort: (row) => row.destination.name },
    { id: 'direction', label: 'Direction', value: (row) => row.bidirectional ? 'Both directions' : 'One way', whenShared: omitAlways },
    { id: 'fare', label: 'Fare', numeric: true, value: (row) => `${row.fare} ${row.currency ? nameOf(row.currency) : ''}`, sort: (row) => row.fare },
  ];
  function routesOf(network: FlightNetwork): Route[] {
    const stops = new Map(network.stops.map((stop) => [stop.id, stop]));
    return network.routes.flatMap((route) => {
      const origin = stops.get(route.from), destination = stops.get(route.to);
      return origin && destination ? [{ ...route, origin, destination }] : [];
    });
  }
</script>

{#each networks as network (`${network.id}:${network.scene}`)}
  {@const routes = routesOf(network)}
  {@const allFree = routes.length > 0 && routes.every((route) => route.fare === 0 && !route.currency)}
  {@const allInitiallyKnown = network.stops.every((stop) => stop.knownInitially)}
  {@const sharedDirection = routes.length > 0 && routes.every((route) => route.bidirectional) ? 'All direct routes work both ways.' : routes.length > 0 && routes.every((route) => !route.bidirectional) ? 'All direct routes run one way.' : ''}
  {@const planned = planColumns(columns.filter((column) => column.id !== 'fare' || !allFree), routes)}
  <section class="network c-stack" aria-label={`${categoryLabel(network.scene)} flight network`}>
    <h3>{categoryLabel(network.scene)}</h3>
    <p>{allInitiallyKnown ? 'All stops are known at the start.' : 'Talk to a flight master to discover a stop.'} {#if allFree}Flights on this network are free.{/if} {sharedDirection}</p>
    <h4>Flight stops</h4>
    <LinkGrid refs={network.stops.map((stop) => stop.master?.key !== null && stop.master ? { ...stop.master, name: stop.name } : { key: null, label: stop.name })} {registry} />
    {#if routes.length}
      <h4>Direct routes</h4>
      <RelationTable columns={planned.columns} rows={routes} label={`Direct routes in ${categoryLabel(network.scene)}`}>
        <svelte:fragment slot="cell" let:row let:column>
          {#if column === 'from'}<FlightStopLink stop={row.origin} {registry} />
          {:else if column === 'to'}<FlightStopLink stop={row.destination} {registry} />
          {:else if column === 'direction'}{row.bidirectional ? 'Both directions' : 'One way'}
          {:else}{row.fare}{#if row.currency}{' '}{nameOf(row.currency)}{/if}{/if}
        </svelte:fragment>
      </RelationTable>
    {/if}
  </section>
{/each}

<style>
  .network + .network { margin-top: 2rem; }
  h3 { font: 600 1.15rem/1.3 var(--c-serif); color: var(--c-text-strong); }
  h4 { color: var(--c-text-strong); font-size: var(--c-text-small); font-weight: 700; }
  p { color: var(--c-text-dim); }
</style>
