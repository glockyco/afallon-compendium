<script lang="ts">
  import { base } from '$app/paths';
  import { page } from '$app/stores';
  import PageShell from '$lib/PageShell.svelte';
  import DetailFrame from '$lib/detail/DetailFrame.svelte';
  import TitleBlock from '$lib/detail/TitleBlock.svelte';
  import AnswerCard from '$lib/detail/AnswerCard.svelte';
  import SideCard from '$lib/detail/SideCard.svelte';
  import '../kit/planner.css';
  import type { PlannerMock } from '../data.server';

  export let data: { registry: never; release: never; mock: PlannerMock };
  $: mock = data.mock;
  $: importing = $page.url.searchParams.has('import');
  $: deleted = $page.url.searchParams.has('deleted');
  $: characters = deleted ? mock.characters.filter((entry) => entry.id !== 'mira') : mock.characters;
  $: icon = (name: string) => mock.classIcons[name] ? `${base}/data/${mock.classIcons[name]?.url}` : undefined;
</script>

<PageShell registry={data.registry} crumbs={[{ label: 'Planner', href: `${base}/planner-mockup/` }, { label: 'Characters' }]} release={data.release}>
  <article class="detail-page planner">
    <DetailFrame answer={importing}>
      <div slot="head" class="head">
        <TitleBlock name="Characters" typeLine={`${characters.length} in this browser`} registry={data.registry} />
        <div class="title-actions">
          <a class="c-action primary" href={`${base}/planner-mockup/setup/`}>New Character</a>
          <a class="c-action" href={`${base}/planner-mockup/characters/?import=1`}>Import From File</a>
          <button class="c-action">Export All</button>
        </div>
      </div>

      <div slot="answer">
        {#if importing}
          <AnswerCard title="Import From File">
            <p class="file"><strong>afallon-characters.json</strong> · 3 characters</p>
            <ul class="import">
              <li>
                <span class="pm-name"><img class="pm-icon" src={icon('Druid')} alt="" /><span><strong>Elara</strong><small>Druid · Human · Level 26</small></span></span>
                <span class="decide"><span class="state">You already have Elara. The file’s Elara is level 26; yours is level 24.</span>
                <span class="pm-segmented" role="radiogroup" aria-label="Elara"><button aria-pressed="true">Keep Mine</button><button>Use the File’s</button><button>Keep Both</button></span></span>
              </li>
              <li>
                <span class="pm-name"><img class="pm-icon" src={icon('Shieldmaster')} alt="" /><span><strong>Brann</strong><small>Shieldmaster · Dwarf · Level 41</small></span></span>
                <span class="decide"><span class="state">Same as yours. Nothing to change.</span></span>
              </li>
              <li>
                <span class="pm-name"><img class="pm-icon" src={icon('Assassin')} alt="" /><span><strong>Thorn</strong><small>Assassin · Orc · Level 30</small></span></span>
                <span class="decide"><span class="state">Not in this browser yet.</span><label class="add"><input type="checkbox" checked /> Add Thorn</label></span>
              </li>
            </ul>
            <div class="import-actions"><button class="c-action primary">Import 1 Character</button><a class="c-action quiet" href={`${base}/planner-mockup/characters/`}>Cancel</a><span class="pm-note">Nothing changes until you import, and Undo reverses it.</span></div>
          </AnswerCard>
        {/if}
      </div>

      <div slot="side">
        <SideCard title="About Characters">
          <ul class="plain">
            <li>Characters stay in this browser. Clearing the browser’s site data deletes them, so export a copy to keep one.</li>
            <li>The active character is the one other pages compare with. Choose it here or from the menu at the top.</li>
            <li>A shared link opens as a preview and never changes these characters.</li>
          </ul>
        </SideCard>
      </div>

      {#if deleted}
        <p class="undo" role="status">Deleted Mira. <button class="text-button">Undo</button></p>
      {/if}
      <ul class="roster">
        {#each characters as entry}
          <li class:active={entry.active}>
            {#if icon(entry.className)}<img class="pm-icon-lg" src={icon(entry.className)} alt="" />{/if}
            <span class="who"><span class="line"><a class="c-link name" href={`${base}/planner-mockup/`}>{entry.name}</a>{#if entry.active}<span class="pm-tag accent">Active</span>{/if}</span><span class="sub">{entry.className} · {entry.race} · Level {entry.level}</span><span class="facts"><span>Talent Points {entry.talents}</span> · <span>Gear {entry.gear}</span> · <span>Party {entry.party}</span> · <span>Changed {entry.changed}</span></span></span>
            <span class="row-actions">{#if !entry.active}<button class="c-action">Make Active</button>{/if}<button class="c-action quiet" aria-label={`More for ${entry.name}`}>More <span aria-hidden="true">▾</span></button></span>
          </li>
        {/each}
      </ul>
    </DetailFrame>
  </article>
</PageShell>

<style>
  .head { display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: center; gap: 1rem; }
  .title-actions { display: flex; flex-wrap: wrap; gap: .5rem; }
  .plain { display: grid; gap: .5rem; margin: 0; padding-left: 1.1rem; color: var(--c-text-dim); }
  .roster { display: grid; margin: 0; padding: 0; border: 1px solid var(--c-line-soft); border-radius: var(--c-radius); background: var(--c-surface-1); list-style: none; overflow: hidden; }
  .roster li { display: grid; grid-template-columns: 2.75rem minmax(0, 1fr) auto; align-items: center; gap: 1rem; padding: .75rem 1rem; border-top: 1px solid var(--c-line-soft); }
  .roster li:first-child { border-top: 0; }
  .roster li.active { background: var(--c-accent-surface); box-shadow: inset 3px 0 0 var(--c-accent); }
  .who { display: grid; min-width: 0; }
  .line { display: flex; align-items: center; gap: .5rem; }
  .name { font: 600 var(--c-text-lead) var(--c-serif); }
  .sub { color: var(--c-text-dim); font-size: var(--c-text-small); }
  .facts { margin-top: .2rem; color: var(--c-text-mute); font-size: var(--c-text-small); }
  .facts span { white-space: nowrap; }
  .row-actions { display: flex; justify-content: flex-end; gap: .4rem; white-space: nowrap; }
  .sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); }
  .undo { display: flex; align-items: center; gap: .6rem; margin: 0 0 .75rem; padding: .55rem .9rem; border: 1px solid var(--c-line); border-radius: var(--c-radius); background: var(--c-surface-1); }
  .file { margin: 0; color: var(--c-text-dim); }
  .file strong { color: var(--c-text-strong); }
  .import { display: grid; margin: 0; padding: 0; border: 1px solid var(--c-line-soft); border-radius: var(--c-radius); list-style: none; }
  .import li { display: grid; grid-template-columns: 15rem minmax(0, 1fr); align-items: center; gap: 1rem; padding: .6rem .9rem; border-top: 1px solid var(--c-line-soft); }
  .import li:first-child { border-top: 0; }
  .import small { display: block; color: var(--c-text-dim); font-size: var(--c-text-small); }
  .decide { display: grid; justify-items: start; gap: .45rem; }
  .state { color: var(--c-text-soft); font-size: var(--c-text-small); }
  .add { display: inline-flex; align-items: center; gap: .4rem; font-size: var(--c-text-small); }
  .add input { accent-color: var(--c-accent); }
  .import-actions { display: flex; flex-wrap: wrap; align-items: center; gap: .75rem; }
  @media (max-width: 640px) {
    .head { grid-template-columns: minmax(0, 1fr); }
    .roster li { grid-template-columns: 2.75rem minmax(0, 1fr); }
    .row-actions { grid-column: 1 / -1; justify-content: flex-start; }
    .import li { grid-template-columns: minmax(0, 1fr); gap: .4rem; }
  }
</style>
