<script lang="ts">
  import type { LootGuide, PublicKindEntry } from '@afallon/contracts/public';
  import GuideSteps from '../GuideSteps.svelte';
  import Hero from '../Hero.svelte';
  import { ruleNumbers } from '../rule-numbers';
  import Section from '../Section.svelte';
  import Sections from '../Sections.svelte';
  import TitleBlock from '../TitleBlock.svelte';
  import MechanicsRules from '../sections/MechanicsRules.svelte';

  export let document: LootGuide;
  export let registry: PublicKindEntry[];
  $: numbers = ruleNumbers(document.rules);
</script>

<article class="detail-page">
  <TitleBlock name={document.ref.name} {registry} />
  <Hero><p class="c-prose">{document.overview}</p></Hero>
  <Sections>
    <GuideSteps steps={document.steps} ruleNumbers={numbers} />
    <Section id="rules-reference" title="Rules reference"><MechanicsRules rules={document.rules} {registry} /></Section>
  </Sections>
</article>
