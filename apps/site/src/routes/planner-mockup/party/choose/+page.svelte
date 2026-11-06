<script lang="ts">
  import { base } from '$app/paths';
  import AnswerCard from '$lib/detail/AnswerCard.svelte';
  import SideCard from '$lib/detail/SideCard.svelte';
  import Section from '$lib/detail/Section.svelte';
  import Sections from '$lib/detail/Sections.svelte';
  import Workspace from '../../kit/Workspace.svelte';
  import MemberDetail from '../../kit/MemberDetail.svelte';
  import RoleCounts from '../../kit/RoleCounts.svelte';
  import type { PlannerMock } from '../../data.server';

  export let data: { registry: never; release: never; mock: PlannerMock };
  $: mock = data.mock;
  $: inParty = new Set(mock.party.map((member) => member.adventurer.slug));
  $: rows = mock.roster.filter((row) => row.startingLevel >= 20).sort((a, b) => a.role.localeCompare(b.role) || a.adventurer.name.localeCompare(b.adventurer.name));
  $: shown = rows.slice(0, 12);
  $: candidate = mock.candidateMember;
</script>

<Workspace {data} view="party">
  <AnswerCard slot="answer" title="Party Roles">
    <RoleCounts counts={{ Tank: 1, Healer: 1, Damage: 2 }} />
    <p class="pm-note">4 of 5 in the party. The Dungeon Finder makes a party of one tank, one healer and three damage dealers.</p>
  </AnswerCard>

  <div slot="inspector" class="wide-only"><SideCard title="Adventurer"><MemberDetail detail={candidate} registry={data.registry} id="candidate" inParty={false} /></SideCard></div>

  <Sections>
    <Section id="choose" title="Choose an Adventurer">
      <a class="back c-link" href={`${base}/planner-mockup/party/`}>Back to Party</a>
      <div class="pm-filters">
        <input class="pm-input" type="search" placeholder="Filter adventurers" aria-label="Filter adventurers" />
        <div class="pm-segmented" role="group" aria-label="Role"><button aria-pressed="true">All</button><button>Tank</button><button>Healer</button><button>Damage</button></div>
        <select class="pm-select" aria-label="Class"><option>Every Class</option></select>
        <select class="pm-select" aria-label="Starting level"><option>Starts at Level 20 or Higher</option></select>
      </div>
      <div class="c-table-scroll">
        <table class="c-table picker stacked">
          <thead><tr><th>Adventurer</th><th>Class</th><th>Role</th><th class="c-num">Starts At</th><th>Joins</th><th>Spends In</th></tr></thead>
          <tbody>
            {#each shown as row}
              <tr class:chosen={row.adventurer.slug === candidate.npc.slug} class:taken={inParty.has(row.adventurer.slug ?? '')}>
                <td><button class="who">{row.adventurer.name}</button>{#if inParty.has(row.adventurer.slug ?? '')}<small>In party</small>{/if}<small class="phone-line">{row.class.name} · {row.role} · Starts at {row.startingLevel}</small><small class="phone-line">{row.preferredTree?.name ?? ''}</small></td>
                <td><span class="pm-name">{#if mock.classIcons[row.class.name]}<img class="pm-icon" src={`${base}/data/${mock.classIcons[row.class.name]?.url}`} alt="" />{/if}{row.class.name}</span></td>
                <td>{row.role}</td>
                <td class="c-num">{row.startingLevel}</td>
                <td>{row.joinAfterHours ? `After ${row.joinAfterHours} hours` : 'From the start'}</td>
                <td>{row.preferredTree?.name ?? '—'}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
      <button class="c-action show-more">Show {rows.length - shown.length} More</button>
    </Section>
  </Sections>

  <div slot="phone-bar" class="phone-bar" aria-label="Chosen adventurer">
    {#if candidate.portrait}<img class="round" src={`${base}/data/${candidate.portrait.url}`} alt="" />{/if}
    <div class="phone-name"><strong>{candidate.npc.name}</strong><span>Druid · Damage · Starts at 20</span></div>
    <div class="phone-actions"><button class="c-action primary">Add</button></div>
  </div>
</Workspace>

<style>
  .back { display: inline-block; margin-bottom: .75rem; font-size: var(--c-text-small); }
  .picker tbody tr { cursor: pointer; }
  .picker tr.chosen { background: var(--c-accent-surface) !important; box-shadow: inset 3px 0 0 var(--c-accent); }
  .picker tr.taken td { color: var(--c-text-mute); }
  .who { padding: 0; border: 0; background: none; color: var(--c-accent); font: inherit; font-weight: 600; text-align: left; cursor: pointer; }
  .taken .who { color: var(--c-text-mute); }
  .picker td small { display: block; color: var(--c-text-dim); font-size: var(--c-text-small); }
  .show-more { margin-top: .75rem; }
  .round { border-radius: 50%; }
  .phone-line { display: none !important; }
  @media (max-width: 640px) {
    .stacked { min-width: 0; }
    .stacked thead, .stacked td:not(:first-child) { display: none; }
    .stacked .phone-line { display: block !important; }
  }
</style>
