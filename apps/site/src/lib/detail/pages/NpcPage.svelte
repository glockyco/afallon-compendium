<script lang="ts">
  import { base } from '$app/paths';
  import type { PublicKindEntry, PublicNpc } from '@afallon/contracts/public';
  import { categoryLabel } from '@afallon/contracts/public';
  import EntityLink from '../../EntityLink.svelte';
  import { creatureTypeLabel, durationRangeText, formatNumber, joinText, killExperienceText, nameOf, npcLevelText, npcTypeLabel, onlyFriendlyRoles, rangeText, roleLabel, signedAmount } from '../../format';
  import { entityOnMap } from '../../map-links';
  import AnswerCard from '../AnswerCard.svelte';
  import DetailFrame from '../DetailFrame.svelte';
  import FactList from '../FactList.svelte';
  import FactRow from '../FactRow.svelte';
  import HowItWorks from '../HowItWorks.svelte';
  import { calculateKillAward, nearestCreatureLevel } from '../kill-calculator';
  import ReaderLevel from '../ReaderLevel.svelte';
  import { CHARACTER_LEVEL } from '../../reader-levels';
  import type { RelationColumn } from '../relation-table';
  import RelationTable from '../RelationTable.svelte';
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
    // A world adventurer that dies returns through its scene's spawn pool, not after its NPC record's respawn time.
    ...(combat && !document.adventurerGear && facts.respawn && facts.respawn.max > 0 ? [{ label: 'Respawn', value: durationRangeText(facts.respawn.min, facts.respawn.max) }] : []),
  ] satisfies Stat[];
  // An adventurer's gear preference: the armor type and weapon types it takes, and the stat it values most in gear.
  $: preference = facts.lootSpecialization && (facts.lootSpecialization.armorType || facts.lootSpecialization.weaponTypes.length || facts.lootSpecialization.stat) ? facts.lootSpecialization : undefined;
  $: moreFacts = Boolean(adventurerGuide || facts.tameable || facts.faction || facts.species || facts.family || facts.aggroRange !== undefined && facts.aggroRange > 0 && combat || facts.immunities.length && combat || preference || document.factionRewards.length || document.linkedNpc);
  $: experienceGuide = document.placedRules.find((rule) => rule.target === 'experience');
  $: adventurerGuide = document.placedRules.find((rule) => rule.target === 'adventurers');
  $: gearGuide = document.placedRules.find((rule) => rule.target === 'adventurer-gear');
  // Kill experience at the reader's character level: the creature spawns at the level nearest to the reader's within its
  // range, and the level difference changes the roll. Followers, Heroic, and bonuses are left to the kill calculator.
  let characterLevel = 1;
  $: kill = combat && facts.experience?.levelDifference && facts.experience.levelCap && facts.level && (facts.experience.max > 0 || facts.experience.perLevel > 0) ? facts.experience : undefined;
  $: creatureLevel = kill && facts.level ? nearestCreatureLevel(facts.level, characterLevel, kill.levelCap!) : undefined;
  $: award = kill && creatureLevel !== undefined ? calculateKillAward({ minExperience: kill.min, maxExperience: kill.max, experiencePerLevel: kill.perLevel,
    higherModifier: kill.levelDifference!.higher, lowerModifier: kill.levelDifference!.lower }, creatureLevel, characterLevel, undefined, 0, 0).award : undefined;
  $: gear = document.adventurerGear;
  // An adventurer of the world roster: what the game sets up for it, with the guide's roster.
  $: adventurer = document.adventurer;
  $: rosterGuide = document.placedRules.find((rule) => rule.target === 'adventurer');
  // The answer card says what you get from this NPC: its drops, an adventurer's gear, or for an NPC you fight that it
  // drops nothing. A friendly NPC without drops has no answer card, and its sections say what it offers.
  $: answer = document.drops.length ? 'drops' : gear ? 'gear' : combat ? 'drops' : undefined;
  const kitColumns: RelationColumn<NonNullable<PublicNpc['adventurerGear']>['kit'][number]>[] = [
    { id: 'item', label: 'Item', value: (row) => nameOf(row.item), sort: (row) => nameOf(row.item) },
    { id: 'type', label: 'Type', value: (row) => row.type, sort: (row) => row.type },
  ];
</script>

<DetailFrame answer={answer !== undefined}>
  <svelte:fragment slot="head">
    <TitleBlock name={document.ref.name} {typeLine} facts={titleFacts} imageUrl={portrait ? `${base}/data/${portrait.url}` : undefined} portrait={Boolean(portrait)} mapHref={document.spotCount ? entityOnMap(document.ref.key) : undefined} {registry}>
      <StatStrip {stats} />
    </TitleBlock>
  </svelte:fragment>

  <svelte:fragment slot="answer">
    {#if answer === 'drops'}
      <AnswerCard title="Drops" id="drops">
        <DropsSection rows={document.drops} variants={document.variants} name={document.ref.name} {registry} answer />
      </AnswerCard>
    {:else if answer === 'gear' && gear}
      <AnswerCard title="Gear" id="gear">
        <div class="c-stack">
          <p>After a job, {document.ref.name} has a {formatNumber(gear.rewardChance)}% chance to take an upgrade from the {#if gearGuide}<a class="c-link" href={`${base}/mechanics/${gearGuide.guide.slug}/#${gearGuide.section}`}>reward gear list</a>{:else}reward gear list{/if}.</p>
          {#if gear.kit.length}
            <p>{document.ref.name} also wears this gear kit, except where {document.ref.name}'s own gear is better.</p>
            <RelationTable columns={kitColumns} rows={gear.kit} label={`Gear kit of ${document.ref.name}`}>
              <svelte:fragment slot="cell" let:row let:column>{#if column === 'item'}<EntityLink ref={row.item} {registry} />{:else}{row.type ?? ''}{/if}</svelte:fragment>
            </RelationTable>
          {/if}
          {#if gearGuide}<HowItWorks guide={gearGuide.guide} section={gearGuide.section} label="How adventurer gear works" />{/if}
        </div>
      </AnswerCard>
    {/if}
  </svelte:fragment>

  <svelte:fragment slot="side">
    {#if document.description}<p class="description">{document.description}</p>{/if}
    {#if adventurer}
      <div class="side-card adventurer">
        <FactList title="Adventurer">
          <FactRow label="Class"><EntityLink ref={adventurer.class} {registry} /></FactRow>
          {#if adventurer.race}<FactRow label="Race"><EntityLink ref={adventurer.race} {registry} /></FactRow>{/if}
          <FactRow label="Party role">{adventurer.role}{adventurer.defaultRole ? ' by default' : ''}</FactRow>
          {#if adventurer.preferredTree}<FactRow label="Preferred tree"><EntityLink ref={adventurer.preferredTree} {registry} tooltip={false} /></FactRow>{/if}
          {#if adventurer.priorityAbilities.length}<FactRow label="Learns first">{#each adventurer.priorityAbilities as ability, index}{index ? ', ' : ''}<EntityLink ref={ability} {registry} />{/each}</FactRow>{/if}
          <FactRow label="Starting level">{formatNumber(adventurer.startingLevel)}</FactRow>
          <FactRow label="Joins">{joinText(adventurer.joinAfterHours)}</FactRow>
        </FactList>
        {#if rosterGuide}<HowItWorks guide={rosterGuide.guide} section={rosterGuide.section} label="How adventurers join and level" />{/if}
      </div>
    {/if}
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
          {#if preference}<FactRow label="Gear preference">{[preference.armorType ? `${categoryLabel(preference.armorType)} armor` : '', ...preference.weaponTypes.map(categoryLabel)].filter(Boolean).join(', ')}{#if preference.stat}{preference.armorType || preference.weaponTypes.length ? ', favours ' : 'Favours '}<EntityLink ref={preference.stat} {registry} />{/if}{#if gearGuide}<HowItWorks guide={gearGuide.guide} section={gearGuide.section} label="How adventurers choose gear" />{/if}</FactRow>{/if}
          {#if document.factionRewards.length}<FactRow label="Faction standing per kill">{#each document.factionRewards as reward, index}{index ? ', ' : ''}<EntityLink ref={reward.counterpart} {registry} /> {signedAmount(reward.amount)}{/each}</FactRow>{/if}
          {#if document.linkedNpc}<FactRow label="Linked NPC"><EntityLink ref={document.linkedNpc} {registry} /></FactRow>{/if}
          {#if adventurerGuide}<FactRow label="Adventurers"><HowItWorks guide={adventurerGuide.guide} section={adventurerGuide.section} label="How adventurers join your party" /></FactRow>{/if}
        </FactList>
      </div>
    {/if}
    {#if kill && award && creatureLevel !== undefined}
      <div class="side-card kill">
        <h2>Experience per kill</h2>
        <ReaderLevel id="npc-character-level" readerId={CHARACTER_LEVEL} label="Your level" max={kill.levelCap ?? 1} fallback={facts.level?.min ?? 1} bind:level={characterLevel} />
        <p><strong>{rangeText(award.low, award.high)}</strong> experience for a level {formatNumber(creatureLevel)} {document.ref.name}.</p>
        {#if experienceGuide}<a class="c-link" href={`${base}/mechanics/${experienceGuide.guide.slug}/#try-it-on-a-creature`}>Followers, Heroic, and bonuses in the kill calculator</a>{/if}
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
  .kill { display: grid; gap: .75rem; }
  .adventurer { display: grid; gap: .75rem; }
  .kill h2 { color: var(--c-text-strong); font: 600 1.05rem/1.3 var(--c-serif); }
  .kill p { line-height: 1.5; }
  .kill a { width: fit-content; font-size: var(--c-text-small); }
  .description { color: var(--c-text-dim); }
  /* Labels keep their own width and values take the rest, right-aligned, so a long value wraps instead of squeezing
     its label to nothing. */
  .side-card :global(.fact-list dl) { grid-template-columns: max-content minmax(0, 1fr); gap: .35rem .75rem; }
  .side-card :global(.fact-row dd) { text-align: right; }
</style>
