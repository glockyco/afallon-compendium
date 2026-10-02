<script lang="ts">
  import type { PlaceToEnter, PublicKindEntry } from '@afallon/contracts/public';
  import EntityLink from '../../EntityLink.svelte';
  import { formatNumber, levelText } from '../../format';
  import { spotOnMap } from '../../map-links';
  import Section from '../Section.svelte';

  export let rows: PlaceToEnter[];
  export let registry: PublicKindEntry[];

  const GROUPS: { group: PlaceToEnter['group']; title: string; spot: string }[] = [
    { group: 'dungeon', title: 'Dungeons', spot: 'Entrance' },
    { group: 'challengeStone', title: 'Challenge stones', spot: 'Stone' },
    { group: 'other', title: 'Caves and other places', spot: 'Entrance' },
  ];
  $: groups = GROUPS.map((entry) => ({ ...entry, rows: rows.filter((row) => row.group === entry.group) })).filter((entry) => entry.rows.length);
</script>

{#if rows.length}
  <Section id="places-to-enter" title="Places to enter" count={rows.length}>
    <div class="groups">
      {#each groups as group}
        <div class="group">
          <h3>{group.title}</h3>
          <ul>
            {#each group.rows as row}
              <li>
                <span class="name"><EntityLink ref={row.place} {registry} /></span>
                {#if row.levelRange}<span class="levels">Levels {levelText(row.levelRange)}</span>{/if}
                <span class="spots">
                  {#if row.placements.length === 1}<a class="c-link" href={spotOnMap(row.placements[0]!.placementId)} aria-label={`Show the ${group.spot.toLowerCase()} of ${row.place.name} on the map`}>Show {group.spot.toLowerCase()}</a>
                  {:else}{#each row.placements as placement, index}<a class="c-link" href={spotOnMap(placement.placementId)} aria-label={`Show ${group.spot.toLowerCase()} ${index + 1} of ${row.place.name} on the map`}>{group.spot} {formatNumber(index + 1)}</a>{/each}{/if}
                </span>
              </li>
            {/each}
          </ul>
        </div>
      {/each}
    </div>
  </Section>
{/if}

<style>
  .groups { display: grid; gap: 1.25rem; }
  h3 { margin: 0 0 .5rem; color: var(--c-text-dim); font-size: var(--c-text-label); font-weight: 700; }
  ul { display: grid; margin: 0; padding: 0; list-style: none; }
  /* Name, levels, and map links share columns across the rows of a group. */
  li { display: grid; grid-template-columns: minmax(0, 1fr) 8rem minmax(9rem, max-content); grid-template-areas: "name levels spots"; align-items: baseline; gap: .25rem 1rem; padding: .55rem 0; border-bottom: 1px solid var(--c-line-soft); }
  .name { grid-area: name; min-width: 0; }
  .levels { grid-area: levels; color: var(--c-text-dim); font-variant-numeric: tabular-nums; }
  .spots { grid-area: spots; display: flex; flex-wrap: wrap; justify-content: flex-end; gap: .25rem .65rem; font-size: var(--c-text-small); }
  /* On a phone the map links stay beside the name, and the levels go below it. */
  @media (max-width: 640px) {
    li { grid-template-columns: minmax(0, 1fr) max-content; grid-template-areas: "name spots" "levels levels"; }
    .levels { font-size: var(--c-text-small); }
  }
</style>
