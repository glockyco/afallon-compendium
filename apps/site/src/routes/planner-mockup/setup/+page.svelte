<script lang="ts">
  import { base } from '$app/paths';
  import PageShell from '$lib/PageShell.svelte';
  import DetailFrame from '$lib/detail/DetailFrame.svelte';
  import TitleBlock from '$lib/detail/TitleBlock.svelte';
  import AnswerCard from '$lib/detail/AnswerCard.svelte';
  import SideCard from '$lib/detail/SideCard.svelte';
  import LevelControl from '$lib/detail/LevelControl.svelte';
  import '../kit/planner.css';
  import type { PlannerMock } from '../data.server';

  export let data: { registry: never; release: never; mock: PlannerMock };
  $: mock = data.mock;
  $: races = mock.talents.doc.facts.races;
  const classes = ['Shieldmaster', 'Wizard', 'Necromancer', 'Assassin', 'Druid', 'Hunter'];
</script>

<PageShell registry={data.registry} crumbs={[{ label: 'Planner', href: `${base}/planner-mockup/` }, { label: 'New Character' }]} release={data.release}>
  <article class="detail-page planner">
    <DetailFrame mobileRestFirst>
      <div slot="head"><TitleBlock name="New Character" registry={data.registry} /></div>

      <div slot="answer">
        <AnswerCard title="Character">
          <label class="field"><span class="pm-label">Name</span><input class="pm-input" type="text" value="Elara" /></label>
          <fieldset class="choice">
            <legend class="pm-label">Class</legend>
            <div class="options three">
              {#each classes as option}
                <label class="option" class:chosen={option === 'Druid'}><input type="radio" name="class" checked={option === 'Druid'} />{#if mock.classIcons[option]}<img src={`${base}/data/${mock.classIcons[option]?.url}`} alt="" />{/if}<span>{option}</span></label>
              {/each}
            </div>
          </fieldset>
          <fieldset class="choice">
            <legend class="pm-label">Race</legend>
            <div class="options three">
              {#each races as race, index}
                <label class="option" class:chosen={index === 0}><input type="radio" name="race" checked={index === 0} />{#if 'icon' in race && race.icon}<img src={`${base}/data/${race.icon.url}`} alt="" />{/if}<span>{race.name}</span></label>
              {/each}
            </div>
          </fieldset>
          <div class="field pm-hidden-label"><span class="pm-label">Level</span><LevelControl id="setup-level" label="Level" min={1} max={60} level={24} compact slider={false} /></div>
          <div class="create"><button class="c-action primary">Create Character</button><span class="pm-note">You can change all of this later.</span></div>
        </AnswerCard>
      </div>

      <div slot="side" class="side">
        <SideCard title="Other Ways to Start">
          <ul class="ways">
            <li><strong>From a shared link.</strong> Open it, and the build shows as a preview you can save.</li>
            <li><strong>From a file.</strong> <a class="c-link" href={`${base}/planner-mockup/characters/?import=1`}>Import characters</a> you exported from another browser.</li>
            <li><strong>From your save.</strong> <a class="c-link" href={`${base}/planner-mockup/save/`}>Read a save file</a> to copy its class, race and level.</li>
          </ul>
        </SideCard>
      </div>
    </DetailFrame>
  </article>
</PageShell>

<style>
  .field { display: grid; gap: .4rem; max-width: 20rem; }
  .choice { display: grid; gap: .4rem; margin: 0; padding: 0; border: 0; }
  .choice legend { margin-bottom: .4rem; }
  .options { display: grid; gap: .5rem; }
  .options.three { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .option { position: relative; display: flex; align-items: center; gap: .55rem; padding: .5rem .7rem; border: 1px solid var(--c-line); border-radius: var(--c-radius-sm); background: var(--c-surface-1); color: var(--c-text); cursor: pointer; }
  .option input { position: absolute; opacity: 0; pointer-events: none; }
  .option img { width: 1.75rem; height: 1.75rem; flex: none; object-fit: contain; }
  .option span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .option.chosen { border-color: var(--c-accent-line); background: var(--c-accent-surface); }
  .create { display: flex; flex-wrap: wrap; align-items: center; gap: 1rem; }
  .ways { display: grid; gap: .65rem; margin: 0; padding: 0; color: var(--c-text-soft); list-style: none; }
  .ways strong { color: var(--c-text-strong); font-weight: 600; }
  @media (max-width: 640px) {
    .options.three { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  }
</style>
