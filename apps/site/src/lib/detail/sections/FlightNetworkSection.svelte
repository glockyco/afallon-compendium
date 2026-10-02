<script lang="ts">
  import type { FlightNetwork } from '@afallon/contracts/public';
  import { categoryLabel } from '@afallon/contracts/public';
  import FlightStopLink from '../FlightStopLink.svelte';
  export let networks: FlightNetwork[];
</script>

{#each networks as network (`${network.id}:${network.scene}`)}
  {@const allKnown = network.stops.every((stop) => stop.knownInitially)}
  <div class="network c-stack">
    <h3>{categoryLabel(network.scene)}</h3>
    {#if allKnown}<p class="initial-note">All stops are known at the start.</p>{/if}
    {#if network.routes.length > 0 && network.routes.every((route) => route.fare === 0 && !route.currency)}
      <p class="initial-note">Every recorded route has a fare of 0. No currency is recorded for this network.</p>
    {/if}
    <div class="stops">
      {#each network.stops as stop (stop.id)}
        <div class="stop"><FlightStopLink {stop} />{#if stop.knownInitially && !allKnown}<span class="initial">Known at the start</span>{/if}</div>
      {/each}
    </div>
    <div class="routes">
      <table>
        <caption>Routes in {categoryLabel(network.scene)}</caption>
        <thead><tr><th scope="col">From</th><th scope="col">To</th><th scope="col">Fare</th></tr></thead>
        <tbody>
          {#each network.routes as route (`${route.from}:${route.to}`)}
            <tr>
              <td><FlightStopLink stop={network.stops.find((stop) => stop.id === route.from)!} /></td>
              <td><FlightStopLink stop={network.stops.find((stop) => stop.id === route.to)!} />{#if route.bidirectional}<span class="return">Both directions</span>{/if}</td>
              <td>{route.fare}{#if route.currency}{' '}{route.currency.key !== null ? route.currency.name : route.currency.label}{/if}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </div>
{/each}

<style>
  .network + .network { margin-top: 2rem; }
  h3 { font: 600 1.15rem/1.3 var(--c-serif); color: var(--c-text-strong); }
  .initial-note { color: var(--c-text-dim); font-size: var(--c-text-small); }
  .stops { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 13rem), 1fr)); gap: .5rem; }
  .stop { min-width: 0; display: flex; flex-wrap: wrap; align-items: baseline; gap: .15rem .5rem; padding: .65rem .8rem; border: 1px solid var(--c-line-soft); border-radius: var(--c-radius); background: var(--c-surface-1); }
  .initial, .return { color: var(--c-text-dim); font-size: var(--c-text-small); }
  .routes { overflow-x: auto; }
  table { width: 100%; border-collapse: collapse; text-align: left; }
  caption { text-align: left; color: var(--c-text-dim); font-size: var(--c-text-small); padding: .5rem 0; }
  th, td { padding: .7rem .6rem; border-bottom: 1px solid var(--c-line-soft); vertical-align: top; }
  th:last-child, td:last-child { text-align: right; white-space: nowrap; }
  .return { display: block; }
  @media (max-width: 460px) { th, td { padding: .6rem .3rem; } }
</style>
