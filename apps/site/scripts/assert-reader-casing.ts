import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { parseDocument, type Element, type Node } from 'htmlparser2';
import { deploymentPaths } from '../deployment-paths.mjs';

const output = process.argv.find((arg) => arg.startsWith('--output='))?.slice('--output='.length)
  ?? deploymentPaths(resolve(import.meta.dirname, '..')).outputDir;
const strict = process.argv.includes('--strict');
const all = process.argv.includes('--all');
const minor: Record<string, true> = { a: true, an: true, the: true, and: true, but: true, or: true, nor: true, for: true, of: true, on: true, in: true, at: true, to: true, by: true, per: true, from: true, with: true, as: true, vs: true };
const abbreviations: Record<string, true> = { NPCs: true, NPC: true, XP: true, HP: true, AoE: true, DoT: true, DPS: true, PvP: true, RPG: true, UI: true };
// These names are authored by the game, rather than by the site's labels.
const authoredNames: Record<string, true> = { 'Stargazing interactive': true };
const reveal = /^Show [\d,]+ (?:items without a known source|NPCs not found in the world|abilities nobody uses)$/;
const classes = ['title', 'heading', 'kind', 'nav', 'button', 'tab', 'column', 'label', 'placeholder', 'summary', 'chip', 'legend', 'count', 'fact', 'action'] as const;
type LabelClass = typeof classes[number];
type Finding = { route: string; kind: string; class: LabelClass; text: string; excluded?: true };
const findings: Finding[] = [];
const totals = new Map<string, { checked: number; violations: number }>();
const remaining = new Set<string>();
const allowlistedGameNames = new Set<string>();
const authoredEntityNames = new Set<string>();
// The map panels and the shared progression layout are being changed on separate branches.
const excludedProgression: Record<string, true> = {
  'Experience Across The Journey': true, 'Level difference': true, 'Try it on a creature': true,
  'Total To Reach Level': true, 'Creature above the player': true, 'Creature below the player': true,
  'Base roll': true, 'Same level as the player': true, 'See The Full Curve And Breakpoints': true,
  'All levels and exact experience amounts': true,
};

function text(node: Node): string {
  if (node.type === 'text') return (node as Node & { data: string }).data;
  if (!('children' in node) || ('attribs' in node && (node.attribs['aria-hidden'] === 'true' || /(?:^|\s)visually-hidden(?:\s|$)/.test(node.attribs.class ?? '')))) return '';
  return node.children.map(text).join(' ');
}
function clean(value: string): string { return value.replace(/\s+/g, ' ').trim(); }
const authoredPageNames = new Map<string, string>();
function firstHeading(node: Node): string | undefined {
  if (node.type === 'tag' && (node as Element).name === 'h1') return clean(text(node));
  if (!('children' in node)) return undefined;
  for (const child of node.children) {
    const heading = firstHeading(child);
    if (heading) return heading;
  }
  return undefined;
}
const properWords: Record<string, true> = { Afallon: true, Compendium: true, Heroic: true, Tier: true, World: true, Quest: true, Quests: true, Loot: true, Dungeon: true, Finder: true, Steam: true, Ko: true };
const phraseHeading = /^(?:How |Try |See |Show |Can |Could |When |Why |Getting |Turning |Finding |Taking |Joining |Meeting |Building |Playing |Your |Experience per |What can |What it |What to |What changes|What you get|Where and when |Where to get |Where to find it|Used by|Used for|Dropped by|Sold by|Found in|Mined from|Gathered from|Starts with|Starts and ends with|Turn in to|Turn it on|Explore this place|To gather|Choose one|Effects they apply|Points to learn|About this item)/iu;
const sentenceLink = /^(?:How |See |Turning |Find a |What )/iu;

function casingViolation(value: string, group: LabelClass, route: string): boolean {
  if (!value || authoredNames[value] || reveal.test(value) || /^Unknown: /u.test(value)) return false;
  const gameName = authoredPageNames.get(route);
  if (gameName && (group === 'heading' || group === 'title') && (value === gameName || value.startsWith(`${gameName} · Afallon `))) return false;
  if (group === 'label' && authoredEntityNames.has(value.replace(/ [\d,]+$/, ''))) return false;
  if (['fact', 'label'].includes(group) && /^(?:Can drop corrupted from|Dropped by|Sold by|Used in|Requires) \S/u.test(value)) return false;
  // A checkbox can explain an item and its bonus in a clause instead of naming a field.
  if (group === 'label' && (/\bgives\b/u.test(value) || /^If eligible /u.test(value) || /:\s*\+\d+ weight/u.test(value))) return false;
  const words = value.match(/[\p{L}][\p{L}'’-]*/gu) ?? [];
  const sentence = ['label', 'placeholder', 'count', 'fact', 'chip'].includes(group)
    || (['heading', 'summary'].includes(group) && phraseHeading.test(value))
    || (group === 'action' && sentenceLink.test(value));
  if (sentence) {
    if (['count', 'fact'].includes(group) && /^\d/.test(value)) {
      const noun = words[0];
      return noun !== undefined && /^\p{Lu}/u.test(noun) && !abbreviations[noun];
    }
    if (/[.!?]$/.test(value)) return false;
    return words.some((word, index) => index > 0 && /^\p{Lu}/u.test(word) && !abbreviations[word] && !properWords[word] && !/^\p{Lu}{2,}$/u.test(word));
  }
  if (/[.!?]$/.test(value)) return false;
  return words.some((word, index) => {
    if (abbreviations[word] || /[\p{Ll}][\p{Lu}]/u.test(word) || /^\p{Lu}{2,}$/u.test(word)) return false;
    const bare = word.toLocaleLowerCase('en-US');
    if (minor[bare] && index > 0 && (index < words.length - 1 || /\d/u.test(value.slice(value.lastIndexOf(word) + word.length)))) return word !== bare && !(word === 'On' && value.includes('Turning It On and Off'));
    return /^\p{Ll}/u.test(word);
  });
}

/** Only mechanically identifiable labels gate deployment; contextual game names stay in the review report. */
function clearFinding(entry: Finding): boolean {
  if (entry.excluded) return false;
  if (['kind', 'nav', 'tab', 'column', 'placeholder', 'count', 'button', 'action'].includes(entry.class)) return true;
  if (entry.class === 'title') return !entry.kind.endsWith('-detail') || entry.kind === 'mechanics-detail';
  if (entry.class === 'fact') return /^\d|^(?:Max |Starts |Every )/u.test(entry.text);
  if (entry.class === 'heading' || entry.class === 'summary') {
    return phraseHeading.test(entry.text) || /^(?:Level curve|Gear options|Heroic gear|Spawn odds|Unconfirmed details)$/iu.test(entry.text);
  }
  return entry.class === 'label' && /^(?:Living Followers|Experience Bonus|Sell Price|Item Power|Stack Size|Gear Preference)$/u.test(entry.text);
}
function routeKind(route: string): string {
  if (route === 'index.html') return 'home';
  if (route === '404.html') return '404';
  const parts = route.split('/');
  if (parts[0] === 'mechanics' && parts.length > 2) return 'mechanics-detail';
  if (parts[0] === 'map' || parts[0] === 'about' || parts[0] === 'coverage') return parts[0]!;
  return parts.length > 2 ? `${parts[0]}-detail` : `${parts[0]}-list`;
}
function record(route: string, group: LabelClass, raw: string, excludedComponent = false): void {
  const value = clean(raw);
  if (!value || /^[-–+×\d\s%,.]+$/.test(value)) return;
  const kind = routeKind(route);
  const key = `${kind}|${group}`;
  const row = totals.get(key) ?? { checked: 0, violations: 0 };
  row.checked++;
  if (reveal.test(value)) remaining.add(value.replace(/[\d,]+/, '#'));
  if (authoredPageNames.get(route) === value && (group === 'heading' || group === 'title') && casingViolation(value, group, '')) allowlistedGameNames.add(value);
  if (casingViolation(value, group, route)) {
    const excluded = excludedComponent || (route === 'mechanics/character-progression/index.html'
      && (excludedProgression[value] || /^Level \d+ × \d+ per level$/.test(value)
        || /^Creatures that can spawn above level \d+/.test(value) || /^\d+ creatures that scale with the player$/.test(value)));
    row.violations++;
    findings.push({ route, kind, class: group, text: value, ...(excluded ? { excluded: true } : {}) });
  }
  totals.set(key, row);
}
function visit(node: Node, route: string, parent?: Element, excludedAncestor = false, titleBlockAncestor = false): void {
  if (node.type !== 'tag' && node.type !== 'script' && node.type !== 'style') {
    if ('children' in node) for (const child of node.children) visit(child, route, parent, excludedAncestor, titleBlockAncestor);
    return;
  }
  const element = node as Element;
  const tag = element.name;
  if (tag === 'script' || tag === 'style' || tag === 'svg' || element.attribs['aria-hidden'] === 'true' || element.attribs.inert !== undefined) return;
  const css = element.attribs.class ?? '';
  const excluded = excludedAncestor || /(?:^|\s)level-slider(?:\s|$)/.test(css);
  const inTitleBlock = titleBlockAncestor || /(?:^|\s)title-block(?:\s|$)/.test(css);
  const role = element.attribs.role;
  let group: LabelClass | undefined;
  if (inTitleBlock && (tag === 'li' && /(?:^|\s)type(?:\s|$)/.test(css) || tag === 'span' && /(?:^|\s)label(?:\s|$)/.test(css))) group = 'kind';
  else if (tag === 'title') group = 'title';
  else if (/^h[1-6]$/.test(tag)) group = 'heading';
  else if (tag === 'th') group = element.attribs.scope === 'row' ? 'label' : 'column';
  else if (tag === 'button') group = role === 'tab' ? 'tab' : /(?:^|\s)pill(?:\s|$)/.test(css) ? 'summary' : /(?:^|\s)hint(?:\s|$)/.test(parent?.attribs.class ?? '') && /(?:^|\s)term(?:\s|$)/.test(css) ? 'label' : /chip/.test(css) ? 'chip' : 'button';
  else if (tag === 'label' || tag === 'dt') group = 'label';
  else if (tag === 'summary') group = 'summary';
  else if (tag === 'legend') group = 'legend';
  else if (tag === 'a' && parent?.name === 'nav') group = /(?:^|\s)row section(?:\s|$)/.test(css) ? 'label' : 'nav';
  else if (tag === 'a' && /section-link|c-action|how-it-works|route-more/.test(css)) group = 'action';
  else if (/(?:^|\s)tile-meta(?:\s|$)/.test(css)) group = 'fact';
  else if (/(?:^|\s)count(?:\s|$)/.test(css)) group = 'count';
  if (tag === 'summary' && element.children.some((child) => child.type === 'tag' && /(?:^|\s)summary-note(?:\s|$)/.test((child as Element).attribs.class ?? ''))) {
    for (const child of element.children) record(route, 'summary', text(child), excluded);
  } else if (group) record(route, group, group === 'kind' && tag === 'li'
    ? element.children.filter((child) => child.type === 'text').map(text).join(' ') : text(element), excluded);
  if (element.attribs.placeholder) record(route, 'placeholder', element.attribs.placeholder, excluded);
  if (['button', 'input', 'select'].includes(tag) && element.attribs['aria-label']
    && clean(element.attribs['aria-label']) !== clean(text(element))
    && clean(element.attribs['aria-label']) !== clean(element.attribs.placeholder ?? '')) {
    record(route, tag === 'button' && /[\p{L}]/u.test(clean(text(element))) ? group ?? 'button' : 'label', element.attribs['aria-label'], excluded);
  }
  // Parent controls and headings already own their complete text; do not double count child spans.
  if (group && group !== 'count' && group !== 'fact' && tag !== 'th') return;
  for (const child of element.children) visit(child, route, element, excluded, inTitleBlock);
}
const roots = readdirSync(output, { withFileTypes: true }).filter((entry) => entry.isDirectory() && !entry.name.startsWith('_') && entry.name !== 'data');
const routes = ['index.html', '404.html'];
for (const root of roots) {
  const index = join(output, root.name, 'index.html');
  if (Bun.file(index).size) routes.push(`${root.name}/index.html`);
  if (!all && ['map', 'about', 'coverage'].includes(root.name)) continue;
  const pages = readdirSync(join(output, root.name), { withFileTypes: true }).filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort();
  for (const slug of root.name === 'mechanics' || all ? pages : pages.slice(0, 3)) routes.push(`${root.name}/${slug}/index.html`);
}
// Entity names are game-authored. Read their detail headings before interpreting filter values on list pages.
routes.sort((left, right) => Number(routeKind(right).endsWith('-detail')) - Number(routeKind(left).endsWith('-detail')));
for (const route of routes) {
  const document = parseDocument(readFileSync(join(output, route), 'utf8'));
  const kind = routeKind(route);
  if (kind.endsWith('-detail') && kind !== 'mechanics-detail') {
    const name = firstHeading(document);
    if (name) {
      authoredPageNames.set(route, name);
      authoredEntityNames.add(name);
    }
  }
  visit(document, route);
}
const byClass = Object.fromEntries(classes.map((key) => [key, [...totals.entries()].filter(([name]) => name.endsWith(`|${key}`)).reduce((sum, [, row]) => ({ checked: sum.checked + row.checked, violations: sum.violations + row.violations }), { checked: 0, violations: 0 })]));
console.log(JSON.stringify({ routes: routes.length, byClass, byRouteKind: Object.fromEntries([...totals.entries()].sort()), allowlisted: [...remaining].sort(), allowlistedGameNames: [...allowlistedGameNames].sort(), excludedViolations: findings.filter((entry) => entry.excluded), reviewCandidates: findings.filter((entry) => !entry.excluded && !clearFinding(entry)), violations: findings.filter(clearFinding) }, null, 2));
if (strict && findings.some(clearFinding)) process.exitCode = 1;
