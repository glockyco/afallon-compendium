<script lang="ts">
  import type { LootGuide, PublicKindEntry } from '@afallon/contracts/public';
  import GuideSection from '../GuideSection.svelte';
  import Hero from '../Hero.svelte';
  import Sections from '../Sections.svelte';
  import TitleBlock from '../TitleBlock.svelte';

  export let document: LootGuide;
  export let registry: PublicKindEntry[];
</script>

<article class="detail-page">
  <TitleBlock name={document.ref.name} {registry} />
  <Hero><p class="c-prose">{document.overview}</p></Hero>
  <Sections>
    {#each document.sections as section (section.id)}<GuideSection {section} {registry} />{/each}
  </Sections>
</article>
