<script lang="ts">
  import type { PublicKindEntry, PublicNpc } from '@afallon/contracts/public';
  import AbilityPhases from './AbilityPhases.svelte';
  import DropTable from './DropTable.svelte';
  import EntityLink from './EntityLink.svelte';
  import FactCardFrame from './FactCardFrame.svelte';
  import LocationList from './LocationList.svelte';
  import MissingValue from './MissingValue.svelte';
  import QuestTable from './QuestTable.svelte';
  import VendorTable from './VendorTable.svelte';

  export let document: PublicNpc;
  export let registry: PublicKindEntry[];
  export let compact = false;
  export let showRelations = false;
  export let limit: number | undefined = undefined;
  $: facts = document.facts;
  $: level = facts.level !== undefined ? String(facts.level) : facts.levelRange ? `${facts.levelRange.min}–${facts.levelRange.max}` : null;
</script>

<FactCardFrame name={document.ref.name} description={document.description} art={document.art.portrait ?? document.art.icon ?? document.ref.icon} artRole="portrait" fallbackIcon={registry.find((entry) => entry.kind === 'npcs')?.icon} {compact}>
  <dl class="facts">
    <div><dt>Level</dt><dd>{#if level}{level}{:else}<MissingValue explanation="No level is published" />{/if}</dd></div>
    <div><dt>Roles</dt><dd>{facts.roles.length ? facts.roles.join(', ') : 'None'}</dd></div>
    <div><dt>Type</dt><dd>{#if facts.npcType || facts.creatureType}{facts.npcType ?? facts.creatureType}{:else}<MissingValue explanation="No NPC type is published" />{/if}</dd></div>
    <div><dt>Family</dt><dd>{#if facts.family}{facts.family}{:else}<MissingValue explanation="No creature family is published" />{/if}</dd></div>
    <div><dt>Faction</dt><dd>{#if facts.faction}<EntityLink ref={facts.faction} {registry} />{:else}<MissingValue explanation="No faction is published" />{/if}</dd></div>
    <div><dt>Species</dt><dd>{#if facts.species}<EntityLink ref={facts.species} {registry} />{:else}<MissingValue explanation="No species is published" />{/if}</dd></div>
    <div><dt>Respawn</dt><dd>{#if facts.respawn}{facts.respawn.min}–{facts.respawn.max}{:else}<MissingValue explanation="Not measured for this build" />{/if}</dd></div>
    <div><dt>Experience</dt><dd>{#if facts.experience}{facts.experience.min}–{facts.experience.max}{:else}<MissingValue explanation="Not measured for this build" />{/if}</dd></div>
    <div><dt>Stats</dt><dd>{#if facts.stats.length}{#each facts.stats as stat}<span class="line"><EntityLink ref={stat.stat} {registry} /> {stat.amount}{stat.isPercent ? '%' : ''}</span>{/each}{:else}None{/if}</dd></div>
    <div><dt>Immunities</dt><dd>{facts.immunities.length ? facts.immunities.join(', ') : 'None'}</dd></div>
    <div><dt>Aggro range</dt><dd>{#if facts.aggroRange !== undefined}{facts.aggroRange}{:else}<MissingValue explanation="Not measured for this build" />{/if}</dd></div>
    <div><dt>Loot specialization</dt><dd>{#if facts.lootSpecialization}{#if facts.lootSpecialization.armorType}{facts.lootSpecialization.armorType}{/if}{#if facts.lootSpecialization.weaponTypes.length}{facts.lootSpecialization.armorType ? ' · ' : ''}{facts.lootSpecialization.weaponTypes.join(', ')}{/if}{#if facts.lootSpecialization.stat}{' · '}<EntityLink ref={facts.lootSpecialization.stat} {registry} />{/if}{:else}None{/if}</dd></div>
    <div><dt>Scales with player</dt><dd>{facts.scalesWithPlayer ? 'Yes' : 'No'}</dd></div>
  </dl>
  {#if showRelations}
    <DropTable rows={document.drops} {registry} heading="Drops" counterpartLabel="Item" {limit} />
    <VendorTable rows={document.sells} {registry} heading="Sells" counterpartLabel="Item" {limit} />
    <QuestTable rows={document.quests} {registry} heading="Quests" {limit} />
    <AbilityPhases phases={document.abilityPhases} {registry} {limit} />
    {#if document.factionRewards.length}<section><h2>Faction rewards</h2><ul>{#each (limit === undefined ? document.factionRewards : document.factionRewards.slice(0, limit)) as reward}<li><EntityLink ref={reward.counterpart} {registry} />: {reward.amount}</li>{/each}</ul></section>{/if}
    <QuestTable rows={document.usedInQuests} {registry} heading="Quest objectives" {limit} />
    {#if document.bossOf.length}<section><h2>Boss of</h2><ul>{#each (limit === undefined ? document.bossOf : document.bossOf.slice(0, limit)) as place}<li><EntityLink ref={place} {registry} /></li>{/each}</ul></section>{/if}
    {#if document.linkedNpc}<section><h2>Linked NPC</h2><EntityLink ref={document.linkedNpc} {registry} /></section>{/if}
    <LocationList locations={document.locations} entityKey={document.ref.key} {limit} />
  {/if}
</FactCardFrame>

<style>
  .line { display: block; } section { margin-top: 1.25rem; } h2 { margin: 0 0 .55rem; color: #eee9dd; font: 600 1rem/1.3 Georgia, serif; }
  ul { margin: 0; padding-left: 1.1rem; }
</style>
