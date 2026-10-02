<script lang="ts">
  import { base } from '$app/paths';
  import type { PublicKindEntry, PublicNpc } from '@afallon/contracts/public';
  import { categoryLabel } from '@afallon/contracts/public';
  import EntityLink from '../../EntityLink.svelte';
  import { creatureTypeLabel, durationRangeText, formatNumber, killExperienceText, nameOf, npcLevelText, npcTypeLabel, onlyFriendlyRoles, roleLabel, signedAmount } from '../../format';
  import { entityOnMap } from '../../map-links';
  import AnswerCard from '../AnswerCard.svelte';
  import DetailFrame from '../DetailFrame.svelte';
  import FactList from '../FactList.svelte';
  import FactRow from '../FactRow.svelte';
  import HowItWorks from '../HowItWorks.svelte';
  import { npcQuestRows } from '../quest-rows';
  import AbilitiesSection from '../sections/AbilitiesSection.svelte';
  import DropsSection from '../sections/DropsSection.svelte';
  import LocationsSection from '../sections/LocationsSection.svelte';
  import QuestRowsSection from '../sections/QuestRowsSection.svelte';
  import VariantsSection from '../sections/VariantsSection.svelte';
  import VendorSection from '../sections/VendorSection.svelte';
  import StatStrip, { type Stat } from '../StatStrip.svelte';
  import TitleBlock, { type TitleFact } from '../TitleBlock.svelte';
  import Sections from '../Sections.svelte';

  export let document: PublicNpc;
  export let registry: PublicKindEntry[];

  $: facts = document.facts;
  $: combat = !onlyFriendlyRoles(facts.roles);
  $: variantTable = document.variants.length > 1 && (document.variantFields.length > 0 || document.drops.some((row) => row.variants));
  $: portrait = document.art.portrait;
  $: typeLine = [npcTypeLabel(facts.npcType), creatureTypeLabel(facts.creatureType), ...facts.roles.map(roleLabel)].filter((part, index, parts) => part && parts.indexOf(part) === index).join(' · ');
  $: titleFacts = [
    ...(document.bossOf.length ? [{ label: 'Boss of', refs: document.bossOf }] : []),
    ...(facts.tameable ? [{ label: 'Hunter pet', text: 'Can be tamed' }] : []),
  ] satisfies TitleFact[];
  $: health = facts.stats.find((stat) => nameOf(stat.stat).toLowerCase() === 'health' && stat.amount > 0);
  const combatOrder = ['Strength', 'Armor', 'Magic Armor', 'Movement Speed'];
  const combatRank = (name: string) => { const index = combatOrder.indexOf(name); return index < 0 ? combatOrder.length : index; };
  $: combatStats = facts.stats.filter((stat) => stat.amount !== 0 && stat !== health)
    .sort((left, right) => combatRank(nameOf(left.stat)) - combatRank(nameOf(right.stat)));
  $: stats = [
    ...(facts.level?.min ? [{ label: 'Level', value: npcLevelText(facts.level) }] : []),
    ...(combat && health ? [{ label: 'Health', value: formatNumber(health.amount) }] : []),
    ...(combat && facts.experience && (facts.experience.max > 0 || facts.experience.perLevel > 0) ? [{ label: 'Experience', value: killExperienceText(facts.experience, facts.level), note: 'Per kill', ...(experienceGuide ? { guide: experienceGuide } : {}) }] : []),
    ...(combat && facts.respawn && facts.respawn.max > 0 ? [{ label: 'Respawn', value: durationRangeText(facts.respawn.min, facts.respawn.max) }] : []),
  ] satisfies Stat[];
  $: loot = facts.lootSpecialization && (facts.lootSpecialization.armorType || facts.lootSpecialization.weaponTypes.length || facts.lootSpecialization.stat) ? facts.lootSpecialization : undefined;
  $: moreFacts = Boolean(adventurerGuide || facts.tameable || facts.faction || facts.species || facts.family || facts.aggroRange !== undefined && facts.aggroRange > 0 && combat || facts.immunities.length && combat || loot || document.factionRewards.length || document.linkedNpc);
  $: experienceGuide = document.placedRules.find((rule) => rule.target === 'experience');
  $: adventurerGuide = document.placedRules.find((rule) => rule.target === 'adventurers');
</script>

<DetailFrame>
  <svelte:fragment slot="head">
    <TitleBlock name={document.ref.name} {typeLine} facts={titleFacts} imageUrl={portrait ? `${base}/data/${portrait.url}` : undefined} portrait={Boolean(portrait)} mapHref={document.spotCount ? entityOnMap(document.ref.key) : undefined} {registry}>
      <StatStrip {stats} />
    </TitleBlock>
  </svelte:fragment>

  <svelte:fragment slot="answer">
    <AnswerCard title="Drops" id="drops">
      <DropsSection rows={document.drops} variants={document.variants} {registry} answer />
    </AnswerCard>
  </svelte:fragment>

  <svelte:fragment slot="side">
    {#if document.description}<p class="description">{document.description}</p>{/if}
    {#if combat && combatStats.length || moreFacts}
      <div class="side-card">
        <FactList title={combat ? 'Combat' : 'About'}>
          {#each (combat ? combatStats : []) as stat}<FactRow label={nameOf(stat.stat)}>{formatNumber(stat.amount)}{stat.isPercent ? '%' : ''}</FactRow>{/each}
          {#if facts.faction}<FactRow label="Faction"><EntityLink ref={facts.faction} {registry} /></FactRow>{/if}
          {#if facts.species}<FactRow label="Species"><EntityLink ref={facts.species} {registry} /></FactRow>{/if}
          {#if facts.family}<FactRow label="Family">{categoryLabel(facts.family)}</FactRow>{/if}
          {#if facts.tameable}<FactRow label="Taming">{#if document.hunter}<EntityLink ref={document.hunter} {registry} />{:else}Hunter{/if} of its level or higher, with no pet, within 30 m</FactRow>{/if}
          {#if combat && facts.aggroRange !== undefined && facts.aggroRange > 0}<FactRow label="Aggro range">{formatNumber(facts.aggroRange)} m</FactRow>{/if}
          {#if combat && facts.immunities.length}<FactRow label="Immune to">{facts.immunities.map(categoryLabel).join(', ')}</FactRow>{/if}
          {#if loot}<FactRow label="Gear drops favour">{[loot.armorType ? categoryLabel(loot.armorType) : '', ...loot.weaponTypes.map(categoryLabel)].filter(Boolean).join(', ')}{#if loot.stat}{loot.armorType || loot.weaponTypes.length ? ', ' : ''}<EntityLink ref={loot.stat} {registry} />{/if}</FactRow>{/if}
          {#if document.factionRewards.length}<FactRow label="Faction standing per kill">{#each document.factionRewards as reward, index}{index ? ', ' : ''}<EntityLink ref={reward.counterpart} {registry} /> {signedAmount(reward.amount)}{/each}</FactRow>{/if}
          {#if document.linkedNpc}<FactRow label="Linked NPC"><EntityLink ref={document.linkedNpc} {registry} /></FactRow>{/if}
          {#if adventurerGuide}<FactRow label="Adventurers"><HowItWorks guide={adventurerGuide.guide} section={adventurerGuide.section} label="How adventurers join your party" /></FactRow>{/if}
        </FactList>
      </div>
    {/if}
    <AbilitiesSection phases={document.abilityPhases} {registry} chips />
  </svelte:fragment>

  <Sections>
    <LocationsSection {document} {registry} {variantTable} />
    <VendorSection id="sells" title="Sells" counterpartLabel="Item" rows={document.sells} variants={document.variants} sort={{ id: 'name', dir: 'asc' }} {registry} />
    <QuestRowsSection id="quests" title="Quests" roleLabel="Role" rows={npcQuestRows(document.quests, document.usedInQuests)} {registry} />
    {#if variantTable}<VariantsSection {document} {registry} />{/if}
  </Sections>
</DetailFrame>

<style>
  .side-card { padding: 1rem; border: 1px solid var(--c-line-soft); border-radius: var(--c-radius); background: var(--c-surface-1); }
  .description { color: var(--c-text-dim); }
  /* Labels keep their own width and values take the rest, right-aligned, so a long value wraps instead of squeezing
     its label to nothing. */
  .side-card :global(.fact-list dl) { grid-template-columns: max-content minmax(0, 1fr); gap: .35rem .75rem; }
  .side-card :global(.fact-row dd) { text-align: right; }
</style>
