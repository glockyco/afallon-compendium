<script lang="ts">
  import { base } from '$app/paths';
  import type { Attunement, CraftingAndGathering, GuideSection as GuideSectionData, PublicKindEntry } from '@afallon/contracts/public';
  import EntityLink from '../../EntityLink.svelte';
  import { formatNumber, nameOf } from '../../format';
  import { skillLevelId } from '../../reader-levels';
  import AttunementToggles from '../AttunementToggles.svelte';
  import CraftExperience from '../CraftExperience.svelte';
  import GuidePart from '../GuidePart.svelte';
  import GuideSection from '../GuideSection.svelte';
  import GuideStart from '../GuideStart.svelte';
  import LinkGrid from '../LinkGrid.svelte';
  import ReaderLevel from '../ReaderLevel.svelte';
  import { planColumns, stateInHeading, type RelationColumn } from '../relation-table';
  import RelationTable from '../RelationTable.svelte';
  import Sections from '../Sections.svelte';
  import SpawnerOdds from '../SpawnerOdds.svelte';
  import TabSet from '../TabSet.svelte';
  import TitleBlock from '../TitleBlock.svelte';
  import { attunementBoosts, relevantAttunements } from '../gathering-odds';

  export let document: CraftingAndGathering;
  export let registry: PublicKindEntry[];

  // The page groups its mechanics by activity: what crafting does, what gathering does, and how both train skills. A
  // section that no part names still shows, after the parts.
  const PARTS = [
    { id: 'crafting-mechanics', title: 'Crafting', sections: ['crafting', 'crafting-experience', 'enchanting'] },
    { id: 'gathering-mechanics', title: 'Gathering', sections: ['node-selection', 'attunement', 'node-availability', 'node-rewards'] },
    { id: 'skill-mechanics', title: 'Training skills', sections: ['skill-experience'] },
  ] as const;
  $: byId = new Map(document.sections.map((section) => [section.id, section]));
  $: parts = [
    ...PARTS.map((part) => ({ ...part, sections: part.sections.flatMap((id) => byId.get(id) ?? []) })),
    { id: 'more-mechanics', title: 'More', sections: document.sections.filter((section) => !PARTS.some((part) => (part.sections as readonly string[]).includes(section.id))) },
  ].filter((part) => part.sections.length);

  $: recipesList = registry.find((entry) => entry.kind === 'recipes' && entry.list);
  $: nodesList = registry.find((entry) => entry.kind === 'gatheringNodes' && entry.list);

  // The attunement table states each item's attunement once, so its section shows only the lead and the unknown rules.
  const withoutVerified = (section: GuideSectionData): GuideSectionData => ({ ...section, rules: section.rules.filter((rule) => rule.status !== 'verified') });
  // The weapon skills read as a grid of links instead of a long sentence.
  const WEAPON_SKILLS = 'weapon-skills';
  $: weaponSkills = byId.get('skill-experience')?.rules.find((rule) => rule.id === WEAPON_SKILLS && rule.status === 'verified');
  const withoutRule = (section: GuideSectionData, id: string): GuideSectionData => ({ ...section, rules: section.rules.filter((rule) => rule.id !== id) });

  const enchantColumns: RelationColumn<CraftingAndGathering['enchantingItems'][number]>[] = [
    { id: 'item', label: 'Enchanting item', value: (row) => row.item.name, sort: (row) => row.item.name },
    { id: 'fits', label: 'Fits', value: (row) => row.fits.join(' and '), sort: (row) => row.fits.join(' and ') },
    { id: 'adds', label: 'Adds', value: (row) => row.stats.map((stat) => nameOf(stat.stat)).join(', ') },
    { id: 'source', label: 'Where to get it', value: (row) => row.crafting ? nameOf(row.crafting) : row.vendors.length ? 'vendor' : row.drops.length ? 'drop' : 'none' },
  ];
  $: enchantPlan = planColumns(enchantColumns, document.enchantingItems);
  const signed = (amount: number, isPercent: boolean) => `${amount < 0 ? '' : '+'}${formatNumber(amount)}${isPercent ? '%' : ''}`;

  const durationText = (minutes: number | undefined) => minutes === undefined ? 'Until removed' : minutes % 60 === 0 ? `${formatNumber(minutes / 60)} ${minutes === 60 ? 'hour' : 'hours'}` : `${formatNumber(minutes)} ${minutes === 1 ? 'minute' : 'minutes'}`;
  const attunementColumns: RelationColumn<Attunement>[] = [
    { id: 'item', label: 'Item', value: (row) => nameOf(row.item), sort: (row) => nameOf(row.item) },
    { id: 'attunement', label: 'Attunement', value: (row) => row.effect },
    { id: 'nodes', label: 'More of', value: (row) => row.nodes.map(nameOf).join(', ') },
    { id: 'boost', label: 'Weight bonus', numeric: true, value: (row) => row.boost, sort: (row) => row.boost },
    { id: 'lasts', label: 'Lasts', value: (row) => durationText(row.minutes), whenShared: stateInHeading },
  ];
  $: attunementPlan = planColumns(attunementColumns, document.attunements);

  // One tab for each gathering skill's most common spawners, each with its own level and attunements.
  // The address names the skill, so a link can open the Mining odds directly.
  $: spawnerTabs = document.spawnerExamples.map((example, index) => ({
    key: example.skill && 'slug' in example.skill && example.skill.slug ? example.skill.slug : `spawners-${index + 1}`,
    label: example.skill ? nameOf(example.skill) : `Spawners ${index + 1}`,
  }));
  let levels: number[] = [];
  let active: string[][] = [];
  let craftLevel = 1;
  const bandNames: Record<string, string> = { full: 'Full', half: 'Half', none: 'None' };
  const percent = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 });
  $: chances = document.example.gather.levelChances;
</script>

<article class="detail-page">
  <TitleBlock name={document.ref.name} {registry} />
  <GuideStart overview={document.overview}>
    {#if document.craftingSkills.length}
      <div>
        <h2>Crafting skills</h2>
        <ul class="skills">
          {#each document.craftingSkills as row (row.skill.key)}<li><EntityLink ref={row.skill} {registry} /><span>{formatNumber(row.recipes)} {row.recipes === 1 ? 'recipe' : 'recipes'}</span></li>{/each}
        </ul>
        {#if recipesList}<a class="c-link all" href={`${base}/${recipesList.route}/`}>All recipes</a>{/if}
      </div>
    {/if}
    {#if document.gatheringSkills.length}
      <div>
        <h2>Gathering skills</h2>
        <ul class="skills">
          {#each document.gatheringSkills as row (row.skill.key)}<li><EntityLink ref={row.skill} {registry} /><span>{formatNumber(row.nodes)} {row.nodes === 1 ? 'node' : 'nodes'}</span></li>{/each}
        </ul>
        {#if nodesList}<a class="c-link all" href={`${base}/${nodesList.route}/`}>All gathering nodes</a>{/if}
      </div>
    {/if}
  </GuideStart>

  <Sections>
    {#each parts as part (part.id)}
      <GuidePart id={part.id} title={part.title}>
        {#each part.sections as section (section.id)}
          {#if section.id === 'enchanting'}
            <GuideSection {section} {registry} level={3}>
              <RelationTable columns={enchantPlan.columns} rows={document.enchantingItems} label="Enchanting items">
                <svelte:fragment slot="cell" let:row let:column>
                  {#if column === 'item'}<EntityLink ref={row.item} {registry} />
                  {:else if column === 'fits'}{row.fits.join(' and ')}
                  {:else if column === 'adds'}{#each row.stats as stat, index}{index ? ', ' : ''}{signed(stat.amount, stat.isPercent)}{' '}<EntityLink ref={stat.stat} {registry} />{/each}
                  {:else if column === 'source'}{#if row.crafting}Craft with <EntityLink ref={row.crafting} {registry} />{:else if row.vendors.length}{#each row.vendors as vendor, index}{index ? ', ' : ''}<EntityLink ref={vendor} {registry} />{/each}{:else if row.drops.length}Dropped by {#each row.drops as drop, index}{index ? ', ' : ''}<EntityLink ref={drop} {registry} />{/each}{:else}No known source{/if}{/if}
                </svelte:fragment>
              </RelationTable>
            </GuideSection>
          {:else if section.id === 'crafting-experience'}
            <GuideSection {section} {registry} level={3}>
              <div class="example">
                <h4>Example: {document.example.craft.product.name}</h4>
                <p><EntityLink ref={document.example.craft.product} {registry} /> needs <EntityLink ref={document.example.craft.skill} {registry} /> level {formatNumber(document.example.craft.rank.requiredLevel)} and gives {formatNumber(document.example.craft.rank.baseExperience)} base experience, which drops as your skill rises.</p>
                <CraftExperience rank={document.example.craft.rank} skill={document.example.craft.skill} id="craft-example-level" bind:level={craftLevel} />
                {#if document.example.craft.rank.bands.length}
                  <div class="c-table-scroll"><table class="c-table">
                    <thead><tr><th scope="col">Experience</th><th scope="col">Skill levels</th><th scope="col" class="c-num">Base experience</th></tr></thead>
                    <tbody>{#each document.example.craft.rank.bands as band}<tr class:current={craftLevel >= band.from && (band.to === undefined || craftLevel <= band.to)}><th scope="row">{bandNames[band.band]}</th><td>{formatNumber(band.from)}{band.to === undefined ? ' and up' : `–${formatNumber(band.to)}`}</td><td class="c-num">{formatNumber(band.experience)}</td></tr>{/each}</tbody>
                  </table></div>
                {/if}
              </div>
            </GuideSection>
          {:else if section.id === 'node-selection'}
            <GuideSection {section} {registry} level={3}>
              {#if spawnerTabs.length}
                <TabSet tabs={spawnerTabs} label="Gathering skill" idPrefix="spawner-odds" param="skill" let:key>
                  {@const index = spawnerTabs.findIndex((tab) => tab.key === key)}
                  {@const example = document.spawnerExamples[index]}
                  {#if example}
                    <div class="odds c-stack">
                      <p class="dim">{formatNumber(example.spawners)} {example.spawners === 1 ? 'spawner uses' : 'spawners share'} these nodes. Change the level to see how the chances move.</p>
                      <ReaderLevel id={`spawner-level-${index}`} readerId={skillLevelId(example.skill ?? { key: null, label: 'gathering' })} label={`${example.skill ? nameOf(example.skill) : 'Skill'} level`} max={example.skillCap} fallback={1} bind:level={levels[index]} />
                      <AttunementToggles attunements={relevantAttunements(example.options, document.attunements)} {registry} bind:active={active[index]} />
                      <SpawnerOdds options={example.options} skillCap={example.skillCap} level={levels[index] ?? 1} boosts={attunementBoosts(example.options, document.attunements, active[index] ?? [])} oddsVerified={example.oddsVerified} {registry} label={`${example.skill ? nameOf(example.skill) : 'Spawner'} nodes`} />
                    </div>
                  {/if}
                </TabSet>
              {/if}
            </GuideSection>
          {:else if section.id === 'attunement' && document.attunements.length}
            <GuideSection section={withoutVerified(section)} {registry} level={3}>
              <svelte:fragment slot="lead">{#if attunementPlan.shared.length}{' '}Each one lasts {String(attunementPlan.shared[0]?.value).toLowerCase()}.{/if}</svelte:fragment>
              <RelationTable columns={attunementPlan.columns} rows={document.attunements} label="Attunements">
                <svelte:fragment slot="cell" let:row let:column>
                  {#if column === 'item'}<EntityLink ref={row.item} {registry} />
                  {:else if column === 'attunement'}{row.effect}
                  {:else if column === 'nodes'}{#each row.nodes as node, index}{index ? ', ' : ''}<EntityLink ref={node} {registry} />{/each}
                  {:else if column === 'boost'}+{formatNumber(row.boost)}
                  {:else if column === 'lasts'}{durationText(row.minutes)}{/if}
                </svelte:fragment>
              </RelationTable>
            </GuideSection>
          {:else if section.id === 'node-rewards'}
            <GuideSection {section} {registry} level={3}>
              {#if chances.length > 1}
                <p>For <EntityLink ref={document.example.gather.node} {registry} /> with <EntityLink ref={document.example.gather.skill} {registry} />, that is {#each chances as row, index}{index ? (index === chances.length - 1 ? ' and ' : ', ') : ''}{percent.format(row.chance)}% at level {formatNumber(row.level)}{/each}.</p>
              {/if}
            </GuideSection>
          {:else if section.id === 'skill-experience' && weaponSkills}
            <GuideSection section={withoutRule(section, WEAPON_SKILLS)} {registry} level={3}>
              <div slot="top" class="weapon-skills c-stack">
                <p>{weaponSkills.phrase}</p>
                <LinkGrid refs={weaponSkills.links} {registry} />
              </div>
            </GuideSection>
          {:else}
            <GuideSection {section} {registry} level={3} />
          {/if}
        {/each}
      </GuidePart>
    {/each}
  </Sections>
</article>

<style>
  /* The page opens with what crafting and gathering are and the skills where each starts. */
  .skills { display: grid; gap: .35rem; margin: 0; padding: 0; list-style: none; }
  .skills li { display: flex; align-items: baseline; justify-content: space-between; gap: 1rem; padding-bottom: .35rem; border-bottom: 1px solid var(--c-line-soft); }
  .skills span { color: var(--c-text-dim); font-size: var(--c-text-small); font-variant-numeric: tabular-nums; white-space: nowrap; }
  .all { width: fit-content; font-size: var(--c-text-small); }

  .example { display: grid; gap: .75rem; padding: 1rem 1.1rem; border: 1px solid var(--c-line-soft); border-radius: var(--c-radius); background: var(--c-surface-1); }
  .example h4 { margin: 0; color: var(--c-text-strong); font: 600 var(--c-text-lead)/1.3 var(--c-serif); }
  .example p { margin: 0; line-height: 1.55; }
  tr.current th, tr.current td { color: var(--c-text-strong); font-weight: 600; }
  .odds { padding-top: .75rem; }
  .dim { margin: 0; color: var(--c-text-dim); }
  .weapon-skills p { margin: 0; }
</style>
