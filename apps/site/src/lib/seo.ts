import type { ArtRef, PublicKindEntry, QuestObjective, StaticDocument } from '@afallon/contracts/public';
import { formatNumber, levelText, nameOf } from './format';
import { durationWords } from './detail/effect-outcome';

export const SITE_ORIGIN = 'https://afallon.compendiums.org';
export const STEAM_URL = 'https://store.steampowered.com/app/2597810/Afallon/';
export const STEAM_GUIDE_URL = 'https://steamcommunity.com/sharedfiles/filedetails/?id=3800843227';
export const UNOFFICIAL_NOTICE = 'Unofficial fan project, not affiliated with the developer or publisher of Afallon.';

export function absolutePageUrl(pathname: string): string {
  return `${SITE_ORIGIN}${pathname.endsWith('/') ? pathname : `${pathname}/`}`;
}

/** JSON is emitted as script contents, not an HTML-escaped text node. Escape markup delimiters in published names. */
export function jsonLdScript(value: object): string {
  return `<script type="application/ld+json">${JSON.stringify(value).replace(/</g, '\\u003c')}</script>`;
}

const largeEnoughForSharing = (image: ArtRef | undefined): image is ArtRef =>
  Boolean(image && image.width >= 200 && image.height >= 200);

/** Use an entity's own shareable art rather than stretching its smaller UI icons. */
export function entitySocialArt(page: StaticDocument): ArtRef | undefined {
  const { art, ref } = page.document;
  if (largeEnoughForSharing(art.artwork)) return art.artwork;
  if (largeEnoughForSharing(art.portrait)) return art.portrait;
  if (largeEnoughForSharing(ref.portrait)) return ref.portrait;
  if (largeEnoughForSharing(art.icon)) return art.icon;
  return largeEnoughForSharing(ref.icon) ? ref.icon : undefined;
}

const ARMOR_SLOTS: Record<string, string> = {
  CHEST: 'chest armor', HANDS: 'gloves', HEAD: 'helmet', LEGS: 'pants',
  FEET: 'boots', WAIST: 'belt', SHOULDERS: 'shoulders',
};

/** Keep complete facts rather than ending a search snippet in the middle of a claim. */
function describe(lead: string, ...facts: (string | undefined)[]): string {
  let text = lead;
  for (const fact of facts) {
    if (fact && text.length + fact.length + 1 <= 160) text += ` ${fact}`;
  }
  return text.replace(/;/g, '.').replace(/—/g, ',');
}

const LIST_DESCRIPTIONS: Partial<Record<PublicKindEntry['kind'], string>> = {
  items: 'Browse Afallon items by type and rarity. Compare item power, required level and damage.',
  npcs: 'Browse Afallon NPCs by role and place. Compare levels, factions and classes.',
  quests: 'Browse Afallon quests by reward type, area and chain. Compare quest levels and givers.',
  places: 'Browse Afallon places by type. See their level ranges and bosses.',
  properties: 'Browse Afallon properties by type and place. Compare prices and income.',
  abilities: 'Browse Afallon abilities by source and class. See who learns or uses each one.',
  recipes: 'Browse Afallon recipes by station and skill. See products and materials.',
  classes: 'Browse Afallon classes. Compare talent trees and abilities.',
  skills: 'Browse Afallon skills. Compare types, skill levels, recipes and gathering nodes.',
  mechanics: 'Browse Afallon mechanics, including character progression, crafting, corruption and loot.',
  gatheringNodes: 'Browse Afallon gathering nodes by skill. See required levels and locations.',
  gearSets: "Browse Afallon gear sets by type. See each set's pieces and bonuses.",
  currencies: 'Browse Afallon currencies. See what each one buys and which quests award it.',
  stats: 'Browse Afallon stats by category and on-hit effect. See where each stat comes from.',
  factions: 'Browse Afallon factions and see which NPCs belong to each one.',
  races: "Browse Afallon races. See each race's starting place, classes and adventurers.",
  effects: 'Browse Afallon effects by type. See what applies each effect and how it works.',
  craftingStations: 'Browse Afallon crafting stations. See their skills, recipes and map locations.',
};

export function listDescription(kind: PublicKindEntry): string {
  const description = LIST_DESCRIPTIONS[kind.kind];
  if (!description) throw new Error(`No list description for ${kind.kind}.`);
  return description;
}

/** Game prose is useful when its opening sentence stands on its own. */
function openingSentence(description: string | null, limit = 105): string | undefined {
  const clean = description?.replace(/\s+/g, ' ').trim().replace(/;/g, '.').replace(/—/g, ',');
  const sentence = clean?.match(/^.+?[.!?](?=\s|$)/)?.[0];
  return sentence && sentence.length <= limit ? sentence : undefined;
}

function questObjectiveSentence(objective: QuestObjective | undefined): string | undefined {
  if (!objective) return undefined;
  switch (objective.type) {
    case 'getItem': return `Collect ${nameOf(objective.target)}${objective.count > 1 ? ` (${formatNumber(objective.count)} needed)` : ''}.`;
    case 'killNpc': return `Defeat ${nameOf(objective.target)}${objective.count > 1 ? ` (${formatNumber(objective.count)} kills)` : ''}.`;
    case 'talkToNpc': return `Talk to ${nameOf(objective.target)}.`;
    case 'useItem': return `Use ${nameOf(objective.target)}${objective.count > 1 ? ` (${formatNumber(objective.count)} times)` : ''}.`;
    case 'enterScene': return `Visit ${nameOf(objective.target)}.`;
    case 'learnAbility': return `Learn ${nameOf(objective.target)}.`;
    default: return undefined;
  }
}

export function entityDescription(page: StaticDocument, effectSubtitle?: string): string {
  const { document } = page;
  const name = document.ref.name;
  switch (page.kind) {
    case 'items': {
      const item = page.document;
      const slot = item.facts.slot && ARMOR_SLOTS[item.facts.slot];
      const type = item.facts.weaponType
        ?? (item.facts.armorType ? `${item.facts.armorType} ${slot ?? 'armor'}` : undefined)
        ?? (item.facts.itemType === 'JEWELRY' && item.facts.slot ? item.facts.slot : item.facts.itemType)
        ?? 'item';
      const identity = [item.facts.rarity, type].filter(Boolean).join(' ').toLowerCase();
      const drop = item.droppedBy[0];
      const source = item.inContainers[0]?.label ?? item.collectedFrom[0]?.label;
      const dropSource = drop && nameOf(drop.counterpart);
      const worldDrop = dropSource === 'Any creature'
        ? drop?.creatureLevel && (drop.creatureLevel.min > 1 || drop.creatureLevel.max !== undefined)
          ? `level ${levelText(drop.creatureLevel)} creatures` : 'creatures'
        : drop ? `${drop.creatureLevel && (drop.creatureLevel.min > 1 || drop.creatureLevel.max !== undefined) ? `level ${levelText(drop.creatureLevel)} ` : ''}${dropSource}` : '';
      const obtained = source
        ? `Find it in ${source}${worldDrop ? ` or from ${worldDrop}` : ''}.`
        : worldDrop ? `Dropped by ${worldDrop}.`
        : item.soldBy[0] ? `Sold by ${nameOf(item.soldBy[0].counterpart)}.`
        : item.crafting ? 'Find its crafting recipe on this page.' : undefined;
      return describe(`${name} is ${/^[aeiou]/i.test(identity) ? 'an' : 'a'} ${identity} in Afallon.`,
        obtained, openingSentence(item.description),
        !obtained && item.facts.itemPower ? `Item power ${formatNumber(item.facts.itemPower)}.` : undefined);
    }
    case 'npcs': {
      const npc = page.document;
      const creatureType = npc.facts.creatureType?.toLowerCase();
      const kind = npc.facts.npcType?.toLowerCase() === 'mob'
        ? creatureType === 'beast' ? 'beast' : creatureType && creatureType !== 'none' ? `${creatureType} creature` : 'creature'
        : npc.facts.npcType?.toLowerCase() === 'npc'
          ? npc.facts.roles.includes('merchant') ? 'merchant' : 'character'
          : (npc.facts.npcType ?? npc.facts.creatureType ?? 'character').toLowerCase();
      const level = npc.facts.level && !npc.facts.level.scales ? `, level ${levelText(npc.facts.level)}` : '';
      const place = npc.locations[0]?.label ?? npc.places[0]?.label;
      const roaming = npc.description?.match(/^A roaming (.+) adventurer\.$/i);
      return describe(roaming ? `${name} is a roaming ${roaming[1]} adventurer in Afallon.` : `${name} is ${/^[aeiou]/i.test(kind) ? 'an' : 'a'} ${kind}${level} in Afallon.`,
        place ? `Find ${name} in ${place}.` : undefined,
        npc.facts.level?.scales ? 'Its level adjusts to your character.' : undefined,
        roaming ? undefined : openingSentence(npc.description),
        !place && npc.drops[0] ? `Can drop ${nameOf(npc.drops[0].counterpart)}.` : undefined);
    }
    case 'quests': {
      const quest = page.document;
      const level = quest.facts.levelRange ? ` for levels ${levelText(quest.facts.levelRange)}` : '';
      const first = quest.objectives[0];
      const start = quest.starts[0];
      return describe(`${name} is an Afallon quest${level}.`,
        questObjectiveSentence(first),
        start?.kind === 'npc' && start.npc ? `Start it with ${nameOf(start.npc)}.` : undefined);
    }
    case 'places': {
      const place = page.document;
      const type = place.facts.placeType?.toLowerCase() ?? 'place';
      const level = place.facts.levelRange ? ` for levels ${levelText(place.facts.levelRange)}` : '';
      return describe(`${name} is an Afallon ${type}${level}.`,
        place.bosses[0] ? `Find ${nameOf(place.bosses[0])} among its bosses.` : undefined,
        openingSentence(place.description));
    }
    case 'abilities': {
      const ability = page.document;
      const version = ability.versions[0];
      const learner = version?.learnedBy[0]?.class;
      const user = version?.usedBy[0];
      return describe(`${name} is an Afallon ability.`,
        openingSentence(ability.description),
        learner ? `${nameOf(learner)} can learn it.` : user ? `Used by ${nameOf(user)}.` : undefined,
        version?.appliedEffects[0] ? `It applies ${nameOf(version.appliedEffects[0].effect)}.` : undefined);
    }
    case 'effects': {
      const effect = page.document;
      const type = effect.type.toLowerCase();
      const actions = effect.ranks[0]?.actions ?? [];
      const change = actions.find((action) => action.label === 'Changes' && action.target && action.amount !== undefined);
      const damage = actions.find((action) => action.label === 'Authored Damage' && action.amount !== undefined);
      const category = actions.find((action) => action.label === 'Damage Category')?.detail;
      const summon = actions.find((action) => action.label === 'Summons' && action.target)?.target;
      const weaponModifier = actions.find((action) => action.label === 'Weapon Damage Modifier' && action.amount !== undefined)?.amount;
      const source = effect.appliedBy.find((row) => effectSubtitle && nameOf(row.source) === effectSubtitle)?.source ?? effect.appliedBy[0]?.source;
      const outcome = change
        ? `Changes ${nameOf(change.target!)} by ${formatNumber(change.amount!)}${change.unit === '%' ? '%' : ''}.`
        : damage ? `Deals ${formatNumber(damage.amount!)}${category ? ` ${category.replace(/ Damage$/i, '').toLowerCase()}` : ''} damage.`
        : summon ? `Summons ${nameOf(summon)}.`
        : weaponModifier !== undefined ? `Its weapon damage modifier is ${formatNumber(weaponModifier)}.` : openingSentence(effect.description);
      const stacking = effectSubtitle?.startsWith('stacks up to')
        ? effect.stackLimit > 1 ? `Can stack up to ${formatNumber(effect.stackLimit)} times.` : 'Does not stack.'
        : undefined;
      return describe(`${name} is an Afallon ${type} effect.`, stacking, outcome,
        effectSubtitle?.endsWith(' ranks') ? `Has ${formatNumber(effect.ranks.length)} ranks.` : undefined,
        source ? `Applied by ${nameOf(source)}.` : undefined,
        effect.isState && effect.durationSeconds > 0 && effect.durationSeconds < 86400 ? `Lasts ${durationWords(effect.durationSeconds)}.` : undefined);
    }
    case 'mechanics': {
      const guide = page.document;
      if (guide.topic === 'factions') return 'Learn how faction standing works in Afallon and how factions treat you in combat.';
      const text = guide.description?.replace(/\s+/g, ' ').trim().replace(/[.!?]$/, '');
      const topic = text?.toLowerCase().startsWith('how ') || text?.toLowerCase().startsWith('where ')
        ? text[0]!.toLowerCase() + text.slice(1) : text ? `about ${text[0]!.toLowerCase()}${text.slice(1)}` : undefined;
      return topic ? `Learn ${topic} in Afallon.` : `${name} explains an Afallon game mechanic.`;
    }
    case 'gatheringNodes': {
      const node = page.document;
      const skill = node.facts.skill && nameOf(node.facts.skill);
      return describe(`${name} is an Afallon gathering node${skill ? ` for ${skill}` : ''}.`,
        node.facts.requiredLevel ? `Requires ${skill ?? 'gathering'} level ${formatNumber(node.facts.requiredLevel)}.` : undefined,
        node.places[0] ? `Found in ${node.places[0].label}.` : undefined,
        node.yields[0] ? `Can yield ${nameOf(node.yields[0].counterpart)}.` : undefined);
    }
    case 'gearSets': {
      const set = page.document;
      return describe(`${name} is an Afallon ${set.type?.toLowerCase() ?? 'equipment'} gear set.`,
        `Includes ${formatNumber(set.pieces.length)} pieces.`,
        set.tiers[0] ? `Its first bonus starts at ${formatNumber(set.tiers[0].equipped)} pieces.` : undefined);
    }
    case 'skills': {
      const skill = page.document;
      const kind = skill.experience?.crafting ? 'crafting' : skill.experience?.gathering ? 'gathering' : 'combat';
      return describe(`${name} is an Afallon ${kind} skill.`,
        skill.recipes.length ? `See ${formatNumber(skill.recipes.length)} recipes.` : undefined,
        skill.gatheringNodes.length ? `Find ${formatNumber(skill.gatheringNodes.length)} gathering nodes.` : undefined,
        openingSentence(skill.description));
    }
    case 'craftingStations': {
      const station = page.document;
      return describe(`${name} is an Afallon crafting station.`,
        station.skills[0] ? `Used for ${nameOf(station.skills[0])}.` : undefined,
        station.places[0] ? `Find it in ${station.places[0].label}.` : undefined,
        station.recipes.length ? `Make ${formatNumber(station.recipes.length)} recipes here.` : undefined);
    }
    case 'currencies': {
      const currency = page.document;
      return describe(`${name} is an Afallon currency.`,
        openingSentence(currency.description),
        currency.purchases.length ? `Spend it on ${formatNumber(currency.purchases.length)} items.` : undefined,
        currency.rewards.length ? `Earn it from ${formatNumber(currency.rewards.length)} quests.` : undefined);
    }
    case 'properties': {
      const property = page.document;
      return describe(`${name} is an Afallon ${property.facts.propertyType?.toLowerCase() ?? 'property'}.`,
        property.locations[0] ? `Find it in ${property.locations[0].label}.` : undefined,
        property.facts.price ? `Costs ${formatNumber(property.facts.price.amount)} ${nameOf(property.facts.price.currency)}.` : undefined);
    }
    case 'stats': {
      const stat = page.document;
      return describe(`${name} is an Afallon stat.`,
        openingSentence(stat.description),
        stat.category ? `Its category is ${stat.category.toLowerCase()}.` : undefined);
    }
    case 'classes': {
      const characterClass = page.document;
      return describe(`${name} is a playable class in Afallon.`,
        openingSentence(characterClass.description),
        characterClass.trees.length > 1 ? `Train in ${characterClass.trees[0]!.name} or ${characterClass.trees[1]!.name}.` : undefined);
    }
    case 'races': {
      const race = page.document;
      return describe(`${name} is a playable race in Afallon.`,
        openingSentence(race.description),
        race.start ? `New characters start in ${nameOf(race.start)}.` : undefined);
    }
    case 'factions': {
      const faction = page.document;
      return describe(`The ${name} faction is part of Afallon's reputation system.`,
        openingSentence(faction.description),
        faction.newCharacter ? `New characters start ${faction.newCharacter.stance.toLowerCase()} with it.` : undefined);
    }
  }
}
