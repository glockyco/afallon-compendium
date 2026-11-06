<script lang="ts">
  import { afterNavigate } from '$app/navigation';
  import { base } from '$app/paths';
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { activeCharacter } from './characters';
  import { characters, initializeCharacters } from './characters-store';
  import type { CharacterClassSummary } from './page-context';

  export let phone = false;
  let mounted = false;
  let menu: HTMLDetailsElement;
  let message = '';
  $: summaries = ($page.data.characterClasses ?? []) as CharacterClassSummary[];
  $: collection = $characters.collection;
  $: active = mounted && $characters.ready ? activeCharacter(collection) : undefined;
  $: activeSummary = active ? summaries.find((summary) => summary.key === active.build.class) : undefined;
  $: className = active ? activeSummary?.name ?? 'Class Not Available' : '';
  const summaryOf = (key: string) => summaries.find((summary) => summary.key === key);

  async function switchCharacter(id: string): Promise<void> {
    const result = await characters.switchActive(id);
    message = result.ok ? '' : result.reason ?? 'The character could not be selected.';
    // Keep the chosen control and disclosure in place: switching must not move focus or scroll.
  }
  afterNavigate(({ type }) => { if (type !== 'enter' && menu) menu.open = false; });
  onMount(() => {
    mounted = true;
    void initializeCharacters();
    const outside = (event: PointerEvent) => { if (event.target instanceof Node && !menu.contains(event.target)) menu.open = false; };
    const keydown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || !menu.open) return;
      event.stopPropagation();
      menu.open = false;
      menu.querySelector('summary')?.focus();
    };
    document.addEventListener('pointerdown', outside);
    menu.addEventListener('keydown', keydown);
    return () => { document.removeEventListener('pointerdown', outside); menu.removeEventListener('keydown', keydown); };
  });
</script>

<details class="character-menu" class:phone bind:this={menu} on:focusout={(event) => { if (event.relatedTarget instanceof Node && !menu.contains(event.relatedTarget)) menu.open = false; }}>
  <summary aria-label={active ? `Active character: ${active.name}, ${className}, level ${active.build.level}` : 'Character planner'}>
    {#if activeSummary?.icon}<img src={`${base}/data/${activeSummary.icon}`} alt="" />{/if}
    <span class="label">{active ? phone ? `${active.name} · ${className} ${active.build.level}` : active.name : 'Planner'}</span>
  </summary>
  <div class="character-panel">
    {#if mounted && collection.characters.length}
      <p class="heading">Characters</p>
      <ul>{#each collection.characters as character (character.id)}
        {@const summary = summaryOf(character.build.class)}
        <li><button type="button" aria-pressed={collection.activeId === character.id} on:click={() => switchCharacter(character.id)}>
          {#if summary?.icon}<img src={`${base}/data/${summary.icon}`} alt="" />{:else}<span class="no-icon" aria-hidden="true"></span>{/if}
          <span class="text"><span class="name">{character.name}</span><span class="identity">{summary?.name ?? 'Class Not Available'} · Level {character.build.level}</span></span>
          {#if collection.activeId === character.id}<span class="check" aria-hidden="true">✓</span>{/if}
        </button></li>
      {/each}</ul>
    {:else}
      <p class="empty">Plan a character’s talents, gear and party. Characters stay in this browser.</p>
    {/if}
    <div class="actions">
      {#if collection.characters.length}<a href={`${base}/planner/`}>Open Planner</a>{/if}
      <a href={`${base}/planner/?new=1`}>New Character</a>
      {#if collection.characters.length}<a href={`${base}/planner/characters/`}>Manage Characters</a>{/if}
    </div>
    {#if message}<p role="alert">{message}</p>{/if}
  </div>
</details>

<style>
  .character-menu { position: relative; align-self: center; flex: none; max-width: 10rem; color: var(--c-text-soft); font-size: var(--c-text-small); }
  summary { display: flex; align-items: center; gap: .45rem; min-height: 2.5rem; padding: .35rem .6rem; border: 1px solid var(--c-line); border-radius: var(--c-radius-sm); list-style: none; cursor: pointer; }
  summary::-webkit-details-marker { display: none; }
  summary img { width: 1.4rem; height: 1.4rem; flex: none; object-fit: contain; }
  summary .label { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  summary::after { content: ''; flex: none; width: .38rem; height: .38rem; margin: -.2rem 0 0 .1rem; border-right: 1.5px solid currentcolor; border-bottom: 1.5px solid currentcolor; transform: rotate(45deg); }
  summary:hover, details[open] summary { border-color: var(--c-accent-line); color: var(--c-text-strong); }
  .character-panel { position: absolute; top: calc(100% + .35rem); right: 0; z-index: 2; width: 17rem; max-width: calc(100vw - 2rem); padding: .5rem; border: 1px solid var(--c-line); border-radius: var(--c-radius); background: var(--c-surface-1); box-shadow: 0 14px 32px var(--c-shadow); }
  .heading { margin: .25rem .5rem .35rem; color: var(--c-text-dim); font-weight: 600; }
  ul { display: grid; gap: .15rem; max-height: 17rem; overflow-y: auto; padding: 0; margin: 0 0 .4rem; list-style: none; }
  button, a { display: flex; align-items: center; gap: .6rem; width: 100%; padding: .45rem .5rem; border: 0; border-radius: var(--c-radius-sm); background: transparent; color: var(--c-text); font: inherit; text-align: left; text-decoration: none; cursor: pointer; }
  button:hover, a:hover { background: var(--c-tint-hover); }
  button[aria-pressed='true'] { background: var(--c-accent-surface); }
  button img, .no-icon { width: 1.75rem; height: 1.75rem; flex: none; object-fit: contain; }
  .text { display: grid; min-width: 0; flex: 1; }
  .name, .identity { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .name { color: var(--c-text-strong); font-weight: 600; }
  .identity { color: var(--c-text-dim); }
  .check { color: var(--c-accent); }
  .empty { margin: .35rem .5rem .6rem; color: var(--c-text-dim); line-height: 1.45; }
  .actions { display: grid; padding-top: .35rem; border-top: 1px solid var(--c-line-soft); }
  .actions a { color: var(--c-accent-strong); }
  summary:focus-visible, button:focus-visible, a:focus-visible { outline: 2px solid var(--c-accent); outline-offset: 2px; }
  .phone { max-width: none; margin: .65rem 1rem; }
  .phone .character-panel { position: static; width: 100%; max-width: none; margin-top: .4rem; box-shadow: none; }
</style>
