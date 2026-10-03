<script lang="ts">
  import { base } from '$app/paths';
  import type { NpcStatRow, PublicKindEntry, PublicNpc } from '@afallon/contracts/public';
  import { categoryLabel } from '@afallon/contracts/public';
  import EntityLink from '../../EntityLink.svelte';
  import { creatureTypeLabel, durationRangeText, formatNumber, killExperienceText, listText, nameOf, npcLevelText, npcTypeLabel, onlyFriendlyRoles, rangeText, roleLabel, signedAmount } from '../../format';
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
    ...(facts.tameable ? [{ label: 'Hunter Pet', text: 'Can Be Tamed' }] : []),
  ] satisfies TitleFact[];
  const combatOrder = ['Health', 'Strength', 'Armor', 'Magic Armor', 'Movement Speed'];
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
  $: hours = adventurer?.joinAfterHours ?? 0;
  $: summaryFacts = adventurer ? [
    ...(adventurer.race ? [{ label: 'Race', value: nameOf(adventurer.race) }] : []),
    { label: 'Party role', value: adventurer.role, ...(adventurer.defaultRole ? { note: 'By default' } : {}), ...(rosterGuide ? { guide: rosterGuide } : {}) },
  ] : [
    ...(facts.level?.min ? [{ label: 'Level', value: npcLevelText(facts.level) }] : []),
    ...(combat && document.locations.length && facts.experience && (facts.experience.max > 0 || facts.experience.perLevel > 0) ? [{ label: 'Experience', value: killExperienceText(facts.experience, facts.level), note: 'Per kill', ...(experienceGuide ? { guide: experienceGuide } : {}) }] : []),
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
  $: creatureLevel = kill && facts.level ? nearestCreatureLevel(facts.level, characterLevel, kill.levelCap!) : undefined;
  $: award = kill && creatureLevel !== undefined ? calculateKillAward({ minExperience: kill.min, maxExperience: kill.max, experiencePerLevel: kill.perLevel,
    higherModifier: kill.levelDifference!.higher, lowerModifier: kill.levelDifference!.lower }, creatureLevel, characterLevel, undefined, 0, 0).award : undefined;
  $: gear = document.adventurerGear;
  // An adventurer of the world roster: what the game sets up for it, with the guide's roster.
  $: adventurer = document.adventurer;
  $: rosterGuide = document.placedRules.find((rule) => rule.target === 'adventurer');
  // Lead with the NPC's actual service or loot. Empty drops and absent placements are not primary answers.
  $: answer = document.flights?.length ? 'flights' : document.drops.length ? 'drops' : gear ? 'gear' : undefined;
  $: hasSide = Boolean(adventurer || combat && (combatStats.length || summaryFacts.length > 1 || kill) || (moreFacts && !document.flights?.length) || document.description && !document.flights?.length);
  $: identityLine = [typeLine, ...(!hasSide && summaryFacts.length === 1 ? [`${summaryFacts[0]!.label} ${summaryFacts[0]!.value.replace(', scales with the player', ', Scales with the Player')}`] : [])].filter(Boolean).join(' · ');
  const kitColumns: RelationColumn<NonNullable<PublicNpc['adventurerGear']>['kit'][number]>[] = [
    { id: 'item', label: 'Item', value: (row) => nameOf(row.item), sort: (row) => nameOf(row.item) },
    { id: 'type', label: 'Type', value: (row) => row.type, sort: (row) => row.type },
  ];
</script>

<DetailFrame answer={answer !== undefined} side={hasSide}>
  <svelte:fragment slot="head">
    <TitleBlock name={document.ref.name} typeLine={identityLine} facts={titleFacts} imageUrl={titleArt ? `${base}/data/${titleArt.url}` : undefined} portrait={Boolean(portrait)} mapHref={document.spotCount ? entityOnMap(document.ref.key) : undefined} {registry} />
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
      <FactsCard facts={summaryFacts} title={adventurer ? 'Adventurer' : undefined}>
        {#if adventurer}<FactRow label="Class"><EntityLink ref={adventurer.class} {registry} /></FactRow>{/if}
          {#if facts.faction && !showFactionInTitle}<FactRow label="Faction"><EntityLink ref={facts.faction} {registry} /></FactRow>{/if}
          {#if facts.species}<FactRow label="Species"><EntityLink ref={facts.species} {registry} /></FactRow>{/if}
          {#if facts.family}<FactRow label="Family">{categoryLabel(facts.family)}</FactRow>{/if}
          {#if facts.tameable}<FactRow label="Taming">{#if document.hunter}<EntityLink ref={document.hunter} {registry} />{:else}Hunter{/if} of its level or higher, with no pet, within 30 m</FactRow>{/if}
          {#if combat && document.locations.length && facts.aggroRange !== undefined && facts.aggroRange > 0}<FactRow label="Aggro range">{formatNumber(facts.aggroRange)} m</FactRow>{/if}
          {#if combat && facts.immunities.length}<FactRow label="Immune to">{facts.immunities.map(categoryLabel).join(', ')}</FactRow>{/if}
          {#if preference && !gear}<FactRow label="Gear preference">{[preference.armorType ? `${categoryLabel(preference.armorType)} armor` : '', ...preference.weaponTypes.map(categoryLabel)].filter(Boolean).join(', ')}{#if preference.stat}{preference.armorType || preference.weaponTypes.length ? ', favours ' : 'Favours '}<EntityLink ref={preference.stat} {registry} />{/if}{#if gearGuide}<HowItWorks guide={gearGuide.guide} section={gearGuide.section} label="How adventurers choose gear" />{/if}</FactRow>{/if}
          {#if document.factionRewards.length}<FactRow label="Faction standing per kill">{#each document.factionRewards as reward, index}{index ? ', ' : ''}<EntityLink ref={reward.counterpart} {registry} /> {signedAmount(reward.amount)}{/each}</FactRow>{/if}
          {#if document.linkedNpc}<FactRow label="Linked NPC"><EntityLink ref={document.linkedNpc} {registry} /></FactRow>{/if}
        <svelte:fragment slot="after">{#if document.description && !document.flights?.length && !adventurer}<p class="description">{document.description}</p>{/if}</svelte:fragment>
      </FactsCard>
      {#if combat && combatStats.length}
        <SideCard title="Creature Stats">
          {#if statSource?.level}
            <p class="stat-source">In {statSource.label}, level {npcLevelText({ ...statSource.level, scales: false })}.</p>
            {#if statMax > statMin}
              <LevelControl id="npc-creature-level" readerId={`npc-level:${document.ref.key}:${statSource.label}`} label="Creature level" min={statMin} max={statMax} fallback={statMin} bind:level={statLevel} />
            {/if}
          {/if}
          <FactList>
            {#each statGroups.effective as stat}
              <FactRow label={statLabel(stat)}>{npcStatDisplay(stat, statLevel)}</FactRow>
            {/each}
          </FactList>
          {#if statGroups.effective.length}<p class="stat-formula">Each stat is a shared starting value plus this creature's bonus plus a gain per level.</p>{/if}
          {#if statGroups.other.length}<p class="stat-extra">Also changes: {#each statGroups.other as stat, index}{index ? ', ' : ''}{statLabel(stat)} {npcStatAmount(stat.amount, stat.isPercent)}{/each}.</p>{/if}
          <details class="stat-method">
            <summary>How these are calculated</summary>
            <div class="c-table-scroll"><table class="c-table c-table--calculator">
              <thead><tr><th scope="col">Stat</th><th scope="col" class="c-num">Start</th><th scope="col" class="c-num">Bonus</th><th scope="col" class="c-num">Per Level</th></tr></thead>
              <tbody>{#each combatStats as stat}
                <tr><th scope="row">{statLabel(stat)}</th><td class="c-num">{stat.startingValue === undefined ? 'Unknown' : formatNumber(stat.startingValue)}</td><td class="c-num">{npcStatAmount(stat.amount, stat.isPercent)}</td><td class="c-num">{stat.perLevel === undefined ? 'Unknown' : npcStatAmount(stat.perLevel, stat.isPercent)}</td></tr>
              {/each}</tbody>
            </table></div>
          </details>
          {#if combatStats.some((stat) => nameOf(stat.stat) === 'Strength')}
            <p class="stat-source">A physical move that uses Strength adds it to that move's damage before defenses. The actual hit depends on the move and its target.</p>
          {/if}
        </SideCard>
      {/if}
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
    {#if kill && award && creatureLevel !== undefined}
      <SideCard title="Experience per kill">
        <LevelControl id="npc-character-level" readerId={CHARACTER_LEVEL} label="Your level" min={1} max={kill.levelCap ?? 1} fallback={facts.level?.min ?? 1} bind:level={characterLevel} />
        <p><strong>{rangeText(award.low, award.high)}</strong> experience for a level {formatNumber(creatureLevel)} {document.ref.name}.</p>
        {#if experienceGuide}<a class="c-link" href={`${base}/mechanics/${experienceGuide.guide.slug}/#try-it-on-a-creature`}>Followers, Heroic, and Bonuses in the Kill Calculator</a>{/if}
      </SideCard>
    {/if}
  </svelte:fragment>

  <Sections>
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
  .stat-source { margin: 0 0 .7rem; color: var(--c-text-dim); }
  .stat-formula, .stat-extra { margin: .65rem 0 0; color: var(--c-text-dim); font-size: var(--c-text-small); line-height: 1.5; }
  .stat-method { margin-top: .85rem; font-size: var(--c-text-small); }
  .stat-method summary { color: var(--c-accent); cursor: pointer; }
  .stat-method .c-table-scroll { margin-top: .6rem; }
  .stat-method :global(.c-table) { width: 100%; font-size: var(--c-text-small); }
  .description { color: var(--c-text-dim); }
  .empty { color: var(--c-text-dim); }
</style>
