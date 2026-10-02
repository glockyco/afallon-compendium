<script lang="ts">
  import type { PlacementRef, PublicKindEntry, PublicPlace } from '@afallon/contracts/public';
  import EntityLink from '../../EntityLink.svelte';
  import { formatNumber, listText, nameOf, roleLabel, timerText } from '../../format';
  import { placeOnMap, spotOnMap } from '../../map-links';
  import FactList from '../FactList.svelte';
  import FactRow from '../FactRow.svelte';
  import HowItWorks from '../HowItWorks.svelte';

  export let document: PublicPlace;
  export let registry: PublicKindEntry[];

  $: start = document.challengeStoneStart;
  $: timed = document.timedDungeon;
  $: gettingThere = document.startingRaces.length > 0 || start !== undefined || document.entrances.length > 0 || document.dungeonFinder !== undefined;
  // Services a player looks for first lead, and crafting stations follow.
  const SERVICE_ORDER = ['banker', 'auctioneer', 'flightPoint', 'merchant', 'questGiver', 'craftingStation', 'alchemyStation', 'cookingStation', 'furnace', 'smithingStation', 'tailoringStation'];
  $: services = [...document.services].sort((left, right) => SERVICE_ORDER.indexOf(left.category) - SERVICE_ORDER.indexOf(right.category));
  const levels = (count: number) => `${formatNumber(count)} ${count === 1 ? 'level' : 'levels'}`;
</script>

{#snippet spotLinks(placements: PlacementRef[], name: string)}
  {#if placements.length === 1}<a class="c-link" href={spotOnMap(placements[0]!.placementId)} aria-label={`Show the entrance in ${name} on the map`}>Show on map</a>
  {:else if placements.length > 1}<span class="spots">{#each placements as placement, index}<a class="c-link" href={spotOnMap(placement.placementId)} aria-label={`Show entrance ${index + 1} in ${name} on the map`}>Entrance {index + 1}</a>{/each}</span>{/if}
{/snippet}

{#if gettingThere}
  <div class="side-card" id="getting-there">
    <h2>Getting there</h2>
    <ul>
      {#if document.startingRaces.length}
        <li>{document.allPlayableRacesStartHere ? 'New characters start here.' : `New ${listText(document.startingRaces.map((race) => race.name))} characters start here.`}</li>
      {/if}
      {#if start}<li>Start at <a class="c-link" href={spotOnMap(start.spot.placementId)}>a challenge stone in {start.regionName}</a> with {formatNumber(start.count)} <EntityLink ref={start.heart} {registry} />.</li>{/if}
      {#each document.entrances as entrance}
        <li class="entrance"><span>{entrance.placements.length > 1 ? `${formatNumber(entrance.placements.length)} entrances` : 'Entrance'} in <EntityLink ref={entrance.place} {registry} /></span>{@render spotLinks(entrance.placements, nameOf(entrance.place))}</li>
      {/each}
      {#if document.dungeonFinder}
        <li>The Dungeon Finder can also send you here. Choose this dungeon, or queue for a Random run that can pick it.{#if document.dungeonFinder.supplyPack}{' '}Only a finished Random run gives an <EntityLink ref={document.dungeonFinder.supplyPack} {registry} />.{/if}</li>
      {/if}
    </ul>
  </div>
{/if}

{#if timed}
  <div class="side-card" id="timed-dungeon">
    <h2>Timed dungeon</h2>
    <FactList>
      {#if timed.totalSeconds !== undefined}<FactRow label="Timer">{timerText(timed.totalSeconds)}</FactRow>{/if}
      {#if timed.altars.length}<FactRow label="Altar of Corruption"><a class="c-link" href={spotOnMap(timed.altars[0]!.placementId)}>Show on map</a></FactRow>{/if}
    </FactList>
    <ul>
      {#each timed.thresholds as threshold}<li>Defeat the last boss with {timerText(threshold.remainingSeconds)} left and the reward token gains {levels(threshold.tokenLevels)}.</li>{/each}
      {#if timed.maxLootItems !== undefined}<li>The reward bag holds {#if timed.token}a <EntityLink ref={timed.token} {registry} /> and{/if} up to {formatNumber(timed.maxLootItems)} other {timed.maxLootItems === 1 ? 'item' : 'items'}.</li>{/if}
    </ul>
    <HowItWorks guide={timed.guide} section="timed-dungeons" label="How timed dungeons work" />
  </div>
{/if}

{#if services.length}
  <div class="side-card" id="services">
    <h2>Services</h2>
    <FactList>
      {#each services as service}
        <FactRow label={roleLabel(service.category)}>{#if document.space}<a class="c-link" href={placeOnMap(document.ref.key, service.category)}>{formatNumber(service.placementCount)} on map</a>{:else}{formatNumber(service.placementCount)}{/if}</FactRow>
      {/each}
    </FactList>
  </div>
{/if}

<style>
  .side-card { display: grid; gap: .75rem; padding: 1rem; border: 1px solid var(--c-line-soft); border-radius: var(--c-radius); background: var(--c-surface-1); }
  h2 { margin: 0; font-size: 1rem; }
  ul { display: grid; gap: .65rem; margin: 0; padding: 0; list-style: none; line-height: 1.5; }
  li + li { padding-top: .65rem; border-top: 1px solid var(--c-line-soft); }
  .entrance { display: flex; flex-wrap: wrap; justify-content: space-between; gap: .25rem .75rem; }
  .spots { display: flex; flex-wrap: wrap; gap: .25rem .65rem; }
  .side-card :global(.fact-list dl) { grid-template-columns: max-content minmax(0, 1fr); gap: .35rem .75rem; }
  .side-card :global(.fact-row dd) { text-align: right; }
</style>
