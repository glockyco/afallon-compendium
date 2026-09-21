<script lang="ts">
  import { base } from '$app/paths';
  import type { PublicKindEntry, PublicNpc } from '@afallon/contracts/public';
  import AbilityPhases from './AbilityPhases.svelte';
  import Card from './Card.svelte';
  import ChipGrid, { type Chip } from './ChipGrid.svelte';
  import DropTable from './DropTable.svelte';
  import EntityHeader, { type HeaderBadge, type HeaderFact } from './EntityHeader.svelte';
  import EntityLink from './EntityLink.svelte';
  import Fact from './Fact.svelte';
  import FactGrid from './FactGrid.svelte';
  import LocationList from './LocationList.svelte';
  import QuestTable from './QuestTable.svelte';
  import RefList from './RefList.svelte';
  import VendorTable from './VendorTable.svelte';
  import { formatNumber, labelOf, rangeText, roleLabel, signedAmount } from './format';

  export let document: PublicNpc;
  export let registry: PublicKindEntry[];
  export let showRelations = false;
  export let limit: number | undefined = undefined;

  $: facts = document.facts;
  $: level = facts.level !== undefined ? String(facts.level) : facts.levelRange ? `${facts.levelRange.min}–${facts.levelRange.max}` : null;
  $: creatureType = facts.npcType ?? facts.creatureType;
  $: badges = [
    ...facts.roles.map((role) => ({ label: roleLabel(role), tone: role === 'boss' ? ('boss' as const) : ('neutral' as const) })),
    ...(facts.scalesWithPlayer ? [{ label: 'Scales with player', tone: 'accent' as const }] : []),
  ] satisfies HeaderBadge[];
  $: headerFacts = [
    ...(level ? [{ label: 'Level', value: level }] : []),
    ...(creatureType ? [{ label: 'Type', value: labelOf(creatureType) }] : []),
    ...(facts.faction ? [{ label: 'Faction', value: facts.faction.key === null ? facts.faction.label : facts.faction.name }] : []),
    ...(document.locations.length > 0 ? [{ label: 'Found in', value: document.locations[0]!.label }] : []),
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
  $: hasFacts = facts.species !== undefined || facts.family !== undefined || facts.respawn !== undefined
    || facts.experience !== undefined || facts.aggroRange !== undefined || lootSpecialization !== undefined || document.linkedNpc !== undefined;
</script>

<article class="document">
  <EntityHeader
    name={document.ref.name}
    art={document.art.portrait ?? document.art.icon ?? document.ref.icon}
    artRole="portrait"
    fallbackIcon={registry.find((entry) => entry.kind === 'npcs')?.icon}
    {badges}
    facts={headerFacts}
    description={document.description}
    atlasHref={document.locations.length > 0 ? `${base}/?entity=${encodeURIComponent(document.ref.key)}` : undefined}
    atlasLabel="View on the atlas"
  />

  <div class="c-stack">
    <div class="c-card-grid">
      {#if hasFacts}
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

    {#if showRelations}
      <AbilityPhases phases={document.abilityPhases} {registry} {limit} />
      <DropTable rows={document.drops} {registry} heading="Drops" counterpartLabel="Item" {limit} />
      <VendorTable rows={document.sells} {registry} heading="Sells" counterpartLabel="Item" {limit} />
      <QuestTable rows={document.quests} {registry} heading="Quests" {limit} />
      <QuestTable rows={document.usedInQuests} {registry} heading="Quest objectives" {limit} />
      <RefList title="Boss of" refs={document.bossOf} {registry} {limit} />
      <LocationList locations={document.locations} entityKey={document.ref.key} {limit} />
    {/if}
  </div>
</article>
