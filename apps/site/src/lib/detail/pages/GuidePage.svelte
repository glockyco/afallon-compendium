<script lang="ts">
  import type { AdventurersGuide, LootGuide, PublicKindEntry } from '@afallon/contracts/public';
  import GuideSection from '../GuideSection.svelte';
  import AdventurerGearTables from '../sections/AdventurerGearTables.svelte';
  import Hero from '../Hero.svelte';
  import Sections from '../Sections.svelte';
  import TitleBlock from '../TitleBlock.svelte';

  /** A guide whose page is its overview and its rule sections. The Adventurers guide adds its gear to the gear section. */
  export let document: LootGuide | AdventurersGuide;
  export let registry: PublicKindEntry[];
</script>

<article class="detail-page">
  <TitleBlock name={document.ref.name} {registry} />
  <Hero><p class="c-prose">{document.overview}</p></Hero>
  <Sections>
    {#each document.sections as section (section.id)}
      <GuideSection {section} {registry}>{#if document.topic === 'adventurers' && section.id === 'gear-upgrades'}<AdventurerGearTables gear={document.gear} {registry} />{/if}</GuideSection>
    {/each}
  </Sections>
</article>
