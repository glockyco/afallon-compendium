<script lang="ts">
  import type { CorruptionGuide, PublicKindEntry } from '@afallon/contracts/public';
  import EntityLink from '../../EntityLink.svelte';
  import { spotOnMap } from '../../map-links';
  import TitleBlock from '../TitleBlock.svelte';
  import Hero from '../Hero.svelte';
  import Section from '../Section.svelte';
  import Sections from '../Sections.svelte';

  export let document: CorruptionGuide;
  export let registry: PublicKindEntry[];
  const format = (value: number) => value.toLocaleString('en-US', { maximumFractionDigits: 2 });
  $: lootLimit = Math.max(0, ...document.dungeons.map((dungeon) => dungeon.maxLootItems ?? 0));
  $: underglow = document.dungeons.find((dungeon) => dungeon.place.name === 'The Underglow');
  $: powerBonus = document.gearStatBonuses?.find((bonus) => bonus.stat.toLowerCase() === 'item power');
  $: healthBonus = document.gearStatBonuses?.find((bonus) => bonus.stat === 'Health');
</script>

<article class="detail-page">
  <TitleBlock name={document.ref.name} {registry} />
  <Hero><p class="c-prose">{document.overview}</p></Hero>
  <Sections>
    <div class="guide-flow">
      <Section id="steps" title="Steps">
        <ol class="steps">
          {#each document.steps as step}
            <li id={`step-${step.id}`}>
              <h3>{step.title}</h3>
              {#if step.id === 'use-the-altar'}
                <p>{step.text} Without a token it raises corruption by +{format(document.nativeRules.altarWithoutTokenIncrement)}. With {#if document.token}a <EntityLink ref={document.token} {registry} />{:else}a token{/if} it adds the token's value and activates its {document.affixesPerToken ?? 'saved'} affixes.{' '}{#if document.maxLevel !== undefined}The dungeon starts at no more than +{format(document.maxLevel)}.{' '}{/if}After a countdown, the dungeon timer starts.</p>
              {:else if step.id === 'read-the-token'}
                <p>{step.text}{#if document.affixesPerToken !== undefined}{' '}New tokens roll up to {format(document.affixesPerToken)} different available affixes.{/if} The token's value is separate from an item's corruption level.</p>
              {:else if step.id === 'face-corrupted-creatures'}
                <p>{step.text} {#if document.mobStatBonuses?.length}{document.mobStatBonuses.map((bonus) => `+${format(bonus.amountPerLevel)}${bonus.isPercent ? '%' : ''} ${bonus.stat}`).join(', ')}.{:else}stat bonuses set by the dungeon.{/if} Affixes add other effects.</p>
                {#if document.affixes?.length}<details class="affix-details"><summary>Dungeon affixes</summary><ul>{#each document.affixes as affix}<li><strong>{affix.name}</strong>{affix.available ? '' : ' (Cannot appear on new tokens)'}: {affix.description}</li>{/each}</ul></details>{/if}
              {:else if step.id === 'finish-the-timer'}
                <p>{step.text} The token in the reward bag is worth the starting level +{format(document.nativeRules.completionFirstBonus)}, +{format(document.nativeRules.completionSecondBonus)}, or +{format(document.nativeRules.completionOtherwiseBonus)}, depending on time left. Timing out gives a token worth the starting level −{format(document.nativeRules.timeoutDecrease)} (at least {format(document.nativeRules.timeoutMinimum)}) and no regular loot. The bag also holds up to {format(lootLimit)} loot rolls{#if underglow?.maxLootItems !== undefined}{' '}({format(underglow.maxLootItems)} in The Underglow){/if}. Equippable items from those rolls carry the dungeon's level.</p>
              {:else if step.id === 'compare-corrupted-gear'}
                <p>{step.text}{#if document.gearAllStatsPercentPerLevel !== undefined}{' '}by +{format(document.gearAllStatsPercentPerLevel)}%{/if}{#if powerBonus}, adds +{format(powerBonus.amountPerLevel)} Item Power{/if}{#if healthBonus}, and adds +{format(healthBonus.amountPerLevel)}% Health on items with a Health stat{/if}. Random stats and gems do not scale. The tooltip shows a green “Corruption +N” line above level zero.{#if document.example}{' '}See <EntityLink ref={document.example.item} {registry} /> in the worked example.{/if} The full damage of a corrupted weapon against an enemy after armor has not been measured.</p>
              {:else if step.id === 'distinguish-the-heart'}
                <p>{#if document.heart}<EntityLink ref={document.heart} {registry} />{:else}The Heart of Corruption{/if} is a separate item used to start challenge stones and as a crafting material. It is different from a token.</p>
                {#if document.heartRequirements?.length}
                  <ul class="stones">{#each document.heartRequirements as requirement}
                    <li><strong>{requirement.regionName ?? requirement.place?.name ?? 'Challenge stone'}</strong> · {#if requirement.spot}<a class="c-link" href={spotOnMap(requirement.spot.placementId)}>{requirement.stoneName ?? 'Stone'} on map</a>{:else}{requirement.stoneName ?? 'Stone'}{/if}: {#if requirement.destinations.length || requirement.unlinkedDestinations?.length}{#each requirement.destinations as destination, index}{#if index}{' · '}{/if}<EntityLink ref={destination} {registry} />{/each}{#each requirement.unlinkedDestinations ?? [] as name, index}{#if index || requirement.destinations.length}{' · '}{/if}{name}{/each}{:else}Destination unknown{/if} ({format(requirement.count)} {requirement.count === 1 ? 'Heart' : 'Hearts'} consumed)</li>
                  {/each}</ul>
                {/if}
              {/if}
            </li>
          {/each}
        </ol>
      </Section>
      <Section id="worked-example" title="Worked example">
        {#if document.example}
          <p><EntityLink ref={document.example.item} {registry} /> has {format(document.example.baseStat)} {document.example.stat} at its base level and {format(document.example.calculatedStat)} at Corruption +{format(document.example.level)}.{#if document.example.basePower !== undefined && document.example.calculatedPower !== undefined}{' '}Its Item Power rises from {format(document.example.basePower)} to {format(document.example.calculatedPower)}.{/if} These are item values before random rolls.</p>
        {:else}<p>No equipment example is available.</p>{/if}
      </Section>
    </div>
    {#if document.dungeons.length}
      <Section id="timed-dungeons" title="Timed dungeons">
        <p>The thresholds are the seconds <strong>left</strong> on the timer when the last boss dies. Maximum loot items is the most regular loot a reward bag can hold besides the token.</p>
        <div class="table-scroll"><table class="timer-table"><thead><tr><th scope="col">Dungeon</th><th scope="col">Timer</th><th scope="col">First threshold</th><th scope="col">Second threshold</th><th scope="col">Maximum loot items</th></tr></thead>
          <tbody>{#each document.dungeons as dungeon}<tr><th scope="row"><EntityLink ref={dungeon.place} {registry} /></th><td data-label="Timer">{dungeon.totalSeconds === undefined ? 'Unavailable' : `${format(dungeon.totalSeconds)} s`}</td><td data-label="First threshold">{dungeon.firstRemainingSeconds === undefined ? 'Unavailable' : `${format(dungeon.firstRemainingSeconds)} s left`}</td><td data-label="Second threshold">{dungeon.secondRemainingSeconds === undefined ? 'Unavailable' : `${format(dungeon.secondRemainingSeconds)} s left`}</td><td data-label="Maximum loot items">{dungeon.maxLootItems === undefined ? 'Unavailable' : format(dungeon.maxLootItems)}</td></tr>{/each}</tbody>
        </table></div>
        <details class="dungeon-associations"><summary>Bosses and reward pools</summary>
          <ul>{#each document.dungeons as dungeon}<li><strong><EntityLink ref={dungeon.place} {registry} /></strong>:
            {#if dungeon.bosses?.length}<span> Bosses: {#each dungeon.bosses as boss, index}{index ? ', ' : ''}<EntityLink ref={boss} {registry} />{/each}.</span>{/if}
            {#if dungeon.lootTables?.length}<span> Reward pools: {dungeon.lootTables.join(', ')}.</span>{/if}
          </li>{/each}</ul>
        </details>
      </Section>
    {/if}
  </Sections>
</article>

<style>
  .guide-flow { display: grid; min-width: 0; gap: 1rem; align-items: start; }
  .guide-flow :global(.section) { min-width: 0; }
  @media (min-width: 1024px) { .guide-flow { grid-template-columns: minmax(0, 1fr) minmax(16rem, .8fr); } }
  .steps { display: grid; gap: 1rem; margin: 0; padding-left: 1.5rem; }
  .steps li { min-width: 0; padding-left: .25rem; scroll-margin-top: 2rem; }
  h3 { margin: 0 0 .35rem; color: var(--c-text-strong); font: 600 var(--c-text-lead)/1.3 var(--c-serif); }
  /* Section text only: the overview paragraph keeps the shared prose style. */
  :global(.c-sections) p, :global(.c-sections) li { line-height: 1.55; }
  :global(.c-sections) p { margin: 0 0 .65rem; }
  .table-scroll { max-width: 100%; overflow-x: auto; }
  table { width: 100%; border-collapse: collapse; text-align: left; font-variant-numeric: tabular-nums; }
  th, td { padding: .55rem .65rem; border-bottom: 1px solid var(--c-line); }
  th { color: var(--c-text-dim); font-weight: 600; }
  td:not(:first-child), th:not(:first-child) { text-align: right; }
  details { line-height: 1.55; }
  summary { cursor: pointer; min-height: 24px; }
  .affix-details { margin: .3rem 0 .6rem; }
  .affix-details ul, .stones { padding-left: 1.3rem; }
  .affix-details li + li, .stones li + li { margin-top: .35rem; }
  .dungeon-associations { margin-top: 1rem; }
  .dungeon-associations li + li { margin-top: .65rem; }
  @media (max-width: 640px) {
    .timer-table, .timer-table tbody, .timer-table tr, .timer-table th, .timer-table td { display: block; width: 100%; }
    .timer-table thead { display: none; }
    .timer-table tr { padding: .65rem 0; border-bottom: 1px solid var(--c-line); }
    .timer-table th, .timer-table td { box-sizing: border-box; padding: .2rem 0; border: 0; text-align: left; }
    .timer-table td { display: flex; justify-content: space-between; gap: .5rem; }
    .timer-table td::before { content: attr(data-label); color: var(--c-text-dim); }
    .timer-table td { font-variant-numeric: tabular-nums; }
  }
</style>
