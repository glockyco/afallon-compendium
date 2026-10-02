<script lang="ts">
  import { base } from '$app/paths';
  import type { PublicKindEntry, PublicStat, Ref } from '@afallon/contracts/public';
  import EntityLink from '../../EntityLink.svelte';
  import { formatNumber } from '../../format';
  import AnswerCard from '../AnswerCard.svelte';
  import DetailFrame from '../DetailFrame.svelte';
  import HowItWorks from '../HowItWorks.svelte';
  import Section from '../Section.svelte';
  import Sections from '../Sections.svelte';
  import StatStrip from '../StatStrip.svelte';
  import TitleBlock from '../TitleBlock.svelte';

  export let document: PublicStat;
  export let registry: PublicKindEntry[];

  const guide = { key: 'mechanics:combat', kind: 'mechanics', name: 'Combat', slug: 'combat' } as const;
  $: sourceGroups = [
    { title: 'Fixed Item Stats', refs: document.sources.fixedItems, note: 'Items with this stat as a fixed bonus.' },
    { title: 'Possible Random Item Stats', refs: document.sources.randomItems, note: 'Items that can roll this stat. A particular copy may not have it.' },
    { title: 'Socketed Gems', refs: document.sources.gems, note: 'These gems grant the stat when socketed in eligible gear.' },
    { title: 'Gear Sets', refs: document.sources.sets, note: 'Set bonuses grant the stat when enough different pieces are equipped.' },
    { title: 'Effects', refs: document.sources.effects, note: 'Recorded effects that grant or alter the stat.' },
    { title: 'Enchantments', refs: document.sources.enchantments, note: 'Recorded enchantment tiers that grant the stat.' },
  ];
  $: stats = [
    { label: 'Unit', value: document.unit === 'percent' ? 'Percent' : 'Flat' },
    { label: 'Base', value: `${formatNumber(document.base)}${document.unit === 'percent' ? '%' : ''}` },
    ...(document.min !== undefined ? [{ label: 'Minimum', value: formatNumber(document.min) }] : []),
    ...(document.max !== undefined ? [{ label: 'Maximum', value: formatNumber(document.max) }] : []),
  ];
  $: guideSection = document.onHit.length ? 'on-hit-effects'
    : document.ref.name === 'Critical Hit Chance' ? 'critical-hits'
    : document.vitality || document.recovery.length ? 'recovery'
    : ['Armor', 'Magic Armor', 'Armor Penetration'].includes(document.ref.name) || document.bonuses.some((row) => ['Resistance', 'Penetration', 'Damage'].includes(row.type)) ? 'damage-and-defense'
    : 'building-stats';
  $: itemsHref = `${base}/items/?stat=${encodeURIComponent(document.ref.name)}`;
</script>

<article class="detail-page">
  <DetailFrame>
    <div slot="head"><TitleBlock name={document.ref.name} typeLine={document.category ? `${document.category} Stat` : 'Stat'} {registry}><StatStrip {stats} /></TitleBlock></div>
    <div slot="answer"><AnswerCard title="What It Does" id="what-it-does">
      {#if document.description}<div class="game-description"><span>In-Game Description</span><p>{document.description}</p></div>{/if}
      {#if document.statCategory && document.statCategory !== document.category}<p>Stat Category: {document.statCategory}</p>{/if}
      {#if document.vitality}<p>This is a vitality stat with a current amount and a maximum. It starts at {formatNumber(document.startPercentage ?? 0)}% of its maximum.</p>{/if}
      {#if document.bonuses.length}
        <ul class="bonuses">
          {#each document.bonuses as bonus}
            <li><strong>{bonus.type}</strong>{#if bonus.damageType}{' '}· {bonus.damageType}{/if}
              {#if bonus.stat}<span>Applies To <EntityLink ref={bonus.stat} {registry} /></span>{/if}
              {#if bonus.resistanceStat}<span>Recorded Resistance <EntityLink ref={bonus.resistanceStat} {registry} /></span>{/if}
              {#if bonus.penetrationStat}<span>Recorded Penetration <EntityLink ref={bonus.penetrationStat} {registry} /></span>{/if}
            </li>
          {/each}
        </ul>
      {/if}
      {#if document.onHit.length}
        <h3>On-Hit Effects</h3>
        <p>The stat's hit chance is checked first. Each linked effect has its own recorded chance.</p>
        <ul class="on-hit">
          {#each document.onHit as hit}
            <li><EntityLink ref={hit.effect} {registry} /> <span>{formatNumber(hit.chance)}% Effect Chance</span></li>
          {/each}
        </ul>
        <p>{document.procCooldown > 0 ? `Configured Trigger Cooldown: ${formatNumber(document.procCooldown)} Seconds` : 'No Configured Trigger Cooldown'}</p>
      {/if}
      {#if document.recovery.length}
        <h3>Recorded Recovery Settings</h3>
        <p>These are configured values, not a confirmed live recovery schedule.</p>
        <ul class="recovery">{#each document.recovery as row}<li><strong>{row.when === 'in-combat' ? 'In Combat' : 'Outside Combat'}</strong><span>{formatNumber(row.amount)} Every {formatNumber(row.interval)} Seconds</span></li>{/each}</ul>
      {/if}
      <HowItWorks {guide} section={guideSection} label="Combat Mechanics" />
    </AnswerCard></div>
    <Sections>
      <Section id="where-it-comes-from" title="Where It Comes From">
        <p class="items-link"><a class="c-link" href={itemsHref}>Browse Items With {document.ref.name}</a></p>
        {#each sourceGroups as group}
          {#if group.refs.length}<div class="source-group"><h3>{group.title} <span>{formatNumber(group.refs.length)}</span></h3><p>{group.note}</p><ul class="source-list">
            {#each group.refs.slice(0, 6) as source}<li><EntityLink ref={source} {registry} /></li>{/each}
          </ul>{#if group.refs.length > 6}<details><summary>Show {formatNumber(group.refs.length - 6)} More</summary><ul class="source-list extra">{#each group.refs.slice(6) as source}<li><EntityLink ref={source} {registry} /></li>{/each}</ul></details>{/if}</div>{/if}
        {/each}
        {#if document.sources.talents.length}<div class="source-group"><h3>Talents <span>{formatNumber(document.sources.talents.length)}</span></h3><ul class="source-list">
          {#each document.sources.talents.slice(0, 6) as row}<li><EntityLink ref={row.talent} {registry} /> <span class="context">in <EntityLink ref={row.class} {registry} /></span></li>{/each}
        </ul>{#if document.sources.talents.length > 6}<details><summary>Show {formatNumber(document.sources.talents.length - 6)} More</summary><ul class="source-list extra">{#each document.sources.talents.slice(6) as row}<li><EntityLink ref={row.talent} {registry} /> <span class="context">in <EntityLink ref={row.class} {registry} /></span></li>{/each}</ul></details>{/if}</div>{/if}
        {#if document.sources.classes.length}<div class="source-group"><h3>Class Stats <span>{formatNumber(document.sources.classes.length)}</span></h3><ul class="source-list">
          {#each document.sources.classes as row}<li><EntityLink ref={row.class} {registry} /> <span class="context">{#if row.starting !== 0}{row.starting > 0 ? '+' : ''}{formatNumber(row.starting)} Starting{/if}{#if row.starting !== 0 && row.growth !== 0},{' '}{/if}{#if row.growth !== 0}{row.growth > 0 ? '+' : ''}{formatNumber(row.growth)} Per Level{/if}</span></li>{/each}
        </ul></div>{/if}
      </Section>
    </Sections>
  </DetailFrame>
</article>

<style>
  .game-description { padding: .65rem .8rem; border-left: 2px solid var(--c-accent); background: var(--c-surface-1); }
  .game-description span { color: var(--c-text-mute); font-size: var(--c-text-label); font-weight: 650; }
  .game-description p { margin: .3rem 0 0; white-space: pre-line; }
  h3 { margin: .9rem 0 .35rem; font: 650 1rem/1.3 var(--c-serif); color: var(--c-text-strong); }
  .bonuses, .on-hit, .recovery, .source-list { margin: .35rem 0 .5rem; padding: 0; list-style: none; }
  .bonuses li { display: grid; gap: .15rem; padding: .35rem 0; border-bottom: 1px solid var(--c-line-soft); }
  .bonuses li span, .context, .source-group p { color: var(--c-text-dim); }
  .on-hit li, .recovery li { display: flex; justify-content: space-between; flex-wrap: wrap; gap: .35rem 1rem; padding: .3rem 0; }
  .items-link { margin: .1rem 0 1rem; }
  .source-group { margin-top: 1.1rem; }
  .source-group h3 span { margin-left: .25rem; color: var(--c-text-mute); font: 500 var(--c-text-small)/1.3 var(--c-sans); }
  .source-group p { margin: .2rem 0 .6rem; font-size: var(--c-text-small); }
  .source-list { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 15rem), 1fr)); gap: .35rem 1rem; }
  .source-list li { min-width: 0; }
  details { margin-top: .5rem; }
  summary { width: fit-content; color: var(--c-accent); cursor: pointer; }
  .extra { margin-top: .55rem; }
</style>
