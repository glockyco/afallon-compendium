<script lang="ts">
  import { base } from '$app/paths';
  import type { PlacementGroup, PublicKindEntry, PublicPlace } from '@afallon/contracts/public';
  import EntityLink from './EntityLink.svelte';
  import FactCardFrame from './FactCardFrame.svelte';
  import LocationLinks from './LocationLinks.svelte';
  import MissingValue from './MissingValue.svelte';

  export let document: PublicPlace;
  export let registry: PublicKindEntry[];
  export let compact = false;
  export let showRelations = false;
  export let limit: number | undefined = undefined;
  $: facts = document.facts;

  function visible<T>(rows: T[]): T[] { return limit === undefined ? rows : rows.slice(0, limit); }
</script>

<FactCardFrame name={document.ref.name} description={document.description} art={document.art.artwork ?? document.art.icon ?? document.ref.icon} artRole="artwork" fallbackIcon={registry.find((entry) => entry.kind === 'places')?.icon} {compact}>
  <dl class="facts">
    <div><dt>Place type</dt><dd>{facts.placeType}</dd></div>
    <div><dt>Level range</dt><dd>{#if facts.levelRange}{facts.levelRange.min}–{facts.levelRange.max}{:else}<MissingValue explanation="Not measured for this build" />{/if}</dd></div>
    <div><dt>Map space</dt><dd>{#if document.space}{document.space.mapSpaceId}{:else}<MissingValue explanation="No map space is published" />{/if}</dd></div>
    <div><dt>Region areas</dt><dd>{#if document.space?.regionIds.length}{document.space.regionIds.length} outlined {document.space.regionIds.length === 1 ? 'area' : 'areas'}{:else}<MissingValue explanation="No region area is published" />{/if}</dd></div>
    <div><dt>Atlas</dt><dd><a href={`${base}/?place=${encodeURIComponent(document.ref.key)}`}>View map space</a></dd></div>
    <div><dt>Guide entry</dt><dd>{facts.guideIncluded ? 'Yes' : 'No'}</dd></div>
    <div><dt>Parent</dt><dd>{#if document.parent}<EntityLink ref={document.parent} {registry} />{:else}None{/if}</dd></div>
  </dl>
  {#if showRelations}
    {#if document.bosses.length}<section><h2>Bosses</h2><ul>{#each visible(document.bosses) as boss}<li><EntityLink ref={boss} {registry} /></li>{/each}</ul></section>{/if}
    {#if document.creatures.length}<section><h2>Creatures</h2><div class="scroll"><table><thead><tr><th>Creature</th><th>Level</th><th>Roles</th><th>Locations</th></tr></thead><tbody>{#each visible(document.creatures) as creature}<tr><td><EntityLink ref={creature.counterpart} {registry} /></td><td>{#if creature.levelRange}{creature.levelRange.min}–{creature.levelRange.max}{:else}<MissingValue explanation="Not measured for this build" />{/if}</td><td>{creature.roles.join(', ')}</td><td>{#if creature.placementCount === 0}<MissingValue explanation="No location is published" />{:else if creature.counterpart.key}<a href={`${base}/?entity=${encodeURIComponent(creature.counterpart.key)}`}>{creature.placementCount} {creature.placementCount === 1 ? 'location' : 'locations'}</a>{:else}{creature.placementCount} {creature.placementCount === 1 ? 'location' : 'locations'}{/if}</td></tr>{/each}</tbody></table></div></section>{/if}
    {#if document.npcs.length}<section><h2>NPCs and services</h2><div class="scroll"><table><thead><tr><th>NPC</th><th>Role</th><th>Locations</th></tr></thead><tbody>{#each visible(document.npcs) as npc}<tr><td><EntityLink ref={npc.counterpart} {registry} /></td><td>{npc.roles.join(', ')}</td><td>{#if npc.placementCount === 0}<MissingValue explanation="No location is published" />{:else if npc.counterpart.key}<a href={`${base}/?entity=${encodeURIComponent(npc.counterpart.key)}`}>{npc.placementCount} {npc.placementCount === 1 ? 'location' : 'locations'}</a>{:else}{npc.placementCount} {npc.placementCount === 1 ? 'location' : 'locations'}{/if}</td></tr>{/each}</tbody></table></div></section>{/if}
    {#each [["Services", document.services], ["Resources", document.resources], ["Containers", document.containers]] as group}
      {@const groups = group[1] as PlacementGroup[]}
      {#if groups.length}<section><h2>{group[0]}</h2><ul>{#each visible(groups) as placementGroup}<li><strong>{placementGroup.category}:</strong> <a href={`${base}/?categories=${encodeURIComponent(placementGroup.category)}`}>{placementGroup.placementCount} {placementGroup.placementCount === 1 ? 'location' : 'locations'}</a></li>{/each}</ul></section>{/if}
    {/each}
    {#if document.quests.length}<section><h2>Quests</h2><ul>{#each visible(document.quests) as quest}<li><EntityLink ref={quest} {registry} /></li>{/each}</ul></section>{/if}
    {#if document.properties.length}<section><h2>Properties</h2><ul>{#each visible(document.properties) as property}<li><EntityLink ref={property} {registry} /></li>{/each}</ul></section>{/if}
    {#if document.connections.length}<section><h2>Connections</h2><div class="scroll"><table><thead><tr><th>Place</th><th>Connection</th><th>Locations</th></tr></thead><tbody>{#each visible(document.connections) as connection}<tr><td><EntityLink ref={connection.counterpart} {registry} /></td><td>{connection.kind}</td><td><LocationLinks placements={connection.placements} /></td></tr>{/each}</tbody></table></div></section>{/if}
    {#if document.regions.length}<section><h2>Regions</h2><ul>{#each visible(document.regions) as region}<li><EntityLink ref={region} {registry} /></li>{/each}</ul></section>{/if}
  {/if}
</FactCardFrame>

<style>
  section { margin-top: 1.25rem; } h2 { margin: 0 0 .55rem; color: #eee9dd; font: 600 1rem/1.3 Georgia, serif; }
  ul { display: grid; gap: .35rem; margin: 0; padding-left: 1.1rem; }
  a { color: #d9bd79; text-underline-offset: .18em; }
  .scroll { overflow-x: auto; }
  table { width: 100%; border-collapse: collapse; font-size: .82rem; } th, td { padding: .55rem; border-bottom: 1px solid #3b3c38; text-align: left; vertical-align: top; }
  th { color: #bdb8ad; font-size: .68rem; letter-spacing: .06em; text-transform: uppercase; }
</style>
