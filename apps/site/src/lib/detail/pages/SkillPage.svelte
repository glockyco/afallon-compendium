<script lang="ts">
  import { base } from '$app/paths';
  import type { PublicKindEntry, PublicSkill, SkillGatheringNodeRow, SkillRecipeRow } from '@afallon/contracts/public';
  import EntityLink from '../../EntityLink.svelte';
  import Requirements from '../../Requirements.svelte';
  import { formatNumber, nameOf } from '../../format';
  import AnswerCard from '../AnswerCard.svelte';
  import DetailFrame from '../DetailFrame.svelte';
  import DetailsDisclosure from '../DetailsDisclosure.svelte';
  import FactsCard from '../FactsCard.svelte';
  import { cumulativeExperience } from '../level-curve';
  import HowItWorks from '../HowItWorks.svelte';
  import { planColumns, type RelationColumn } from '../relation-table';
  import RelationTable from '../RelationTable.svelte';
  import Section from '../Section.svelte';
  import TitleBlock from '../TitleBlock.svelte';
  import LevelCurve from '../sections/LevelCurve.svelte';

  export let document: PublicSkill;
  export let registry: PublicKindEntry[];

  // Level bands summarize the published gate, never infer a required level for a recipe without one.
  const recipeBand = (row: SkillRecipeRow) => row.requiredLevel === undefined ? 'Level not published' : row.requiredLevel < 1 ? 'No level requirement' : `Levels ${Math.floor((row.requiredLevel - 1) / 50) * 50 + 1}–${(Math.floor((row.requiredLevel - 1) / 50) + 1) * 50}`;
  const recipeOrder = (row: SkillRecipeRow) => row.requiredLevel === undefined ? Number.MAX_SAFE_INTEGER : row.requiredLevel;
  $: sortedRecipes = [...document.recipes].sort((a, b) => recipeOrder(a) - recipeOrder(b) || a.recipe.name.localeCompare(b.recipe.name));
  $: recipeBands = [...new Set(sortedRecipes.map(recipeBand))].map((label) => ({ label, rows: sortedRecipes.filter((row) => recipeBand(row) === label) }));

  // A level gate must be a conjunctive predicate on this skill, not a number in another requirement.
  const gate = (row: SkillGatheringNodeRow) => row.requirements.filter((group) => group.mode === 'all' && !group.checkCount)
    .flatMap((group) => group.requirements).find((requirement) => requirement.label.toLocaleLowerCase().startsWith(`${document.ref.name.toLocaleLowerCase()} `))?.label;
  const gateLevel = (row: SkillGatheringNodeRow) => {
    const match = gate(row)?.match(/\b(\d+)\b/);
    return match ? Number(match[1]) : undefined;
  };
  const nonGateRequirements = (row: SkillGatheringNodeRow) => row.requirements.filter((group) => group.mode === 'all' && !group.checkCount)
    .flatMap((group) => group.requirements).filter((requirement) => requirement.label !== gate(row));
  $: sortedNodes = [...document.gatheringNodes].sort((a, b) => (gateLevel(a) ?? 0) - (gateLevel(b) ?? 0) || nameOf(a.node).localeCompare(nameOf(b.node)));
  $: sharedRequirements = sortedNodes.length ? nonGateRequirements(sortedNodes[0]!)
    .filter((requirement, index, requirements) => requirements.findIndex((candidate) => candidate.label === requirement.label) === index)
    .filter((requirement) => sortedNodes.every((row) => nonGateRequirements(row).some((candidate) => candidate.label === requirement.label))) : [];
  $: sharedTool = sharedRequirements.length === 1 && /^has /i.test(sharedRequirements[0]!.label)
    ? sharedRequirements[0]!.spans.find((span) => 'ref' in span) : undefined;
  $: allVeins = sortedNodes.length > 0 && sortedNodes.every((row) => nameOf(row.node).endsWith(' Vein'));
  $: sharedToolArticle = sharedTool && 'ref' in sharedTool && /^[aeiou]/i.test(nameOf(sharedTool.ref)) ? 'an' : 'a';
  function extraRequirements(row: SkillGatheringNodeRow) {
    const levelGate = gate(row);
    return row.requirements.map((group) => group.mode === 'all' && !group.checkCount
      ? { ...group, requirements: group.requirements.filter((requirement) =>
        requirement.label !== levelGate && !sharedRequirements.some((shared) => shared.label === requirement.label)) }
      : group).filter((group) => group.requirements.length);
  }

  const recipeColumns: RelationColumn<SkillRecipeRow>[] = [
    { id: 'recipe', label: 'Product or recipe', value: (row) => row.product ? nameOf(row.product) : row.recipe.name, sort: (row) => row.product ? nameOf(row.product) : row.recipe.name },
    { id: 'level', label: 'Level', numeric: true, value: (row) => row.requiredLevel, sort: (row) => row.requiredLevel },
    { id: 'station', label: 'Station', value: (row) => row.station ? nameOf(row.station) : undefined },
  ];
  const nodeColumns: RelationColumn<SkillGatheringNodeRow>[] = [
    { id: 'node', label: 'Gathering node', value: (row) => nameOf(row.node), sort: (row) => nameOf(row.node) },
    { id: 'level', label: 'Required level', numeric: true, value: (row) => gateLevel(row), sort: (row) => gateLevel(row) ?? 0 },
    { id: 'experience', label: 'Experience per use', numeric: true, value: (row) => row.experience, sort: (row) => row.experience },
  ];
  $: sharedStation = document.recipes.length ? document.recipes.find((row) => row.station)?.station : undefined;
  $: stationShared = !!sharedStation && document.recipes.every((row) => !row.station || row.station.key === sharedStation.key);
  $: recipePlan = planColumns(recipeColumns.filter((column) => column.id !== 'station' || !stationShared), document.recipes);
  $: nodePlan = planColumns(nodeColumns, document.gatheringNodes);
  $: total = document.curve ? cumulativeExperience(document.curve)[document.curve.cap] : undefined;
  $: stats = [
    ...(document.facts.highestLevel ? [{ label: 'Highest level', value: formatNumber(document.facts.highestLevel), href: document.curve ? '#levels' : undefined }] : []),
    ...(document.recipes.length ? [{ label: 'Recipes', value: formatNumber(document.recipes.length), href: '#recipes' }] : []),
    ...(document.gatheringNodes.length ? [{ label: 'Gathering nodes', value: formatNumber(document.gatheringNodes.length), href: '#gathering-nodes' }] : []),
    ...(total !== undefined ? [{ label: 'Experience to highest level', value: formatNumber(total), href: '#levels' }] : []),
  ];
  const weaponCategory: Record<string, string> = {
    'One-Handed Swords': 'One handed sword', 'Two-Handed Swords': 'Two handed sword',
    Axes: 'AXE', 'Two-Handed Axes': 'Two-Handed Axe', Bows: 'BOW', Staves: 'STAFF',
    'Fist Weapons': 'Fist weapon', Crossbows: 'CROSSBOW', 'Two-Handed Maces': 'Two-Handed Mace',
  };
  $: weaponHref = weaponCategory[document.ref.name] ? `${base}/items/?weapon=${encodeURIComponent(weaponCategory[document.ref.name]!)}` : `${base}/items/?itemType=WEAPON`;
  $: firstRecipe = sortedRecipes.find((row) => row.requiredLevel !== undefined) ?? sortedRecipes[0];
  $: lastRecipe = sortedRecipes.findLast((row) => row.requiredLevel !== undefined);
  $: firstNode = sortedNodes[0];
  $: lastNode = sortedNodes[sortedNodes.length - 1];
  $: levelingGuide = document.placedRules.find((rule) => rule.target === 'how-to-gain-experience' && rule.guide.slug === 'crafting-and-gathering')
    ?? document.placedRules.find((rule) => rule.target === 'how-to-gain-experience');
</script>

<article class="detail-page">
  <DetailFrame>
    <div slot="head">
      <TitleBlock name={document.ref.name} imageUrl={document.art.icon ?? document.ref.icon ? `${base}/data/${(document.art.icon ?? document.ref.icon)!.url}` : undefined} typeLine="Skill" {registry} />
    </div>

    <div slot="answer">
      <AnswerCard title="How to level it" id="how-to-gain-experience">
        {#if document.description}<p class="description">{document.description}</p>{/if}
        <ul class="routes">
          {#if document.experience.crafting && firstRecipe}
            <li><strong>Craft recipes</strong><span>Make a recipe for this skill. {#if firstRecipe.requiredLevel !== undefined}From <a class="c-link" href={`#${firstRecipe.anchor}`}>{firstRecipe.recipe.name} at level {formatNumber(firstRecipe.requiredLevel)}</a>{#if lastRecipe && lastRecipe !== firstRecipe}{' '}to <a class="c-link" href={`#${lastRecipe.anchor}`}>{lastRecipe.recipe.name} at level {formatNumber(lastRecipe.requiredLevel!)}</a>{/if}.{:else}See the <a class="c-link" href="#recipes">published recipes</a> for their known gates.{/if}</span></li>
          {/if}
          {#if document.experience.gathering && firstNode}
            <li><strong>Gather from nodes</strong><span>Each use awards the node's published skill experience. From <EntityLink ref={firstNode.node} {registry} />{#if gate(firstNode)}{' '}({gate(firstNode)}){/if}{#if lastNode && lastNode !== firstNode}{' '}to <EntityLink ref={lastNode.node} {registry} />{#if gate(lastNode)}{' '}({gate(lastNode)}){/if}{/if}.</span></li>
          {/if}
          {#if document.experience.autoAttack}
            <li><strong>Auto-attack hits</strong><span>Each hit with this weapon type awards {formatNumber(document.experience.autoAttack.perHit)} skill experience below the highest level.</span></li>
            <li><strong>Weapons that use this skill</strong><span><a class="c-link" href={weaponHref}>Browse {document.ref.name.toLocaleLowerCase()} weapons</a> to find gear for those auto-attack hits.</span></li>
          {/if}
          {#if !document.experience.crafting && !document.experience.gathering && !document.experience.autoAttack}<li>No known experience source is listed for this skill.</li>{/if}
        </ul>
        {#if levelingGuide}<p class="guide"><HowItWorks guide={levelingGuide.guide} section={levelingGuide.section} /></p>{/if}
      </AnswerCard>
    </div>

    <div slot="side" class="side-content">
      <FactsCard facts={stats} title="At a glance"><a slot="after" class="c-link progression" href={`${base}/mechanics/character-progression/`}>Character progression</a></FactsCard>
      {#if document.curve && document.facts.highestLevel !== undefined && document.facts.highestLevel > 1}
        <DetailsDisclosure title="Level curve" id="levels" summary="Experience and level breakpoints">
          <LevelCurve curve={document.curve} subject={document.ref.name} compact />
        </DetailsDisclosure>
      {/if}
    </div>

    {#if document.recipes.length}
      <Section id="recipes" title="Recipes" count={document.recipes.length} line={stationShared ? document.recipes.some((row) => !row.station) ? `Recipes use ${nameOf(sharedStation!)} unless a row says station not listed.` : `Recipes use ${nameOf(sharedStation!)}.` : undefined}>
        <div class="c-groups">
          {#each recipeBands as band}
            <div class="c-stack"><h3>{band.label} <span>{formatNumber(band.rows.length)}</span></h3>
              <RelationTable columns={recipePlan.columns} rows={band.rows} label={`Recipes: ${band.label}`} rowAnchors={(row) => [row.anchor]}>
                <svelte:fragment slot="cell" let:row let:column>
                  {#if column === 'recipe'}{#if row.product}<EntityLink ref={row.product} {registry} />{:else}{row.recipe.name}{/if}{#if stationShared && !row.station}<small class="exception">Station not listed</small>{/if}
                  {:else if column === 'level' && row.requiredLevel !== undefined}{formatNumber(row.requiredLevel)}
                  {:else if column === 'station' && row.station}<EntityLink ref={row.station} {registry} />{/if}
                </svelte:fragment>
              </RelationTable>
            </div>
          {/each}
        </div>
      </Section>
    {/if}

    {#if document.gatheringNodes.length}
      <Section id="gathering-nodes" title="Gathering nodes" count={document.gatheringNodes.length}>
        {#if sharedTool && 'ref' in sharedTool}
          <p class="common-requirements">{allVeins ? 'Every vein' : 'Every listed node'} needs {sharedToolArticle} <EntityLink ref={sharedTool.ref} {registry} />.</p>
        {:else if sharedRequirements.length}
          <p class="common-requirements">Shared requirements: <Requirements requirements={[{ mode: 'all', checkCount: false, requirements: sharedRequirements }]} {registry} kindLabels={false} />.</p>
        {/if}
        <RelationTable columns={nodePlan.columns} rows={sortedNodes} label="Gathering nodes" sort={{ id: 'level', dir: 'asc' }}>
          <svelte:fragment slot="cell" let:row let:column>
            {#if column === 'node'}<EntityLink ref={row.node} {registry} />{#if extraRequirements(row).length}<small><Requirements requirements={extraRequirements(row)} {registry} kindLabels={false} /></small>{/if}
            {:else if column === 'level'}{gateLevel(row) === undefined ? 'No gate' : formatNumber(gateLevel(row)!)}
            {:else if column === 'experience' && row.experience !== undefined}{formatNumber(row.experience)}{/if}
          </svelte:fragment>
        </RelationTable>
      </Section>
    {/if}
  </DetailFrame>
</article>

<style>
  .description { color: var(--c-text-dim); line-height: 1.5; }
  .common-requirements { color: var(--c-text-dim); line-height: 1.5; }
  .routes { display: grid; gap: .75rem; list-style: none; padding: 0; }
  .routes li { display: grid; gap: .15rem; border-bottom: 1px solid var(--c-line-soft); padding: .3rem 0 .8rem; }
  .routes li:last-child { border-bottom: 0; padding-bottom: 0; }
  .routes strong { color: var(--c-text-strong); }
  .side-content { display: grid; align-content: start; gap: 1rem; min-width: 0; }
  .progression { display: inline-block; width: fit-content; min-height: 1.5rem; }
  .exception { display: block; color: var(--c-text-mute); }
  h3 { display: flex; align-items: baseline; gap: .5rem; color: var(--c-text-strong); font: 600 1.1rem/1.3 var(--c-serif); }
  h3 span { color: var(--c-text-dim); font: 400 .875rem/1.5 var(--c-sans); }
</style>
