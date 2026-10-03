<script lang="ts">
  import type { CorruptionGuide, PublicItem, PublicKindEntry } from '@afallon/contracts/public';
  import EntityLink from '../../EntityLink.svelte';
  import { listText } from '../../format';
  import CorruptionTryIt from '../CorruptionTryIt.svelte';
  import type { ItemPickerOption } from '../item-picker-options';
  import GuideSection from '../GuideSection.svelte';
  import Hero from '../Hero.svelte';
  import Section from '../Section.svelte';
  import RelationTable from '../RelationTable.svelte';
  import type { RelationColumn } from '../relation-table';
  import Sections from '../Sections.svelte';
  import TitleBlock from '../TitleBlock.svelte';

  export let document: CorruptionGuide;
  export let registry: PublicKindEntry[];
  export let inlineItem: PublicItem | undefined = undefined;
  export let corruptionItems: ItemPickerOption[] = [];
  const format = (value: number) => value.toLocaleString('en-US', { maximumFractionDigits: 2 });
  $: lootLimit = Math.max(0, ...document.dungeons.map((dungeon) => dungeon.maxLootItems ?? 0));
  $: underglow = document.dungeons.find((dungeon) => dungeon.place.name === 'The Underglow');
  $: powerBonus = document.gearStatBonuses?.find((bonus) => bonus.stat.toLowerCase() === 'item power');
  $: healthBonus = document.gearStatBonuses?.find((bonus) => bonus.stat === 'Health');
  $: rules = document.nativeRules;
  type Dungeon = CorruptionGuide['dungeons'][number];
  const dungeonColumns: RelationColumn<Dungeon>[] = [
    { id: 'place', label: 'Dungeon', value: (row) => row.place.name, sort: (row) => row.place.name },
    { id: 'timer', label: 'Timer', numeric: true, value: (row) => row.totalSeconds, sort: (row) => row.totalSeconds },
    { id: 'first', label: 'First Threshold', numeric: true, value: (row) => row.firstRemainingSeconds, sort: (row) => row.firstRemainingSeconds },
    { id: 'second', label: 'Second Threshold', numeric: true, value: (row) => row.secondRemainingSeconds, sort: (row) => row.secondRemainingSeconds },
    { id: 'loot', label: 'Maximum Loot', numeric: true, value: (row) => row.maxLootItems, sort: (row) => row.maxLootItems },
  ];
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
            {' '}Using it without a token adds +{format(rules.altarWithoutTokenIncrement)}. A {#if document.token}<EntityLink ref={document.token} {registry} />{:else}token{/if} adds its own value and up to {format(document.affixesPerToken ?? 0)} of its affixes. A dungeon can start at up to +{format(document.maxLevel ?? 0)}.
          {:else if section.id === 'tokens'}
            {' '}A new token has up to {format(document.affixesPerToken ?? 0)} affixes. Its value is separate from the corruption level of gear.
          {:else if section.id === 'enemies' && document.mobStatBonuses?.length}
            {' '}Each corruption level adds {listText(document.mobStatBonuses.map((bonus) => `+${format(bonus.amountPerLevel)}${bonus.isPercent ? '%' : ''} ${bonus.stat}`))} to enemies, and the bonuses add up. Affixes add other effects.
          {:else if section.id === 'timed-dungeons'}
            {' '}Finish with time to spare and the reward token gains levels: +{format(rules.completionFirstBonus)} if you beat the first threshold, and +{format(rules.completionSecondBonus)} if you beat only the second{#if rules.completionOtherwiseBonus > 0}, or +{format(rules.completionOtherwiseBonus)} otherwise{/if}. If time runs out, the token loses {format(rules.timeoutDecrease)} {rules.timeoutDecrease === 1 ? 'level' : 'levels'}, down to a minimum of {format(rules.timeoutMinimum)}, and the bag holds nothing else. A finished run's bag holds up to {format(lootLimit)} items besides the token{#if underglow?.maxLootItems !== undefined}{' '}({format(underglow.maxLootItems)} in The Underglow){/if}.
          {:else if section.id === 'gear' && document.gearAllStatsPercentPerLevel !== undefined}
            {' '}Each level raises the item's base stats and weapon damage by {format(document.gearAllStatsPercentPerLevel)}%{#if powerBonus}, adds {format(powerBonus.amountPerLevel)} Item Power{/if}{#if healthBonus}, and adds {format(healthBonus.amountPerLevel)}% Health to items with a Health stat{/if}. Random stats and gems keep their values.
          {/if}
        </svelte:fragment>
        {#if section.id === 'tokens' && document.affixes?.length}
          <p>New tokens never roll {document.affixes.filter((affix) => !affix.available).length} of these affixes.</p>
          <details class="affix-details c-disclosure"><summary>Show all dungeon affixes</summary>
            <ul>{#each document.affixes as affix}<li><strong>{affix.name}</strong>{affix.available ? '' : ' (Not on new tokens)'}: {affix.description.replaceAll(' — ', ', ')}</li>{/each}</ul>
          </details>
        {:else if section.id === 'timed-dungeons' && document.dungeons.length}
          <p>Thresholds count the time <strong>left</strong> on the timer when the last boss dies. Maximum loot is the most items a reward bag holds besides the token.</p>
          <RelationTable rows={document.dungeons} columns={dungeonColumns} label="Timed dungeons">
            <svelte:fragment slot="cell" let:row let:column>
              {#if column === 'place'}<EntityLink ref={row.place} {registry} />
              {:else if column === 'timer'}{row.totalSeconds === undefined ? 'Unavailable' : `${format(row.totalSeconds)} s`}
              {:else if column === 'first'}{row.firstRemainingSeconds === undefined ? 'Unavailable' : `${format(row.firstRemainingSeconds)} s left`}
              {:else if column === 'second'}{row.secondRemainingSeconds === undefined ? 'Unavailable' : `${format(row.secondRemainingSeconds)} s left`}
              {:else if column === 'loot'}{row.maxLootItems === undefined ? 'Unavailable' : format(row.maxLootItems)}{/if}
            </svelte:fragment>
          </RelationTable>
          <details class="dungeon-associations c-disclosure"><summary>Bosses</summary>
            {#if document.dungeons.every((dungeon) => dungeon.rewardsFromBossDrops)}
              <p>The reward bag's extra loot comes from the same tables as the bosses' own drops, so each boss page lists its chances.</p>
            {/if}
            <ul>{#each document.dungeons as dungeon}<li><strong><EntityLink ref={dungeon.place} {registry} /></strong>:
              {#if dungeon.bosses?.length}{#each dungeon.bosses as boss, index}{index ? ', ' : ''}<EntityLink ref={boss} {registry} />{/each}.{:else}{' '}Bosses unavailable.{/if}
            </li>{/each}</ul>
          </details>
        {/if}
      </GuideSection>
      {#if section.id === 'gear'}
        <Section id="try-it" title="Try it on an item">
          <CorruptionTryIt guide={document} {inlineItem} {registry} options={corruptionItems} />
        </Section>
      {/if}
    {/each}
  </Sections>
</article>

<style>
  .see-also { color: var(--c-text-dim); }
  /* Section text only: the overview paragraph keeps the shared prose style. */
  :global(.c-sections) p, :global(.c-sections) li { line-height: 1.55; }
  .affix-details ul { padding-left: 1.3rem; }
  .affix-details li + li { margin-top: .35rem; }
  details { line-height: 1.55; }
  /* A disclosure is not a layout container, so its summary and content keep their space with margins. */
  details[open] > * + * { margin-top: .65rem; }
  .dungeon-associations li + li { margin-top: .65rem; }
</style>
