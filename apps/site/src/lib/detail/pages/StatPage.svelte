<script lang="ts">
  import { base } from '$app/paths';
  import type { PublicKindEntry, PublicStat } from '@afallon/contracts/public';
  import EntityLink from '../../EntityLink.svelte';
  import { formatNumber, signedAmount } from '../../format';
  import AnswerCard from '../AnswerCard.svelte';
  import DetailFrame from '../DetailFrame.svelte';
  import FactsCard from '../FactsCard.svelte';
  import HowItWorks from '../HowItWorks.svelte';
  import { planColumns, type RelationColumn } from '../relation-table';
  import RelationTable from '../RelationTable.svelte';
  import Section from '../Section.svelte';
  import Sections from '../Sections.svelte';
  import TitleBlock from '../TitleBlock.svelte';
  import TabSet from '../TabSet.svelte';

  export let document: PublicStat;
  export let registry: PublicKindEntry[];
  const combat = { key: 'mechanics:combat', kind: 'mechanics', name: 'Combat', slug: 'combat' } as const;
  type Grant = PublicStat['grants'][number];
  type Class = PublicStat['sources']['classes'][number];
  const sourceColumns: RelationColumn<Grant>[] = [
    { id: 'source', label: 'Source', value: (row) => 'name' in row.source ? row.source.name : row.source.label, sort: (row) => 'name' in row.source ? row.source.name : row.source.label },
    { id: 'amount', label: 'Bonus', numeric: true, value: (row) => row.amount ?? row.max, sort: (row) => row.amount ?? row.max },
    { id: 'tier', label: 'Tier', numeric: true, value: (row) => row.tier, sort: (row) => row.tier },
    { id: 'class', label: 'Class', value: (row) => row.class ? ('name' in row.class ? row.class.name : row.class.label) : undefined },
  ];
  const classColumns: RelationColumn<Class>[] = [
    { id: 'class', label: 'Class', value: (row) => 'name' in row.class ? row.class.name : row.class.label },
    { id: 'starting', label: 'Starting', numeric: true, value: (row) => row.starting || undefined, sort: (row) => row.starting },
    { id: 'growth', label: 'Per Level', numeric: true, value: (row) => row.growth || undefined, sort: (row) => row.growth },
  ];
  const families = [
    { key: 'items', label: 'Items', types: ['fixedItems', 'randomItems'], columns: ['source', 'amount'] },
    { key: 'gems', label: 'Gems', types: ['gems'], columns: ['source', 'amount'] },
    { key: 'sets', label: 'Gear Sets', types: ['sets'], columns: ['source', 'amount', 'tier'] },
    { key: 'talents', label: 'Talents', types: ['talents'], columns: ['source', 'amount', 'class', 'tier'] },
    { key: 'effects', label: 'Effects', types: ['effects'], columns: ['source', 'amount', 'tier'] },
    { key: 'enchantments', label: 'Enchantments', types: ['enchantments'], columns: ['source', 'amount', 'tier'] },
  ] as const;
  $: groups = families.map((family) => {
    const rows = document.grants.filter((row) => (family.types as readonly string[]).includes(row.family));
    const count = new Set(rows.map((row) => `${row.source.key}#${'variant' in row.source ? row.source.variant ?? '' : ''}`)).size;
    const columns = sourceColumns.filter((column) => (family.columns as readonly string[]).includes(column.id))
      .map((column) => column.id === 'tier' && family.key === 'talents' ? { ...column, label: 'Ranks' } : column);
    return { ...family, rows, count, columns: planColumns(columns, rows).columns };
  }).filter((group) => group.rows.length > 0);
  $: tabs = groups.map((group) => ({ key: group.key, label: `${group.label} ${formatNumber(group.count)}` }));
  $: itemCount = document.itemListCount ?? groups.find((group) => group.key === 'items')?.count ?? 0;
  $: totalSources = new Set(document.grants.map((row) => `${row.family}:${row.source.key}#${'variant' in row.source ? row.source.variant ?? '' : ''}`)).size + document.sources.classes.length;
  $: classPlan = planColumns(classColumns, document.sources.classes);
  $: facts = [
    ...(document.base !== 0 && document.base !== document.max ? [{ label: 'Starting value', value: `${formatNumber(document.base)}${document.unit === 'percent' ? '%' : ''}` }] : []),
    ...(document.max !== undefined && document.max !== 0 ? [{ label: 'Maximum', value: `${formatNumber(document.max)}${document.unit === 'percent' ? '%' : ''}` }] : []),
    ...(document.min !== undefined && document.min !== 0 ? [{ label: 'Minimum', value: `${formatNumber(document.min)}${document.unit === 'percent' ? '%' : ''}` }] : []),
    ...(document.procCooldown > 0 ? [{ label: 'Trigger cooldown', value: `${formatNumber(document.procCooldown)} seconds` }] : []),
    ...(document.recovery.map((row) => ({ label: row.when === 'in-combat' ? 'In combat' : 'Out of combat', value: `${formatNumber(row.amount)} every ${formatNumber(row.interval)} seconds` }))),
  ];
  $: guideSection = document.onHit.length ? 'on-hit-effects' : document.vitality || document.recovery.length ? 'recovery' : document.category === 'Defense' || document.bonuses.some((row) => ['Resistance', 'Penetration', 'Damage'].includes(row.type)) ? 'damage-and-defense' : 'building-stats';
  $: itemsHref = document.itemListColumn ? `${base}/items/?min.${encodeURIComponent(document.itemListColumn)}=0&sort=${encodeURIComponent(document.itemListColumn)}&dir=desc` : `${base}/items/?stat=${encodeURIComponent(`${document.ref.name}*`)}`;
  $: onHit = document.onHit.length > 0;
</script>

<article class="detail-page">
  <DetailFrame side={facts.length > 1}>
    <div slot="head"><TitleBlock name={document.ref.name} typeLine={`${document.category ?? document.statCategory ?? 'General'} Stat${onHit ? ' · On-Hit Trigger' : ''}`} imageUrl={document.art.icon ?? document.ref.icon ? `${base}/data/${(document.art.icon ?? document.ref.icon)!.url}` : undefined} {registry} /></div>
    <div slot="answer"><AnswerCard title="What it does" id="what-it-does">
      {#if document.description}<p class="description">{document.description}</p>{/if}
      {#if document.note}<p>{document.note}</p>{/if}
      {#if document.recovery.length}<p>Recovers {#each document.recovery as recovery, index}{index ? ', and ' : ''}{formatNumber(recovery.amount)} every {formatNumber(recovery.interval)} {recovery.interval === 1 ? 'second' : 'seconds'} {recovery.when === 'in-combat' ? 'in combat' : 'out of combat'}{/each}.</p>{/if}
      {#if onHit}<p>On an eligible hit, this stat's current value is its trigger chance. When it triggers, {#each document.onHit as hit, index}{index ? ', ' : ''}<EntityLink ref={hit.effect} {registry} /> applies {formatNumber(hit.chance)}% of the time{/each}.</p>{/if}
      {#if !document.description && !document.note && !document.recovery.length && !onHit}<p>{document.ref.name} is a {document.category?.toLowerCase() ?? document.statCategory?.toLowerCase() ?? 'character'} stat.</p>{/if}
      {#if itemCount > 0}<p><a class="c-link" href={itemsHref}>Browse {formatNumber(itemCount)} {itemCount === 1 ? 'item' : 'items'} with {document.ref.name}</a>.{#if !document.itemListColumn}{' '}Fixed bonuses and possible rolls are listed below.{/if}</p>
      {:else if totalSources > 0}<p>See the sources below for ways to gain this stat.</p>{/if}
      <HowItWorks guide={combat} section={guideSection} label="How combat stats work" />
    </AnswerCard></div>
    <svelte:fragment slot="side"><FactsCard {facts} title="At a Glance" /></svelte:fragment>
    <Sections>
      {#if groups.length}<Section id="sources" title="Sources" count={document.grants.length} line={document.sources.randomItems.length ? 'Fixed bonuses always apply. Possible item rolls vary by copy.' : undefined}>
        <TabSet {tabs} label="Stat Source Types" idPrefix="stat-sources" param="source" let:key>
          {#each groups.filter((group) => group.key === key) as group (group.key)}
            <RelationTable columns={group.columns} rows={group.rows} label={`${group.label} granting ${document.ref.name}`}>
              <svelte:fragment slot="cell" let:row let:column>
                {#if column === 'source'}<EntityLink ref={row.source} {registry} />
                {:else if column === 'amount'}{#if row.family === 'randomItems'}Possible roll:{' '}{/if}{#if row.min !== undefined && row.max !== undefined}{signedAmount(row.min, row.percent)}–{signedAmount(row.max, row.percent)}{:else if row.amount !== undefined}{signedAmount(row.amount, row.percent)}{/if}
                {:else if column === 'tier'}{#if row.tier !== undefined}{row.family === 'sets' ? `${formatNumber(row.tier)} pieces` : formatNumber(row.tier)}{/if}
                {:else if column === 'class'}{#if row.class}<EntityLink ref={row.class} {registry} />{/if}{/if}
              </svelte:fragment>
            </RelationTable>
          {/each}
        </TabSet>
      </Section>{/if}
      {#if document.sources.classes.length}<Section id="class-stats" title="Class Stats" count={document.sources.classes.length} line="Starting value and the increase at each level.">
        <RelationTable columns={classPlan.columns} rows={document.sources.classes} label="Class stat growth"><svelte:fragment slot="cell" let:row let:column>
          {#if column === 'class'}<EntityLink ref={row.class} {registry} />{:else if column === 'starting'}{row.starting ? signedAmount(row.starting) : ''}{:else if column === 'growth'}{row.growth ? signedAmount(row.growth) : ''}{/if}
        </svelte:fragment></RelationTable>
      </Section>{/if}
    </Sections>
  </DetailFrame>
</article>

<style>
  .description { color: var(--c-text-strong); font-size: 1.06rem; line-height: 1.5; white-space: pre-line; }
</style>
