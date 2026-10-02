<script lang="ts">
  import { base } from '$app/paths';
  import type { CraftingAndGathering, PublicKindEntry } from '@afallon/contracts/public';
  import EntityLink from '../../EntityLink.svelte';
  import { formatNumber, nameOf } from '../../format';
  import { skillLevelId } from '../../reader-levels';
  import AttunementToggles from '../AttunementToggles.svelte';
  import CraftExperience from '../CraftExperience.svelte';
  import ReaderLevel from '../ReaderLevel.svelte';
  import SpawnerOdds from '../SpawnerOdds.svelte';
  import { attunementBoosts, relevantAttunements } from '../gathering-odds';
  import FactList from '../FactList.svelte';
  import FactRow from '../FactRow.svelte';
  import GuideSection from '../GuideSection.svelte';
  import Hero from '../Hero.svelte';
  import Sections from '../Sections.svelte';
  import TitleBlock from '../TitleBlock.svelte';

  export let document: CraftingAndGathering;
  export let registry: PublicKindEntry[];

  $: nodes = registry.find((entry) => entry.kind === 'gatheringNodes' && entry.pages);
  const bandNames: Record<string, string> = { full: 'Full', half: 'Half', none: 'None' };
  const percent = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 });
  // Each example has its own level control, which the skill's saved level starts, and its own attunements.
  let levels: number[] = [];
  let craftLevel = 1;
  let active: string[][] = [];
</script>

<article class="detail-page">
  <TitleBlock name={document.ref.name} {registry} />
  <Hero>
    <p class="c-prose">{document.overview}</p>
    <FactList>
      {#if nodes}<FactRow label="Gathering nodes"><a class="c-link" href={`${base}/${nodes.route}/`}>All gathering nodes</a></FactRow>{/if}
      <FactRow label="Related mechanics"><a class="c-link" href={`${base}/mechanics/character-progression/`}>Character Progression</a></FactRow>
    </FactList>
  </Hero>
  <Sections>
    {#each document.sections as section (section.id)}
      <GuideSection {section} {registry}>
        {#if section.id === 'enchanting'}
          <div class="table-scroll"><table class="enchanting-table">
            <thead><tr><th scope="col">Enchanting item</th><th scope="col">Fits</th><th scope="col">Adds</th><th scope="col">Where to get it</th></tr></thead>
            <tbody>
              {#each document.enchantingItems as row}
                <tr>
                  <th scope="row"><EntityLink ref={row.item} {registry} /></th>
                  <td data-label="Fits">{row.fits.join(' and ')}</td>
                  <td data-label="Adds">{#each row.stats as stat, index}{index ? ', ' : ''}{stat.amount < 0 ? '' : '+'}{formatNumber(stat.amount)}{stat.isPercent ? '%' : ''} <EntityLink ref={stat.stat} {registry} />{/each}</td>
                  <td data-label="Source">{#if row.crafting}Craft with <EntityLink ref={row.crafting} {registry} />{:else if row.vendors.length}{#each row.vendors as vendor, index}{index ? ', ' : ''}<EntityLink ref={vendor} {registry} />{/each}{:else if row.drops.length}Dropped by {#each row.drops as drop, index}{index ? ', ' : ''}<EntityLink ref={drop} {registry} />{/each}{:else}No known source{/if}</td>
                </tr>
              {/each}
            </tbody>
          </table></div>
        {/if}
        {#if section.id === 'crafting-experience'}
          <div class="c-stack">
            <h3>Example: Runeweave Regalia</h3>
            <p><EntityLink ref={document.example.craft.product} {registry} /> needs <EntityLink ref={document.example.craft.skill} {registry} /> level {formatNumber(document.example.craft.rank.requiredLevel)} and gives {formatNumber(document.example.craft.rank.baseExperience)} base experience, which drops as your skill rises:</p>
            <CraftExperience rank={document.example.craft.rank} skill={document.example.craft.skill} id="craft-example-level" bind:level={craftLevel} />
            {#if document.example.craft.rank.bands.length}
              <div class="table-scroll"><table>
                <thead><tr><th scope="col">Experience band</th><th scope="col">Skill levels</th><th scope="col">Base experience</th></tr></thead>
                <tbody>{#each document.example.craft.rank.bands as band}<tr class:current={craftLevel >= band.from && (band.to === undefined || craftLevel <= band.to)}><th scope="row">{bandNames[band.band]}</th><td>{formatNumber(band.from)}{band.to === undefined ? '+' : `–${formatNumber(band.to)}`}</td><td>{formatNumber(band.experience)}</td></tr>{/each}</tbody>
              </table></div>
            {/if}
          </div>
        {:else if section.id === 'node-selection'}
          <div class="c-groups">
            {#each document.spawnerExamples as example, index}
              <div class="c-stack">
                <h3>{#if example.skill}<EntityLink ref={example.skill} {registry} />{:else}Spawner{/if} example</h3>
                <p class="table-intro">{formatNumber(example.spawners)} {example.spawners === 1 ? 'spawner uses' : 'spawners share'} this set of nodes. Change the level to see how the chances move.</p>
                <ReaderLevel id={`spawner-level-${index}`} readerId={skillLevelId(example.skill ?? { key: null, label: 'gathering' })} label={`${example.skill ? nameOf(example.skill) : 'Skill'} level`} max={example.skillCap} fallback={1} bind:level={levels[index]} />
                <AttunementToggles attunements={relevantAttunements(example.options, document.attunements)} {registry} bind:active={active[index]} />
                <SpawnerOdds options={example.options} skillCap={example.skillCap} level={levels[index] ?? 1} boosts={attunementBoosts(example.options, document.attunements, active[index] ?? [])} oddsVerified={example.oddsVerified} {registry} label={`${example.skill ? nameOf(example.skill) : 'Spawner'} example`} />
              </div>
            {/each}
          </div>
        {:else if section.id === 'node-rewards'}
          <div class="c-stack">
            <h3>Example: Small Iron Vein</h3>
            <p>You gather <EntityLink ref={document.example.gather.node} {registry} /> with <EntityLink ref={document.example.gather.skill} {registry} />. The chance that each item you get comes with one extra:</p>
            <div class="table-scroll"><table>
              <thead><tr><th scope="col">Skill level</th><th scope="col">Extra item chance</th></tr></thead>
              <tbody>{#each document.example.gather.levelChances as row}<tr><td>{formatNumber(row.level)}</td><td>{percent.format(row.chance)}%</td></tr>{/each}</tbody>
            </table></div>
          </div>
        {/if}
      </GuideSection>
    {/each}
  </Sections>
</article>

<style>
  h3 { color: var(--c-text-strong); font: 600 var(--c-text-lead)/1.3 var(--c-serif); }
  .c-stack p { line-height: 1.55; }
  .table-intro { color: var(--c-text-dim); }
  .table-scroll { max-width: 100%; overflow-x: auto; }
  table { width: 100%; border-collapse: collapse; text-align: left; font-variant-numeric: tabular-nums; }
  th, td { padding: .5rem .7rem; border-bottom: 1px solid var(--c-line); }
  th { color: var(--c-text-dim); font-weight: 600; }
  td:not(:first-child), th:not(:first-child) { text-align: right; white-space: nowrap; }
  .enchanting-table td:not(:first-child), .enchanting-table th:not(:first-child) { text-align: left; white-space: normal; }
  .enchanting-table td, .enchanting-table th { min-width: 8rem; vertical-align: top; }
  .enchanting-table th:first-child { width: 21%; }
  .enchanting-table th:nth-child(2) { width: 12%; }
  .enchanting-table th:last-child { width: 23%; }
  tr.current th, tr.current td { color: var(--c-text-strong); font-weight: 600; }
  @media (max-width: 640px) {
    .enchanting-table thead { display: none; }
    .enchanting-table, .enchanting-table tbody, .enchanting-table tr { display: block; }
    .enchanting-table tr { padding: .85rem 0; border-bottom: 1px solid var(--c-line); }
    .enchanting-table th { width: auto; }
    .enchanting-table th, .enchanting-table td { display: block; min-width: 0; padding: .12rem 0; border: 0; }
    .enchanting-table th { color: var(--c-text-strong); }
    .enchanting-table td::before { content: attr(data-label) ' · '; color: var(--c-text-dim); }
  }
</style>
