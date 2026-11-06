<script lang="ts">
  import { base } from '$app/paths';
  import { page } from '$app/stores';
  import AnswerCard from '$lib/detail/AnswerCard.svelte';
  import SideCard from '$lib/detail/SideCard.svelte';
  import Section from '$lib/detail/Section.svelte';
  import Sections from '$lib/detail/Sections.svelte';
  import ItemTooltip from '$lib/ItemTooltip.svelte';
  import { rarityTone } from '$lib/format';
  import Workspace from '../kit/Workspace.svelte';
  import type { PlannerMock } from '../data.server';

  type Group = PlannerMock['acquisition']['groups'][number];
  export let data: { registry: never; release: never; mock: PlannerMock };
  $: mock = data.mock;
  $: preview = $page.url.searchParams.has('preview');
  $: needs = new Map(mock.needs.map((need) => [need.key, need]));
  $: left = mock.needs.filter((need) => !need.collected);
  $: collected = mock.needs.filter((need) => need.collected);
  // Fixed sections by the kind of trip. Inside each, places with more of the plan's items come first; the order is
  // set when the view opens, so ticking an item never moves the places around.
  $: dungeons = mock.acquisition.groups.filter((group) => group.kind === 'dungeon');
  const only = (groups: Group[], kinds: string[]) => groups
    .filter((group) => group.kind !== 'dungeon')
    .map((group) => ({ group, rows: group.rows.map((row) => ({ ...row, ways: row.ways.filter((way) => kinds.includes(way.kind)) })).filter((row) => row.ways.length) }))
    .filter((entry) => entry.rows.length)
    .sort((a, b) => b.rows.length - a.rows.length || a.group.name.localeCompare(b.group.name));
  $: vendors = only(mock.acquisition.groups, ['vendor']);
  $: world = only(mock.acquisition.groups, ['drop', 'chest']);
  $: vendorItems = mock.acquisition.forSale.reduce((sum, total) => sum + total.items, 0);
  $: selectedKey = 'helmet';
  $: selected = needs.get(selectedKey)!;
  $: helmet = mock.slots.find((slot) => slot.placement === 'helmet')!;
  $: selectedPlaces = [...mock.acquisition.groups, mock.acquisition.other].filter((group) => group.rows.some((row) => row.need === selectedKey));
  const href = (path?: string) => path ? `${base}${path}` : undefined;
  const amount = (value: number) => value.toLocaleString('en-US');
  const alsoText = (names: string[]) => names.length <= 3 ? names.join(', ') : `${names.slice(0, 2).join(', ')} and ${names.length - 2} more`;
</script>

<Workspace {data} view="get" {preview}>
  <AnswerCard slot="answer" title="Still to Get">
    <div class="summary">
      <p class="count"><strong>{left.length}</strong> of {mock.needs.length} left</p>
      <div class="controls">
        <label class="check"><input type="checkbox" checked /> Hide What I Have</label>
        <button class="c-action">Show All on Map</button>
      </div>
    </div>
    <div class="bar" aria-hidden="true"><span style={`width: ${(collected.length / mock.needs.length) * 100}%`}></span></div>
    <p class="pm-note">An item with more than one source is listed under each one. Tick it once and it leaves every list.</p>
  </AnswerCard>

  <svelte:fragment slot="inspector">
    <div class="c-game-frame wide-only"><ItemTooltip document={helmet.document} registry={data.registry} corruptionLevel={helmet.corruption ?? 0} /></div>
    <div class="wide-only">
      <SideCard title="In Elara’s Plan">
        <dl class="pm-dl">
          <div><dt>Planned For</dt><dd>Helmet<small>{selected.version}</small></dd></div>
          <div><dt>Collected</dt><dd><label class="check"><input type="checkbox" /> I have it</label></dd></div>
          <div><dt>Found In</dt><dd>{selectedPlaces.map((group) => group.name).join(', ')}</dd></div>
        </dl>
        <p class="pm-note">Only the reward bag of a timed Tidefallen Grotto run gives it corrupted. <a class="c-link" href={`${base}/mechanics/corruption/`}>How corruption works</a></p>
        <a class="c-link small" href={`${base}/items/hat-of-the-arcanist/`}>Every Source on the Item Page</a>
      </SideCard>
    </div>
  </svelte:fragment>

  <Sections>
    {#if dungeons.length}
      <Section id="dungeon-runs" title="Dungeon Runs">
        <div class="places">
          {#each dungeons as group (group.id)}
            <section class="place" aria-labelledby={`place-${group.id}`}>
              <header>
                <div class="title">
                  <h3 id={`place-${group.id}`}>{#if group.href}<a class="c-link" href={href(group.href)}>{group.name}</a>{:else}{group.name}{/if}</h3>
                  <span class="meta">{#each [group.levels ? `Levels ${group.levels}` : undefined, `${group.rows.length} ${group.rows.length === 1 ? 'item' : 'items'}`].filter(Boolean) as part, index}{index ? ' · ' : ''}<span class="nowrap">{part}</span>{/each}</span>
                </div>
                {#if group.mapHref}<a class="c-action quiet map" href={href(group.mapHref)}>Show on Map</a>{/if}
              </header>
              {#if group.notes.length}<ul class="notes">{#each group.notes as note}<li>{note}</li>{/each}</ul>{/if}
              <ul class="rows">
                {#each group.rows as row}
                  {@const need = needs.get(row.need)}
                  {#if need}
                    <li class:selected={row.need === selectedKey}>
                      <input class="have" type="checkbox" aria-label={`I have ${need.item.name}`} />
                      <div class="item">
                        {#if need.item.icon}<img src={`${base}/data/${need.item.icon}`} alt="" />{/if}
                        <div>
                          <button class="name" data-rarity={rarityTone(need.item.rarity)}>{need.item.name}</button>
                          <span class="sub">{need.slot}{#if need.version}{' · '}<span class="version">{need.version}</span>{/if}</span>
                        </div>
                      </div>
                      <ul class="ways">
                        {#each row.ways as way}
                          <li>
                            <span class="from">{#if way.from.href}<a class="c-link" href={href(way.from.href)}>{way.from.name}</a>{:else}{way.from.name}{/if}</span>
                            <span class="detail">{way.detail}</span>
                            {#if way.version?.ok}<span class="pm-tag ok">{way.version.text}</span>{/if}
                          </li>
                        {/each}
                      </ul>
                      {#if row.also.length}<p class="also">Also from {alsoText(row.also)}</p>{/if}
                    </li>
                  {/if}
                {/each}
              </ul>
            </section>
          {/each}
        </div>
      </Section>
    {/if}

    {#if vendors.length}
      <Section id="vendors" title="Vendors">
        <p class="lead">Buying all {vendorItems} costs {#each mock.acquisition.forSale as total, index}{index ? ' and ' : ''}<span class="price">{amount(total.amount)} {#if total.href}<a class="c-link" href={href(total.href)}>{total.currency}</a>{:else}{total.currency}{/if}</span>{/each}.</p>
        <div class="c-table-scroll">
          <table class="c-table c-table--reference list">
            <thead><tr><th class="have-col"><span class="sr">Have</span></th><th>Item</th><th>Vendor</th><th class="c-num">Price</th></tr></thead>
            <tbody>
              {#each vendors as { group, rows } (group.id)}
                <tr class="place-row"><th colspan="4" scope="rowgroup">{#if group.href}<a class="c-link" href={href(group.href)}>{group.name}</a>{:else}{group.name}{/if}</th></tr>
                {#each rows as row, index}
                  {@const need = needs.get(row.need)}
                  {#each row.ways as way}
                    {#if need}
                      <tr>
                        <td class="have-col"><input type="checkbox" aria-label={`I have ${need.item.name}`} /></td>
                        <td><span class="pm-name">{#if need.item.icon}<img class="pm-icon" src={`${base}/data/${need.item.icon}`} alt="" />{/if}<span class="cell-name"><span data-rarity={rarityTone(need.item.rarity)} class="rarity">{need.item.name}</span><small>{need.slot}</small></span></span></td>
                        <td><span class="nowrap">{#if way.from.href}<a class="c-link" href={href(way.from.href)}>{way.from.name}</a>{:else}{way.from.name}{/if}</span>{#if way.alsoAt?.length}<small>Also at {way.alsoAt.join(' and ')}</small>{/if}</td>
                        <td class="c-num"><span class="price">{amount(way.price?.amount ?? 0)} {way.price?.currency}</span></td>
                      </tr>
                    {/if}
                  {/each}
                {/each}
              {/each}
            </tbody>
          </table>
        </div>
      </Section>
    {/if}

    {#if world.length}
      <Section id="out-in-the-world" title="Out in the World">
        <div class="c-table-scroll">
          <table class="c-table c-table--reference list">
            <thead><tr><th class="have-col"><span class="sr">Have</span></th><th>Item</th><th>From</th><th class="c-num">Chance</th></tr></thead>
            <tbody>
              {#each world as { group, rows } (group.id)}
                <tr class="place-row"><th colspan="4" scope="rowgroup">{#if group.href}<a class="c-link" href={href(group.href)}>{group.name}</a>{:else}{group.name}{/if}</th></tr>
                {#each rows as row, index}
                  {@const need = needs.get(row.need)}
                  {#each row.ways as way}
                    {#if need}
                      <tr>
                        <td class="have-col"><input type="checkbox" aria-label={`I have ${need.item.name}`} /></td>
                        <td><span class="pm-name">{#if need.item.icon}<img class="pm-icon" src={`${base}/data/${need.item.icon}`} alt="" />{/if}<span class="cell-name"><span data-rarity={rarityTone(need.item.rarity)} class="rarity">{need.item.name}</span><small>{need.slot}{need.version ? ` · ${need.version}` : ''}</small></span></span></td>
                        <td>{#if way.from.href}<a class="c-link" href={href(way.from.href)}>{way.from.name}</a>{:else}{way.from.name}{/if}{#if way.version?.ok}<small>{way.version.text}</small>{/if}</td>
                        <td class="c-num nowrap">{way.detail}</td>
                      </tr>
                    {/if}
                  {/each}
                {/each}
              {/each}
            </tbody>
          </table>
        </div>
      </Section>
    {/if}

    <Section id="other-ways" title="Other Ways">
      <div class="c-table-scroll">
        <table class="c-table c-table--reference list">
          <thead><tr><th class="have-col"><span class="sr">Have</span></th><th>Item</th><th>How</th></tr></thead>
          <tbody>
            {#each mock.acquisition.other.rows as row}
              {@const need = needs.get(row.need)}
              {#if need}
                <tr>
                  <td class="have-col"><input type="checkbox" aria-label={`I have ${need.item.name}`} /></td>
                  <td><span class="pm-name">{#if need.item.icon}<img class="pm-icon" src={`${base}/data/${need.item.icon}`} alt="" />{/if}<span class="cell-name"><span data-rarity={rarityTone(need.item.rarity)} class="rarity">{need.item.name}</span><small>{need.slot}</small></span></span></td>
                  <td>{#each row.ways as way}<span class="way">{#if way.from.href}<a class="c-link" href={href(way.from.href)}>{way.from.name}</a>{:else}{way.from.name}{/if}{' '}<span class="detail">{#if way.price}<span class="price">{amount(way.price.amount)} {way.price.currency}</span>{#if way.detail}{' · '}{way.detail}{/if}{:else}{way.detail}{/if}</span></span>{/each}</td>
                </tr>
              {/if}
            {/each}
          </tbody>
        </table>
      </div>
      <details class="collected c-disclosure">
        <summary>Collected ({collected.length})</summary>
        <ul>{#each collected as need}<li><label class="check"><input type="checkbox" checked /> {need.item.name}</label><span class="sub">{need.slot}</span></li>{/each}</ul>
      </details>
    </Section>
  </Sections>
</Workspace>

<style>
  .summary { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: .75rem 1rem; }
  .count { margin: 0; color: var(--c-text-dim); }
  .count strong { color: var(--c-text-strong); font: 700 2rem var(--c-serif); }
  .controls { display: flex; flex-wrap: wrap; align-items: center; gap: .75rem; }
  .check { display: inline-flex; align-items: center; gap: .4rem; color: var(--c-text-soft); font-size: var(--c-text-small); }
  input[type='checkbox'] { accent-color: var(--c-accent); }
  .bar { height: .4rem; overflow: hidden; border-radius: 999px; background: var(--c-surface-sunken); }
  .bar span { display: block; height: 100%; background: var(--c-accent-muted); }
  .price { color: var(--c-currency); font-variant-numeric: tabular-nums; white-space: nowrap; }
  .price .c-link { color: inherit; }
  .small { font-size: var(--c-text-small); }
  .lead { margin: 0 0 .75rem; }
  .places { display: grid; gap: 1rem; }
  .place { border: 1px solid var(--c-line-soft); border-radius: var(--c-radius); background: var(--c-surface-1); overflow: hidden; }
  .place header { display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: .6rem .9rem; border-bottom: 1px solid var(--c-line-soft); background: var(--c-surface-2); }
  .title { display: flex; flex-wrap: wrap; align-items: baseline; gap: .25rem .75rem; min-width: 0; }
  h3 { margin: 0; color: var(--c-text-strong); font: 600 var(--c-text-lead) var(--c-serif); }
  .meta { color: var(--c-text-dim); font-size: var(--c-text-small); }
  .map { flex: none; padding: .25rem .6rem; }
  .notes { margin: 0; padding: .5rem .9rem .5rem 2rem; border-bottom: 1px solid var(--c-line-soft); color: var(--c-text-dim); font-size: var(--c-text-small); }
  .rows { margin: 0; padding: 0; list-style: none; }
  .rows > li { display: grid; grid-template-columns: 1.25rem minmax(12rem, 16rem) minmax(0, 1fr); grid-template-areas: 'have item ways' '. . also'; align-items: start; gap: .2rem .9rem; padding: .65rem .9rem; border-top: 1px solid var(--c-line-soft); }
  .rows > li:first-child { border-top: 0; }
  .rows > li.selected { background: var(--c-accent-surface); box-shadow: inset 3px 0 0 var(--c-accent); }
  .have { grid-area: have; margin-top: .55rem; }
  .item { grid-area: item; display: grid; grid-template-columns: 2rem minmax(0, 1fr); align-items: center; gap: .6rem; }
  .item img { width: 2rem; height: 2rem; border: 1px solid var(--c-line); border-radius: var(--c-radius-sm); background: var(--c-surface-sunken); object-fit: contain; }
  .item > div { display: grid; min-width: 0; line-height: 1.35; }
  .name { padding: 0; border: 0; background: none; color: var(--c-rarity); font: inherit; font-weight: 600; text-align: left; cursor: pointer; }
  .sub { color: var(--c-text-dim); font-size: var(--c-text-small); }
  .version { color: var(--c-accent-strong); }
  .ways { grid-area: ways; display: grid; gap: .3rem; margin: 0; padding: .1rem 0 0; list-style: none; }
  .ways li { display: flex; flex-wrap: wrap; align-items: baseline; gap: .15rem .6rem; line-height: 1.45; }
  .from { font-weight: 500; }
  .detail { color: var(--c-text-soft); font-size: var(--c-text-small); }
  .also { grid-area: also; margin: .15rem 0 0; color: var(--c-text-mute); font-size: var(--c-text-small); }
  .list td { vertical-align: top; }
  .list td small { display: block; color: var(--c-text-dim); font-size: var(--c-text-small); }
  .list .place-row th { padding-top: .7rem; background: var(--c-surface-2); color: var(--c-text-strong); font-weight: 600; text-align: left; }
  .list .place-row + tr td { border-top: 0; }
  .have-col { width: 1.5rem; padding-right: 0 !important; }
  .have-col input { margin-top: .35rem; }
  .sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); }
  .cell-name { display: grid; line-height: 1.35; }
  .rarity { color: var(--c-rarity); font-weight: 600; white-space: nowrap; }
  .place-name, .nowrap { white-space: nowrap; }
  .way { display: block; line-height: 1.5; }
  .collected { margin-top: 1.25rem; }
  .collected ul { display: grid; gap: .35rem; margin: 0; padding: 0; list-style: none; }
  .collected li { display: flex; flex-wrap: wrap; align-items: baseline; gap: .6rem; }
  @media (max-width: 760px) {
    .rows > li { grid-template-columns: 1.25rem minmax(0, 1fr); grid-template-areas: 'have item' '. ways' '. also'; gap: .45rem .75rem; }
    .place header { align-items: flex-start; }
  }
  @media (max-width: 640px) {
    .list thead { display: none; }
    .list tr { display: grid; grid-template-columns: 1.5rem minmax(0, 1fr); column-gap: .6rem; padding: .55rem .5rem; }
    .list td { display: block; padding: .1rem 0; border: 0 !important; text-align: left !important; }
    .list td:not(.have-col) { grid-column: 2; }
    .list .have-col { grid-row: 1 / span 4; }
    .list td:empty { display: none; }
    .list .place-row { display: block; }
    .list .place-row th { display: block; }
  }
</style>
