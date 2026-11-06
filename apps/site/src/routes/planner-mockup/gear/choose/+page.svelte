<script lang="ts">
  import { base } from '$app/paths';
  import AnswerCard from '$lib/detail/AnswerCard.svelte';
  import SideCard from '$lib/detail/SideCard.svelte';
  import Section from '$lib/detail/Section.svelte';
  import Sections from '$lib/detail/Sections.svelte';
  import ItemTooltip from '$lib/ItemTooltip.svelte';
  import { rarityTone } from '$lib/format';
  import Workspace from '../../kit/Workspace.svelte';
  import type { PlannerMock } from '../../data.server';

  export let data: { registry: never; release: never; mock: PlannerMock };
  $: mock = data.mock;
  $: candidate = mock.candidate;
  $: shown = mock.helmets.slice(0, 12);
  $: items = mock.slots.filter((slot) => slot.document).length;
  $: candidateScore = candidate.facts.stats.filter((row) => !row.isPercent).reduce((sum, row) => sum + row.amount, 0);
  $: equippedScore = mock.comparison.filter((row) => !row.percent).reduce((sum, row) => sum + (row.from ?? 0), 0);
  const typeOf = (document: PlannerMock['candidate']) => document.facts.armorType ? `${document.facts.armorType[0]}${document.facts.armorType.slice(1).toLowerCase()}` : 'Helmet';
  const keyStats = (document: PlannerMock['candidate']) => document.facts.stats.filter((row) => !/Armor$/.test(row.stat.key === null ? row.stat.label : row.stat.name)).slice(0, 3)
    .map((row) => `${row.amount}${row.isPercent ? '%' : ''} ${row.stat.key === null ? row.stat.label : row.stat.name}`).join(', ');
  const change = (from = 0, to = 0, percent = false) => {
    const difference = Math.round((to - from) * 10) / 10;
    return difference === 0 ? 'Same' : `${difference > 0 ? '+' : '−'}${Math.abs(difference)}${percent ? '%' : ''}`;
  };
</script>

<Workspace {data} view="gear">
  <AnswerCard slot="answer" title="Gear Score">
    <div class="score">
      <strong>{mock.gearScore.toLocaleString('en-US')}</strong>
      <p>From the flat stats of {items} items and the staff’s average damage. In the Heroic Tier, creatures grow 0.08% stronger per point, up to +100% at 1,250.</p>
    </div>
  </AnswerCard>

  <svelte:fragment slot="inspector">
    <div class="c-game-frame"><ItemTooltip document={candidate} registry={data.registry} /></div>
    <SideCard title="Compared With Your Helmet">
      <table class="compare">
        <thead><tr><th scope="col">Stat</th><th scope="col" class="num">Yours</th><th scope="col" class="num">This</th><th scope="col" class="num">Change</th></tr></thead>
        <tbody>
          {#each mock.comparison as row}
            <tr><th scope="row">{row.stat}</th><td class="num">{row.from ?? '—'}</td><td class="num">{row.to ?? '—'}</td><td class="num">{change(row.from, row.to, row.percent)}</td></tr>
          {/each}
          <tr class="score-row"><th scope="row">Gear Score</th><td class="num"></td><td class="num"></td><td class="num">{change(equippedScore, candidateScore)}</td></tr>
        </tbody>
      </table>
      <p class="pm-note">Yours includes its corruption level and gem. Equipping this one replaces them.</p>
      <div class="pm-row-actions"><button class="c-action primary">Equip on Elara</button><a class="c-action quiet" href={`${base}/planner-mockup/gear/`}>Cancel</a></div>
    </SideCard>
  </svelte:fragment>

  <Sections>
    <Section id="choose" title="Choose a Helmet">
      <a class="back c-link" href={`${base}/planner-mockup/gear/`}>Back to Equipment</a>
      <div class="pm-filters">
        <input class="pm-input" type="search" placeholder="Filter helmets" aria-label="Filter helmets" />
        <div class="pm-segmented" role="group" aria-label="Armor"><button aria-pressed="true">All</button><button>Cloth</button><button>Leather</button><button>Mail</button><button>Plate</button></div>
        <label class="check"><input type="checkbox" /> Only what Elara can wear now</label>
      </div>
      <div class="c-table-scroll">
        <table class="c-table picker stacked">
          <thead><tr><th>Helmet</th><th>Armor</th><th class="c-num">Level</th><th>Stats</th><th>Where</th></tr></thead>
          <tbody>
            {#each shown as { document, where }}
              {@const level = document.facts.levelRequirement ?? 0}
              <tr class:chosen={document.ref.key === candidate.ref.key} class:equipped={document.ref.key === mock.equippedHelmet.ref.key} class:locked={level > 24}>
                <td>
                  <span class="pm-name"><img class="pm-icon" src={`${base}/data/${(document.art.icon ?? document.ref.icon)?.url}`} alt="" /><button class="item-name" data-rarity={rarityTone(document.facts.rarity)}>{document.ref.name}</button></span>
                  {#if document.ref.key === mock.equippedHelmet.ref.key}<small>Equipped</small>{:else if level > 24}<small>Requires level {level}</small>{/if}
                  <small class="phone-line">{typeOf(document)} · Level {level} · {where}</small>
                  <small class="phone-line">{keyStats(document)}</small>
                </td>
                <td>{typeOf(document)}</td>
                <td class="c-num">{level}</td>
                <td class="stats">{keyStats(document)}</td>
                <td>{where}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
      <button class="c-action show-more">Show {mock.helmets.length - shown.length} More</button>
    </Section>
  </Sections>

  <div slot="phone-bar" class="phone-bar" aria-label="Chosen helmet">
    <img src={`${base}/data/${(candidate.art.icon ?? candidate.ref.icon)?.url}`} alt="" />
    <div class="phone-name"><strong>{candidate.ref.name}</strong><span>Gear Score {change(equippedScore, candidateScore)}</span></div>
    <div class="phone-actions"><button class="c-action primary">Equip</button></div>
  </div>
</Workspace>

<style>
  .score { display: grid; grid-template-columns: auto minmax(0, 1fr); align-items: center; gap: 1.25rem; }
  .score strong { color: var(--c-text-strong); font: 700 2rem var(--c-serif); font-variant-numeric: tabular-nums; }
  .score p { margin: 0; color: var(--c-text-dim); }
  .back { display: inline-block; margin-bottom: .75rem; font-size: var(--c-text-small); }
  .check { display: inline-flex; align-items: center; gap: .4rem; color: var(--c-text-soft); font-size: var(--c-text-small); }
  .check input { accent-color: var(--c-accent); }
  .picker tbody tr { cursor: pointer; }
  .picker tr.chosen { background: var(--c-accent-surface) !important; box-shadow: inset 3px 0 0 var(--c-accent); }
  .picker tr.locked td { color: var(--c-text-mute); }
  .item-name { padding: 0; border: 0; background: none; color: var(--c-rarity); font: inherit; font-weight: 600; text-align: left; cursor: pointer; }
  .locked .item-name { opacity: .7; }
  .picker td small { margin-left: 2rem; }
  .stats { color: var(--c-text-soft); font-size: var(--c-text-small); }
  .show-more { margin-top: .75rem; }
  .compare { width: 100%; border-collapse: collapse; font-size: var(--c-text-small); font-variant-numeric: tabular-nums; }
  .compare th, .compare td { padding: .3rem 0; border-top: 1px solid var(--c-line-soft); text-align: left; }
  .compare thead th { border-top: 0; color: var(--c-text-dim); font-weight: 600; }
  .compare tbody th { color: var(--c-text); font-weight: 400; }
  .compare .num { padding-left: .5rem; text-align: right; white-space: nowrap; }
  .score-row th, .score-row td { border-top-color: var(--c-line); font-weight: 600 !important; }
  .phone-line { display: none !important; }
  @media (max-width: 640px) {
    .score { grid-template-columns: minmax(0, 1fr); gap: .5rem; }
    .stacked { min-width: 0; }
    .stacked thead, .stacked td:not(:first-child) { display: none; }
    .stacked .phone-line { display: block !important; margin-left: 2rem; }
  }
</style>
