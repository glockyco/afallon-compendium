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
  const creatureGroups = [
    { title: 'How tables choose items', ids: ['creature-loot-entry-rolls', 'creature-loot-minimum'] },
    { title: 'World Loot and level limits', ids: ['creature-world-loot-gates', 'creature-loot-level-band'] },
    { title: 'Loot bonuses and who gets drops', ids: ['creature-loot-chance-inversion', 'creature-loot-player-reward'] },
  ];
  const groupedCreatureRules = new Set(creatureGroups.flatMap((group) => group.ids));
</script>

<article class="detail-page">
  <TitleBlock name={document.ref.name} {registry} />
  <Hero><p class="c-prose">{document.overview}</p></Hero>
  <Sections>
    {#each document.sections as section (section.id)}
      {@const detailRules = section.id === 'supply-packs' ? section.rules.filter((rule) => pickDetails.has(rule.id)) : []}
      {@const creatureDetails = section.id === 'creature-drops'}
      {@const otherCreatureRules = creatureDetails
        ? section.rules.filter((rule) => rule.status === 'verified' && rule.id !== 'creature-loot-table-gate' && !groupedCreatureRules.has(rule.id))
        : []}
      <GuideSection {section} {registry} rules={section.rules.filter((rule) => creatureDetails
        ? rule.id === 'creature-loot-table-gate' || rule.status === 'unknown'
        : !detailRules.length || !pickDetails.has(rule.id))}>
        {#if creatureDetails}
          <details class="rule-details">
            <summary>More about creature drops</summary>
            {#each creatureGroups as group (group.title)}
              {@const rules = section.rules.filter((rule) => rule.status === 'verified' && group.ids.includes(rule.id))}
              {#if rules.length}
                <div class="rule-group">
                  <h3>{group.title}</h3>
                  {#each rules as rule (rule.id)}<p><RulePhrase {rule} {registry} /></p>{/each}
                </div>
              {/if}
            {/each}
            {#if otherCreatureRules.length}
              <div class="rule-group">
                <h3>Other creature drops</h3>
                {#each otherCreatureRules as rule (rule.id)}<p><RulePhrase {rule} {registry} /></p>{/each}
              </div>
            {/if}
          </details>
        {/if}
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
  .pick-details, .rule-details { border-top: 1px solid var(--c-line-soft); padding-top: .8rem; }
  .pick-details summary, .rule-details summary { color: var(--c-accent); cursor: pointer; font-weight: 600; }
  .pick-details p, .rule-details p { margin: .6rem 0 0; line-height: 1.55; }
  .rule-group { margin-top: 1rem; }
  .rule-group h3 { margin: 0; color: var(--c-text-strong); font-size: var(--c-text-body); }
</style>
