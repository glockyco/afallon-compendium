<script lang="ts">
  import { base } from '$app/paths';
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import type { ItemFacts, PublicAbility } from '@afallon/contracts/public';
  import { activeCharacter } from './characters';
  import { characters, initializeCharacters } from './characters-store';
  import { abilityClassCue, itemClassCue, type CharacterClassSummary } from './page-context';

  export let item: ItemFacts | undefined = undefined;
  export let ability: PublicAbility | undefined = undefined;
  export let heroic = false;
  let mounted = false;
  $: active = mounted && $characters.ready ? activeCharacter($characters.collection) : undefined;
  $: summaries = ($page.data.characterClasses ?? []) as CharacterClassSummary[];
  $: summary = active ? summaries.find((entry) => entry.key === active.build.class) : undefined;
  $: cue = active ? item ? itemClassCue(item, summary) : ability ? abilityClassCue(ability, active.build.class) : undefined : undefined;
  $: detail = heroic ? active ? 'Gear Score Not Available' : 'A character’s gear score needs verified equipment inputs.'
    : item ? [
      cue ?? (item.itemType === 'WEAPON' ? active ? 'Weapon compatibility: Not Verified.' : 'Compare this weapon with your character’s class.' : ''),
      item.levelRequirement !== undefined && item.levelRequirement > 0 ? `Requires level ${item.levelRequirement}${active ? `; ${active.name} is level ${active.build.level}` : ''}.` : '',
    ].filter(Boolean).join(' ')
    : ability ? cue ?? (active ? 'This page does not list this ability for your class.' : 'Class context uses the published facts on this page.') : '';
  onMount(() => { mounted = true; void initializeCharacters(); });
</script>

<!-- A quiet, fixed-height reference line keeps hydration and ordinary switches from moving the article.
     It remains a useful planner entry, not an empty character card, when there is no active character. -->
<div class="active-context" class:with-cue={Boolean(detail)} data-character-context>
  <div class="identity"><a class="c-link" href={`${base}/planner/`}>{active ? active.name : 'Character Planner'}</a>{#if active}<span class="separator" aria-hidden="true">{' · '}</span><span>{summary?.name ?? 'Class Not Available'} · Level {active.build.level}</span>{:else}<span class="neutral">{' · '}Keep your character’s comparisons together</span>{/if}{#if !detail}<a class="context-help" href={`${base}/planner/#help`} aria-label="About active character comparisons" title="About active character comparisons"><span class="c-help-mark" aria-hidden="true">?</span></a>{/if}</div>
  {#if detail}<p>{detail}<a class="context-help" href={`${base}/planner/#help`} aria-label="About active character comparisons" title="About active character comparisons"><span class="c-help-mark" aria-hidden="true">?</span></a></p>{/if}
</div>

<style>
  .active-context { display: grid; align-content: center; gap: .2rem; height: 2.75rem; min-width: 0; color: var(--c-text-dim); font-size: var(--c-text-small); }
  .with-cue { height: 5.5rem; }
  .identity { display: flex; align-items: center; min-width: 0; white-space: nowrap; }
  .identity > a:first-child { max-width: 12rem; overflow: hidden; text-overflow: ellipsis; }
  .identity > span:not(.separator) { overflow: hidden; text-overflow: ellipsis; }
  .separator { white-space: pre; }
  .context-help { display: inline-flex; align-items: center; flex: none; margin-left: .4rem; color: var(--c-accent); vertical-align: middle; text-decoration: none; }
  .context-help:focus-visible { outline: 2px solid var(--c-accent); outline-offset: 2px; }
  p { margin: 0; line-height: 1.4; }
  @media (max-width: 600px) { .neutral { display: none; } .identity > a:first-child { max-width: 7.5rem; } .with-cue { height: 6.5rem; } }
</style>
