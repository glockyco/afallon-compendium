<script lang="ts">
  import { base } from '$app/paths';
  import { page } from '$app/stores';
  import PageShell from '$lib/PageShell.svelte';
  import DetailFrame from '$lib/detail/DetailFrame.svelte';
  import TitleBlock from '$lib/detail/TitleBlock.svelte';
  import AnswerCard from '$lib/detail/AnswerCard.svelte';
  import SideCard from '$lib/detail/SideCard.svelte';
  import Section from '$lib/detail/Section.svelte';
  import Sections from '$lib/detail/Sections.svelte';
  import '../kit/planner.css';
  import type { PlannerMock } from '../data.server';

  export let data: { registry: never; release: never; mock: PlannerMock };
  $: mock = data.mock;
  $: read = $page.url.searchParams.has('read');
  $: druid = mock.classIcons.Druid ? `${base}/data/${mock.classIcons.Druid.url}` : undefined;
</script>

<PageShell registry={data.registry} crumbs={[{ label: 'Your Save' }]} release={data.release}>
  <article class="detail-page planner">
    <DetailFrame mobileRestFirst>
      <div slot="head"><TitleBlock name="Your Save" typeLine={read ? 'Read from Aldric_RPGBCharacter.txt' : undefined} registry={data.registry} /></div>

      <div slot="answer">
        {#if read}
          <AnswerCard title="Aldric">
            <div class="identity">
              {#if druid}<img class="pm-icon-lg" src={druid} alt="" />{/if}
              <div><p class="who">Druid · Orc · Level 22</p><p class="pm-note">Game version not recorded in the save. Progress uses only what the site can read safely.</p></div>
            </div>
            <div class="actions"><a class="c-action primary" href={`${base}/planner-mockup/preview/?from=save`}>Start a Plan From This Save</a><button class="c-action quiet">Clear Save</button></div>
            <p class="copy-title">A plan from this save gets:</p>
            <dl class="copy">
              <div><dt>Class, race and level</dt><dd><span class="pm-tag ok">Included</span></dd></div>
              <div><dt>Talents</dt><dd><span class="pm-tag">Not read yet</span></dd></div>
              <div><dt>Gear</dt><dd><span class="pm-tag">Not read yet</span></dd></div>
              <div><dt>Party</dt><dd><span class="pm-tag">Not read yet</span></dd></div>
            </dl>
            <p class="pm-note">The plan opens as a preview. Nothing is saved until you choose to, and the save’s character name stays out of it.</p>
          </AnswerCard>
        {:else}
          <AnswerCard title="Read a Save File">
            <p class="privacy">Your save is read in this browser, not uploaded, and not changed.</p>
            <div class="actions"><button class="c-action primary">Choose Save File</button><button class="c-action">Try a Sample Save</button></div>
            <p class="pm-note">Refreshing the page forgets the save. Choose the file again to bring it back.</p>
          </AnswerCard>
        {/if}
      </div>

      <div slot="side">
        <SideCard title="Where Saves Are">
          <p class="path">%USERPROFILE%\<wbr />AppData\<wbr />LocalLow\<wbr />Stargazing interactive\<wbr />Afallon</p>
          <ul class="plain">
            <li>Each character has its own file, named after the character, such as <span class="mono">Aldric_RPGBCharacter.txt</span>.</li>
            <li>Choose one file. The site never reads the others.</li>
          </ul>
        </SideCard>
      </div>

      {#if read}
        <Sections>
          <Section id="progress" title="Progress">
            <div class="tiles">
              <a class="tile" href={`${base}/quests/`}><strong>14</strong><span>Open Quests</span><small>In 5 zones</small></a>
              <a class="tile" href={`${base}/npcs/`}><strong>9</strong><span>Bosses Killed</span><small>Of 41 bosses</small></a>
              <a class="tile" href={`${base}/map/`}><strong>23</strong><span>Areas Not Found</span><small>On the map</small></a>
              <a class="tile" href={`${base}/recipes/`}><strong>41</strong><span>Unlearned Recipes</span><small>3 unclear</small></a>
            </div>
          </Section>
        </Sections>
      {/if}
    </DetailFrame>
  </article>
</PageShell>

<style>
  .identity { display: grid; grid-template-columns: 2.75rem minmax(0, 1fr); align-items: center; gap: .85rem; }
  .identity p { margin: 0; }
  .who { color: var(--c-text-strong); }
  .actions { display: flex; flex-wrap: wrap; gap: .5rem; }
  .copy { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: .5rem; margin: 0; }
  .copy > div { display: grid; gap: .3rem; padding: .55rem .7rem; border: 1px solid var(--c-line-soft); border-radius: var(--c-radius-sm); background: var(--c-surface-1); }
  .copy dt { color: var(--c-text-dim); font-size: var(--c-text-small); }
  .copy dd { margin: 0; }
  .copy-title { margin: 0; color: var(--c-text-dim); font-size: var(--c-text-small); }
  .privacy { margin: 0; color: var(--c-text-strong); }
  .path { margin: 0 0 .6rem; padding: .45rem .6rem; border: 1px solid var(--c-line-soft); border-radius: var(--c-radius-sm); background: var(--c-surface-sunken); font: .82rem/1.45 ui-monospace, monospace;  }
  .mono { font: .85rem ui-monospace, monospace; }
  .plain { display: grid; gap: .45rem; margin: 0; padding-left: 1.1rem; color: var(--c-text-dim); }
  .tiles { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: .75rem; }
  .tile { display: grid; gap: .1rem; padding: .8rem .9rem; border: 1px solid var(--c-line); border-radius: var(--c-radius); background: var(--c-surface-1); color: var(--c-text); text-decoration: none; }
  .tile:hover { border-color: var(--c-accent-line); }
  .tile strong { color: var(--c-text-strong); font: 700 1.6rem var(--c-serif); }
  .tile small { color: var(--c-text-dim); font-size: var(--c-text-small); }
  @media (max-width: 640px) {
    .copy, .tiles { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  }
</style>
