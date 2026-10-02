<script lang="ts">
  import { base } from '$app/paths';
  import type { CraftingAndGathering, PublicKindEntry } from '@afallon/contracts/public';
  import EntityLink from '../../EntityLink.svelte';
  import { formatNumber } from '../../format';
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
        {#if section.id === 'crafting-experience'}
          <div class="c-stack">
            <h3>Example: Runeweave Regalia</h3>
            <p><EntityLink ref={document.example.craft.product} {registry} /> needs <EntityLink ref={document.example.craft.skill} {registry} /> level {formatNumber(document.example.craft.rank.requiredLevel)}. The recipe rank gives {formatNumber(document.example.craft.rank.baseExperience)} base experience before skill modifiers.</p>
            {#if document.example.craft.rank.bands.length}
              <div class="table-scroll"><table>
                <thead><tr><th scope="col">Experience band</th><th scope="col">Skill levels</th><th scope="col">Base experience</th></tr></thead>
                <tbody>{#each document.example.craft.rank.bands as band}<tr><th scope="row">{bandNames[band.band]}</th><td>{formatNumber(band.from)}{band.to === undefined ? '+' : `–${formatNumber(band.to)}`}</td><td>{formatNumber(band.experience)}</td></tr>{/each}</tbody>
              </table></div>
            {/if}
          </div>
        {:else if section.id === 'node-selection'}
          <div class="c-groups">
            {#each document.spawnerExamples as example}
              <div class="c-stack">
                <h3>{#if example.skill}<EntityLink ref={example.skill} {registry} />{:else}Spawner{/if} example</h3>
                <p class="table-intro">The most common {example.skill && 'name' in example.skill ? example.skill.name : ''} spawner options serve {formatNumber(example.spawners)} {example.spawners === 1 ? 'spawner' : 'spawners'}. Each weight moves in a straight line from level 1 to level {formatNumber(example.skillCap)}.</p>
                <div class="table-scroll"><table>
                  <thead><tr><th scope="col">Node</th><th scope="col">Weight at level 1</th><th scope="col">Weight at level {formatNumber(example.skillCap)}</th><th scope="col">Minimum weight</th></tr></thead>
                  <tbody>{#each example.options as option}<tr><td><EntityLink ref={option.node} {registry} /></td><td>{formatNumber(option.lowSkillWeight)}</td><td>{formatNumber(option.highSkillWeight)}</td><td>{formatNumber(option.teaserWeight)}</td></tr>{/each}</tbody>
                </table></div>
              </div>
            {/each}
          </div>
        {:else if section.id === 'node-rewards'}
          <div class="c-stack">
            <h3>Example: Small Iron Vein</h3>
            <p><EntityLink ref={document.example.gather.node} {registry} /> uses <EntityLink ref={document.example.gather.skill} {registry} />. Each listed chance is the chance for one extra item after the loot roll.</p>
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
</style>
