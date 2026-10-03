<script lang="ts">
  import { base } from '$app/paths';
  import type { NpcFlights, PublicKindEntry } from '@afallon/contracts/public';
  import { nameOf } from '../../format';
  import FlightStopLink from '../FlightStopLink.svelte';
  import { planColumns, type RelationColumn } from '../relation-table';
  import RelationTable from '../RelationTable.svelte';

  export let flights: NpcFlights[];
  export let registry: PublicKindEntry[];
  type Destination = NpcFlights['destinations'][number];
  const columns: RelationColumn<Destination>[] = [
    { id: 'destination', label: 'Destination', value: (row) => row.destination.name, sort: (row) => row.destination.name },
    { id: 'route', label: 'Route', value: (row) => row.direct ? 'Direct' : 'Via a connection' },
    { id: 'fare', label: 'Fare', numeric: true, value: (row) => row.fare === undefined ? undefined : `${row.fare} ${row.currency ? nameOf(row.currency) : ''}`, sort: (row) => row.fare },
  ];
</script>

<div class="c-stack">
  {#each flights as flight (flight.stop.id)}
    {@const free = flight.destinations.length > 0 && flight.destinations.every((route) => route.fare === 0 && !route.currency)}
    {@const planned = planColumns(columns.filter((column) => column.id !== 'fare' || !free), flight.destinations)}
    <div class="c-stack">
      <p>Depart from <strong>{flight.stop.name}</strong>.{#if free}{' '}All destinations from this stop are free.{/if}{' '}{flight.stop.knownInitially ? 'This stop is known at the start.' : 'Talk to this flight master to discover the stop.'}</p>
      {#if flight.destinations.length}
        <RelationTable columns={planned.columns} rows={flight.destinations} label={`Flights from ${flight.stop.name}`}>
          <svelte:fragment slot="cell" let:row let:column>
            {#if column === 'destination'}<FlightStopLink stop={row.destination} {registry} />
            {:else if column === 'route'}{row.direct ? 'Direct' : 'Via a connection'}
            {:else if row.fare !== undefined}{row.fare}{#if row.currency}{' '}{nameOf(row.currency)}{/if}
            {:else}Fare depends on the connection{/if}
          </svelte:fragment>
        </RelationTable>
      {/if}
    </div>
  {/each}
  <p>Travel time depends on the flight path and each route's speed. The game shows the time remaining during the flight.</p>
  <a class="c-link" href={`${base}/mechanics/travel/`}>Explore the Full Flight Network</a>
</div>
