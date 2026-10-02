<script lang="ts">
  import type { HeroicTier, PublicKindEntry } from '@afallon/contracts/public';
  import FactList from '../FactList.svelte';
  import FactRow from '../FactRow.svelte';
  import GuideSection from '../GuideSection.svelte';
  import Hero from '../Hero.svelte';
  import Sections from '../Sections.svelte';
  import TitleBlock from '../TitleBlock.svelte';

  export let document: HeroicTier;
  export let registry: PublicKindEntry[];

  const format = (value: number) => value.toLocaleString('en-US', { maximumFractionDigits: 4 });
  const percent = (fraction: number) => `${format(fraction * 100)}%`;
  $: settings = 'unavailable' in document.settings ? undefined : document.settings;
  $: unavailable = 'unavailable' in document.settings ? document.settings.unavailable : undefined;
</script>

<article class="detail-page">
  <TitleBlock name={document.ref.name} {registry} />
  <Hero><p class="c-prose">{document.overview}</p></Hero>
  <Sections>
    {#each document.sections as section (section.id)}
      <GuideSection {section} {registry}>
        <svelte:fragment slot="lead">{#if section.id === 'essence' && settings}{' '}Each kill starts from {format(settings.essenceBaseAmount)} Essence, plus {format(settings.essencePerAffix)} for each of the creature's affixes.{/if}</svelte:fragment>
        <svelte:fragment slot="top">
          {#if section.id === 'kill-experience' || section.id === 'essence'}
            {#if unavailable}<p>{unavailable}</p>
            {:else if settings && section.id === 'kill-experience'}
              <FactList><FactRow label="Kill experience multiplier">{format(settings.killExperienceMultiplier)}×</FactRow></FactList>
            {:else if settings}
              <FactList>
                {#if settings.essencePoints}<FactRow label="Points">{settings.essencePoints}</FactRow>{/if}
                <FactRow label="Elite rank multiplier">{format(settings.essenceEliteMultiplier)}×</FactRow>
                <FactRow label="Rare rank multiplier">{format(settings.essenceRareMultiplier)}×</FactRow>
                <FactRow label="Boss rank multiplier">{format(settings.essenceBossMultiplier)}×</FactRow>
                <FactRow label="Health baseline">{format(settings.essenceHealthBaseline)}×</FactRow>
                <FactRow label="Health factor bounds">{format(settings.essenceHealthFactorMin)}–{format(settings.essenceHealthFactorMax)}</FactRow>
              </FactList>
            {/if}
          {/if}
        </svelte:fragment>
        {#if section.id === 'essence' && document.example}
          <h3>Essence per kill</h3>
          <p>Essence per kill by creature rank and number of affixes, at a health factor of 1.</p>
          <div class="table-scroll"><table class="essence">
            <thead>
              <tr><th scope="col" rowspan="2">Creature rank</th><th scope="colgroup" colspan={document.example.affixCounts.length} class="group">Affixes</th></tr>
              <tr>{#each document.example.affixCounts as count}<th scope="col" class="count">{count}</th>{/each}</tr>
            </thead>
            <tbody>{#each document.example.rows as row}<tr><th scope="row">{row.rank === 'other' ? 'Other' : row.rank === 'elite' ? 'Elite' : row.rank === 'rare' ? 'Rare' : 'Boss'}</th>{#each row.essence as amount}<td>{format(amount)}</td>{/each}</tr>{/each}</tbody>
          </table></div>
        {:else if section.id === 'settings'}
          {#if unavailable}<p>{unavailable}</p>
          {:else if settings}
            <FactList>
              <FactRow label="Creature health multiplier">{format(settings.baseHealthMultiplier)}×</FactRow>
              <FactRow label="Creature damage multiplier">{format(settings.baseDamageMultiplier)}×</FactRow>
              <FactRow label="Gear scaling coefficient">{format(settings.gearScoreCoefficient)}</FactRow>
              <FactRow label="Maximum gear bonus">{format(settings.maxGearBonus)}</FactRow>
              <FactRow label="First affix chance">{percent(settings.affixChance)}</FactRow>
              <FactRow label="Later affix chance">{percent(settings.extraAffixChance)}</FactRow>
              <FactRow label="Maximum affixes">{format(settings.maxAffixes)}</FactRow>
              <FactRow label="Guaranteed affixes for Rare creatures">{format(settings.rareGuaranteedAffixes)}</FactRow>
              <FactRow label="Affix loot multiplier">{format(settings.affixLootDropMultiplier)}×</FactRow>
              <FactRow label="Heroic gear stat bonus">{format(settings.heroicGearStatBonusPercent)}%</FactRow>
            </FactList>
          {/if}
        {/if}
      </GuideSection>
    {/each}
  </Sections>
</article>

<style>
  h3 { color: var(--c-text-strong); font: 600 var(--c-text-lead)/1.3 var(--c-serif); }
  .table-scroll { max-width: 100%; overflow-x: auto; }
  table { width: 100%; border-collapse: collapse; text-align: left; font-variant-numeric: tabular-nums; }
  th, td { padding: .55rem .7rem; border-bottom: 1px solid var(--c-line); white-space: nowrap; }
  th { color: var(--c-text-dim); font-weight: 600; }
  thead th[rowspan] { vertical-align: bottom; }
  .group { padding-bottom: .2rem; border-bottom-color: var(--c-line-soft); text-align: center; }
  .count, td { text-align: right; }
  @media (max-width: 640px) { th, td { padding-inline: .45rem; } }
</style>
