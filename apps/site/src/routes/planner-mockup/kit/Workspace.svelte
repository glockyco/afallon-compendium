<script lang="ts">
  // Throwaway: the planner workspace shell. One title, four views with their status, a side column whose first card
  // is whatever the reader selected and whose last card is the character itself.
  import { base } from '$app/paths';
  import './planner.css';
  import type { PublicKindEntry } from '@afallon/contracts/public';
  import PageShell from '$lib/PageShell.svelte';
  import DetailFrame from '$lib/detail/DetailFrame.svelte';
  import TitleBlock from '$lib/detail/TitleBlock.svelte';
  import SideCard from '$lib/detail/SideCard.svelte';
  import LevelControl from '$lib/detail/LevelControl.svelte';
  import EntityLink from '$lib/EntityLink.svelte';
  import type { PlannerMock } from '../data.server';

  export let data: { registry: PublicKindEntry[]; release: never; mock: PlannerMock };
  export let view: 'overview' | 'talents' | 'gear' | 'party' | 'get';
  export let preview = false;
  export let moreOpen = false;
  export let source: 'link' | 'save' = 'link';

  $: mock = data.mock;
  $: doc = mock.talents.doc;
  $: classIcon = doc.art.icon ? `${base}/data/${doc.art.icon.url}` : undefined;
  $: slotsUsed = mock.slots.filter((slot) => slot.document).length;
  $: slotCount = mock.slots.filter((slot) => !slot.note).length;
  $: left = mock.needs.filter((need) => !need.collected).length;
  $: empty = source === 'save';
  $: views = [
    { key: 'overview', label: 'Overview', status: undefined },
    { key: 'talents', label: 'Talents', status: `${empty ? 64 : mock.talents.total - mock.talents.spent} points left` },
    { key: 'gear', label: 'Gear', status: `${empty ? 0 : slotsUsed} of ${slotCount} slots` },
    { key: 'party', label: 'Party', status: `${empty ? 0 : mock.party.length} of 4 members` },
    { key: 'get', label: 'Where to Get', status: empty ? 'Nothing planned' : `${left} items left` },
  ];
  const href = (key: string) => `${base}/planner-mockup/${key === 'overview' ? '' : `${key}/`}${preview ? '?preview=1' : ''}`;
</script>

<PageShell registry={data.registry} crumbs={[{ label: 'Planner' }]} release={data.release}>
  <article class="detail-page planner">
    {#if preview}
      <div class="preview-note" role="status">
        {#if source === 'save'}
          <p><strong>From your save.</strong> Class, race and level came from your save file. Talents, gear and party start empty. Nothing is saved yet.</p>
        {:else}
          <p><strong>Shared build.</strong> You opened this from a link. It isn’t saved, and your characters haven’t changed.</p>
        {/if}
        <div class="actions"><button class="c-action">Save as New Character</button><button class="c-action">Replace Elara’s Build</button></div>
      </div>
    {/if}
    <DetailFrame mobileRestFirst answer={Boolean($$slots.answer)}>
      <div slot="head" class="head">
        <div class="title-row">
          <TitleBlock name={preview ? source === 'save' ? 'New Plan' : 'Shared Build' : 'Elara'} imageUrl={classIcon} typeLine={preview ? source === 'save' ? 'Druid · Orc · Level 22' : 'Druid · Orc · Level 24' : 'Druid · Human · Level 24'} registry={data.registry} />
          <div class="title-actions">
            <span class="saved">{preview ? 'Not saved' : 'Saved in this browser'}</span>
            <button class="c-action">Copy Link</button>
            <details class="more" open={moreOpen}>
              <summary class="c-action">More <span aria-hidden="true">▾</span></summary>
              <div class="menu" role="menu">
                {#if preview}
                  <button role="menuitem">Save as New Character</button>
                  <button role="menuitem">Replace Elara’s Build</button>
                {:else}
                  <button role="menuitem">Rename</button>
                  <button role="menuitem">Duplicate</button>
                  <button role="menuitem">Export Characters</button>
                  <hr />
                  <button role="menuitem" class="danger">Delete Elara</button>
                {/if}
              </div>
            </details>
          </div>
        </div>
        <nav class="views" aria-label="Planner views">
          {#each views as entry}
            <a href={href(entry.key)} aria-current={entry.key === view ? 'page' : undefined}>
              <span class="label">{entry.label}</span>{#if entry.status}<span class="status">{entry.status}</span>{/if}
            </a>
          {/each}
        </nav>
      </div>

      <div slot="answer"><slot name="answer" /></div>

      <div slot="side" class="side-stack">
        <slot name="inspector" />
        <SideCard title="Character">
          <dl class="character">
            <div><dt>Class</dt><dd><EntityLink ref={doc.ref} registry={data.registry} /></dd></div>
            <div><dt>Race</dt><dd>{#if preview}Orc{:else}<select aria-label="Race"><option>Human</option><option>Dwarf</option><option>Orc</option></select>{/if}</dd></div>
            <div><dt>Level</dt><dd>{#if preview}{source === 'save' ? 22 : 24}{:else}<LevelControl id="character-level" label="Level" min={1} max={60} level={24} compact slider={false} />{/if}</dd></div>
          </dl>
        </SideCard>
      </div>

      <slot />
    </DetailFrame>
    <slot name="phone-bar" />
  </article>
</PageShell>

<style>
  .planner { display: grid; gap: 1.25rem; }
  .preview-note { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: .75rem 1rem; padding: .85rem 1.1rem; border: 1px solid var(--c-frame-strong); border-radius: var(--c-radius); background: var(--c-accent-surface); }
  .preview-note p { margin: 0; }
  .preview-note strong { color: var(--c-accent-strong); }
  .actions { display: flex; flex-wrap: wrap; gap: .5rem; }
  .head { display: grid; gap: 1.25rem; }
  .title-row { display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: center; gap: 1rem; }
  .title-actions { display: flex; align-items: center; gap: .5rem; }
  .saved { margin-right: .35rem; color: var(--c-text-dim); font-size: var(--c-text-small); white-space: nowrap; }
  .more { position: relative; }
  .more summary { list-style: none; cursor: pointer; }
  .more summary::-webkit-details-marker { display: none; }
  .menu { position: absolute; top: calc(100% + .35rem); right: 0; z-index: 5; display: grid; width: 13rem; padding: .35rem; border: 1px solid var(--c-line); border-radius: var(--c-radius); background: var(--c-surface-1); box-shadow: 0 14px 32px var(--c-shadow); }
  .menu button { padding: .5rem .65rem; border: 0; border-radius: var(--c-radius-sm); background: transparent; color: var(--c-text); font: inherit; text-align: left; cursor: pointer; }
  .menu button:hover { background: var(--c-tint-hover); }
  .menu hr { width: 100%; margin: .3rem 0; border: 0; border-top: 1px solid var(--c-line-soft); }
  .menu .danger { color: var(--c-danger); }

  .views { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); border: 1px solid var(--c-line); border-radius: var(--c-radius); background: var(--c-surface-1); overflow: hidden; }
  .views a { display: grid; align-content: center; gap: .1rem; min-height: 3.6rem; padding: .55rem .9rem; border-left: 1px solid var(--c-line-soft); color: var(--c-text-soft); text-decoration: none; }
  .views a:first-child { border-left: 0; }
  .views a:hover { background: var(--c-tint-hover); color: var(--c-text-strong); }
  .views a[aria-current='page'] { background: var(--c-accent-surface); box-shadow: inset 0 -2px 0 var(--c-accent); color: var(--c-text-strong); }
  .label { font-weight: 600; }
  .views a[aria-current='page'] .label { color: var(--c-accent-strong); }
  .status { overflow: hidden; color: var(--c-text-dim); font-size: var(--c-text-small); text-overflow: ellipsis; white-space: nowrap; }

  .side-stack { display: grid; gap: 1rem; }
  .character { display: grid; gap: .65rem; margin: 0; }
  .character > div { display: grid; grid-template-columns: 5rem minmax(0, 1fr); align-items: center; gap: .75rem; }
  .character dt { color: var(--c-text-dim); font-size: var(--c-text-small); }
  .character dd { margin: 0; }
  .character select { padding: .35rem .5rem; border: 1px solid var(--c-frame); border-radius: var(--c-radius-sm); background: var(--c-surface-sunken); color: var(--c-text); font: inherit; }
  .character :global(.level-control label) { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }

  @media (max-width: 640px) {
    .title-row { grid-template-columns: minmax(0, 1fr); }
    .title-actions { flex-wrap: wrap; }
    /* Five views do not fit one phone row: three above, two below, each label whole. */
    .views { grid-template-columns: repeat(6, minmax(0, 1fr)); }
    .views a { grid-column: span 2; min-height: 0; padding: .6rem .65rem; text-align: center; }
    .views a:nth-child(n + 4) { grid-column: span 3; border-top: 1px solid var(--c-line-soft); }
    .views a:nth-child(4) { border-left: 0; }
    .views .status { font-size: .8rem; }
  }
</style>
