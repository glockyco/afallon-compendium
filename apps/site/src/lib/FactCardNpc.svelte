<script lang="ts">
  import type { PublicKindEntry, PublicNpc } from '@afallon/contracts/public';
  import AbilityPhases from './AbilityPhases.svelte';
  import DropTable from './DropTable.svelte';
  import EntityLink from './EntityLink.svelte';
  import FactCardFrame from './FactCardFrame.svelte';
  import LocationList from './LocationList.svelte';
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
    {#if level}<div><dt>Level</dt><dd>{level}</dd></div>{/if}
    {#if facts.roles.length}<div><dt>Roles</dt><dd>{facts.roles.join(', ')}</dd></div>{/if}
    {#if facts.npcType || facts.creatureType}<div><dt>Type</dt><dd>{facts.npcType ?? facts.creatureType}</dd></div>{/if}
    {#if facts.family}<div><dt>Family</dt><dd>{facts.family}</dd></div>{/if}
    {#if facts.faction}<div><dt>Faction</dt><dd><EntityLink ref={facts.faction} {registry} /></dd></div>{/if}
    {#if facts.species}<div><dt>Species</dt><dd><EntityLink ref={facts.species} {registry} /></dd></div>{/if}
    {#if facts.respawn}<div><dt>Respawn</dt><dd>{facts.respawn.min}–{facts.respawn.max}</dd></div>{/if}
    {#if facts.experience}<div><dt>Experience</dt><dd>{facts.experience.min}–{facts.experience.max}</dd></div>{/if}
    {#if facts.stats.length}<div><dt>Stats</dt><dd>{#each facts.stats as stat}<span class="line"><EntityLink ref={stat.stat} {registry} /> {stat.amount}{stat.isPercent ? '%' : ''}</span>{/each}</dd></div>{/if}
    {#if facts.immunities.length}<div><dt>Immunities</dt><dd>{facts.immunities.join(', ')}</dd></div>{/if}
    {#if facts.aggroRange !== undefined}<div><dt>Aggro range</dt><dd>{facts.aggroRange}</dd></div>{/if}
    {#if facts.lootSpecialization && (facts.lootSpecialization.armorType || facts.lootSpecialization.weaponTypes.length || facts.lootSpecialization.stat)}<div><dt>Loot specialization</dt><dd>{#if facts.lootSpecialization.armorType}{facts.lootSpecialization.armorType}{/if}{#if facts.lootSpecialization.weaponTypes.length}{facts.lootSpecialization.armorType ? ' · ' : ''}{facts.lootSpecialization.weaponTypes.join(', ')}{/if}{#if facts.lootSpecialization.stat}{' · '}<EntityLink ref={facts.lootSpecialization.stat} {registry} />{/if}</dd></div>{/if}
    {#if facts.scalesWithPlayer}<div><dt>Scales with player</dt><dd>Yes</dd></div>{/if}
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
