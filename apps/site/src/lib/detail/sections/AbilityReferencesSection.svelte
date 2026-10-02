<script lang="ts">
  import type { AbilityVersion, PublicKindEntry, Ref } from '@afallon/contracts/public';
  import EntityLink from '../../EntityLink.svelte';
  import { nameOf } from '../../format';
  import { shownRowCount, type RelationColumn } from '../relation-table';
  import RelationTable from '../RelationTable.svelte';
  import Section from '../Section.svelte';

  export let versions: AbilityVersion[];
  export let relation: 'usedBy' | 'usedByItems' | 'taughtBy';
  export let registry: PublicKindEntry[];
  export let compact = false;
  export let showAllHref = '#used-by';
  export let onShowAll: (() => void) | undefined = undefined;

  const columns: RelationColumn<Ref>[] = [{ id: 'entity', label: 'Name', value: nameOf, sort: nameOf }];
  $: groups = versions.map((version, index) => ({ refs: version[relation], index })).filter((group) => group.refs.length);
  $: refs = groups.flatMap((group) => group.refs);
  $: count = refs.length;
  // The preview follows the rule of every list. The full section exists only when the preview hides rows.
  $: previewCount = shownRowCount(count, false);
  $: title = relation === 'usedBy' ? 'Used by' : relation === 'usedByItems' ? 'Used by items' : 'Taught by';
  $: id = relation === 'usedBy' ? 'used-by' : relation === 'usedByItems' ? 'used-by-items' : 'taught-by';
</script>

{#if count}
  {#if compact}<div id={versions.length > 1 ? id : undefined} class="compact"><h3>{title} {count}{#if refs.every((ref) => ref.key !== null && ref.kind === 'npcs')}{' NPCs'}{/if}</h3>
    <ul class="preview">{#each refs.slice(0, previewCount) as ref}<li><EntityLink {ref} {registry} /></li>{/each}</ul>
    {#if previewCount < count}<a class="c-link all" href={showAllHref} on:click={() => onShowAll?.()}>Show all {count}</a>{/if}
  </div>
  {:else}<Section {id} {title} {count}><div class="groups">{#each groups as group}<div>{#if versions.length > 1}<h3>Version {group.index + 1} <span>{group.refs.length}</span></h3>{/if}<RelationTable {columns} rows={group.refs} label={`${title}${versions.length > 1 ? `, version ${group.index + 1}` : ''}`}><svelte:fragment slot="cell" let:row><EntityLink ref={row} {registry} /></svelte:fragment></RelationTable></div>{/each}</div></Section>{/if}
{/if}

<style>
  .groups { display: grid; gap: 1rem; }
  h3 { margin-bottom: .5rem; color: var(--c-text-strong); font-size: 1rem; font-weight: 700; }
  h3 span { margin-left: .25rem; color: var(--c-text-mute); font-size: .875rem; font-weight: 500; }
  .compact { padding-top: var(--c-space-block); border-top: 1px solid var(--c-line-soft); }
  .preview { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .4rem .8rem; padding: 0; list-style: none; }
  .preview li { min-width: 0; }
  .all { display: inline-flex; align-items: center; min-height: 1.75rem; margin-top: .6rem; }
  @media (max-width: 640px) { .preview { grid-template-columns: minmax(0, 1fr); } }
</style>
