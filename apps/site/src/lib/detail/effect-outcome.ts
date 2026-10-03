import type { AbilityAppliedEffect, PublicEffect } from '@afallon/contracts/public';
import { formatNumber, nameOf, signedAmount } from '../format';

type Action = PublicEffect['ranks'][number]['actions'][number];
/** Publication gives effects without authored names the title "Unnamed <effect type> Effect". */
export function isNamedAppliedEffect(row: AbilityAppliedEffect): boolean {
  return !/^Unnamed\b.*\bEffect(?: \(\d+\))?$/i.test(row.effect.name);
}

export function durationWords(seconds: number): string {
  if (seconds >= 3600 && seconds % 3600 === 0) return `${formatNumber(seconds / 3600)} ${seconds === 3600 ? 'hour' : 'hours'}`;
  if (seconds >= 60 && seconds % 60 === 0) return `${formatNumber(seconds / 60)} ${seconds === 60 ? 'minute' : 'minutes'}`;
  return `${formatNumber(seconds)} ${seconds === 1 ? 'second' : 'seconds'}`;
}

/** Compact, player-facing outcome of one action. Entity targets remain separately linkable in the page. */
export function actionWords(entry: Action): { before: string; after: string } {
  const amount = entry.amount === undefined ? '' : `${formatNumber(entry.amount)}${entry.unit === '%' ? '%' : ''}`;
  switch (entry.label) {
    case 'Changes': return { before: `${signedAmount(entry.amount ?? 0, entry.unit === '%')} `, after: '' };
    case 'Authored Damage': return { before: `Deals ${amount} damage`, after: '' };
    case 'Authored Healing': return { before: `Heals ${amount}`, after: '' };
    case 'Summons': return { before: 'Summons ', after: '' };
    case 'Destination Scene': return entry.target ? { before: 'Travels to ', after: '' } : { before: 'Its destination is not part of this version of the game.', after: '' };
    case 'Removes Effect': return { before: 'Removes ', after: '' };
    case 'Affects': return { before: 'Affects ', after: '' };
    case 'Restores': return { before: 'Restores ', after: '' };
    case 'Life Steal Modifier': return { before: `Heals you for ${amount}% of damage dealt`, after: '' };
    case 'Cannot Critically Hit': return { before: 'Cannot critically hit', after: '' };
    case 'Pet Duration': return { before: `Summoned for ${durationWords(entry.amount ?? 0)}`, after: '' };
    case 'Summon Count': return { before: `Summons ${amount}`, after: '' };
    default: return { before: `${entry.label[0]?.toUpperCase()}${entry.label.slice(1).toLowerCase()}${amount ? `: ${amount}` : ''}${entry.target ? ' ' : ''}`, after: entry.detail ? `: ${entry.detail}` : entry.unit && entry.unit !== '%' ? ` ${entry.unit.toLowerCase()}` : '' };
  }
}

export function actionSummary(entry: Action): string {
  const { before, after } = actionWords(entry);
  return `${before}${entry.target ? nameOf(entry.target) : ''}${after}`.trim();
}

export function effectImpact(document: PublicEffect, rank = document.ranks[0]): string {
  if (!rank) return document.description ?? '';
  const actions = rank.actions;
  const authoredHeal = actions.find((entry) => entry.label === 'Authored Healing');
  if (authoredHeal?.amount !== undefined) {
    const restored = actions.find((entry) => entry.label === 'Restores')?.target;
    return restored ? `Restores ${formatNumber(authoredHeal.amount)} ${nameOf(restored)}.` : `Heals ${formatNumber(authoredHeal.amount)}.`;
  }
  const summon = actions.find((entry) => entry.label === 'Summons');
  if (summon) {
    const count = actions.find((entry) => entry.label === 'Summon Count')?.amount;
    const duration = actions.find((entry) => entry.label === 'Pet Duration')?.amount;
    return `Summons ${count && count > 1 ? `${formatNumber(count)} ` : ''}${summon.target ? nameOf(summon.target) : 'a companion'}${duration ? ` for ${durationWords(duration)}` : ''}.`;
  }
  const damage = actions.find((entry) => entry.label === 'Authored Damage');
  const healing = actions.find((entry) => entry.label === 'Life Steal Modifier');
  if (damage?.amount !== undefined) {
    const category = actions.find((entry) => entry.label === 'Damage Category')?.detail;
    const type = category ?? actions.find((entry) => entry.label === 'Damage Type')?.detail;
    return `Deals ${formatNumber(damage.amount)}${type && type !== 'Neutral' ? ` ${type.replace(/ Damage$/i, '')}` : ''} damage${healing?.amount ? ` and heals you for ${formatNumber(healing.amount)}% of the damage dealt` : ''}.`;
  }
  if (actions.length) return actions.filter((entry) => !['Damage Type', 'Damage Category', 'Affects'].includes(entry.label)).map(actionSummary).join(' · ');
  return document.description ?? '';
}

/** A comparison row includes gameplay differences that the opening sentence leaves in the details. */
export function rankOutcome(document: PublicEffect, rank: PublicEffect['ranks'][number]): string {
  const impact = effectImpact(document, rank);
  if (!['Instant Damage', 'Damage Over Time', 'Instant Heal', 'Heal Over Time'].includes(document.type)) return impact;
  const details = rank.actions.filter((entry) => ![
    'Authored Damage', 'Authored Healing', 'Damage Type', 'Damage Category', 'Healing Category', 'Life Steal Modifier', 'Affects', 'Restores',
  ].includes(entry.label)).map(actionSummary);
  return [impact, ...details].filter(Boolean).join(' · ');
}
