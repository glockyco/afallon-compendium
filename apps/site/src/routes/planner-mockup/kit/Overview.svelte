<script lang="ts">
  // Throwaway: the character sheet. What the build is and what is left to do, with each part one click from its view.
  import { base } from '$app/paths';
  import AnswerCard from '$lib/detail/AnswerCard.svelte';
  import SideCard from '$lib/detail/SideCard.svelte';
  import Section from '$lib/detail/Section.svelte';
  import Sections from '$lib/detail/Sections.svelte';
  import { rarityTone } from '$lib/format';
  import Workspace from './Workspace.svelte';
  import type { PlannerMock } from '../data.server';

  export let data: { registry: never; release: never; mock: PlannerMock };
  export let preview = false;
  export let source: 'link' | 'save' = 'link';
  export let moreOpen = false;

  $: empty = source === 'save';
  $: mock = data.mock;
  $: lines = mock.statLines.filter((line) => line.stat !== 'Item Power');
  $: selected = lines.find((line) => line.stat === 'Intellect')!;
  $: doc = mock.talents.doc;
  $: trees = doc.trees.map((tree) => {
    const learned = tree.rows.filter((row) => mock.talents.learned[row.anchor]);
    return { tree, spent: mock.talents.treeSpent[tree.name] ?? 0, abilities: learned.filter((row) => row.ability), bonuses: learned.filter((row) => !row.ability).length };
  }).filter((entry) => entry.spent);
  $: needs = new Map(mock.needs.map((need) => [need.key, need]));
  $: left = mock.needs.filter((need) => !need.collected);
  $: dungeonTrips = mock.acquisition.groups.filter((group) => group.kind === 'dungeon');
  $: worldNeeds = [...new Set(mock.acquisition.groups.filter((group) => group.kind !== 'dungeon').flatMap((group) => group.rows.filter((row) => row.ways.some((way) => way.kind === 'drop' || way.kind === 'chest')).map((row) => row.need)))];
  $: vendorItems = mock.acquisition.forSale.reduce((sum, total) => sum + total.items, 0);
  $: trips = [
    ...dungeonTrips.map((group) => ({ label: group.name, what: group.rows.map((row) => needs.get(row.need)?.item.name).join(', ') })),
    ...(vendorItems ? [{ label: 'Vendors', what: `${vendorItems} items for ${mock.acquisition.forSale.map((total) => `${total.amount.toLocaleString('en-US')} ${total.currency}`).join(' and ')}` }] : []),
    ...(worldNeeds.length ? [{ label: 'Out in the World', what: worldNeeds.map((key) => needs.get(key)?.item.name).join(', ') }] : []),
  ];
  $: equipped = mock.slots.filter((slot) => slot.document);
  const iconOf = (row: PlannerMock['talents']['doc']['trees'][number]['rows'][number]) => (row.ability && 'icon' in row.ability ? row.ability.icon : undefined) ?? row.icon;
  const signed = (amount: number, percent: boolean) => `${amount < 0 ? '−' : '+'}${Math.abs(amount).toLocaleString('en-US')}${percent ? '%' : ''}`;
  const link = (key: string) => `${base}/planner-mockup/${key}/${preview ? '?preview=1' : ''}`;
</script>

<Workspace {data} view="overview" {preview} {source} {moreOpen}>
  <AnswerCard slot="answer" title="Stat Bonuses">
    {#if empty}<p class="pm-note">No gear or talents yet, so there are no bonuses to show.</p>{:else}
    <p class="pm-note">From gear, sets and talents. Base stats from race, class and level aren’t verified yet, so these aren’t totals.</p>
    <dl class="stat-grid">
      {#each lines as line}
        <div class:selected={line === selected}>
          <dt><button class="stat-button">{line.stat}</button></dt>
          <dd>{signed(line.amount, line.percent)}</dd>
        </div>
      {/each}
    </dl>
    {/if}
  </AnswerCard>

  <svelte:fragment slot="inspector">{#if !empty}
    <SideCard title="Intellect">
      <p class="total"><strong>{signed(selected.amount, false)}</strong> from {selected.sources.length} sources</p>
      <table class="sources">
        <tbody>
          {#each selected.sources.slice(0, 6) as source}
            <tr><th scope="row">{source.label}<small>{source.detail}</small></th><td>{signed(source.amount, false)}</td></tr>
          {/each}
        </tbody>
      </table>
      <details class="c-disclosure more-sources">
        <summary>Show All {selected.sources.length} Sources</summary>
        <table class="sources"><tbody>{#each selected.sources.slice(6) as source}<tr><th scope="row">{source.label}<small>{source.detail}</small></th><td>{signed(source.amount, false)}</td></tr>{/each}</tbody></table>
      </details>
      <p class="pm-note">Base Intellect isn’t included.</p>
    </SideCard>
  {/if}</svelte:fragment>

  <Sections>
    {#if !empty}
      <Section id="to-get" title="Still to Get">
        <p class="lead"><strong>{left.length} of {mock.needs.length}</strong> items left.</p>
        <ul class="trips">
          {#each trips as trip}
            <li><span class="trip">{trip.label}</span><span class="what">{trip.what}</span></li>
          {/each}
        </ul>
        <a class="c-link small" href={link('get')}>Open Where to Get</a>
      </Section>
    {/if}

    <Section id="equipment" title="Equipment">
      {#if empty}<p class="pm-note">No gear yet. <a class="c-link" href={link('gear')}>Open Gear</a></p>{:else}
      <ul class="gear">
        {#each equipped as slot}
          {@const document = slot.document}
          {#if document}
            <li>
              <img src={`${base}/data/${(document.art.icon ?? document.ref.icon)?.url}`} alt="" />
              <span class="gear-text">
                <a class="gear-name" data-rarity={rarityTone(document.facts.rarity)} href={`${base}/items/${document.ref.slug}/`}>{document.ref.name}</a>
                <span class="sub">{slot.label}{slot.heroic ? ' · Heroic' : ''}{slot.corruption ? ` · Corruption ${slot.corruption}` : ''}</span>
              </span>
              {#if slot.collected}<span class="state have">Collected</span>{:else}<span class="state">To get</span>{/if}
            </li>
          {/if}
        {/each}
      </ul>
      {/if}
    </Section>

    <Section id="talents" title="Talents">
      {#if empty}<p class="pm-note">No talents learned yet. <a class="c-link" href={link('talents')}>Open Talents</a></p>{:else}
      <div class="trees">
        {#each trees as entry}
          <div class="tree">
            <h3>{entry.tree.name} <span class="count">{entry.spent} points</span></h3>
            <ul class="chips">
              {#each entry.abilities as row}
                <li><a class="chip" href={`${base}/classes/druid/#${row.anchor}`}>{#if iconOf(row)}<img src={`${base}/data/${iconOf(row)?.url}`} alt="" />{/if}<span>{row.name}</span></a></li>
              {/each}
            </ul>
            <p class="pm-note">{entry.abilities.length} abilities and {entry.bonuses} other talents.</p>
          </div>
        {/each}
      </div>
      {/if}
    </Section>

    <Section id="party" title="Party">
      {#if empty}<p class="pm-note">No party yet.</p>{:else}
      <ul class="party">
        <li><img class="portrait" src={`${base}/data/${doc.art.icon?.url}`} alt="" /><span class="gear-text"><strong>Elara</strong><span class="sub">Druid · Damage · Level 24</span></span></li>
        {#each mock.party as member}
          <li>{#if member.portrait}<img class="portrait round" src={`${base}/data/${member.portrait.url}`} alt="" />{/if}<span class="gear-text"><a class="c-link" href={`${base}/npcs/${member.adventurer.slug}/`}>{member.adventurer.name}</a><span class="sub">{member.class.name} · {member.role} · Starts at level {member.startingLevel}</span></span></li>
        {/each}
        <li class="open"><span class="portrait placeholder" aria-hidden="true"></span><span class="sub">One spot open</span></li>
      </ul>
      {/if}
    </Section>
  </Sections>
</Workspace>

<style>
  .stat-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0 2rem; margin: 0; }
  .stat-grid > div { display: flex; align-items: baseline; justify-content: space-between; gap: 1rem; padding: .35rem .5rem; border-bottom: 1px solid var(--c-line-soft); }
  .stat-grid > div.selected { margin: 0 -.5rem; padding: .35rem 1rem; background: var(--c-accent-surface); box-shadow: inset 3px 0 0 var(--c-accent); }
  .stat-grid dt, .stat-grid dd { margin: 0; }
  .stat-grid dd { color: var(--c-text-strong); font-variant-numeric: tabular-nums; }
  .stat-button { padding: 0; border: 0; background: none; color: var(--c-text); font: inherit; text-align: left; cursor: pointer; }
  .stat-button:hover { color: var(--c-accent-strong); }
  .selected .stat-button { color: var(--c-accent-strong); font-weight: 600; }
  .total { margin: 0; color: var(--c-text-dim); }
  .total strong { color: var(--c-text-strong); font: 700 1.5rem var(--c-serif); }
  .sources { width: 100%; border-collapse: collapse; font-size: var(--c-text-small); }
  .sources th, .sources td { padding: .35rem 0; border-top: 1px solid var(--c-line-soft); text-align: left; vertical-align: baseline; }
  .sources th { color: var(--c-text); font-weight: 400; }
  .sources th small { display: block; color: var(--c-text-mute); }
  .sources td { padding-left: .75rem; color: var(--c-text-strong); font-variant-numeric: tabular-nums; text-align: right; white-space: nowrap; }
  .more-sources > summary { font-size: var(--c-text-small); }
  .lead { margin: 0 0 .65rem; }
  .lead strong { color: var(--c-text-strong); }
  .trips { display: grid; margin: 0 0 .65rem; padding: 0; border: 1px solid var(--c-line-soft); border-radius: var(--c-radius); background: var(--c-surface-1); list-style: none; }
  .trips li { display: grid; grid-template-columns: 12rem minmax(0, 1fr); gap: 1rem; padding: .5rem .9rem; border-top: 1px solid var(--c-line-soft); }
  .trips li:first-child { border-top: 0; }
  .trip { color: var(--c-text-strong); font-weight: 600; }
  .what { color: var(--c-text-soft); }
  .small { font-size: var(--c-text-small); }
  .gear { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0 1.5rem; margin: 0; padding: 0; list-style: none; }
  .gear li, .party li { display: grid; grid-template-columns: 2rem minmax(0, 1fr) auto; align-items: center; gap: .65rem; padding: .45rem 0; border-bottom: 1px solid var(--c-line-soft); }
  .gear img, .party .portrait { width: 2rem; height: 2rem; box-sizing: border-box; border: 1px solid var(--c-line); border-radius: var(--c-radius-sm); background: var(--c-surface-sunken); object-fit: contain; }
  .party .round { border-radius: 50%; object-fit: cover; }
  .placeholder { display: block; border-style: dashed !important; background: transparent !important; }
  .gear-text { display: grid; min-width: 0; line-height: 1.3; }
  .gear-name { overflow: hidden; color: var(--c-rarity); font-weight: 600; text-decoration: none; text-overflow: ellipsis; white-space: nowrap; }
  .gear-name:hover { text-decoration: underline; }
  .sub { color: var(--c-text-dim); font-size: var(--c-text-small); }
  .state { color: var(--c-text-mute); font-size: var(--c-text-small); white-space: nowrap; }
  .state.have { color: var(--c-positive); }
  .party { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0 1.5rem; margin: 0; padding: 0; list-style: none; }
  .party li { grid-template-columns: 2rem minmax(0, 1fr); }
  .trees { display: grid; gap: 1rem; }
  .tree h3 { margin: 0 0 .5rem; color: var(--c-text-strong); font: 600 var(--c-text-lead) var(--c-serif); }
  .count { margin-left: .4rem; color: var(--c-text-dim); font: 400 var(--c-text-small) var(--c-sans, inherit); }
  .chips { display: flex; flex-wrap: wrap; gap: .4rem; margin: 0 0 .4rem; padding: 0; list-style: none; }
  .chip { display: inline-flex; align-items: center; gap: .4rem; padding: .2rem .55rem .2rem .25rem; border: 1px solid var(--c-line); border-radius: var(--c-radius-sm); background: var(--c-surface-1); color: var(--c-text); font-size: var(--c-text-small); text-decoration: none; }
  .chip:hover { border-color: var(--c-accent-line); }
  .chip img { width: 1.4rem; height: 1.4rem; object-fit: contain; }
  @media (max-width: 640px) {
    .stat-grid, .gear, .party { grid-template-columns: minmax(0, 1fr); }
    .trips li { grid-template-columns: minmax(0, 1fr); gap: .1rem; }
  }
</style>
