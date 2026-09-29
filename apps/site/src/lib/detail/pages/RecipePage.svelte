<script lang="ts">
  import { base } from '$app/paths';
  import type { PublicItem, PublicKindEntry, PublicRecipe, RecipeExperienceBand } from '@afallon/contracts/public';
  import EntityLink from '../../EntityLink.svelte';
  import ItemTooltip from '../../ItemTooltip.svelte';
  import FactList from '../FactList.svelte';
  import FactRow from '../FactRow.svelte';
  import { formatNumber } from '../../format';
  import Hero from '../Hero.svelte';
  import Section from '../Section.svelte';
  import RecipeRowsSection from '../sections/RecipeRowsSection.svelte';
  import TitleBlock, { type TitleFact } from '../TitleBlock.svelte';
  import Sections from '../Sections.svelte';

  export let document: PublicRecipe;
  export let product: PublicItem | undefined;
  export let registry: PublicKindEntry[];

  $: facts = [
    ...(document.facts.station ? [{ label: 'Station', refs: [document.facts.station] }] : []),
    ...(document.facts.skill ? [{ label: 'Skill', refs: [document.facts.skill] }] : []),
    ...(document.facts.rank !== undefined && document.facts.rank > 0 ? [{ text: `Rank ${document.facts.rank}` }] : []),
  ] satisfies TitleFact[];
  $: rank = document.ranks.length === 1 ? document.ranks[0] : undefined;
  const bandLabels: Record<RecipeExperienceBand['band'], string> = { firstFull: 'Full, first band', secondFull: 'Full, second band', half: 'Half', none: 'None' };
  const levels = (band: RecipeExperienceBand) => band.to === undefined ? `${formatNumber(band.from)} and higher` : band.to === band.from ? formatNumber(band.from) : `${formatNumber(band.from)}–${formatNumber(band.to)}`;
</script>

<article class="detail-page">
  <TitleBlock name={document.ref.name} {facts} {registry} />

  <Hero view={product ? 'wide' : undefined}>
    <div slot="view" class="c-game-frame">
      {#if product}
        <ItemTooltip document={product} {registry}>
          <svelte:fragment slot="ref" let:ref let:rankIndex><EntityLink {ref} {rankIndex} {registry} /></svelte:fragment>
        </ItemTooltip>
      {/if}
    </div>
      {#if document.description}<p class="c-prose">{document.description}</p>{/if}
      <FactList>
        {#if document.product && (!product || document.product.count > 1)}<FactRow label="Makes">{#if !product}<EntityLink ref={document.product.counterpart} {registry} />{#if document.product.count > 1} × {document.product.count}{/if}{:else}{document.product.count}{/if}</FactRow>{/if}
        {#if rank}
          <FactRow label="Required level">{formatNumber(rank.requiredLevel)}</FactRow>
          <FactRow label="Base experience" href={rank.bands.length ? '#experience' : undefined}>{formatNumber(rank.baseExperience)} per craft</FactRow>
        {/if}
        {#if document.taughtBy.length}<FactRow label="Taught by">{#each document.taughtBy as ref, index}{index > 0 ? ', ' : ''}<EntityLink {ref} {registry} />{/each}</FactRow>{/if}
        <FactRow label="Related mechanics"><a class="c-link" href={`${base}/mechanics/crafting-and-gathering/`}>Crafting and Gathering</a></FactRow>
      </FactList>
  </Hero>

  <Sections>
    {#each document.ranks as entry}
      <Section id={document.ranks.length > 1 ? `experience-rank-${entry.rank}` : 'experience'} title={document.ranks.length > 1 ? `Experience, rank ${entry.rank}` : 'Experience'} icon="talent"
        line={entry.bands.length ? 'Base experience per craft by skill level, before skill modifiers such as Experience Bonus.' : undefined}>
        {#if entry.bands.length}
          <div class="table-scroll"><table>
            <thead><tr><th scope="col">Band</th><th scope="col">Skill level</th><th scope="col">Base experience</th></tr></thead>
            <tbody>{#each entry.bands as band}<tr><td>{bandLabels[band.band]}</td><td>{levels(band)}</td><td>{formatNumber(band.experience)}</td></tr>{/each}</tbody>
          </table></div>
        {:else}<p class="note">This rank gives no base experience, so crafting it gives no skill experience.</p>{/if}
      </Section>
    {/each}
    <RecipeRowsSection id="materials" title="Materials" counterpartLabel="Material" quantityLabel="Quantity" rows={document.materials} {registry} />
  </Sections>
</article>

<style>
  .note { margin: 0; line-height: 1.55; }
  .table-scroll { max-width: 100%; overflow-x: auto; }
  table { width: 100%; border-collapse: collapse; text-align: left; font-variant-numeric: tabular-nums; }
  th, td { padding: .5rem .7rem; border-bottom: 1px solid var(--c-line); }
  th { color: var(--c-text-dim); font-weight: 600; }
  td:not(:first-child), th:not(:first-child) { text-align: right; white-space: nowrap; }
</style>
