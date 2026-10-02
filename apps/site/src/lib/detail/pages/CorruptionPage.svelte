<script lang="ts">
  import type { CorruptionGuide, PublicItem, PublicKindEntry } from '@afallon/contracts/public';
  import EntityLink from '../../EntityLink.svelte';
  import CorruptionTryIt from '../CorruptionTryIt.svelte';
  import GuideSection from '../GuideSection.svelte';
  import Hero from '../Hero.svelte';
  import Section from '../Section.svelte';
  import Sections from '../Sections.svelte';
  import TitleBlock from '../TitleBlock.svelte';

  export let document: CorruptionGuide;
  export let registry: PublicKindEntry[];
  export let inlineItem: PublicItem | undefined = undefined;
  const format = (value: number) => value.toLocaleString('en-US', { maximumFractionDigits: 2 });
  $: lootLimit = Math.max(0, ...document.dungeons.map((dungeon) => dungeon.maxLootItems ?? 0));
  $: underglow = document.dungeons.find((dungeon) => dungeon.place.name === 'The Underglow');
  $: powerBonus = document.gearStatBonuses?.find((bonus) => bonus.stat.toLowerCase() === 'item power');
  $: healthBonus = document.gearStatBonuses?.find((bonus) => bonus.stat === 'Health');
  $: rules = document.nativeRules;
</script>

<article class="detail-page">
  <TitleBlock name={document.ref.name} {registry} />
  <Hero>
    <p class="c-prose">{document.overview}</p>
    {#each document.seeAlso ?? [] as entry}<p class="see-also">{entry.lead} <EntityLink ref={entry.ref} {registry} />.</p>{/each}
  </Hero>
  <Sections>
    {#each document.sections as section (section.id)}
      <GuideSection {section} {registry}>
        <svelte:fragment slot="lead">
          {#if section.id === 'altars'}
            {' '}Without a token, the altar adds +{format(rules.altarWithoutTokenIncrement)}. A {#if document.token}<EntityLink ref={document.token} {registry} />{:else}token{/if} adds its value and activates up to {format(document.affixesPerToken ?? 0)} affixes. The dungeon starts at no more than +{format(document.maxLevel ?? 0)}.
          {:else if section.id === 'tokens'}
            {' '}New tokens roll up to {format(document.affixesPerToken ?? 0)} available affixes. Token value and item corruption level are separate.
          {:else if section.id === 'enemies' && document.mobStatBonuses?.length}
            {' '}At each corruption level, enemies gain {document.mobStatBonuses.map((bonus) => `+${format(bonus.amountPerLevel)}${bonus.isPercent ? '%' : ''} ${bonus.stat}`).join(', ')}. Affixes add other effects.
          {:else if section.id === 'timed-dungeons'}
            {' '}With time left, the reward token gains +{format(rules.completionFirstBonus)}, +{format(rules.completionSecondBonus)}, or +{format(rules.completionOtherwiseBonus)} levels. On timeout, its value falls by {format(rules.timeoutDecrease)} to at least {format(rules.timeoutMinimum)}, and the bag holds no regular loot. A completed bag holds up to {format(lootLimit)} loot rolls{#if underglow?.maxLootItems !== undefined}{' '}({format(underglow.maxLootItems)} in The Underglow){/if}.
          {:else if section.id === 'gear' && document.gearAllStatsPercentPerLevel !== undefined}
            {' '}Each corruption level increases equipment's base stats and weapon damage by +{format(document.gearAllStatsPercentPerLevel)}%{#if powerBonus}, adds +{format(powerBonus.amountPerLevel)} Item Power{/if}{#if healthBonus}, and adds +{format(healthBonus.amountPerLevel)}% Health on items with a Health stat{/if}. Random stats and gems keep their values.
          {/if}
        </svelte:fragment>
        {#if section.id === 'tokens' && document.affixes?.length}
          <p>{document.affixes.filter((affix) => !affix.available).length} affixes cannot appear on new tokens.</p>
          <details class="affix-details"><summary>Show all dungeon affixes</summary>
            <ul>{#each document.affixes as affix}<li><strong>{affix.name}</strong>{affix.available ? '' : ' (Cannot appear on new tokens)'}: {affix.description.replaceAll(' — ', ', ')}</li>{/each}</ul>
          </details>
        {:else if section.id === 'timed-dungeons' && document.dungeons.length}
          <p>The thresholds are the seconds <strong>left</strong> on the timer when the last boss dies. Maximum loot items is the most regular loot a reward bag can hold besides the token.</p>
          <div class="table-scroll"><table class="timer-table"><thead><tr><th scope="col">Dungeon</th><th scope="col">Timer</th><th scope="col">First threshold</th><th scope="col">Second threshold</th><th scope="col">Maximum loot items</th></tr></thead>
            <tbody>{#each document.dungeons as dungeon}<tr><th scope="row"><EntityLink ref={dungeon.place} {registry} /></th><td data-label="Timer">{dungeon.totalSeconds === undefined ? 'Unavailable' : `${format(dungeon.totalSeconds)} s`}</td><td data-label="First threshold">{dungeon.firstRemainingSeconds === undefined ? 'Unavailable' : `${format(dungeon.firstRemainingSeconds)} s left`}</td><td data-label="Second threshold">{dungeon.secondRemainingSeconds === undefined ? 'Unavailable' : `${format(dungeon.secondRemainingSeconds)} s left`}</td><td data-label="Maximum loot items">{dungeon.maxLootItems === undefined ? 'Unavailable' : format(dungeon.maxLootItems)}</td></tr>{/each}</tbody>
          </table></div>
          <details class="dungeon-associations"><summary>Bosses</summary>
            {#if document.dungeons.every((dungeon) => dungeon.rewardsFromBossDrops)}
              <p>Defeating all bosses in time fills the reward bag. Its extra loot comes from the same tables as each boss's own drops, which the boss pages list with chances.</p>
            {/if}
            <ul>{#each document.dungeons as dungeon}<li><strong><EntityLink ref={dungeon.place} {registry} /></strong>:
              {#if dungeon.bosses?.length}{#each dungeon.bosses as boss, index}{index ? ', ' : ''}<EntityLink ref={boss} {registry} />{/each}.{:else} Bosses unavailable.{/if}
            </li>{/each}</ul>
          </details>
        {/if}
      </GuideSection>
      {#if section.id === 'gear'}
        <Section id="try-it" title="Try it on an item">
          <CorruptionTryIt guide={document} {inlineItem} {registry} />
        </Section>
      {/if}
    {/each}
  </Sections>
</article>

<style>
  .see-also { color: var(--c-text-dim); }
  /* Section text only: the overview paragraph keeps the shared prose style. */
  :global(.c-sections) p, :global(.c-sections) li { line-height: 1.55; }
  .table-scroll { max-width: 100%; overflow-x: auto; }
  table { width: 100%; border-collapse: collapse; text-align: left; font-variant-numeric: tabular-nums; }
  th, td { padding: .55rem .65rem; border-bottom: 1px solid var(--c-line); }
  th { color: var(--c-text-dim); font-weight: 600; }
  td:not(:first-child), th:not(:first-child) { text-align: right; }
  .affix-details ul { padding-left: 1.3rem; }
  .affix-details li + li { margin-top: .35rem; }
  details { line-height: 1.55; }
  /* A disclosure is not a layout container, so its summary and content keep their space with margins. */
  details[open] > * + * { margin-top: .65rem; }
  summary { cursor: pointer; min-height: 24px; }
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
