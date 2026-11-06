<script lang="ts">
  // Throwaway: one adventurer's published facts, linked to their pages, with the one fact a reader enters.
  import { base } from '$app/paths';
  import type { PublicKindEntry } from '@afallon/contracts/public';
  import EntityLink from '$lib/EntityLink.svelte';
  import type { PlannerMock } from '../data.server';

  export let detail: PlannerMock['memberDetail'];
  export let registry: PublicKindEntry[];
  export let id = 'member';
  export let inParty = true;
  $: adventurer = detail.adventurer!;
  const title = (value: string | undefined) => value ? `${value[0]}${value.slice(1).toLowerCase()}` : undefined;
</script>

<div class="member pm-hidden-label" id={`${id}-member`}>
  <div class="identity">
    {#if detail.portrait}<img class="portrait" src={`${base}/data/${detail.portrait.url}`} alt="" />{/if}
    <div>
      <a class="c-link name" href={`${base}/npcs/${detail.npc.slug}/`}>{detail.npc.name}</a>
      <p class="pm-note">{adventurer.class.key === null ? adventurer.class.label : adventurer.class.name} · {adventurer.race ? (adventurer.race.key === null ? adventurer.race.label : adventurer.race.name) : 'Race Not Available'} · {adventurer.role}</p>
    </div>
  </div>
  <dl class="pm-dl">
    <div><dt>Starts At</dt><dd>Level {adventurer.startingLevel}</dd></div>
    <div><dt>Joins</dt><dd>{adventurer.joinAfterHours ? `After ${adventurer.joinAfterHours} hours of play` : 'From the start'}</dd></div>
    {#if adventurer.preferredTree}<div><dt>Spends In</dt><dd><EntityLink ref={adventurer.preferredTree} {registry} /></dd></div>{/if}
    {#if adventurer.priorityAbilities.length}<div><dt>Learns First</dt><dd><ul class="icons">{#each adventurer.priorityAbilities.slice(0, 5) as ability}<li><EntityLink ref={ability} {registry} /></li>{/each}</ul></dd></div>{/if}
    {#if detail.preference}
      <div><dt>Takes</dt><dd>{[title(detail.preference.armorType), ...detail.preference.weaponTypes.map(title)].filter(Boolean).join(', ')}{#if detail.preference.stat}<small>Values <EntityLink ref={detail.preference.stat} {registry} /> most</small>{/if}</dd></div>
    {/if}
    {#if detail.kit.length}<div><dt>Gear Kit</dt><dd>{detail.kit.length} items · <a class="c-link" href={`${base}/npcs/${detail.npc.slug}/#gear`}>See Kit</a></dd></div>{/if}
  </dl>
  {#if inParty}
    <div class="pm-row-actions"><a class="c-action" href={`${base}/planner-mockup/party/choose/`}>Change</a><button class="c-action quiet">Remove</button></div>
  {:else}
    <div class="pm-row-actions"><button class="c-action primary">Add to Party</button><a class="c-action quiet" href={`${base}/planner-mockup/party/`}>Cancel</a></div>
  {/if}
</div>

<style>
  .member { display: grid; gap: .85rem; }
  .identity { display: grid; grid-template-columns: 3rem minmax(0, 1fr); align-items: center; gap: .75rem; }
  .portrait { width: 3rem; height: 3rem; border: 1px solid var(--c-frame); border-radius: 50%; background: var(--c-surface-sunken); object-fit: cover; }
  .name { font: 600 1.05rem var(--c-serif); }
  .icons { display: grid; gap: .25rem; margin: 0; padding: 0; list-style: none; }
</style>
