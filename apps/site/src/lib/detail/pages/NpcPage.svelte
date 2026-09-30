<script lang="ts">
  import { base } from '$app/paths';
  import type { PublicKindEntry, PublicNpc } from '@afallon/contracts/public';
  import { categoryLabel } from '@afallon/contracts/public';
  import EntityLink from '../../EntityLink.svelte';
  import { creatureTypeLabel, formatNumber, nameOf, npcLevelText, npcTypeLabel, onlyFriendlyRoles, placesText, rangeText, roleLabel, signedAmount } from '../../format';
  import { entityOnMap } from '../../map-links';
  import FactList from '../FactList.svelte';
  import FactRow from '../FactRow.svelte';
  import Hero from '../Hero.svelte';
  import { npcQuestRows } from '../quest-rows';
  import AbilitiesSection from '../sections/AbilitiesSection.svelte';
  import DropsSection from '../sections/DropsSection.svelte';
  import LocationsSection from '../sections/LocationsSection.svelte';
  import QuestRowsSection from '../sections/QuestRowsSection.svelte';
  import VariantsSection from '../sections/VariantsSection.svelte';
  import VendorSection from '../sections/VendorSection.svelte';
  import TitleBlock, { type TitleFact } from '../TitleBlock.svelte';
  import Sections from '../Sections.svelte';

  export let document: PublicNpc;
  export let registry: PublicKindEntry[];

  $: facts = document.facts;
  // The Variants section appears when the records differ in facts or in loot. Otherwise the records differ only in where
  // and when they appear, which Where to find shows.
  $: variantTable = document.variants.length > 1 && (document.variantFields.length > 0 || document.drops.some((row) => row.variants));
  $: typeLabel = npcTypeLabel(facts.npcType);
  $: places = placesText(document.locations.map((location) => location.label));
  $: titleFacts = [
    ...facts.roles.map((role) => ({ text: roleLabel(role) })),
    ...(typeLabel ? [{ text: typeLabel }] : []),
    ...(facts.level ? [{ label: 'Level', text: npcLevelText(facts.level) }] : []),
    ...(places ? [{ label: 'In', text: places }] : []),
    ...(document.bossOf.length ? [{ label: 'Boss of', refs: document.bossOf }] : []),
  ] satisfies TitleFact[];
  $: portrait = document.art.portrait;
  // A player cannot fight an NPC that only offers friendly services, so its combat values are only defaults.
  $: combat = !onlyFriendlyRoles(facts.roles);
  $: creatureType = creatureTypeLabel(facts.creatureType);
  $: loot = facts.lootSpecialization && (facts.lootSpecialization.armorType || facts.lootSpecialization.weaponTypes.length || facts.lootSpecialization.stat) ? facts.lootSpecialization : undefined;
  $: about = [facts.faction, facts.species, creatureType, combat && facts.respawn, combat && facts.experience, combat && facts.aggroRange !== undefined,
    facts.immunities.length, loot, document.factionRewards.length, document.linkedNpc].some(Boolean);
</script>

<article class="detail-page">
  <TitleBlock name={document.ref.name} facts={titleFacts} mapHref={document.locations.length ? entityOnMap(document.ref.key) : undefined} {registry} />

  {#if portrait || document.description || facts.stats.length || about}
    <Hero view={portrait ? 'narrow' : undefined}>
      <svelte:fragment slot="view">{#if portrait}<img class="portrait" src={`${base}/data/${portrait.url}`} width={portrait.width} height={portrait.height} alt={`${document.ref.name} portrait`} />{/if}</svelte:fragment>
      {#if document.description}<p class="c-prose">{document.description}</p>{/if}
      {#if facts.stats.length}
        <FactList title="Stats">
          {#each facts.stats as stat}<FactRow label={nameOf(stat.stat)}>{formatNumber(stat.amount)}{stat.isPercent ? '%' : ''}</FactRow>{/each}
        </FactList>
      {/if}
      {#if about}
        <FactList title="About">
          {#if facts.faction}<FactRow label="Faction"><EntityLink ref={facts.faction} {registry} /></FactRow>{/if}
          {#if facts.species}<FactRow label="Species"><EntityLink ref={facts.species} {registry} /></FactRow>{/if}
          {#if creatureType}<FactRow label="Creature type">{creatureType}</FactRow>{/if}
          {#if combat && facts.respawn}<FactRow label="Respawn">{rangeText(facts.respawn.min, facts.respawn.max)} s</FactRow>{/if}
          {#if combat && facts.experience}<FactRow label="Experience" rules={document.placedRules.filter((entry) => entry.target === 'experience')} {registry}>{rangeText(facts.experience.min, facts.experience.max)}</FactRow>{/if}
          {#if combat && facts.aggroRange !== undefined}<FactRow label="Aggro range">{formatNumber(facts.aggroRange)} m</FactRow>{/if}
          {#if facts.immunities.length}<FactRow label="Immune to">{facts.immunities.map(categoryLabel).join(', ')}</FactRow>{/if}
          {#if loot}
            <FactRow label="Gear drops favour">
              {[loot.armorType ? categoryLabel(loot.armorType) : '', ...loot.weaponTypes.map(categoryLabel)].filter(Boolean).join(', ')}{#if loot.stat}{loot.armorType || loot.weaponTypes.length ? ', ' : ''}<EntityLink ref={loot.stat} {registry} />{/if}
            </FactRow>
          {/if}
          {#if document.factionRewards.length}
            <FactRow label="Faction standing per kill">{#each document.factionRewards as reward, index}{index > 0 ? ', ' : ''}<EntityLink ref={reward.counterpart} {registry} /> {signedAmount(reward.amount)}{/each}</FactRow>
          {/if}
          {#if document.linkedNpc}<FactRow label="Linked NPC"><EntityLink ref={document.linkedNpc} {registry} /></FactRow>{/if}
        </FactList>
      {/if}
    </Hero>
  {/if}

  <Sections>
    <LocationsSection {document} {registry} {variantTable} />
    {#if variantTable}<VariantsSection {document} {registry} />{/if}
    <AbilitiesSection phases={document.abilityPhases} {registry} />
    <DropsSection rows={document.drops} variants={document.variants} {registry} />
    <VendorSection id="sells" title="Sells" counterpartLabel="Item" rows={document.sells} variants={document.variants} sort={{ id: 'name', dir: 'asc' }} {registry} />
    <QuestRowsSection id="quests" title="Quests" roleLabel="Role" rows={npcQuestRows(document.quests, document.usedInQuests)} {registry} />
  </Sections>
</article>

<style>
  .portrait { display: block; width: 100%; height: auto; border: 1px solid var(--c-frame-strong); border-radius: var(--c-radius); background: var(--c-surface-sunken); }
</style>
