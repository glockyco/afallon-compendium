<script lang="ts">
  import { base } from '$app/paths';
  import type { NpcStatRow, PublicKindEntry, PublicNpc } from '@afallon/contracts/public';
  import { categoryLabel } from '@afallon/contracts/public';
  import EntityLink from '../../EntityLink.svelte';
  import { creatureTypeLabel, durationRangeText, formatNumber, killExperienceText, levelText, listText, nameOf, npcLevelText, npcTypeLabel, onlyFriendlyRoles, rangeText, roleLabel, signedAmount } from '../../format';
  import { entityOnMap } from '../../map-links';
  import AnswerCard from '../AnswerCard.svelte';
  import DetailFrame from '../DetailFrame.svelte';
  import FactsCard from '../FactsCard.svelte';
  import FactList from '../FactList.svelte';
  import SideCard from '../SideCard.svelte';
  import FactRow from '../FactRow.svelte';
  import HowItWorks from '../HowItWorks.svelte';
  import LinkGrid from '../LinkGrid.svelte';
  import { calculateKillAward, nearestCreatureLevel } from '../kill-calculator';
  import LevelControl from '../LevelControl.svelte';
  import { npcStatAmount, npcStatDisplay, projectNpcStat } from '../npc-stats';
  import { CHARACTER_LEVEL } from '../../reader-levels';
  import NpcFlightsSection from '../sections/NpcFlightsSection.svelte';
  import NpcEffectsSection from '../sections/NpcEffectsSection.svelte';
  import RelationTable from '../RelationTable.svelte';
  import type { RelationColumn } from '../relation-table';
  import { npcQuestRows } from '../quest-rows';
  import AbilitiesSection from '../sections/AbilitiesSection.svelte';
  import DropsSection from '../sections/DropsSection.svelte';
  import LocationsSection from '../sections/LocationsSection.svelte';
  import QuestRowsSection from '../sections/QuestRowsSection.svelte';
  import VariantsSection from '../sections/VariantsSection.svelte';
  import VendorSection from '../sections/VendorSection.svelte';
  import TitleBlock, { type TitleFact } from '../TitleBlock.svelte';
  import Section from '../Section.svelte';
  import Sections from '../Sections.svelte';

  export let document: PublicNpc;
  export let registry: PublicKindEntry[];

  $: facts = document.facts;
  $: combat = !onlyFriendlyRoles(facts.roles);
  $: variantTable = document.variants.length > 1 && (document.variantFields.length > 0 || document.drops.some((row) => row.variants));
  $: portrait = document.art.portrait;
  $: titleArt = portrait ?? (document.adventurer && document.adventurer.class.key !== null ? document.adventurer.class.icon : undefined);
  $: typeLine = [npcTypeLabel(facts.npcType), ...facts.roles.map((role) => categoryLabel(roleLabel(role))), ...(!facts.roles.length && document.locations.length ? [creatureTypeLabel(facts.creatureType)] : [])].filter((part, index, parts) => part && parts.indexOf(part) === index).join(' · ');
  $: showFactionInTitle = Boolean(facts.faction && (document.flights?.length || !document.locations.length && !document.adventurer));
  $: titleFacts = [
    ...(document.bossOf.length ? [{ label: 'Boss of', refs: document.bossOf }] : []),
    ...(showFactionInTitle && facts.faction ? [{ label: 'Faction', refs: [facts.faction] }] : []),
    ...(facts.tameable ? [{ text: 'Hunter Pet' }, { text: 'Can be tamed' }] : []),
  ] satisfies TitleFact[];
  const combatOrder = ['Health', 'Strength', 'Armor', 'Magic Armor', 'Movement Speed'];
  const primaryStatNames = ['Health', 'Strength', 'Armor', 'Magic Armor'] as const;
  const combatRank = (name: string) => { const index = combatOrder.indexOf(name); return index < 0 ? combatOrder.length : index; };
  const statLabel = (stat: NpcStatRow) => { const name = nameOf(stat.stat); return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase(); };
  function groupStats(stats: NpcStatRow[], level: number | undefined) {
    const effective: NpcStatRow[] = [], other: NpcStatRow[] = [];
    for (const stat of stats) {
      if (projectNpcStat(stat, level) !== undefined) effective.push(stat);
      else if (stat.amount !== 0) other.push(stat);
    }
    return { effective, other };
  }
  $: combatStats = facts.stats.filter((stat) => stat.amount !== 0 || stat.perLevel || stat.startingValue)
    .sort((left, right) => combatRank(nameOf(left.stat)) - combatRank(nameOf(right.stat)));
  $: statSource = document.locations.find((location) => location.level);
  $: statMin = statSource?.level?.min ?? 1;
  $: statMax = Math.max(statMin, statSource?.level?.max ?? facts.experience?.levelCap ?? statMin);
  let statLevel = 1;
  $: statLevel = Math.min(statMax, Math.max(statMin, statLevel));
  $: statGroups = groupStats(combatStats, statSource ? statLevel : undefined);
  $: primaryStats = primaryStatNames.flatMap((name) => {
    const stat = statGroups.effective.find((row) => nameOf(row.stat) === name);
    return stat && (name !== 'Health' || (projectNpcStat(stat, statLevel) ?? 0) > 0) ? [stat] : [];
  });
  $: health = primaryStats.find((stat) => nameOf(stat.stat) === 'Health');
  $: boss = document.bossOf.length > 0 || facts.roles.some((role) => roleLabel(role) === 'Boss');
  $: hasCombatStats = combat && !adventurer && document.locations.length > 0 && primaryStats.length > 0;
  $: variableStatLevel = statSource?.level && statMax > statMin && !boss;
  $: hours = adventurer?.joinAfterHours ?? 0;
  $: summaryFacts = adventurer ? [
    ...(adventurer.race ? [{ label: 'Race', value: nameOf(adventurer.race) }] : []),
    { label: 'Party role', value: adventurer.role, ...(adventurer.defaultRole ? { note: 'By default' } : {}), ...(rosterGuide ? { guide: rosterGuide } : {}) },
  ] : [
    ...(facts.level?.min ? [{ label: 'Level', value: levelText(facts.level), ...(facts.level.scales ? { note: 'Scales with the player' } : {}) }] : []),
    ...(combat && document.locations.length && !kill && facts.experience && (facts.experience.max > 0 || facts.experience.perLevel > 0) ? [{ label: 'Experience', value: killExperienceText(facts.experience, facts.level), note: 'Per kill', ...(experienceGuide ? { guide: experienceGuide } : {}) }] : []),
    ...(combat && document.locations.length && !document.adventurerGear && facts.respawn && facts.respawn.max > 0 ? [{ label: 'Respawn', value: durationRangeText(facts.respawn.min, facts.respawn.max) }] : []),
  ];
  // An adventurer's gear preference: the armor type and weapon types it takes, and the stat it values most in gear. With
  // the adventurer's Gear card it opens that card, and otherwise it is a fact of the side.
  $: preference = facts.lootSpecialization && (facts.lootSpecialization.armorType || facts.lootSpecialization.weaponTypes.length || facts.lootSpecialization.stat) ? facts.lootSpecialization : undefined;
  $: preferredGear = preference ? [...(preference.armorType ? [`${categoryLabel(preference.armorType)} armor`] : []), ...preference.weaponTypes.map(categoryLabel)] : [];
  $: moreFacts = Boolean(facts.tameable || facts.faction && !showFactionInTitle || facts.species || facts.family || facts.aggroRange !== undefined && facts.aggroRange > 0 && combat && document.locations.length || facts.immunities.length && combat || preference && !gear || document.factionRewards.length || document.linkedNpc);
  $: experienceGuide = document.placedRules.find((rule) => rule.target === 'experience');
  $: adventurerGuide = document.placedRules.find((rule) => rule.target === 'adventurers');
  $: gearGuide = document.placedRules.find((rule) => rule.target === 'adventurer-gear');
  // Kill experience at the reader's character level: the creature spawns at the level nearest to the reader's within its
  // range, and the level difference changes the roll. Followers, Heroic, and bonuses are left to the kill calculator.
  let characterLevel = 1;
  $: kill = combat && document.locations.length && facts.experience?.levelDifference && facts.experience.levelCap && facts.level && (facts.experience.max > 0 || facts.experience.perLevel > 0) ? facts.experience : undefined;
  // A creature whose level varies gets one creature-level choice, shared by its combat stats and its experience. Its
  // first value is the level that the creature spawns at for the reader's level.
  $: spawnLevel = kill && facts.level ? nearestCreatureLevel(facts.level, characterLevel, kill.levelCap!) : undefined;
  $: levelVaries = Boolean(facts.level && facts.level.max !== undefined && facts.level.max > facts.level.min);
  $: creatureLevel = levelVaries && facts.level ? Math.min(facts.level.max ?? statLevel, Math.max(facts.level.min, statLevel)) : spawnLevel;
  $: creatureLevelId = `npc-level:${document.ref.key}`;
  $: award = kill && creatureLevel !== undefined ? calculateKillAward({ minExperience: kill.min, maxExperience: kill.max, experiencePerLevel: kill.perLevel,
    higherModifier: kill.levelDifference!.higher, lowerModifier: kill.levelDifference!.lower }, creatureLevel, characterLevel, undefined, 0, 0).award : undefined;
  $: gear = document.adventurerGear;
  // An adventurer of the world roster: what the game sets up for it, with the guide's roster.
  $: adventurer = document.adventurer;
  $: rosterGuide = document.placedRules.find((rule) => rule.target === 'adventurer');
  // Lead with the NPC's actual service or loot. Empty drops and absent placements are not primary answers.
  $: answer = document.flights?.length ? 'flights' : document.drops.length ? 'drops' : gear ? 'gear' : undefined;
  $: hasSide = Boolean(adventurer || kill || combat && summaryFacts.length > 1 || facts.level?.scales || (moreFacts && !document.flights?.length) || document.description && !document.flights?.length);
  $: identityLine = [typeLine, ...(!hasSide && summaryFacts.length === 1 ? [summaryFacts[0]!.label === 'Level' && facts.level ? `Level ${npcLevelText(facts.level)}` : `${summaryFacts[0]!.label} ${summaryFacts[0]!.value}`] : [])].filter(Boolean).join(' · ');
  const statColumns: RelationColumn<NpcStatRow>[] = [
    { id: 'stat', label: 'Stat', value: (row) => nameOf(row.stat) },
    { id: 'start', label: 'Start', numeric: true, value: (row) => row.startingValue },
    { id: 'bonus', label: 'Bonus', numeric: true, value: (row) => row.amount },
    { id: 'perLevel', label: 'Per Level', numeric: true, value: (row) => row.perLevel },
  ];
  const kitColumns: RelationColumn<NonNullable<PublicNpc['adventurerGear']>['kit'][number]>[] = [
    { id: 'item', label: 'Item', value: (row) => nameOf(row.item), sort: (row) => nameOf(row.item) },
    { id: 'type', label: 'Type', value: (row) => row.type, sort: (row) => row.type },
  ];
</script>

<DetailFrame answer={answer !== undefined} side={hasSide} mobileSideFirst={Boolean(adventurer)}>
  <svelte:fragment slot="head">
    <TitleBlock name={document.ref.name} typeLine={identityLine} facts={titleFacts} imageUrl={titleArt ? `${base}/data/${titleArt.url}` : undefined} portrait={Boolean(portrait)} mapHref={document.spotCount ? entityOnMap(document.ref.key) : undefined} {registry} />
    {#if !adventurer && answer === 'drops' && combat && facts.level?.min}
      <div class="mobile-combat" aria-label={health ? 'Level and health' : 'Level'}>
        <FactList><FactRow label="Level" note={facts.level.scales ? 'Scales with the player' : undefined}>{levelText(facts.level)}</FactRow>{#if health}<FactRow label="Health">{npcStatDisplay(health, statLevel)}</FactRow>{/if}</FactList>
      </div>
    {/if}
  </svelte:fragment>

  <svelte:fragment slot="answer">
    {#if answer === 'flights' && document.flights}
      <AnswerCard title="Where you can fly" id="flights">
        <NpcFlightsSection flights={document.flights} {registry} />
      </AnswerCard>
    {:else if answer === 'drops'}
      <AnswerCard title="Drops" id="drops">
        <DropsSection rows={document.drops} variants={document.variants} name={document.ref.name} guide={document.placedRules.find((rule) => rule.target === 'drops')} {registry} answer />
      </AnswerCard>
    {:else if answer === 'gear' && gear}
      <AnswerCard title="Gear" id="gear">
        <div class="c-stack">
          {#if preference}<p>{document.ref.name}{#if preferredGear.length}{' '}prefers {listText(preferredGear)}{/if}{#if preference.stat}{preferredGear.length ? ', and' : ''}{' '}favours <EntityLink ref={preference.stat} {registry} /> in gear{/if}.</p>{/if}
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
    {#if hasSide}
      <div class:boss-facts={!adventurer && answer === 'drops' && combat && Boolean(facts.level?.min && health)}>
      <FactsCard facts={summaryFacts} title={adventurer ? 'Adventurer' : undefined}>
        {#if adventurer}<FactRow label="Class"><EntityLink ref={adventurer.class} {registry} /></FactRow>{/if}
          {#if facts.faction && !showFactionInTitle}<FactRow label="Faction"><EntityLink ref={facts.faction} {registry} /></FactRow>{/if}
          {#if facts.species}<FactRow label="Species"><EntityLink ref={facts.species} {registry} /></FactRow>{/if}
          {#if facts.family}<FactRow label="Family">{categoryLabel(facts.family)}</FactRow>{/if}
          {#if facts.tameable}<FactRow label="Taming">{#if document.hunter}<EntityLink ref={document.hunter} {registry} />{:else}Hunter{/if} of its level or higher, with no pet, within&nbsp;30&nbsp;m</FactRow>{/if}
          {#if combat && document.locations.length && facts.aggroRange !== undefined && facts.aggroRange > 0}<FactRow label="Aggro range">{formatNumber(facts.aggroRange)}&nbsp;m</FactRow>{/if}
          {#if combat && facts.immunities.length}<FactRow label="Immune to">{facts.immunities.map(categoryLabel).join(', ')}</FactRow>{/if}
          {#if preference && !gear}<FactRow label="Gear preference">{[preference.armorType ? `${categoryLabel(preference.armorType)} armor` : '', ...preference.weaponTypes.map(categoryLabel)].filter(Boolean).join(', ')}{#if preference.stat}{preference.armorType || preference.weaponTypes.length ? ', favours ' : 'Favours '}<EntityLink ref={preference.stat} {registry} />{/if}{#if gearGuide}<HowItWorks guide={gearGuide.guide} section={gearGuide.section} label="How adventurers choose gear" />{/if}</FactRow>{/if}
          {#if document.factionRewards.length}<FactRow label="Faction standing per kill">{#each document.factionRewards as reward, index}{index ? ', ' : ''}<EntityLink ref={reward.counterpart} {registry} /> {signedAmount(reward.amount)}{/each}</FactRow>{/if}
          {#if document.linkedNpc}<FactRow label="Linked NPC"><EntityLink ref={document.linkedNpc} {registry} /></FactRow>{/if}
        <svelte:fragment slot="after">{#if document.description && !document.flights?.length && !adventurer}<p class="description">{document.description}</p>{/if}</svelte:fragment>
      </FactsCard>
      </div>
    {/if}
    {#if kill && award && creatureLevel !== undefined}
      <SideCard title="Experience per kill">
        <div class="experience">
          <LevelControl id="npc-character-level" readerId={CHARACTER_LEVEL} label="Your level" min={1} max={kill.levelCap ?? 1} fallback={facts.level?.min ?? 1} compact slider={false} bind:level={characterLevel} />
          {#if levelVaries && facts.level}<LevelControl id="npc-experience-creature-level" readerId={creatureLevelId} label="Creature level" min={facts.level.min} max={facts.level.max ?? facts.level.min} fallback={spawnLevel ?? facts.level.min} compact slider={false} bind:level={statLevel} />{/if}
          <p><strong>{rangeText(award.low, award.high)}</strong> experience</p>
          {#if experienceGuide}<a class="c-link" href={`${base}/mechanics/${experienceGuide.guide.slug}/#try-it-on-a-creature`}>Kill calculator</a>{/if}
        </div>
      </SideCard>
    {/if}
    {#if adventurer}
      <SideCard title="Arrival">
        <FactList>
          <FactRow label="Starting level">{formatNumber(adventurer.startingLevel)}</FactRow>
          <FactRow label="Joins">{hours ? `After ${formatNumber(hours)} ${hours === 1 ? 'hour' : 'hours'} of play` : 'At the start'}</FactRow>
        </FactList>
        {#if adventurerGuide}<HowItWorks guide={adventurerGuide.guide} section={adventurerGuide.section} label="How adventurers join your party" />{/if}
      </SideCard>
    {/if}
  </svelte:fragment>

  <Sections>
    {#if hasCombatStats}
      <Section id="combat-stats" title="Combat Stats" line={statSource?.level ? `In ${statSource.label}, level ${npcLevelText({ ...statSource.level, scales: false })}` : undefined} actionVisible={Boolean(variableStatLevel)}>
        <svelte:fragment slot="action">
          {#if variableStatLevel && statSource}
            <span class="combat-control"><span class="mobile-level-label" aria-hidden="true">Level</span><LevelControl id="npc-creature-level" readerId={creatureLevelId} label="Creature level" min={statMin} max={statMax} fallback={spawnLevel !== undefined ? Math.min(statMax, Math.max(statMin, spawnLevel)) : statMin} compact slider={false} bind:level={statLevel} /></span>
          {/if}
        </svelte:fragment>
        <dl class="combat-stats" style={`--stat-columns: ${Math.min(4, primaryStats.length)}; --phone-columns: ${primaryStats.length === 4 ? 2 : primaryStats.length}`}>
          {#each primaryStats as stat}
            <div><dt>{statLabel(stat)}</dt><dd>{npcStatDisplay(stat, statLevel)}</dd></div>
          {/each}
        </dl>
        <details class="stat-method c-disclosure">
          <summary>How these are calculated</summary>
          <p class="stat-formula">Each stat starts at a value that every creature shares. This creature adds its own bonus to that, and gains more with each level.</p>
          <RelationTable columns={statColumns} rows={primaryStats} label="How combat stats are calculated" mobileLabelNumbers>
            <svelte:fragment slot="cell" let:row let:column>
              {#if column === 'stat'}{statLabel(row)}
              {:else if column === 'start'}{formatNumber(row.startingValue ?? 0)}
              {:else if column === 'bonus'}{npcStatAmount(row.amount, row.isPercent)}
              {:else}{npcStatAmount(row.perLevel ?? 0, row.isPercent)}{/if}
            </svelte:fragment>
          </RelationTable>
        </details>
        {#if statGroups.other.length}<p class="stat-extra">It also has {listText(statGroups.other.map((stat) => `${npcStatAmount(stat.amount, stat.isPercent)} ${statLabel(stat)}`))}.</p>{/if}
      </Section>
    {/if}
    {#if !answer && !document.summonedBy.length && !document.spawnedBy.length && !document.recruitedByActions.length && !document.appliedEffects.length && !document.sells.length && !document.quests.length && !document.usedInQuests.length && !document.abilityPhases.some((phase) => phase.abilities.length) && !document.locations.length && !adventurer && !variantTable}
      <p class="empty">No location or services are known for this NPC.</p>
    {/if}
    {#if document.summonedBy.length}
      <Section id="summoned-by" title="Summoned By" count={document.summonedBy.length}>
        <p>These effects summon {document.variants.length > 1 ? `one version of ${document.ref.name}` : document.ref.name}.</p>
        <LinkGrid refs={document.summonedBy} {registry} />
      </Section>
    {/if}
    {#if document.spawnedBy.length && !document.locations.length}
      <Section id="spawned-by" title="Spawned By" count={document.spawnedBy.length}>
        {#each document.spawnedBy as spawner}
          <p>A spawner in <EntityLink ref={spawner.place} {registry} /> can spawn {document.ref.name}. No map spot is available for this spawner.</p>
        {/each}
      </Section>
    {/if}
    {#if document.recruitedByActions.length}
      <Section id="recruited-by" title="Recruitment">
        {#each document.recruitedByActions as action}
          <p>A {action.label.toLowerCase()} action adds {document.ref.name} to the group{#if action.owner}{' '}in <EntityLink ref={action.owner} {registry} />{/if}.</p>
        {/each}
      </Section>
    {/if}
    {#if document.sells.length}<VendorSection id="sells" title="Sells" counterpartLabel="Item" rows={document.sells} variants={document.variants} sort={{ id: 'name', dir: 'asc' }} {registry} />{/if}
    {#if !document.sells.length && !document.locations.length}<AbilitiesSection phases={document.abilityPhases} {registry} />{/if}
    {#if !document.sells.length && (document.quests.length || document.usedInQuests.length)}<QuestRowsSection id="quests" title="Quests" roleLabel="Role" rows={npcQuestRows(document.quests, document.usedInQuests)} {registry} />{/if}
    {#if adventurer && document.appliedEffects.length}<NpcEffectsSection rows={document.appliedEffects} name={document.ref.name} {registry} />{/if}
    {#if document.locations.length || adventurer}
      <LocationsSection {document} {registry} {variantTable}
        emptyText={adventurerGuide ? `Once ${document.ref.name} has joined, find them with Find in the Friends panel.` : undefined} />
    {/if}
    {#if adventurer}
      <Section id="talents" title="Talents">
        <div class="c-stack">
          <p>{document.ref.name} learns the talents of the <EntityLink ref={adventurer.class} {registry} /> class as they level{#if adventurer.preferredTree}, and spends talent points in <EntityLink ref={adventurer.preferredTree} {registry} tooltip={false} /> first{/if}.{#if adventurer.priorityAbilities.length}{' '}{document.ref.name} learns these abilities first when their requirements allow:{/if}</p>
          {#if adventurer.priorityAbilities.length}<ul class="learns">{#each adventurer.priorityAbilities as ability}<li><EntityLink ref={ability} {registry} /></li>{/each}</ul>{/if}
          {#if rosterGuide}<HowItWorks guide={rosterGuide.guide} section={rosterGuide.section} label="How adventurers learn talents" />{/if}
        </div>
      </Section>
    {/if}
    {#if document.sells.length || document.locations.length}<AbilitiesSection phases={document.abilityPhases} {registry} />{/if}
    {#if !adventurer && document.appliedEffects.length}<NpcEffectsSection rows={document.appliedEffects} name={document.ref.name} {registry} />{/if}
    {#if document.sells.length}<QuestRowsSection id="quests" title="Quests" roleLabel="Role" rows={npcQuestRows(document.quests, document.usedInQuests)} {registry} />{/if}
    {#if variantTable}<VariantsSection {document} {registry} />{/if}
  </Sections>
</DetailFrame>

<style>
  .learns { display: grid; gap: .45rem 1rem; grid-template-columns: repeat(auto-fill, minmax(12rem, 1fr)); margin: 0; padding: 0; list-style: none; }
  .combat-control { display: inline-flex; align-items: center; gap: .35rem; }
  .mobile-level-label { display: none; color: var(--c-text-dim); font-size: var(--c-text-small); }
  /* One bordered strip, like the other tables: a label above each value, with dividers between the stats. */
  .combat-stats { display: grid; grid-template-columns: repeat(var(--stat-columns), minmax(0, 1fr)); margin: 0; border: 1px solid var(--c-line-soft); border-radius: var(--c-radius); background: var(--c-surface-1); }
  .combat-stats > div { display: flex; flex-direction: column; gap: .2rem; min-width: 0; padding: .65rem .9rem; }
  .combat-stats > div + div { border-left: 1px solid var(--c-line-soft); }
  .combat-stats dt { color: var(--c-text-mute); font-size: var(--c-text-label); font-weight: 600; }
  .combat-stats dd { margin: 0; color: var(--c-text-strong); font-weight: 600; font-variant-numeric: tabular-nums; white-space: nowrap; }
  .stat-formula, .stat-extra { margin: 0; color: var(--c-text-dim); }
  .stat-method .stat-formula { margin-bottom: .6rem; }
  .experience { display: grid; justify-items: start; gap: .65rem; }
  .experience p { margin: 0; }
  /* Both level controls share one label column, so their steppers line up. */
  .experience { grid-template-columns: max-content auto; align-items: center; column-gap: .6rem; }
  .experience :global(.level-control) { display: contents; }
  .experience > p, .experience > a { grid-column: 1 / -1; }
  .description { color: var(--c-text-dim); }
  .empty { color: var(--c-text-dim); }
  .mobile-combat { display: none; }
  @media (max-width: 640px) {
    /* Four stats make two rows of two; fewer stay on one row. */
    .combat-stats { grid-template-columns: repeat(var(--phone-columns), minmax(0, 1fr)); }
    .combat-stats > div { padding: .6rem .7rem; }
    .combat-stats[style*='--phone-columns: 2'] > div:nth-child(odd) { border-left: 0; }
    .combat-stats[style*='--phone-columns: 2'] > div:nth-child(n + 3) { border-top: 1px solid var(--c-line-soft); }
    .mobile-level-label { display: inline; }
    .combat-control :global(.level-control > label) { display: none; }
  }
  @media (max-width: 1023px) {
    .mobile-combat { display: block; margin-top: 1rem; padding: .8rem 1rem; border: 1px solid var(--c-frame); border-radius: var(--c-radius); background: var(--c-surface-1); }
    .mobile-combat :global(.fact-list dl) { grid-template-columns: max-content minmax(0, 1fr); }
    .mobile-combat :global(dd) { text-align: right; }
    .boss-facts :global(.fact-list dl > .fact-row:first-child) { display: none; }
  }
</style>
