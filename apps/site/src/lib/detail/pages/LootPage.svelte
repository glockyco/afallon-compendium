<script lang="ts">
  import type { LootGuide, PublicKindEntry } from '@afallon/contracts/public';
  import GuideSection from '../GuideSection.svelte';
  import Hero from '../Hero.svelte';
  import RulePhrase from '../sections/RulePhrase.svelte';
  import Sections from '../Sections.svelte';
  import TitleBlock from '../TitleBlock.svelte';

  export let document: LootGuide;
  export let registry: PublicKindEntry[];

  const pickDetails = new Set(['supply-pack-picks', 'supply-pack-world-loot']);
</script>

<article class="detail-page">
  <TitleBlock name={document.ref.name} {registry} />
  <Hero><p class="c-prose">{document.overview}</p></Hero>
  <Sections>
    {#each document.sections as section (section.id)}
      {@const detailRules = section.id === 'supply-packs' ? section.rules.filter((rule) => pickDetails.has(rule.id)) : []}
      <GuideSection {section} {registry} rules={detailRules.length ? section.rules.filter((rule) => !pickDetails.has(rule.id)) : section.rules}>
        {#if detailRules.length}
          <details class="pick-details"><summary>How supply pack picks work</summary>
            {#each detailRules as rule (rule.id)}<p><RulePhrase {rule} {registry} /></p>{/each}
          </details>
        {/if}
      </GuideSection>
    {/each}
  </Sections>
</article>

<style>
  .pick-details { border-top: 1px solid var(--c-line-soft); padding-top: .8rem; }
  .pick-details summary { color: var(--c-accent); cursor: pointer; font-weight: 600; }
  .pick-details p { margin: .6rem 0 0; line-height: 1.55; }
</style>
