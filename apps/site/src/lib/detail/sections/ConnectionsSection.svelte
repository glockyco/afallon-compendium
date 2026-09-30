<script lang="ts">
  import type { ConnectionRow, PublicKindEntry } from '@afallon/contracts/public';
  import EntityLink from '../../EntityLink.svelte';
  import { nameOf } from '../../format';
  import { spotOnMap } from '../../map-links';
  import { placeConnectionRows, type PlaceConnectionRow } from '../place-rows';
  import Section from '../Section.svelte';

  export let connections: ConnectionRow[];
  export let registry: PublicKindEntry[];
  export let compact = false;

  const ORDER: Record<PlaceConnectionRow['direction'], number> = { to: 0, from: 1, within: 2 };
  $: rows = placeConnectionRows(connections).sort((left, right) => ORDER[left.direction] - ORDER[right.direction] || nameOf(left.counterpart).localeCompare(nameOf(right.counterpart)));
</script>

{#snippet connectionList()}
  <ul class="connections">
    {#each rows as row}
      <li>
        <div class="destination">
          <span>{row.direction === 'within' ? 'Within' : row.direction === 'to' ? 'To' : 'From'}</span>
          {#if row.direction === 'within'}this place
          {:else}<EntityLink ref={row.counterpart} {registry} truncate />{/if}
          {#if row.placements.length}<span class="count">{row.placements.length} {row.placements.length === 1 ? 'spot' : 'spots'}</span>{/if}
        </div>
        {#if row.placements.length}
          <div class="map-spots">{#each row.placements as placement, index}<a class="c-link" href={spotOnMap(placement.placementId)} aria-label={`${row.direction === 'from' ? 'From' : 'To'} ${nameOf(row.counterpart)}, source spot ${index + 1} on map`}>{row.placements.length === 1 ? 'Show source on map' : `Spot ${index + 1}`}</a>{/each}</div>
        {/if}
      </li>
    {/each}
  </ul>
{/snippet}

{#if rows.length}
  {#if compact}<div class="side-card" id="connections"><h2>Connections</h2>{@render connectionList()}</div>
  {:else}<Section id="connections" title="Connections" count={rows.length}>{@render connectionList()}</Section>{/if}
{/if}

<style>
  .side-card { padding: 1rem; border: 1px solid var(--c-line-soft); border-radius: var(--c-radius); background: var(--c-surface-1); }
  h2 { margin: 0 0 .75rem; font-size: 1rem; }
  /* `minmax(0, 1fr)` lets a row be narrower than its one-line content, so a long name truncates instead of overflowing. */
  .connections { display: grid; grid-template-columns: minmax(0, 1fr); gap: .7rem; margin: 0; padding: 0; list-style: none; }
  li + li { padding-top: .7rem; border-top: 1px solid var(--c-line-soft); }
  /* One line per connection: the direction and count keep their width, and a long place name ends in an ellipsis. */
  .destination { display: flex; align-items: center; gap: .35rem; min-width: 0; white-space: nowrap; }
  .destination > span:first-child, .count { flex: none; color: var(--c-text-dim); }
  .count { margin-left: auto; padding-left: .5rem; font-size: var(--c-text-small); }
  .map-spots { display: flex; flex-wrap: wrap; gap: .25rem .65rem; margin-top: .25rem; font-size: var(--c-text-small); }
</style>
