<script lang="ts">
  import type { HeroicTier, MechanicsRule, PublicKindEntry } from '@afallon/contracts/public';
  import Hero from '../Hero.svelte';
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
  function rulesFor(section: string): MechanicsRule[] {
    return document.rules.filter((rule) => rule.section === section);
  }
</script>

<article class="detail-page">
  <TitleBlock name={document.ref.name} {registry} />
  {#if document.description}<Hero><p class="c-prose">{document.description}</p></Hero>{/if}
  <Sections>
    <Section id="kill-experience" title="Kill experience" icon="creature">
      {#if 'unavailable' in document.settings}
        <p>{document.settings.unavailable}</p>
      {:else}
        <p>Heroic creature kills multiply kill experience by {format(document.settings.killExperienceMultiplier)}. Quest experience does not use this multiplier.</p>
        <MechanicsRules rules={rulesFor('kill-experience')} {registry} />
      {/if}
    </Section>
    <Section id="essence" title="Heroic Essence" icon="talent">
      {#if 'unavailable' in document.settings}
        <p>{document.settings.unavailable}</p>
      {:else}
        <p>Heroic Essence per eligible kill: ({format(document.settings.essenceBaseAmount)} base + {format(document.settings.essencePerAffix)} per affix × affix count) × rank multiplier × bounded health factor.</p>
        <FactList>
          {#if document.settings.essencePoints}<FactRow label="Points">{document.settings.essencePoints}</FactRow>{/if}
          <FactRow label="Elite rank multiplier">{format(document.settings.essenceEliteMultiplier)}×</FactRow>
          <FactRow label="Rare rank multiplier">{format(document.settings.essenceRareMultiplier)}×</FactRow>
          <FactRow label="Boss rank multiplier">{format(document.settings.essenceBossMultiplier)}×</FactRow>
          <FactRow label="Health baseline">{format(document.settings.essenceHealthBaseline)}×</FactRow>
          <FactRow label="Health factor bounds">{format(document.settings.essenceHealthFactorMin)}–{format(document.settings.essenceHealthFactorMax)}</FactRow>
        </FactList>
        <MechanicsRules rules={rulesFor('essence')} {registry} />
      {/if}
    </Section>
    <Section id="settings" title="Settings" icon="text">
      {#if 'unavailable' in document.settings}
        <p>{document.settings.unavailable}</p>
      {:else}
        <MechanicsRules rules={rulesFor('settings')} {registry} />
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
  </Sections>
</article>

<style>
  p { margin: 0 0 .8rem; line-height: 1.55; }
  p:last-child { margin-bottom: 0; }
</style>
