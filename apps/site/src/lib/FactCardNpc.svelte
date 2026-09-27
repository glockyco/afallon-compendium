<script lang="ts">
  import { base } from '$app/paths';
  import type { PublicKindEntry, PublicNpc } from '@afallon/contracts/public';
  import AbilityPhases from './AbilityPhases.svelte';
  import Card from './Card.svelte';
  import ChipGrid, { type Chip } from './ChipGrid.svelte';
  import DropTable from './DropTable.svelte';
  import EntityHeader, { type HeaderFact } from './EntityHeader.svelte';
  import EntityLink from './EntityLink.svelte';
  import Fact from './Fact.svelte';
  import FactGrid from './FactGrid.svelte';
  import NpcLocations from './NpcLocations.svelte';
  import NpcVariants from './NpcVariants.svelte';
  import QuestTable from './QuestTable.svelte';
  import RefList from './RefList.svelte';
  import VendorTable from './VendorTable.svelte';
  import { formatNumber, labelOf, npcLevelText, placesText, rangeText, roleLabel, signedAmount } from './format';

  export let document: PublicNpc;
  export let registry: PublicKindEntry[];
  export let showRelations = false;
  export let limit: number | undefined = undefined;

  $: facts = document.facts;
  // The variants table appears when the records differ in facts or in loot. Otherwise the records differ only in where
  // and when they appear, which the location table shows.
  $: variantTable = document.variants.length > 1 && (document.variantFields.length > 0 || document.drops.some((row) => row.variants));
  $: creatureType = facts.npcType ?? facts.creatureType;
  $: places = placesText(document.locations.map((location) => location.label));
  $: headerFacts = [
    ...facts.roles.map((role) => ({ value: roleLabel(role) })),
    ...(facts.level ? [{ label: 'Level', value: npcLevelText(facts.level) }] : []),
    ...(creatureType ? [{ label: 'Type', value: labelOf(creatureType) }] : []),
    ...(facts.faction ? [{ label: 'Faction', value: facts.faction.key === null ? facts.faction.label : facts.faction.name }] : []),
    ...(places ? [{ label: 'Found in', value: places, href: `${base}/?entity=${encodeURIComponent(document.ref.key)}` }] : []),
  ] satisfies HeaderFact[];
  $: statChips = facts.stats.map((stat) => ({
    label: stat.stat.key === null ? stat.stat.label : stat.stat.name,
    value: signedAmount(stat.amount, stat.isPercent),
  })) satisfies Chip[];
  $: immunityChips = facts.immunities.map((immunity) => ({ label: labelOf(immunity) })) satisfies Chip[];
  $: rewardChips = document.factionRewards.map((reward) => ({
    label: reward.counterpart.key === null ? reward.counterpart.label : reward.counterpart.name,
    value: signedAmount(reward.amount),
  })) satisfies Chip[];
  $: lootSpecialization = facts.lootSpecialization && (facts.lootSpecialization.armorType || facts.lootSpecialization.weaponTypes.length > 0 || facts.lootSpecialization.stat)
    ? facts.lootSpecialization
    : undefined;
  $: factCount = [facts.species !== undefined, facts.family !== undefined, facts.experience !== undefined,
    facts.respawn !== undefined, facts.aggroRange !== undefined, lootSpecialization !== undefined,
    document.linkedNpc !== undefined].filter(Boolean).length;
</script>

<article class="document">
  <EntityHeader
    name={document.ref.name}
    art={document.art.portrait ?? document.art.icon ?? document.ref.icon}
    artRole="portrait"
    facts={headerFacts}
    description={document.description}
  />

  <div class="c-stack">
    <div class="c-card-grid">
      {#if factCount > 0}
      <Card title="Facts" wide={factCount > 2}>
        <FactGrid wide>
            {#if facts.species}<Fact label="Species"><EntityLink ref={facts.species} {registry} /></Fact>{/if}
            {#if facts.family}<Fact label="Family">{labelOf(facts.family)}</Fact>{/if}
            {#if facts.experience}<Fact label="Experience">{rangeText(facts.experience.min, facts.experience.max)}</Fact>{/if}
            {#if facts.respawn}<Fact label="Respawn">{rangeText(facts.respawn.min, facts.respawn.max)} s</Fact>{/if}
            {#if facts.aggroRange !== undefined}<Fact label="Aggro range">{formatNumber(facts.aggroRange)} m</Fact>{/if}
            {#if lootSpecialization}
              <Fact label="Loot specialization">
                {[lootSpecialization.armorType ? labelOf(lootSpecialization.armorType) : '', ...lootSpecialization.weaponTypes.map(labelOf)].filter(Boolean).join(' · ')}
                {#if lootSpecialization.stat}<br /><EntityLink ref={lootSpecialization.stat} {registry} />{/if}
              </Fact>
            {/if}
          {#if document.linkedNpc}<Fact label="Linked NPC"><EntityLink ref={document.linkedNpc} {registry} /></Fact>{/if}
        </FactGrid>
      </Card>
      {/if}
      {#if statChips.length}<Card title="Stats" count={statChips.length}><ChipGrid chips={statChips} /></Card>{/if}
      {#if immunityChips.length}<Card title="Immunities" count={immunityChips.length}><ChipGrid chips={immunityChips} /></Card>{/if}
      {#if rewardChips.length}<Card title="Faction rewards" count={rewardChips.length}><ChipGrid chips={rewardChips} /></Card>{/if}
    </div>
    <NpcLocations {document} {registry} {variantTable} />
    {#if variantTable}<NpcVariants {document} {registry} />{/if}

    {#if showRelations}
      <AbilityPhases phases={document.abilityPhases} {registry} {limit} />
      <DropTable rows={document.drops} variants={document.variants} {registry} heading="Drops" counterpartLabel="Item" {limit} />
      <VendorTable rows={document.sells} variants={document.variants} {registry} heading="Sells" counterpartLabel="Item" {limit} />
      <QuestTable rows={document.quests} {registry} heading="Quests" counterpartLabel="Quest" {limit} />
      <QuestTable rows={document.usedInQuests} {registry} heading="Quest objectives" counterpartLabel="Quest" {limit} />
      <RefList title="Boss of" refs={document.bossOf} {registry} {limit} />
    {/if}
  </div>
</article>
