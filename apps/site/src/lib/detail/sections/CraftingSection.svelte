<script lang="ts">
  import type { Craft, PlacedRule, PublicKindEntry } from '@afallon/contracts/public';
  import EntityLink from '../../EntityLink.svelte';
  import HowItWorks from '../HowItWorks.svelte';
  import { craftExperienceSentence } from '../item-sources';
  import RecipeEquation from '../RecipeEquation.svelte';

  export let craft: Craft;
  export let registry: PublicKindEntry[];
  export let rules: PlacedRule[] = [];
  export let pageKey: string | undefined = undefined;
  $: teachers = craft.taughtBy.filter((teacher) => teacher.key !== pageKey);
  $: materials = craft.materials.map((row) => ({ item: row.counterpart, quantity: row.count }));
  $: guide = rules.find((rule) => rule.target === 'teaches') ?? rules[0];
  $: experience = craftExperienceSentence(craft);
</script>

<div class="craft-block">
  <RecipeEquation {materials} product={craft.product?.counterpart} yieldCount={craft.product?.count ?? 1} {registry} />
  {#if craft.skill || craft.ranks[0] || experience}
    <p class="meta">{#if craft.skill || craft.ranks[0]}Needs {#if craft.skill}<EntityLink ref={craft.skill} {registry} />{/if}{#if craft.ranks[0]}{' '}{craft.ranks[0].requiredLevel}{/if} to craft{/if}{#if experience}{' · '}{experience}{/if}</p>
  {/if}
  {#if experience}<p class="qualification">Base experience before skill modifiers.</p>{/if}
  {#if teachers.length}<p>Also taught by {#each teachers as teacher, index}{index > 0 ? ', ' : ''}<EntityLink ref={teacher} {registry} />{/each}.</p>{/if}
  {#if guide}<HowItWorks guide={guide.guide} stepId={guide.stepId} label="How crafting experience works" />{/if}
</div>

<style>
  .craft-block { display: grid; gap: .7rem; min-width: 0; }
  p { margin: 0; line-height: 1.5; }
  .meta { color: var(--c-text-strong); }
  .qualification { color: var(--c-text-dim); font-size: var(--c-text-small); }
</style>
