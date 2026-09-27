import type { StatRow, TalentPoints } from '@afallon/contracts/public';
import { nameOf } from './format';

const amountText = (amount: number) => Number.isInteger(amount) ? String(amount) : String(Number(amount.toFixed(2)));

/** A stat change as the game writes it: "+2 Block Chance", "+10% Haste", "-5 Armor". */
export function statChange(row: StatRow): string {
  return `${row.amount < 0 ? '-' : '+'}${amountText(Math.abs(row.amount))}${row.isPercent ? '%' : ''} ${nameOf(row.stat)}`;
}

const TRIGGERS: Record<TalentPoints['gains'][number]['trigger'], string> = {
  characterLevelUp: 'for each character level', skillLevelUp: 'for each skill level', npcKilled: 'for each kill', itemGained: 'for each item gained', weaponTemplateLevelUp: 'for each weapon level',
};

/** How a class gains talent points: "1 at the start, 3 for each character level, at most 180". */
export function talentPointText(points: TalentPoints): string {
  const parts = [...(points.start > 0 ? [`${points.start} at the start`] : []), ...points.gains.map((gain) => `${gain.amount} ${TRIGGERS[gain.trigger]}`)];
  return [...parts, ...(points.max > 0 ? [`at most ${points.max}`] : [])].join(', ');
}
