<script lang="ts">
  // Throwaway: what a reference page offers for the active character. One card, named after the character, with the
  // facts that page can check and the planner action that fits it.
  import { base } from '$app/paths';
  import SideCard from '$lib/detail/SideCard.svelte';
  import type { PlannerMock } from '../data.server';

  export let mock: PlannerMock;
  export let kind: 'item' | 'item-planned' | 'class' | 'adventurer' | 'dungeon';
  export let compare = false;

  $: druid = mock.classIcons.Druid ? `${base}/data/${mock.classIcons.Druid.url}` : undefined;
  $: needs = new Map(mock.needs.map((need) => [need.key, need]));
  $: grotto = mock.acquisition.groups.find((group) => group.name === 'Tidefallen Grotto');
  const change = (from = 0, to = 0) => {
    const difference = Math.round((to - from) * 10) / 10;
    return difference === 0 ? 'Same' : `${difference > 0 ? '+' : '−'}${Math.abs(difference)}`;
  };
</script>

<div class="handoff planner">
  {#if kind === 'dungeon' && grotto}
    <SideCard title="From Elara’s Plan">
      <p class="line">{grotto.rows.length} items Elara still needs drop here.</p>
      <ul class="plan">
        {#each grotto.rows as row}
          {@const need = needs.get(row.need)}
          {#if need}
            <li>
              {#if need.item.icon}<img src={`${base}/data/${need.item.icon}`} alt="" />{/if}
              <span><a class="c-link" href={`${base}/items/${need.item.slug}/`}>{need.item.name}</a><small>{need.version ? `${need.version} from the timed run reward bag` : row.ways.filter((way) => way.kind === 'drop').map((way) => way.from.name).join(' or ') || 'Timed run reward bag'}</small></span>
            </li>
          {/if}
        {/each}
      </ul>
      <a class="c-link small" href={`${base}/planner-mockup/get/`}>Everything Elara Still Needs</a>
    </SideCard>
  {/if}
  {#if kind === 'item-planned'}
    <SideCard title="In Elara’s Plan">
      <p class="who">{#if druid}<img src={druid} alt="" />{/if}<span><strong>Elara</strong> · Druid · Level 24</span></p>
      <dl class="pm-dl">
        <div><dt>Slot</dt><dd>Helmet<small>Corruption 3, with a Blue Intellect Gem</small></dd></div>
        <div><dt>Collected</dt><dd>Not yet</dd></div>
      </dl>
      <p class="pm-note">Only the reward bag of a timed Tidefallen Grotto run gives it corrupted.</p>
      <div class="pm-row-actions"><button class="c-action primary">I Have It</button><a class="c-action" href={`${base}/planner-mockup/get/`}>Where to Get</a></div>
    </SideCard>
  {:else if kind !== 'dungeon'}
  <SideCard title={kind === 'class' ? 'Planner' : kind === 'item' ? 'For Elara' : 'Elara’s Party'}>
    <p class="who">{#if druid}<img src={druid} alt="" />{/if}<span><strong>Elara</strong> · Druid · Level 24</span></p>
    {#if kind === 'item'}
      <dl class="pm-dl">
        <div><dt>Can Wear</dt><dd>Yes, from level 21</dd></div>
        <div><dt>Wearing</dt><dd><a class="c-link" href={`${base}/items/hat-of-the-arcanist/`}>Hat of the Arcanist</a><small>Corruption 3, one gem</small></dd></div>
      </dl>
      {#if compare}
        <table class="compare">
          <thead><tr><th scope="col">Stat</th><th scope="col" class="num">Now</th><th scope="col" class="num">This</th><th scope="col" class="num">Change</th></tr></thead>
          <tbody>
            {#each mock.comparison as row}
              <tr><th scope="row">{row.stat}</th><td class="num">{row.from ?? '—'}</td><td class="num">{row.to ?? '—'}</td><td class="num">{change(row.from, row.to)}</td></tr>
            {/each}
          </tbody>
        </table>
      {/if}
      <div class="pm-row-actions"><button class="c-action primary">Equip on Elara</button>{#if compare}<button class="c-action quiet">Hide Comparison</button>{:else}<a class="c-action" href="?compare=1">Compare</a>{/if}</div>
    {:else if kind === 'class'}
      <p class="line">Elara is a Druid.</p>
      <div class="stack"><a class="c-action primary" href={`${base}/planner-mockup/talents/`}>Open Elara’s Talents</a><a class="c-link small" href={`${base}/planner-mockup/setup/`}>Plan a New Druid</a></div>
    {:else if kind === 'adventurer'}
      <dl class="pm-dl">
        <div><dt>Members</dt><dd>3 of 4</dd></div>
        <div><dt>Damage</dt><dd>2 of 3, counting Elara</dd></div>
      </dl>
      <div class="stack"><button class="c-action primary">Add to Elara’s Party</button><span class="pm-note">Starts at level 20 and joins from the start.</span></div>
    {/if}
  </SideCard>
  {/if}
</div>

<style>
  .handoff { display: contents; }
  .who { display: flex; align-items: center; gap: .5rem; margin: 0; color: var(--c-text-dim); font-size: var(--c-text-small); }
  .who img { width: 1.5rem; height: 1.5rem; object-fit: contain; }
  .who strong { color: var(--c-text-strong); }
  .line { margin: 0; }
  .stack { display: grid; gap: .5rem; justify-items: start; }
  .plan { display: grid; gap: .45rem; margin: 0; padding: 0; list-style: none; }
  .plan li { display: grid; grid-template-columns: 1.75rem minmax(0, 1fr); align-items: center; gap: .55rem; }
  .plan img { width: 1.75rem; height: 1.75rem; object-fit: contain; }
  .plan span { display: grid; line-height: 1.35; }
  .plan small { color: var(--c-text-dim); font-size: var(--c-text-small); }
  .small { font-size: var(--c-text-small); }
  .compare { width: 100%; border-collapse: collapse; font-size: var(--c-text-small); font-variant-numeric: tabular-nums; }
  .compare th, .compare td { padding: .3rem 0; border-top: 1px solid var(--c-line-soft); text-align: left; vertical-align: middle; }
  .compare thead th { border-top: 0; color: var(--c-text-dim); font-weight: 600; }
  .compare tbody th { color: var(--c-text); font-weight: 400; }
  .compare .num { padding: 0 .5rem; text-align: right; white-space: nowrap; }
  .compare td:last-child { text-align: right; }
</style>
