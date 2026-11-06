<script lang="ts">
  // Throwaway: the player and four places, in the same row style as the equipment list.
  import { base } from '$app/paths';
  import type { PlannerMock } from '../data.server';

  export let party: PlannerMock['party'];
  export let classIcon: string | undefined;
  export let selected: string | undefined = undefined;
  export let choosing = false;
</script>

<div class="places">
  <div class="place you">
    {#if classIcon}<img class="portrait" src={classIcon} alt="" />{/if}
    <span class="who"><span><strong>Elara</strong> <span class="you">You</span></span><span class="sub">Druid · Human</span></span>
    <span class="role"><select class="pm-select" aria-label="Your role"><option>Damage</option><option>Tank</option><option>Healer</option></select></span>
    <span class="level">Level 24</span>
  </div>
  {#each party as member, index}
    <div class="place" class:selected={member.adventurer.slug === selected}>
      {#if member.portrait}<img class="portrait" src={`${base}/data/${member.portrait.url}`} alt="" />{/if}
      <span class="who"><a class="c-link name" href={`${base}/npcs/${member.adventurer.slug}/`}>{member.adventurer.name}</a><span class="sub">{member.class.name} · {member.race?.name}</span></span>
      <span class="role"><span class="pm-tag">{member.role}</span></span>
      <span class="level">Starts at {member.startingLevel}</span>
    </div>
    {#if member.adventurer.slug === selected && $$slots.expanded}<div class="inline phone-only"><slot name="expanded" /></div>{/if}
  {/each}
  <div class="place open" class:selected={choosing}>
    <span class="portrait placeholder" aria-hidden="true"></span>
    <span class="who"><span class="none">{choosing ? 'Choosing an adventurer…' : 'Open spot'}</span></span>
    <span class="role"></span>
    <span class="level">{#if !choosing}<a class="c-action" href={`${base}/planner-mockup/party/choose/`}>Choose Adventurer</a>{/if}</span>
  </div>
</div>

<style>
  .places { display: grid; border: 1px solid var(--c-line-soft); border-radius: var(--c-radius); background: var(--c-surface-1); overflow: hidden; }
  .place { display: grid; grid-template-columns: 2.5rem minmax(0, 1fr) 7rem 10rem; align-items: center; gap: .75rem; min-height: 3.6rem; padding: .45rem .9rem; border-top: 1px solid var(--c-line-soft); cursor: pointer; }
  .place:first-child { border-top: 0; cursor: default; }
  .place:not(.you):hover { background: var(--c-tint-hover); }
  .place.selected { background: var(--c-accent-surface); box-shadow: inset 3px 0 0 var(--c-accent); }
  .you { margin-left: .2rem; color: var(--c-text-dim); font-size: var(--c-text-small); }
  .portrait { width: 2.5rem; height: 2.5rem; box-sizing: border-box; border: 1px solid var(--c-line); border-radius: 50%; background: var(--c-surface-sunken); object-fit: cover; }
  .placeholder { display: block; border-style: dashed; background: transparent; }
  .who { display: grid; min-width: 0; line-height: 1.35; }
  .who strong { color: var(--c-text-strong); }
  .name { font-weight: 600; }
  .sub { color: var(--c-text-dim); font-size: var(--c-text-small); }
  .none { color: var(--c-text-mute); }
  .level { justify-self: end; text-align: right; font-variant-numeric: tabular-nums; }
  .level .c-action { white-space: nowrap; }
  .level small { display: block; color: var(--c-text-dim); font-size: var(--c-text-small); }
  .inline { padding: .75rem; border-top: 1px dashed var(--c-line); background: var(--c-surface-2); }
  @media (max-width: 640px) {
    .place { grid-template-columns: 2.5rem minmax(0, 1fr) auto; grid-template-areas: 'portrait who level' '. role role'; row-gap: .1rem; padding: .55rem .75rem; }
    .portrait { grid-area: portrait; align-self: start; }
    .who { grid-area: who; }
    .role { grid-area: role; margin-top: .3rem; }
    .role:empty { display: none; }
    .level { grid-area: level; align-self: start; }
  }
</style>
