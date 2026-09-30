<script lang="ts">
  import type { Craft, PlacedRule, PublicKindEntry, RecipeExperienceBand } from '@afallon/contracts/public';
  import EntityLink from '../../EntityLink.svelte';
  import { formatNumber } from '../../format';
  import FactList from '../FactList.svelte';
  import FactRow from '../FactRow.svelte';
  import PlacedRules from './PlacedRules.svelte';

  export let craft: Craft;
  export let registry: PublicKindEntry[];
  export let itemName: string | undefined = undefined;
  export let showProduct = false;
  export let rules: PlacedRule[] = [];
  // The page that shows the block. It does not list itself as a teacher.
  export let pageKey: string | undefined = undefined;
  $: teachers = craft.taughtBy.filter((teacher) => teacher.key !== pageKey);

  const bandLabels: Record<RecipeExperienceBand['band'], string> = { firstFull: 'Full, first band', secondFull: 'Full, second band', half: 'Half', none: 'None' };
  const levels = (band: RecipeExperienceBand) => band.to === undefined ? `${formatNumber(band.from)} and higher` : band.to === band.from ? formatNumber(band.from) : `${formatNumber(band.from)}–${formatNumber(band.to)}`;
</script>

<div class="craft-block">
  <FactList>
    {#if itemName !== craft.recipe.name}<FactRow label="Recipe">{craft.recipe.name}</FactRow>{/if}
    {#if showProduct && craft.product}<FactRow label="Makes"><EntityLink ref={craft.product.counterpart} {registry} />{#if craft.product.count > 1} × {formatNumber(craft.product.count)}{/if}</FactRow>
    {:else if craft.product && craft.product.count > 1}<FactRow label="Makes">{formatNumber(craft.product.count)} per craft</FactRow>{/if}
    {#if craft.station}<FactRow label="Station"><EntityLink ref={craft.station} {registry} /></FactRow>{/if}
    {#if craft.skill}<FactRow label="Skill"><EntityLink ref={craft.skill} {registry} /></FactRow>{/if}
    {#each craft.ranks as rank}
      <FactRow label="Required level">{formatNumber(rank.requiredLevel)}</FactRow>
      <FactRow label="Base experience">{formatNumber(rank.baseExperience)} per craft, before skill modifiers</FactRow>
    {/each}
    {#if teachers.length}<FactRow label="Taught by">{#each teachers as teacher, index}{index > 0 ? ', ' : ''}<EntityLink ref={teacher} {registry} />{/each}</FactRow>{/if}
  </FactList>
  {#if craft.materials.length}
    <div class="table-scroll"><table>
      <thead><tr><th scope="col">Material</th><th scope="col">Quantity</th></tr></thead>
      <tbody>{#each craft.materials as material}<tr><td data-label="Material"><EntityLink ref={material.counterpart} {registry} /></td><td data-label="Quantity">{formatNumber(material.count)}</td></tr>{/each}</tbody>
    </table></div>
  {/if}
  {#each craft.ranks as rank}
    {#if rank.bands.length}
      <p class="note">Base experience per craft by skill level, before skill modifiers.</p>
      <div class="table-scroll"><table>
        <thead><tr><th scope="col">Band</th><th scope="col">Skill level</th><th scope="col">Base experience</th></tr></thead>
        <tbody>{#each rank.bands as band}<tr><td data-label="Band">{bandLabels[band.band]}</td><td data-label="Skill level">{levels(band)}</td><td data-label="Base experience">{formatNumber(band.experience)}</td></tr>{/each}</tbody>
      </table></div>
    {:else}<p class="note">This craft gives no base skill experience.</p>
    {/if}
  {/each}
  {#if rules.length}<PlacedRules {rules} {registry} skill={craft.skill} />{/if}
</div>

<style>
  .craft-block { display: grid; gap: .8rem; min-width: 0; }
  .note { margin: 0; line-height: 1.55; color: var(--c-text-dim); }
  .table-scroll { max-width: 100%; overflow-x: auto; }
  table { width: 100%; border-collapse: collapse; text-align: left; font-variant-numeric: tabular-nums; }
  th, td { padding: .5rem .7rem; border-bottom: 1px solid var(--c-line); }
  th { color: var(--c-text-dim); font-weight: 600; }
  td:not(:first-child), th:not(:first-child) { text-align: right; white-space: nowrap; }
  /* Narrow screens show each row as a block of labeled values, like the relation tables. */
  @media (max-width: 640px) {
    thead { display: none; }
    tr { display: block; padding: .45rem 0; border-bottom: 1px solid var(--c-line); }
    td { display: flex; justify-content: space-between; gap: 1rem; padding: .15rem 0; border: 0; }
    td:not(:first-child) { text-align: right; }
    td::before { content: attr(data-label); color: var(--c-text-dim); text-align: left; }
  }
</style>
