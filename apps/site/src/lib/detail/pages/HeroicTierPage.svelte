<script lang="ts">
  import type { HeroicTier, PublicKindEntry } from '@afallon/contracts/public';
  import Hero from '../Hero.svelte';
  import GuideSteps from '../GuideSteps.svelte';
  import FactList from '../FactList.svelte';
  import FactRow from '../FactRow.svelte';
  import Section from '../Section.svelte';
  import Sections from '../Sections.svelte';
  import TitleBlock from '../TitleBlock.svelte';
  import MechanicsRules from '../sections/MechanicsRules.svelte';

  export let document: HeroicTier;
  export let registry: PublicKindEntry[];

  const format = (value: number) => value.toLocaleString('en-US', { maximumFractionDigits: 4 });
  const percent = (fraction: number) => `${format(fraction * 100)}%`;
  import { ruleNumbers } from '../rule-numbers';
  $: numbers = ruleNumbers(document.rules);
</script>

<article class="detail-page">
  <TitleBlock name={document.ref.name} {registry} />
  <Hero><p class="c-prose">{document.overview}</p></Hero>
  <Sections>
    <GuideSteps steps={document.steps} ruleNumbers={numbers} />
    <Section id="worked-example" title="Worked example">
      {#if document.example}
        <p>Essence per kill at health factor 1, before the stored fraction. The example does not use a creature's health stat.</p>
        <table class="essence">
          <thead>
            <tr><th scope="col" rowspan="2">Creature rank</th><th scope="colgroup" colspan={document.example.affixCounts.length} class="group">Affixes</th></tr>
            <tr>{#each document.example.affixCounts as count}<th scope="col" class="count">{count}</th>{/each}</tr>
          </thead>
          <tbody>{#each document.example.rows as row}<tr><th scope="row">{row.rank === 'other' ? 'Other' : row.rank === 'elite' ? 'Elite' : row.rank === 'rare' ? 'Rare' : 'Boss'}</th>{#each row.essence as amount}<td>{format(amount)}</td>{/each}</tr>{/each}</tbody>
        </table>
      {/if}
    </Section>
    <Section id="kill-experience" title="Kill experience">
      {#if 'unavailable' in document.settings}
        <p>{document.settings.unavailable}</p>
      {:else}
        <p>Heroic creature kills multiply kill experience by {format(document.settings.killExperienceMultiplier)}. Quest experience does not use this multiplier.</p>
      {/if}
    </Section>
    <Section id="essence" title="Heroic Essence">
      {#if 'unavailable' in document.settings}
        <p>{document.settings.unavailable}</p>
      {:else}
        <p>Essence per eligible kill at the health baseline starts with {format(document.settings.essenceBaseAmount)}. Each affix adds {format(document.settings.essencePerAffix)} before the rank multiplier.</p>
        <FactList>
          {#if document.settings.essencePoints}<FactRow label="Points">{document.settings.essencePoints}</FactRow>{/if}
          <FactRow label="Elite rank multiplier">{format(document.settings.essenceEliteMultiplier)}×</FactRow>
          <FactRow label="Rare rank multiplier">{format(document.settings.essenceRareMultiplier)}×</FactRow>
          <FactRow label="Boss rank multiplier">{format(document.settings.essenceBossMultiplier)}×</FactRow>
          <FactRow label="Health baseline">{format(document.settings.essenceHealthBaseline)}×</FactRow>
          <FactRow label="Health factor bounds">{format(document.settings.essenceHealthFactorMin)}–{format(document.settings.essenceHealthFactorMax)}</FactRow>
        </FactList>
      {/if}
    </Section>
    <Section id="settings" title="Settings">
      {#if 'unavailable' in document.settings}
        <p>{document.settings.unavailable}</p>
      {:else}
        <FactList>
          <FactRow label="Creature health multiplier">{format(document.settings.baseHealthMultiplier)}×</FactRow>
          <FactRow label="Creature damage multiplier">{format(document.settings.baseDamageMultiplier)}×</FactRow>
          <FactRow label="Gear scaling coefficient">{format(document.settings.gearScoreCoefficient)}</FactRow>
          <FactRow label="Maximum gear bonus">{format(document.settings.maxGearBonus)}</FactRow>
          <FactRow label="First affix chance">{percent(document.settings.affixChance)}</FactRow>
          <FactRow label="Later affix chance">{percent(document.settings.extraAffixChance)}</FactRow>
          <FactRow label="Maximum affixes">{format(document.settings.maxAffixes)}</FactRow>
          <FactRow label="Guaranteed affixes for Rare creatures">{format(document.settings.rareGuaranteedAffixes)}</FactRow>
          <FactRow label="Affix loot multiplier">{format(document.settings.affixLootDropMultiplier)}×</FactRow>
          <FactRow label="Heroic gear stat bonus">{format(document.settings.heroicGearStatBonusPercent)}%</FactRow>
        </FactList>
      {/if}
    </Section>
    <Section id="rules-reference" title="Rules reference">
      <MechanicsRules rules={document.rules} {registry} />
    </Section>
  </Sections>
</article>

<style>
  /* Section text only: the overview paragraph keeps the shared prose style. */
  :global(.c-sections) p { line-height: 1.55; }
  table { width: 100%; border-collapse: collapse; text-align: left; font-variant-numeric: tabular-nums; }
  th, td { padding: .55rem .7rem; border-bottom: 1px solid var(--c-line); white-space: nowrap; }
  th { color: var(--c-text-dim); font-weight: 600; }
  thead th[rowspan] { vertical-align: bottom; }
  .group { padding-bottom: .2rem; border-bottom-color: var(--c-line-soft); text-align: center; }
  .count, td { text-align: right; }
  @media (max-width: 640px) { th, td { padding-inline: .45rem; } }
</style>
