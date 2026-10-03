<script lang="ts">
  import type { HeroicTier, PublicKindEntry } from '@afallon/contracts/public';
  import EntityLink from '../../EntityLink.svelte';
  import { formatNumber } from '../../format';
  import { spotOnMap } from '../../map-links';
  import CompareTable from '../CompareTable.svelte';
  import GuidePart from '../GuidePart.svelte';
  import GuideSection from '../GuideSection.svelte';
  import GuideStart from '../GuideStart.svelte';
  import type { RelationColumn } from '../relation-table';
  import RelationTable from '../RelationTable.svelte';
  import Sections from '../Sections.svelte';
  import TitleBlock from '../TitleBlock.svelte';

  export let document: HeroicTier;
  export let registry: PublicKindEntry[];

  // The page answers three questions in order: how to turn the tier on, what changes, and what it gives. The opening
  // states each answer in one sentence from the rules' values, and the parts below hold the rules in full.
  const PARTS = [
    { id: 'getting-started', title: 'Getting started', sections: ['entering'] },
    { id: 'what-changes', title: 'What changes', sections: ['empowered-creatures', 'affixes'] },
    { id: 'rewards', title: 'Rewards', sections: ['kill-experience', 'essence', 'currency', 'heroic-gear'] },
  ] as const;
  $: byId = new Map(document.sections.map((section) => [section.id, section]));
  // A section that no part names still shows, after the parts.
  $: parts = [
    ...PARTS.map((part) => ({ ...part, sections: part.sections.flatMap((id) => byId.get(id) ?? []) })),
    { id: 'more', title: 'More', sections: document.sections.filter((section) => !PARTS.some((part) => (part.sections as readonly string[]).includes(section.id))) },
  ].filter((part) => part.sections.length);

  $: rules = new Map(document.sections.flatMap((section) => section.rules).filter((rule) => rule.status === 'verified').map((rule) => [rule.id, rule]));
  const value = (id: string, operand: string) => rules.get(id)?.operands[operand];
  $: consoles = document.consoles ?? [];
  $: level = value('heroic-tier-recommended-level', 'level');
  $: health = value('heroic-tier-creature-health-scaling', 'health');
  $: damage = value('heroic-tier-creature-damage-scaling', 'damage');
  $: maxAffixes = value('heroic-tier-affix-rolls', 'maximum');
  $: killExperience = value('heroic-kill-experience', 'multiplier');
  $: bossCurrency = value('heroic-tier-boss-currency', 'multiplier');
  $: questCurrency = value('heroic-tier-world-quest-currency', 'multiplier');
  $: gearBonus = value('heroic-gear-base-stats', 'statBonusPercent');
  $: rewards = [
    killExperience === undefined ? undefined : `${formatNumber(killExperience)} times the kill experience`,
    bossCurrency === undefined || questCurrency === undefined ? undefined
      : bossCurrency === questCurrency ? `${formatNumber(bossCurrency)} times the currency from Bosses and World Quests`
        : `${formatNumber(bossCurrency)} times the currency from Bosses and ${formatNumber(questCurrency)} times from World Quests`,
    byId.has('essence') ? 'Heroic Essence' : undefined,
    gearBonus === undefined ? undefined : `Heroic gear with ${formatNumber(gearBonus)}% stronger fixed stats`,
  ].filter((text): text is string => Boolean(text));
  const list = (texts: string[]) => texts.length < 3 ? texts.join(' and ') : `${texts.slice(0, -1).join(', ')}, and ${texts.at(-1)}`;

  // How strong an empowered creature is at three gear scores: none, half of the score that reaches the cap, and the cap.
  type Strength = { score: number; health: number; damage: number };
  $: percentPerPoint = value('heroic-tier-gear-bonus-cap', 'percentPerPoint');
  $: capScore = value('heroic-tier-gear-bonus-cap', 'capScore');
  $: capPercent = value('heroic-tier-gear-bonus-cap', 'capPercent');
  $: strength = health !== undefined && damage !== undefined && percentPerPoint !== undefined && capScore !== undefined && capPercent !== undefined
    ? [0, capScore / 2, capScore].map((score): Strength => {
      const factor = 1 + Math.min(score * percentPerPoint, capPercent) / 100;
      return { score, health: health * factor, damage: damage * factor };
    })
    : [];
  const STRENGTH_FACTS = [{ id: 'health', label: 'Creature health' }, { id: 'damage', label: 'Creature damage' }];
  // Factors and Essence amounts keep their decimals, such as a health factor of 0.25.
  const exact = new Intl.NumberFormat('en-US', { maximumFractionDigits: 4 });

  $: settings = 'unavailable' in document.settings ? undefined : document.settings;
  const rankLabel = (rank: string) => rank === 'other' ? 'Other' : rank === 'elite' ? 'Elite' : rank === 'rare' ? 'Rare' : 'Boss';
  const rankMultiplier = (rank: string) => !settings || rank === 'other' ? undefined
    : rank === 'elite' ? settings.essenceEliteMultiplier : rank === 'rare' ? settings.essenceRareMultiplier : settings.essenceBossMultiplier;
  type EssenceRow = NonNullable<HeroicTier['example']>['rows'][number];
  $: essenceColumns = [
    { id: 'rank', label: 'Creature rank', value: (row: EssenceRow) => rankLabel(row.rank) },
    ...(document.example?.affixCounts ?? []).map((count, index): RelationColumn<EssenceRow> => ({
      id: `affixes-${count}`, label: count === 1 ? '1 affix' : `${formatNumber(count)} affixes`, numeric: true, value: (row) => row.essence[index],
    })),
  ] satisfies RelationColumn<EssenceRow>[];
</script>

<article class="detail-page">
  <TitleBlock name={document.ref.name} {registry} />
  <GuideStart overview={document.overview}>
    {#if consoles.length}
      <div>
        <h2>Turn it on</h2>
        <p>Use a Heroic Console in one of these places, then confirm.{#if level !== undefined}{' '}The console recommends level {formatNumber(level)} or higher.{/if}</p>
        <nav class="console-spots" aria-label="Find a Heroic Console">
          {#each consoles as console (console.spot.placementId)}
            <span><EntityLink ref={console.place} {registry} /><a class="c-link" href={spotOnMap(console.spot.placementId)}>Show on map</a></span>
          {/each}
        </nav>
        <a class="c-link more" href="#entering">Turning it on and off</a>
      </div>
    {/if}
    {#if health !== undefined && damage !== undefined}
      <div>
        <h2>What changes</h2>
        <p>Creatures have {formatNumber(health)} times their health and deal {formatNumber(damage)} times their damage, more as your gear improves.{#if maxAffixes !== undefined}{' '}They can carry up to {formatNumber(maxAffixes)} affixes.{/if}</p>
        <a class="c-link more" href="#empowered-creatures">Empowered creatures</a>
      </div>
    {/if}
    {#if rewards.length}
      <div>
        <h2>What you get</h2>
        <p>{list(rewards)}.</p>
        <a class="c-link more" href="#kill-experience">Rewards</a>
      </div>
    {/if}
  </GuideStart>

  <Sections>
    {#each parts as part (part.id)}
      <GuidePart id={part.id} title={part.title}>
        {#each part.sections as section (section.id)}
          <GuideSection {section} {registry} level={3}>
            {#if section.id === 'entering' && consoles.length}
              <p class="console-lead">Find each console on the map.</p>
              <nav class="console-spots" aria-label="Heroic Console locations">
                {#each consoles as console (console.spot.placementId)}
                  <span><EntityLink ref={console.place} {registry} /><a class="c-link" href={spotOnMap(console.spot.placementId)}>Show on map</a></span>
                {/each}
              </nav>
            {/if}
            {#if section.id === 'empowered-creatures' && strength.length}
              <CompareTable items={strength} facts={STRENGTH_FACTS} has={() => true} anchor={(row) => `gear-score-${row.score}`} label="Empowered creature strength by your gear score" minColumn={60}>
                <svelte:fragment slot="corner">Your gear score</svelte:fragment>
                <svelte:fragment slot="head" let:item><span class="score">{formatNumber(item.score)}{item.score === capScore ? '+' : ''}</span></svelte:fragment>
                <svelte:fragment slot="cell" let:item let:fact>{exact.format(fact === 'health' ? item.health : item.damage)}×</svelte:fragment>
              </CompareTable>
            {:else if section.id === 'essence' && document.example}
              <RelationTable columns={essenceColumns} rows={document.example.rows} label="Essence per kill by creature rank and affixes">
                <svelte:fragment slot="cell" let:row let:column>
                  {@const index = document.example.affixCounts.findIndex((count) => column === `affixes-${count}`)}
                  {#if column === 'rank'}{rankLabel(row.rank)}{#if rankMultiplier(row.rank) !== undefined}<small>{exact.format(rankMultiplier(row.rank) ?? 1)}× Essence</small>{/if}
                  {:else if index >= 0}{exact.format(row.essence[index] ?? 0)}{/if}
                </svelte:fragment>
              </RelationTable>
              {#if settings}<p class="note">Essence per kill at a health factor of 1. The health baseline is {exact.format(settings.essenceHealthBaseline)}, and the health factor stays between {exact.format(settings.essenceHealthFactorMin)} and {exact.format(settings.essenceHealthFactorMax)}.</p>{/if}
            {/if}
          </GuideSection>
        {/each}
      </GuidePart>
    {/each}
  </Sections>
</article>

<style>
  p { margin: 0; line-height: 1.55; }
  .more { width: fit-content; font-size: var(--c-text-small); }
  .note { color: var(--c-text-dim); font-size: var(--c-text-small); }
  .console-lead { margin-top: .5rem; color: var(--c-text-dim); }
  .console-spots { display: grid; width: min(100%, 22rem); gap: .35rem; line-height: 1.5; }
  .console-spots span { display: flex; justify-content: space-between; align-items: baseline; gap: .5rem; min-width: 0; }
  .console-spots span > :global(a:last-child) { flex: none; font-size: var(--c-text-small); }
  /* A gear score is one short number, so it never breaks across lines. */
  .score { white-space: nowrap; }
</style>
