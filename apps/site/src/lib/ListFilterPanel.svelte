<script lang="ts">
  import type { PublicKindEntry } from '@afallon/contracts/public';
  import { formatNumber, readerNoun } from './format';
  import { listValueLabel, statLabel, type FacetOption, type ListFilterState } from './list-filters';

  type Facet = PublicKindEntry['facets'][number];
  export let groups: Array<{ facet: Facet; options: FacetOption[] }>;
  export let ranges: Array<{ id: string; label: string }>;
  export let stats: Array<{ key: string; count: number }>;
  export let state: ListFilterState;
  /** Distinguishes the sidebar copy from the sheet copy, so control ids stay unique. */
  export let instance: string;
  export let onFacet: (id: string, value: string, checked: boolean) => void;
  export let onRange: (bound: 'min' | 'max', id: string, value: string) => void;
  export let onAddStat: (key: string) => void;
  export let onStatBound: (index: number, bound: 'min' | 'max', value: string) => void;
  export let onRemoveStat: (index: number) => void;
  /** The groups that start open; undefined opens every group. `stats` names the Stats group. */
  export let openGroups: readonly string[] | undefined = undefined;

  // A group is open when the reader opened it, or, until the reader opens or closes it, when it is a default group or
  // has an active filter, so a shared link shows its own filters.
  let chosen: Record<string, boolean> = {};
  $: isOpen = (key: string, active: boolean) => chosen[key] ?? (openGroups === undefined || openGroups.includes(key) || active);
  // The toggle event also follows an opening by an active filter, so a group stays open after its filter is cleared.
  const toggled = (key: string, event: Event) => { chosen = { ...chosen, [key]: (event.currentTarget as HTMLDetailsElement).open }; };

  // A group with many values gets a field that narrows the values it shows. It does not filter the list.
  const LONG_GROUP = 10;
  let searches: Record<string, string> = {};
  const shown = (facet: Facet, options: FacetOption[], search: string | undefined) => {
    const needle = (search ?? '').trim().toLocaleLowerCase();
    return needle ? options.filter((option) => listValueLabel(facet.id, option.value).toLocaleLowerCase().includes(needle)) : options;
  };
  $: addable = stats.filter((option) => !state.stats.some((filter) => filter.key === option.key));
</script>

<!-- Every group is a disclosure. Its summary names the group, counts its active filters, and shows a chevron that turns
     when the group opens or closes, as the map sidebar does. -->
<div class="panel">
  {#each groups as group (group.facet.id)}
    {@const selected = state.facets[group.facet.id] ?? []}
    <details class="group" open={isOpen(group.facet.id, selected.length > 0)} on:toggle={(event) => toggled(group.facet.id, event)}>
      <summary><span class="title">{group.facet.label}</span>{#if selected.length}<span class="picked">{formatNumber(selected.length)}</span>{/if}<svg class="chevron" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="m3.5 6 4.5 4.5L12.5 6" /></svg></summary>
      {#if group.options.length > LONG_GROUP}
        <input class="narrow" type="search" placeholder={`Find ${readerNoun(group.facet.label)}`} aria-label={`Find ${readerNoun(group.facet.label)} values`}
          value={searches[group.facet.id] ?? ''} on:input={(event) => (searches = { ...searches, [group.facet.id]: event.currentTarget.value })} />
      {/if}
      <ul class="options" class:long={group.options.length > LONG_GROUP}>
        {#each shown(group.facet, group.options, searches[group.facet.id]) as option (option.value)}
          {@const checked = selected.includes(option.value)}
          <li>
            <label class:none={option.count === 0 && !checked}>
              <input type="checkbox" {checked} disabled={option.count === 0 && !checked}
                on:change={(event) => onFacet(group.facet.id, option.value, event.currentTarget.checked)} />
              <span class="name">{listValueLabel(group.facet.id, option.value)}</span>
              <span class="count">{formatNumber(option.count)}</span>
            </label>
          </li>
        {/each}
      </ul>
    </details>
  {/each}

  {#each ranges as range (range.id)}
    <details class="group" open={isOpen(range.id, Boolean(state.minimums[range.id] || state.maximums[range.id]))} on:toggle={(event) => toggled(range.id, event)}>
      <summary><span class="title">{range.label}</span>{#if state.minimums[range.id] || state.maximums[range.id]}<span class="picked">1</span>{/if}<svg class="chevron" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="m3.5 6 4.5 4.5L12.5 6" /></svg></summary>
      <div class="bounds">
        <input type="number" inputmode="numeric" placeholder="Min" aria-label={`Lowest ${readerNoun(range.label)}`}
          value={state.minimums[range.id] ?? ''} on:change={(event) => onRange('min', range.id, event.currentTarget.value)} />
        <span aria-hidden="true">–</span>
        <input type="number" inputmode="numeric" placeholder="Max" aria-label={`Highest ${readerNoun(range.label)}`}
          value={state.maximums[range.id] ?? ''} on:change={(event) => onRange('max', range.id, event.currentTarget.value)} />
      </div>
    </details>
  {/each}

  {#if stats.length}
    <details class="group" open={isOpen('stats', state.stats.length > 0)} on:toggle={(event) => toggled('stats', event)}>
      <summary><span class="title">Stats</span>{#if state.stats.length}<span class="picked">{formatNumber(state.stats.length)}</span>{/if}<svg class="chevron" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="m3.5 6 4.5 4.5L12.5 6" /></svg></summary>
      {#each state.stats as filter, index (filter.key)}
        <div class="stat">
          <span class="stat-name">{statLabel(filter.key)}</span>
          <button type="button" class="remove" aria-label={`Remove the ${statLabel(filter.key)} filter`} on:click={() => onRemoveStat(index)}>×</button>
          <div class="bounds">
            <input type="number" inputmode="decimal" placeholder="Min" aria-label={`Lowest ${statLabel(filter.key)}`}
              value={filter.min} on:change={(event) => onStatBound(index, 'min', event.currentTarget.value)} />
            <span aria-hidden="true">–</span>
            <input type="number" inputmode="decimal" placeholder="Max" aria-label={`Highest ${statLabel(filter.key)}`}
              value={filter.max} on:change={(event) => onStatBound(index, 'max', event.currentTarget.value)} />
          </div>
        </div>
      {/each}
      {#if addable.length}
        <select id={`${instance}-add-stat`} aria-label="Add a stat filter" value="" on:change={(event) => { const key = event.currentTarget.value; event.currentTarget.value = ''; if (key) onAddStat(key); }}>
          <option value="">Add a stat</option>
          {#each addable as option (option.key)}<option value={option.key}>{statLabel(option.key)} ({formatNumber(option.count)})</option>{/each}
        </select>
      {/if}
    </details>
  {/if}
</div>

<style>
  .panel { display: grid; gap: .25rem; }
  .group { margin: 0; padding: .7rem 0; border-top: 1px solid var(--c-line); min-width: 0; }
  .group:first-child { border-top: 0; padding-top: 0; }
  summary { display: flex; align-items: center; gap: .4rem; min-height: 1.75rem; padding: 0; color: var(--c-text); font-size: var(--c-text-label); font-weight: 700; list-style: none; cursor: pointer; }
  summary::-webkit-details-marker { display: none; }
  summary:hover { color: var(--c-text-strong); }
  .chevron { flex: none; width: 14px; height: 14px; margin-left: auto; color: var(--c-accent-muted); fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; transition: transform 160ms ease; }
  summary:hover .chevron { color: var(--c-accent); }
  details[open] > summary .chevron { transform: rotate(180deg); }
  .picked { min-width: 1.25rem; padding: 0 .35rem; border-radius: 999px; background: var(--c-accent-line); color: var(--c-surface-1); font-size: .75rem; text-align: center; }
  .options { display: grid; gap: .1rem; margin: .35rem 0 0; padding: 0; list-style: none; }
  /* A long group scrolls inside a bounded height, so it does not push every later group off the screen. */
  .options.long { max-height: 15rem; overflow-y: auto; padding-right: .25rem; }
  label { display: grid; grid-template-columns: auto minmax(0, 1fr) auto; align-items: center; gap: .5rem; min-height: 1.85rem; color: var(--c-text-soft); cursor: pointer; }
  label:hover { color: var(--c-text); }
  label.none { color: var(--c-text-mute); cursor: default; }
  .name { overflow-wrap: anywhere; }
  .count { color: var(--c-text-mute); font-size: var(--c-text-small); font-variant-numeric: tabular-nums; }
  input[type='checkbox'] { width: 1rem; height: 1rem; margin: 0; accent-color: var(--c-accent); }
  .narrow, select, .bounds input { width: 100%; min-height: 2.1rem; padding: .3rem .5rem; border: 1px solid var(--c-line-strong); border-radius: var(--c-radius-sm); background: var(--c-surface-sunken); color: var(--c-text); }
  .narrow { margin-top: .35rem; }
  .bounds { display: grid; grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr); align-items: center; gap: .35rem; margin-top: .35rem; }
  .bounds span { color: var(--c-text-mute); }
  /* Spin buttons cover the placeholder of a narrow number field. */
  .bounds input { appearance: textfield; -moz-appearance: textfield; }
  .bounds input::-webkit-inner-spin-button, .bounds input::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
  .stat { display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: center; gap: 0 .5rem; margin-top: .55rem; }
  .stat .bounds { grid-column: 1 / -1; margin-top: .2rem; }
  .stat-name { color: var(--c-text-soft); overflow-wrap: anywhere; }
  .remove { width: 1.75rem; height: 1.75rem; border: 1px solid var(--c-line-strong); border-radius: var(--c-radius-sm); background: transparent; color: var(--c-text-soft); cursor: pointer; }
  .remove:hover { color: var(--c-text); border-color: var(--c-accent-line); }
  select { margin-top: .55rem; appearance: none; padding-right: 1.6rem; background-image: linear-gradient(45deg, transparent 50%, var(--c-text-mute) 50%), linear-gradient(135deg, var(--c-text-mute) 50%, transparent 50%); background-position: right 1rem center, right .65rem center; background-size: .35rem .35rem; background-repeat: no-repeat; }
  input:focus-visible, select:focus-visible, .remove:focus-visible, summary:focus-visible { outline: 2px solid var(--c-accent); outline-offset: 2px; }
</style>
